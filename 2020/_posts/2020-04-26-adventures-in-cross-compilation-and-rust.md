---
layout: post
title: "Adventures in Cross Compilation and Rust"
---

# Pretty shell prompts

I've [previously talked about]({% post_url /2019-11-01-promtail-apt-packages-and-home-made-environment-sensors %}) doing some simple software packaging for other people's projects, where the maintainer doesn't currently generate any packages I can use across debian-based systems.

As a big fan of [powerline-shell](https://github.com/b-ryan/powerline-shell), I wanted to see if I could distribute this in a usable form to my systems that I frequently log into. There's not many, but they do vary in power and architecture (some x86_64, some arm7, some arm6 etc). The idea behind powerline-shell is that you include its output as part of your shell's prompt output, and it gives you a useful (and pretty!) prompt line. It's trivial, but I find it useful and pleasing.

The problem here is that it effectively executes every single time the shell decides to give you a prompt, which is mostly after every command. Anyone who's played an online FPS game, or worked with sound recording can tell you that for things that the brain expects to happen immediately, it's pretty good at noticing that the thing isn't actually "immediate" after delays of 10s of ms, if not less. So when you're working at a shell, you expect a prompt to arrive essentially immediately after the last command finishes running. Type `ls` and the output along with the prompt for the next command are expected to appear at the same time. If you need to run an entire process to figure out how that prompt should look, it better be fast.

So let's see how `powerline-shell` performs. On my laptop (recent MBP, python 3.7.7):

```shell
[mac]$ time powerline-shell
real    0m0.096s
user    0m0.066s
sys     0m0.032s
```

On a small cloud VPS running debian:

```shell
[cloud-host]$ time powerline-shell
real    0m0.081s
user    0m0.058s
sys     0m0.022s
```

Not too bad. 80-90ms is probably ok-enough. Let's see how it runs on a Raspberry Pi 2 (arm7, hf) with an NFS root.

```shell
[rpi 2]$ time powerline-shell
real    0m1.019s
user    0m0.760s
sys     0m0.248s
```

Oh. How about an rPi zero (arm6, hf)?

```shell
[rpi-zero]$ time powerline-shell
real    0m1.401s
user    0m1.136s
sys     0m0.203s
```

Hmm. Waiting a second for your shell to be responsive after running a command is going to send you quietly insane.
 
# Golang to the rescue!?

Computers are pretty quick these days, but using python to write a program that has to execute very quickly doesn't seem like a good idea. Thankfully, some other people on the internet have had a similar thought: someone's got a [decent version available in golang](https://github.com/justjanne/powerline-go). Let's see how that does.

```shell
[mac]$ time powerline-go
real    0m0.030s
user    0m0.013s
sys     0m0.021s

[cloud-host]$ time powerline-go
real    0m0.014s
user    0m0.011s
sys     0m0.003s

[rpi 2]$ time powerline-go
real    0m0.541s
user    0m0.061s
sys     0m0.126s

[rpi-zero]$ time powerline-go
real    0m0.264s
user    0m0.125s
sys     0m0.128s
```

Pretty good! This is getting towards usable, although a 250ms wait on the rpi-zero would start to get annoying. I had a look at the golang code and did some profiling, but it didn't seem there were any obvious places in which latency could be improved.

# How about Rust?

Then I discovered that someone had [done a port in rust](https://github.com/cirho/powerline-rust). Intrigued, I wanted to find out how this performed. I've been dabbling in rust recently and seem to be going through the same learning curve as most other people. Initial excitement at how good the language and stdlib feel (along with the excellent tooling) followed by complete despair at my inability to write even the most simple program without the compiler complaining about literally everything. Without sounding too Stockholm-y, this isn't rust's fault - it's just enforcing some pretty simple rules about memory management. It's actually *my* fault for not understanding what I actually want to do.

Anyhow, the other reason for wanting to play with it is that it's not an interpreted language. Unlike python/golang etc. it doesn't rely on a VM or runtime to be present, which potentially lends itself well towards higher performance and lower latency applications. People are calling it the "new C" (but without all the annoying unsafe foot-gun bits that C also comes with).

So in theory, a version of `powerline-shell` in rust should perform pretty well. But first we have to build it.

# Compile for everything!

One thing that a lot of "newer" languages and environments have in common is a recognition that sometimes the type of computer you're developing / building you application on is not the same as what it will eventually run on. Hence them making cross-compiling very straightforward (at least in theory).

In golang, cross-compilation is very easy: just set the `GOOS` and `GOARCH` environment variables before building it and the output you'll end up with is a binary that will execute on that platform. I assume this is simple because golang code fundamentally runs on a VM, so cross compiling is just a case of bundling the right VM for the target system with the binary. 

In rust, it's a little more complex. The compiler has to output the actual assembler that will execute on the target architecture, in a format that can be run by the target OS. The process is described pretty well [here](https://rustc-dev-guide.rust-lang.org/overview.html).

The `cargo` utility is what takes care of building and managing the dependencies of any rust project. In theory, cross-compiling is as simple as specifying the target that you want to build for when executing `cargo build`. So let's try and build for `arm-unknown-linux-musleabihf` (I'm using musl because it'll a little lighter than glibc so should run faster - I should test this though).

```shell
$ cargo build --target=arm-unknown-linux-musleabihf
...
the `arm-unknown-linux-musleabihf` target may not be installed
```

Ok, so we install with rustup
```shell
$ rustup target add arm-unknown-linux-musleabihf
$ cargo build --target=arm-unknown-linux-musleabihf
...
error occurred: Failed to find tool. Is `arm-linux-musleabihf-gcc` installed?
```

Ah, it's looking for a compiler that can compile some of the dependencies for the requested target. The problem I have is that I'm building this on Ubuntu Bionic (18.04), and this doesn't have any package that provides the `musl` version of armhf gcc. However, it does offer `gcc-8-arm-linux-gnueabihf` (the glibc version) and `musl-tools`. `musl-tools` supplies a script called `musl-gcc` which sets some arguments pointing to the musl libs and then executes the actual CC. In cargo, we can tell it to use a specific compiler by overriding `TARGET_CC`. We also need to set the environment variable `REALGCC` to be the actual cross-compiler we want to use, as this is then invoked by `musl-gcc`. The default (I think) is just to invoke the `gcc` for whatever the current arch is, and we don't want that (we want ARM!).

```shell
$ REALGCC=arm-linux-gnueabihf-gcc-8 TARGET_CC=musl-gcc cargo build --target=arm-unknown-linux-musleabihf
...
error: linking with `cc` failed: exit code: 1
/root/.rustup/toolchains/stable-x86_64-unknown-linux-gnu/lib/rustlib/arm-unknown-linux-musleabihf/lib/crt1.o: error adding symbols: File in wrong format
collect2: error: ld returned 1 exit status
```

Oh, the linker has failed. So the compiler worked! Progress! 

More magic variables are needed. Cargo needs to be told what linker to use for each target if it's not the default linker. So we set `CARGO_TARGET_ARM_UNKNOWN_LINUX_MUSLEABIHF_LINKER` to be the cross-suite's arm linker: `arm-linux-gnueabihf-ld`

```shell
$ CARGO_TARGET_ARM_UNKNOWN_LINUX_MUSLEABIHF_LINKER=arm-linux-gnueabihf-ld REALGCC=arm-linux-gnueabihf-gcc-8 TARGET_CC=musl-gcc cargo build --target=arm-unknown-linux-musleabihf
...
Finished dev [unoptimized + debuginfo] target(s) in 1.19s
```

Success!

Let's build a release version (`cargo build [...] --release`) and see how it performs.

```shell
[mac]$ time powerline-rust
real    0m0.009s
user    0m0.004s
sys     0m0.004s

[cloud-host]$ time powerline-rust
real    0m0.001s
user    0m0.001s
sys     0m0.000s

[rpi 2]$ time powerline-rust
real    0m0.009s
user    0m0.007s
sys     0m0.000s

[rpi-zero]$ time powerline-rust
Illegal instruction
```

Hmm. Something's odd about the rpi-zero build. This is an ARMv6 chip that definitely has hard-float, so an arm eabihf build should work fine. If I build the same output on OSX (using https://github.com/osx-cross/homebrew-arm), I get a binary that works. So what's happening?

Maybe it's just musl being odd. Let's try GNU instead.

```shell
[build]$ CARGO_TARGET_ARM_UNKNOWN_LINUX_GNUEABIHF_LINKER=arm-linux-gnueabihf-gcc-8 TARGET_CC=arm-linux-gnueabihf-gcc-8  cargo build --target=arm-unknown-linux-gnueabihf
[rpi-zero]$ ./powerline-rust-arm-gnueabihf
Illegal Instruction 
``` 

Nope. Something else independent of the libc implementation is causing a binary to be made that doesn't work on ARMv6.

# Stupid compilers and their opinions

Let's have a look at the binary to find out what it is.

```shell
$ readelf -A powerline-rust-arm-gnueabihf
Attribute Section: aeabi
File Attributes
  Tag_CPU_name: "7-A"
  Tag_CPU_arch: v7
  Tag_CPU_arch_profile: Application
  Tag_ARM_ISA_use: Yes
  Tag_THUMB_ISA_use: Thumb-2
  Tag_FP_arch: VFPv3-D16
  Tag_ABI_PCS_GOT_use: GOT-indirect
  Tag_ABI_PCS_wchar_t: 4
  Tag_ABI_FP_rounding: Needed
  Tag_ABI_FP_denormal: Needed
  Tag_ABI_FP_exceptions: Needed
  Tag_ABI_FP_number_model: IEEE 754
  Tag_ABI_align_needed: 8-byte
  Tag_ABI_enum_size: int
  Tag_ABI_VFP_args: VFP registers
  Tag_CPU_unaligned_access: v6
  Tag_ABI_FP_16bit_format: IEEE 754
```

Aha! GCC appears to have built an ARMv7 binary. No wonder it doesn't work! I had made an assumption here: because rustup supports targets like `armv5te-unknown-linux-gnueabi` (for ARMv5), `arm-unknown-linux-gnueabihf` (v6) and `armv7-unknown-linux-gnueabihf` (v7), I had assumed that the `arm-` prefix generically meant "v6" as a sort-of default. I had also assumed that when cargo builds for a given target, it instructs the compiler to use the correct arch version (if the compiler happens to support multiple). It turns out this isn't true.  
 
For no reason at all, what happens if we try soft-float?

```shell
[build]$ root@f8704b95def8:~/src# CARGO_TARGET_ARM_UNKNOWN_LINUX_GNUEABI_LINKER=arm-linux-gnueabi-gcc-8 TARGET_CC=arm-linux-gnueabi-gcc-8  cargo build --target=arm-unknown-linux-gnueabi
[rpi-zero]$ ./powerline-rust-arm-gnueabi
(successful output)
```

Hmm, this works. Let's check the ELF attributes:

```shell
$ readelf -A powerline-rust-arm-gnueabi
Attribute Section: aeabi
File Attributes
  Tag_CPU_name: "ARM v6"
  Tag_CPU_arch: v6
  Tag_ARM_ISA_use: Yes
  Tag_THUMB_ISA_use: Thumb-1
  Tag_ABI_PCS_GOT_use: GOT-indirect
  Tag_ABI_PCS_wchar_t: 4
  Tag_ABI_FP_rounding: Needed
  Tag_ABI_FP_denormal: Needed
  Tag_ABI_FP_exceptions: Needed
  Tag_ABI_FP_number_model: IEEE 754
  Tag_ABI_align_needed: 8-byte
  Tag_ABI_enum_size: int
  Tag_CPU_unaligned_access: v6
  Tag_ABI_FP_16bit_format: IEEE 754
```

How strange. Digging around, it looks like the GCC that's shipped with Debian / Ubuntu has some interesting defaults, which means that building for ARMv6 is somewhat tricky: [https://stackoverflow.com/questions/35132319/build-for-armv6-with-gnueabihf/51201725#51201725](https://stackoverflow.com/questions/35132319/build-for-armv6-with-gnueabihf/51201725#51201725). I'd probably go as far as saying that it looks like building for anything less than ARMv7 on the GCC toolchain that Debian supplies isn't supported. Why the hard-float toolchain chucks out an ARMv7 binary, but the soft-float an ARMv6 one is beyond me. Computers!

So, the GCC toolchain is the problem here. If the one that ships with Ubuntu doesn't work, then I need to get one that does. I could compile my own, but this is a bit of a faff. Usefully, the Raspberry Pi lot [provide their own gcc binaries that are build for the correct target arch](https://github.com/raspberrypi/tools.git). It's quite an old version of gcc (4.9.3) but it should work. Unfortunately, it doesn't work with `musl-tools`, so we might have to compile against a glibc target.

([This issue](https://github.com/BurntSushi/ripgrep/issues/676#issuecomment-374058198) and [this reddit thread](https://www.reddit.com/r/rust/comments/9io0z8/run_crosscompiled_code_on_rpi_0/) were pretty useful in helping me figure it out).

```shell
[build]$ git clone --depth=1 https://github.com/raspberrypi/tools.git rpi-tools
[build]$ export MAGIC_RPI_GCC=rpi-tools/arm-bcm2708/gcc-linaro-arm-linux-gnueabihf-raspbian-x64/bin/arm-linux-gnueabihf-gcc
[build]$ CARGO_TARGET_ARM_UNKNOWN_LINUX_GNUEABIHF_LINKER=$MAGIC_RPI_GCC TARGET_CC=$MAGIC_RPI_GCC cargo build --target=arm-unknown-linux-gnueabihf --release
...
[build]$ readelf -A target/arm-unknown-linux-gnueabihf/release/powerline
Attribute Section: aeabi
File Attributes
  Tag_CPU_name: "6"
  Tag_CPU_arch: v6
  Tag_ARM_ISA_use: Yes
  Tag_THUMB_ISA_use: Thumb-1
  Tag_FP_arch: VFPv2
  Tag_ABI_PCS_GOT_use: GOT-indirect
  Tag_ABI_PCS_wchar_t: 4
  Tag_ABI_FP_denormal: Needed
  Tag_ABI_FP_exceptions: Needed
  Tag_ABI_FP_number_model: IEEE 754
  Tag_ABI_align_needed: 8-byte
  Tag_ABI_enum_size: int
  Tag_ABI_HardFP_use: Deprecated
  Tag_ABI_VFP_args: VFP registers
  Tag_CPU_unaligned_access: v6
  Tag_ABI_FP_16bit_format: IEEE 754
  Tag_DIV_use: Not allowed 
```

Great! Looks like we have a binary that should work - it's ARMv6 and VPFv2, which is what the rPI needs as a baseline. How does it perform?

```shell
[rpi 2]$ time powerline-rust
real    0m0.030s
user    0m0.002s
sys     0m0.021s

[rpi-zero]$ time powerline-rust
real    0m0.047s
user    0m0.010s
sys     0m0.032s
```

At last! That's very acceptable performance on the pi zero and even though there's a significant degredation in performance on the rPi 2 from the gcc-8 toolchain earlier, it's still perfectly reasonable.

At some point, I'll try doing a custom build of gcc to see if that makes a difference, as well as trying to get musl to work.