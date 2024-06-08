---
layout: post
title: "A Silly KVM"
description: "Software, not hardware."
tags: [ "programming" ]
---

## Too many computers, not enough desks

When at home, I tend to do computery-based things in one place, at a nice desk with a bunch of monitors, keyboard, the
usual. "Home" is also where I do a lot of work for my employer, who requires that I use a specific laptop (a rather nice
MBP).

This leads to a fairly typical problem where I want to use a bunch of different computing devices (the work laptop, plus
my desktop) but with the same set of human-interface devices (keyboard, mouse, monitors, etc.). A lot of people seem to
have this problem, and the universe invented a [Keyboard/Video/Mouse (KVM) switch][kvm] to solve it. In short, it's a
fancy piece of hardware that lets you plug in a single set of montior/keyboard/whatevers, along with multiple computers,
and then manually switch which computer is "connected" to those devices at any one time.

I seem to remember these were pretty cheap things, and it turns out that was true back in the good old days when
everyone had a single VGA (or DVI)-connected monitor.

The present is not like the past. I have 3 [Dell UP2615D monitors][monitors], which are each capable of running at
2560x1440. If you look up how much it costs to get a triple-monitor KVM switch that supports that type of resolution, you'll discover that they're both (a)
pretty uncommon and (b) hilariously expensive.

## Display Monitors are Computers too

There is, maybe, another way. The bit that's the problem here is the displays. Everything else I use to interact with
The Computer is a fairly simple USB device, and USB KVMs are plentiful and very cheap! So with a simple bit of cheap
hardware, I can at least have a box that lets me switch the USB devices between Work Laptop and my desktop.

At some point between the invention of the monitor and the present day, monitors got a bit more complicated. They've
gone from being simple analogue displays that can accept a bunch of different VGA modes and just draw a picture to
full-on computing devices in their own right, with firmware and multiple types of input and correction and built-in USB
hubs and chess engines and all sorts of other things. The bit that's important here is that they have multiple input
types, and can switch between them.

Sooo.... why not plug one computer into one set of monitor inputs, and another one into the other? That way, I can
switch devices by toggling the USB KVM, and then just switching the input source on each monitor. Success!

## Software to the rescue

After the second time of doing this and getting it wrong, I wondered if there wasn't a better way to switch the inputs.
Since these devices are now quite complicated, someone surely must have invented an API to let you control it remotely?
This has been a thing on laptops for ages where you can use keyboard keys to adjust the brightness of the display.

Turns out, there is an API. It's called [Display Data Channel][ddc]. It's essentially an I2C bus that runs on the
DisplayPort / HDMI connection, and lets you both interrogate and command the display to do fancy things.

Using the `ddcutil` command on linux, we can test to see if it works:

```shell
$ ddcutil detect
Display 1
   I2C bus:  /dev/i2c-3
   DRM connector:           card1-HDMI-A-1
   EDID synopsis:
      Mfg id:               DEL - Dell Inc.
      Model:                DELL UP2516D
      Product code:         16609  (0x40e1)
      Serial number:        TYPR36AAATML
      Binary serial number: 1096043852 (0x41544d4c)
      Manufacture year:     2016,  Week: 41
   VCP version:         2.1

Display 2
   I2C bus:  /dev/i2c-4
   DRM connector:           card1-HDMI-A-2
   EDID synopsis:
      Mfg id:               DEL - Dell Inc.
      Model:                DELL UP2516D
      Product code:         16609  (0x40e1)
      Serial number:        TYPR36A6699L
      Binary serial number: 909719884 (0x3639394c)
      Manufacture year:     2016,  Week: 40
   VCP version:         2.1

Display 3
   I2C bus:  /dev/i2c-6
   DRM connector:           card1-DP-1
   EDID synopsis:
      Mfg id:               DEL - Dell Inc.
      Model:                DELL UP2516D
      Product code:         16608  (0x40e0)
      Serial number:        NMYTX917045L
      Binary serial number: 808727884 (0x3034354c)
      Manufacture year:     2019,  Week: 2
   VCP version:         2.1
```

There they are. What can you do with them?

