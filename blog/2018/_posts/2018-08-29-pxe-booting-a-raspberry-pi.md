---
layout: post
title: "PXE booting a Raspberry Pi (using KEA DHCP server)"
---
I'm pretty fond of the Raspberry Pi and have somehow ended up with about 6 of them doing various different things. One of the biggest issues I have with the platform is storage. They all rely on a micro-SD card (or regular-SD card if it's early) to provide persistent storage. This has two problems: it bumps up the cost of a "£30 purchase" to more like a "£40 purchase", and the IO performance is awful. Now, I'm not necessarily doing anything with these that requires particularly heavy IO, but when it comes to things like keeping the OS up to date and other maintenance, you really feel a slow disk. Also, SD cards seem to fail. A lot.

So the obvious solution here is PXE boot. Every revision of the rPI (except the very first version) supports PXE booting in some way. The catch is that a v1 or a v2 still requires an SD card with the relevant firmware blob on it in order to kick off the process, which sort of defeats the purpose.

Thankfully, I've got enough v3 rPIs to make trying to make this work worthwhile. At ths point, I'm writing this down so that I don't forget how to do it next time.

PXE booting is essentially a simple, yet powerful process for getting computers to be configured on boot by a network server. Specifically, you can configure the computer to use a network share as a root disk, thus removing the need for the computer to have any local storage itself. You can in theory do all sorts of cool stuff with PXE, but I just care about the network-root-share-bit. There's four basic things you need:

1. A PXE-capable client
2. A DHCP server that can hand out specific PXE options
3. A TFTP server
4. An NFS server

## The client (device)