```shell
$ ddcutil capabilities
ddcutil capabilities
Model: UP2516D
MCCS version: 2.1
Commands:
   Op Code: 01 (VCP Request)
   Op Code: 02 (VCP Response)
   Op Code: 03 (VCP Set)
   Op Code: 07 (Timing Request)
   Op Code: 0C (Save Settings)
   Op Code: E3 (Capabilities Reply)
   Op Code: F3 (Capabilities Request)
VCP Features:
   Feature: 02 (New control value)
   Feature: 04 (Restore factory defaults)
   Feature: 05 (Restore factory brightness/contrast defaults)
   Feature: 08 (Restore color defaults)
   Feature: 10 (Brightness)
   Feature: 12 (Contrast)
   Feature: 14 (Select color preset)
      Values:
         01: sRGB
         04: 5000 K
         0b: User 1
         05: 6500 K
         06: 7500 K
         08: 9300 K
         09: 10000 K
         0c: User 2
   Feature: 16 (Video gain: Red)
   Feature: 18 (Video gain: Green)
   Feature: 1A (Video gain: Blue)
   Feature: 52 (Active control)
   Feature: 60 (Input Source)
      Values:
         10: DisplayPort-2
         11: HDMI-1
         12: HDMI-2
         0f: DisplayPort-1
   Feature: AA (Screen Orientation)
      Values:
         01: 0 degrees
         02: 90 degrees
         04: 270 degrees
   Feature: AC (Horizontal frequency)
   Feature: AE (Vertical frequency)
   Feature: B2 (Flat panel sub-pixel layout)
   Feature: B6 (Display technology type)
   Feature: C6 (Application enable key)
   Feature: C8 (Display controller type)
   Feature: C9 (Display firmware level)
   Feature: D6 (Power mode)
      Values:
         01: DPM: On,  DPMS: Off
         04: DPM: Off, DPMS: Off
         05: Write only value to turn off display
   Feature: DC (Display Mode)
      Values:
         00: Standard/Default mode
         02: Mixed
         03: Movie
         05: Games
   Feature: DF (VCP Version)
   Feature: E0 (Manufacturer specific feature)
   Feature: E1 (Manufacturer specific feature)
   Feature: E2 (Manufacturer specific feature)
      Values: 00 01 02 04 07 0A 0B 0C 0D 0F 10 11 13 14 15 19 1A 1B (interpretation unavailable)
   Feature: E4 (Manufacturer specific feature)
      Values: 00 01 (interpretation unavailable)
   Feature: E5 (Manufacturer specific feature)
   Feature: F0 (Manufacturer specific feature)
      Values: 02 05 06 08 09 0A (interpretation unavailable)
   Feature: F1 (Manufacturer specific feature)
   Feature: F2 (Manufacturer specific feature)
   Feature: FD (Manufacturer specific feature)
```

I... don't care about most of that. But the interesting bit is `Feature: 60`, which looks like it'll let me switch
between each of the 4 different input sources.

```shell
$ ddcutil setvcp 60 10
< Display goes blank >
```

Yes, that works.

## Automate! Automate!

So after wiring my desktop on all the DisplayPort inputs, and the work laptop to all the HDMI inputs, I can write some
dumb code that will just call `setvcp` on each display and switch them all over to HDMI. This is a 3-line bash script.

```bash
#!/bin/bash
ddcutil setvcp -d1 60 11
ddcutil setvcp -d2 60 11
ddcutil setvcp -d3 60 11
```

This works brilliantly the first time. Unfortunately, it succeeds literally only the first time - once switched over to
the work laptop, I've no way of switching back. I could just run a copy of this on my work laptop as well, but it's a
Mac and Steve probably won't let me for some reason regarding my own welfare and aesthetic taste.

What we need instead is for the desktop to have some way of knowing that I want to switch the monitors back to the
DisplayPort inputs, but without there being any USB devices connected to it.

"...but without there being any USB devices connected to it."

> Glares at the USB KVM

What if...

> Thinks

What if it were a long-running process that polled the connected USB devices, and when they all went away flipped the
displays to HDMI, and when they all came back again, flipped the displays to DisplayPort?

## Let's ~~Play~~ Code

Obviously I'm going to write some code in Rust, because bash is not a real programming language and this is Serious
System Software that needs to be Very Reliable and Very Fast and Never Crash.

```rust
fn main() -> Result<(), Error> {
    return Ok(());
}
```

Great start. It definitely doesn't crash, or leak any memory!

This is going to be run on the CLI and need some configuring, so let's use [clap](https://clap.rs/). We're going to need
a USB device to look for the presence / absence of, which takes the form of a vendor ID and a product ID. Let's also let
the user specify which monitor/input combo they want to switch to when that USB device arrives and leaves.

```rust
#[derive(Parser)]
struct CliOptions {
    #[arg(short, long, help = "Show Debug Logs")]
    debug: bool,
    #[arg(short = 'v', long, value_parser = u16::from_hex_string, help = "USB Vendor ID to listen for")]
    usb_vendor_id: u16,
    #[arg(short = 'p', long, value_parser = u16::from_hex_string, help = "USB Product ID to listen for")]
    usb_product_id: u16,

    #[arg(
        long, value_parser = parse_duration, default_value = "300", help = "How long to pause after issuing a DDC command"
    )]
    ddc_wait_interval: Duration,

    #[arg(
        long, short, num_args = 1.., help = "Monitor configuration in the format <bus_id>:<device_arrive_mode>:<device_left_mode>"
    )]
    monitor_config: Vec<String>,
}
```

We'll need a way of storing the configuration of which input of which monitor to switch to for each event, as well as
the pause time between ddc commands. For each monitor we can have a struct:

```rust
pub struct DDCDisplaySwitchConfig {
    pub display_bus_id: u16,
    pub device_arrive_mode: u16,
    pub device_left_mode: u16,
}
```

For the USB bit, we're going to use the [rusb][rusb] crate (a nice wrapper around `libusb`). This has a handy API where
you can basically subscribe to events that match a specific USB device, and then call methods on an implementation
of `Hotplug`. This trait just gives you `device_arrived` and `device_left` functions, so you can write your own
implementation of what to do for each of those two events.

In our case, we want a struct that contains a list of configs (one for each display), along with the pause duration (my
setup gets a bit wonky if you try and `setvcp` multiple display commands at the same time).

```rust
struct USBHotplugCallback {
    display_switch_configs: Vec<DDCDisplaySwitchConfig>,
    ddc_wait_interval: Duration,
}

impl<T: UsbContext> Hotplug<T> for USBHotplugCallback {
    fn device_arrived(&mut self, device: Device<T>) {
        info!("Device arrived: {:?}", device);
        self.display_switch_configs.iter().for_each(|config| {
            switch_monitor_to_input_source(config.display_bus_id, config.device_arrive_mode);
            sleep(self.ddc_wait_interval);
        });
    }

    fn device_left(&mut self, device: Device<T>) {
        info!("Device left: {:?}", device);
        self.display_switch_configs.iter().for_each(|config| {
            switch_monitor_to_input_source(config.display_bus_id, config.device_left_mode);
            sleep(self.ddc_wait_interval);
        });
    }
}
```

What does `switch_monitor_to_input_source` look like? It's just a call to `ddcutil` with the right arguments.

```rust
fn switch_monitor_to_input_source(bus_id: u16, input_source: u16) {
    info!(
        "Switching monitor on bus {} to input source {}",
        bus_id, input_source
    );
    let result = Command::new("ddcutil")
        .arg(format!("--bus={}", bus_id))
        .arg("setvcp")
        .arg("60")
        .arg(input_source.to_string())
        .status();
    if result.is_err() {
        warn!("Error setting input source: {:?}", result);
    }
}
```

Boring!

(There's a ddc crate I think. I couldn't be bothered. Maybe I should).

So hanging this altogether (with some signal handling and config parsing stuff), we mostly just need to register our
hotplug callback against `libusb` with the USB device we care about, then enter a loop listening for events. When the
events happen, ddc commands are fired.