The client is easy. We have one of those in the form of a rPI (let's assume v3). Annoyingly you have to actually specifically enable PXE booting by booting it into linux from an sd card and programming the OTP memory:
```shell
$ echo program_usb_boot_mode=1 | sudo tee -a /boot/config.txt
$ reboot
```
When it reboots, you can check it with
``` shell
$ vcgencmd otp_dump | grep 17:
17:3020000a
```
This bit is all covered in [this rPI page](https://www.raspberrypi.org/documentation/hardware/raspberrypi/bootmodes/net_tutorial.md), but who knows, that may go away at some point.

## The DHCP Server

Next up, the DHCP server. This is where things start to get tricky. Many internets guides talk about using DHCP servers such as dnsmasq, wihch is fine and good but I'm using [Kea](https://kea.isc.org/wiki). Kea is the new DHCP server hotness from the ISC. It supports a whole bunch of nice things and is a bit easier to use and configure than the old ISC `dhcpcd`. However, not many people are apparently using it, and while the docuemntation is [great](https://kea.isc.org/docs/kea-guide.html), it doesn't necessarily answer questions like "How do I get this Raspberry Pi thing working?"

DHCP is request/response and PXE works by fiddling with some of the bits in the response to specific types of request. DHCP responses contain values that live in numbered fields - the spec determines the purpose and type of each field (or 'option'). To get this working, we need to stuff some data into option 43 of the DHCP response. Option 43 is where "Vendor Specific Information" lives and the spec basically says you can pretty much put whatever you like in here, and a client is free to interpret it how thye like (go look at §8.4 of [RFC2132](https://www.ietf.org/rfc/rfc2132.txt) if you care). It's essentially a binary field, each with its own set of fields, lengths and values.

Surprisingly, [IBM has some pretty good documentation](https://www.ibm.com/support/knowledgecenter/SS3HLM_7.1.1.9/com.ibm.tivoli.tpm.osd.doc_7.1.1.9/install/rosd_dhcpoptions.html) on how to set option 43 for PXE booting.

In our case, we will see a DHCP request from the rPI, and need to send it some magic values in option 43 to get it to work. In Kea, we need to define the option format:

```json
"Dhcp4":
{
  "option-def": [
    {
        "name": "PXEDiscoveryControl",
        "code": 6,
        "space": "vendor-encapsulated-options-space",
        "type": "uint8",
        "array": false
    },
    {
        "name": "PXEMenuPrompt",
        "code": 10,
        "space": "vendor-encapsulated-options-space",
        "type": "record",
        "array": false,
        "record-types": "uint8,string"
    },
    {
        "name": "PXEBootMenu",
        "code": 9,
        "space": "vendor-encapsulated-options-space",
        "type": "record",
        "array": false,
        "record-types": "uint16,uint8,string"
    }
  ],
}
```

This tells Kea that we're sometimes going to be setting an option that looks like this. We just need `PXEDiscoveryControl`, `PXEMenuControl` and `PXEBootMenu` to be set.

The other thing we need to do with Kea is tell it to set some DHCP options for any request that is an rPI PXE boot request. Incoming DHCP requests contain a bunch of useful information, one of which is the `vendor-class-identifier`. This is the same for all rPI clients, so we can filter on that:
```json
"Dhcp4":
{
  "client-classes": [
    {
      "name": "rpi-pxe",
      "test": "option[vendor-class-identifier].text == 'PXEClient:Arch:00000:UNDI:002001'",
      "option-data": [
        {"name": "boot-file-name", "data": "bootcode.bin"},
        {"name": "vendor-class-identifier", "data": "PXEClient" },
        {"name": "vendor-encapsulated-options"},
        {"name": "PXEBootMenu", "csv-format":true, "data": "0,17,Raspberry Pi Boot","space":"vendor-encapsulated-options-space"},
        {"name": "PXEDiscoveryControl", "data": "3","space":"vendor-encapsulated-options-space"},
        {"name": "PXEMenuPrompt", "csv-format":true, "data": "0,PXE","space":"vendor-encapsulated-options-space"}
      ]
    }
  ]
}
```

So, every rPI that sends a PXE DHCP request will set the `vendor-class-identifier` to `PXEClient:Arch:00000:UNDI:002001`, and the above configures Kea to respond to such requests with a response that includes some options. First, we specify `boot-file-name` (option 67) to be `bootcode.bin` - this is the first request the client is going to make from the tftp server. We also set the `vendor-class-identifier` (Option 60) to be the necessary value `PXEClient` and then the magic values required in the vendor-specific space.

Finally, we need to set the DHCP `next-server` value to the address of our TFTP server:
```json
"Dhcp4":
{
 "subnet4": [
    {
      "next-server": "192.168.2.2"
    }
  ]
}
```

Now, if you plug the rPI in, it should make a request of the DHCP server and then contact the TFTP server requesting `bootcode.bin`.

### A slight hitch

This usually works. However, sometimes the client receives a valid response and then hangs. It turns out there's a bug in the rPI PXE code where a race condition causes an unrecoverable hang after receiving the DHCP response. [Someone](https://www.raspberrypi.org/blog/piserver/#comment-1375406) worked out a solution involving periodically sending broadcast to the network to 'kick' the rPI into waking up and making the request. I just run a constant broadcast ping on my LAN, seems to work

```shell
$ ping -b 192.168.2.255
```
## TFTP server

A TFTP server setup is pretty easy. I use the one that comes with FreeNAS. Get a valid `bootcode.bin` from a raspbian distribution and place it in the root. Once the rPI has download `bootcode.bin`, it'll then start to make requests for a few other things. Some of these things aren't strictly necessary (e.g. `bootcode.sig`), but others are.

The rPI will make a request to the TFTP server for a bunch of files that expects to be inside a directory corresponding to the serial number of the rPI. So you might see a bunch of TFTP requests for something like `//df90a038/start.elf` - in my case `df90a038` is the serial number of my device. I find it easiest to just try and boot it whilst watching the TFTP log and seeing what it requests, then create that directory on the TFTP root.

Copy the contents of `/boot` from a raspbian image to this folder. One of the files there will be `cmdline.txt` which details all the arguments to be passed to the kernel - it's here where we tell the rPI that it should use a network root disk:

```
dwc_otg.lpm_enable=0 console=serial0,115200 console=tty1 root=/dev/nfs nfsroot=192.168.2.2:/mnt/newtank/pxe/proxybot/,vers=3,tcp rw ip=dhcp rootwait elevator=deadline cgroup_enable=memory cgroup_memory=1
```

In this case, setting `root=/dev/nfs` indicates that an NFS-based root device is required, and `nfsroot=...` specifies the details of where that share is. When the rPI boots, you should see it initialize the kernel, attempt to mount the NFS root and resume booting from it.

## NFS server

Again, I'm using FreeNAS, so an NFS share is a pretty easy thing to expose. I configured the share to only be accessible to the fixed IP address reservation that I know the DHCP server will handle out, and set the root user to be `root`. Once setup, the raspbian filesystem can be copied to it, and that's all that should be needed.

The only tweaking I do past this point is allow the `apt` mechanism to update the kernel by exposing the rPI-specific folder on the TFTP server over NFS and mounting that on `/boot`. From `/etc/fstab`:
```
192.168.2.2:/mnt/newtank/tftproot/proxybot  /boot   nfs     vers=3  0       0
```

This means that when the kernel is updated by upstream, the relevent files on the TFTP folder are also updated, which saves having to manually copy things round.

## Results

I'm pretty surprised at how effective this is. Storage IO is much more performance and reliable than the crappy micro-SD cards I was using earlier, and I no longer need to worry about buying yet another card if I decide to get another device.

It took a pretty long time to figure out how to get the DHCP configuration right, but `dhcpdump` and `tcpdump` are very much your friends in this sort of situation.