```rust
fn main() -> Result<(), Error> {
    let cli = CliOptions::parse();

    simplelog::TermLogger::init(
        if cli.debug {
            LevelFilter::Debug
        } else {
            LevelFilter::Info
        },
        Config::default(),
        TerminalMode::Mixed,
        ColorChoice::Always,
    )?;

    let monitor_config_map = parse_monitor_config(cli.monitor_config);

    let switcher_config =
        SwitcherConfig::new(cli.usb_vendor_id, cli.usb_product_id, monitor_config_map);

    let signal_channel_receiver = setup_signal_handler()?;

    let usb_context = Context::new()?;

    let boxed_callback: Box<USBHotplugCallback> = Box::new(USBHotplugCallback {
        display_switch_configs: switcher_config.display_switch_configs,
        ddc_wait_interval: cli.ddc_wait_interval,
    });

    debug!(
        "Registering hotplug callback for vendor_id: {:?} product_id: {:?}",
        switcher_config.vendor_id, switcher_config.product_id
    );
    let mut hotplug_builder = HotplugBuilder::new();
    let registration: Registration<Context> = hotplug_builder
        .vendor_id(switcher_config.vendor_id)
        .product_id(switcher_config.product_id)
        .register(&usb_context, boxed_callback)?;

    loop {
        let result = usb_context.handle_events(None);
        if result.is_err() {
            warn!("Error handling events: {:?}", result);
            break;
        }
        if !signal_channel_receiver.is_empty() {
            debug!("Signal received");
            break;
        }
    }
    info!("Done");
    usb_context.unregister_callback(registration);
    Ok(())
}
```

Does it work?

```conf
Jun 08 22:28:31 bump silly-kvm[87190]: 21:28:31 [INFO] Monitor ID: 1
Jun 08 22:28:31 bump silly-kvm[87190]: 21:28:31 [INFO] Monitor ID: 2
Jun 08 22:28:31 bump silly-kvm[87190]: 21:28:31 [INFO] Monitor ID: 3
Jun 08 22:28:31 bump silly-kvm[87190]: 21:28:31 [DEBUG] (1) silly_kvm::ddc: Display number: 1
Jun 08 22:28:31 bump silly-kvm[87190]: 21:28:31 [DEBUG] (1) silly_kvm::ddc: Bus id: 3
Jun 08 22:28:31 bump silly-kvm[87190]: 21:28:31 [DEBUG] (1) silly_kvm::ddc: Display number: 2
Jun 08 22:28:31 bump silly-kvm[87190]: 21:28:31 [DEBUG] (1) silly_kvm::ddc: Bus id: 4
Jun 08 22:28:31 bump silly-kvm[87190]: 21:28:31 [DEBUG] (1) silly_kvm::ddc: Display number: 3
Jun 08 22:28:31 bump silly-kvm[87190]: 21:28:31 [DEBUG] (1) silly_kvm::ddc: Bus id: 6
Jun 08 22:28:31 bump silly-kvm[87190]: 21:28:31 [DEBUG] (1) silly_kvm: Registering hotplug callback for vendor_id: 16700 product_id: 8464
Jun 08 22:30:34 bump silly-kvm[87190]: 21:30:34 [INFO] Device left: Bus 003 Device 012: ID 413c:2110
Jun 08 22:30:34 bump silly-kvm[87190]: 21:30:34 [INFO] Switching monitor on bus 4 to input source 16
Jun 08 22:30:35 bump silly-kvm[87190]: 21:30:35 [INFO] Switching monitor on bus 6 to input source 17
Jun 08 22:30:35 bump silly-kvm[87190]: 21:30:35 [INFO] Switching monitor on bus 3 to input source 16
Jun 08 22:30:48 bump silly-kvm[87190]: 21:30:48 [INFO] Device arrived: Bus 003 Device 023: ID 413c:2110
Jun 08 22:30:48 bump silly-kvm[87190]: 21:30:48 [INFO] Switching monitor on bus 4 to input source 17
Jun 08 22:30:49 bump silly-kvm[87190]: 21:30:49 [INFO] Switching monitor on bus 6 to input source 16
Jun 08 22:30:49 bump silly-kvm[87190]: 21:30:49 [INFO] Switching monitor on bus 3 to input source 17
```

Of course! It's written in Rust, so it's perfect and never crashes.

If you want to see / download / use the whole thing, I put it [on github][github].

[rusb]: https://docs.rs/rusb/latest/rusb/

[kvm]: https://en.wikipedia.org/wiki/KVM_switch

[ddc]: https://en.wikipedia.org/wiki/Display_Data_Channel

[monitors]: https://web.archive.org/web/20240413153501/https://www.displayspecifications.com/en/model/da704af

[github]: https://github.com/growse/silly-kvm/
