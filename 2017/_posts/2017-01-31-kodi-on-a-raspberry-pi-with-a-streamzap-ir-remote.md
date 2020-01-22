---
layout: post
title: Kodi on a Raspberry Pi with a Streamzap IR remote
---
For a long time, I've had a small box plugged into my TV running [Kodi](https://kodi.tv) (formerly XBMC). The original inspiration was Jeff Atwood's [2013 HTPC build](https://blog.codinghorror.com/the-2013-htpc-build/) which led to the creation of my current media box. I used roughly the same case, motherboard and CPU and discovered that this was powerful enough to both occasionally play some media files and also fiddle about with for some other projects.

As time wore on, a few things happened. Firstly, I didn't make too much of an effort to make it particularly quiet. There's a lot I could do to reduce fan noise and get it down to a whisper, but I can't really be bothered. Secondly, with the acquisition of a couple of HP's excellent value Gen8 Microservers, I don't really *need* that much compute power (and therefore, cooling) under my TV. Finally, [Raspberry Pis](https://www.raspberrypi.org/) became [awesome](https://www.raspberrypi.org/products/raspberry-pi-3-model-b/). They always were awesome, but with a faster processor, a decent amount of memory and the existing built-in hardware video decoding, it becomes a serious proposition for a silent, media playback machine.

# Lovely Pi

I really like the rPI platform - I've currently got 2 in use, one as a [VOIP PBX running Asterisk](/2007/03/19/setting-up-home-voip-with-asterisk/) and another that uploads ADSB data to [FlightRadar24](https://www.flightradar24.com). I've yet to be one of these slightly more hardcore electrical engineer types who actually solder stuff together and driver it with python, but I'm sure that day will come. 

I had a spare rPI 2, so I downloaded the latest [Raspbian](https://www.raspbian.org/), imaged it to a microSD card, plugged it into the TV and booted it up. Actually, I forgot that since last year, Raspbian disable the SSH server on their image unless you place an empty file called `ssh` on the `/boot` partition. So I subsequently turned it off, copied the file to the disk and then turned it back on again. 

# Kodi

Kodi is available in the default repository so installing it is as simple as 
```shell
$ apt install kodi
```
Usefully, this will also give you an init script in `/etc/init.d/kodi` that you can use to start it. Simply doing
```shell
systemctl start kodi
```
Should give you output over the HDMI display ' no X or Wayland needed. Enabling on boot is as easy as
```shell
systemctl enable kodi
```
On an rPI 2 (and a 3), browsing the UI is pretty smooth. It's a little juddery in places, but nothing to complain too much about. Where you'll really notice the lack of CPU ability is when you ask it to do a lot: e.g. load a media library while also trying to use the UI. Then you'll see the temperature spike and things start to slow down. Usefully, you only have to import a library once.

# Tweaks (or, "Bits I needed to do and am documenting for my future self")

There are a few things that I needed to do to fix some issues.

## GPU memory

By default, the Raspberry Pi gives 64MB of memory to the GPU (out of its total). This is *not enough* for video playback in Kodi - playing media results in hearing audio, but not seeing any video come out (and also errors like `OMX_ErrorInsufficientResources, insufficient resources` in the log file). 

This is simply solved, give the GPU more memory. In `/boot/config.txt` you can adjust the memory split:
```
gpu_mem=226
```
On my rPI 3, I went with 226M. This seems like a pleasing number, and also appears to work. Bear in mind that this value is how much of the total amount of memory is given to the GPU, so the more the GPU has, the less the system has. 

## IR remotes (Streamzap) and Lirc

Back in the old days, if you wanted to get an IR remote working with Kodi, you had to fiddle with Lirc and XML mapping files. I was expecting to have to do this again, but was surprised to see that when starting Kodi for the first time with my [Streamzap](http://www.streamzap.com/consumer/pc_remote/index.php) remote control plugged in, some of the keys worked. Basically the arrows, and the Play/Pause button. Nothing else though. Looking through the kernel modules, it appears that the latest kernel ships lirc modules enabling it to natively detect some remotes. In `dmesg`:
```
[    2.245517] usb 1-1.5: Product: Streamzap Remote Control
[    2.245526] usb 1-1.5: Manufacturer: Streamzap, Inc.
[    5.429770] Registered IR keymap rc-streamzap
[    5.430330] input: Streamzap PC Remote Infrared Receiver (0e9c:0000) as /devices/platform/soc/3f980000.usb/usb1/1-1/1-1.5/1-1.5:1.0/rc/rc0/input0
[    5.430366] rc0: Streamzap PC Remote Infrared Receiver (0e9c:0000) as /devices/platform/soc/3f980000.usb/usb1/1-1/1-1.5/1-1.5:1.0/rc/rc0
[    5.454491] input: MCE IR Keyboard/Mouse (streamzap) as /devices/virtual/input/input1
[    5.454963] streamzap 1-1.5:1.0: Registered Streamzap, Inc. Streamzap Remote Control on usb1:4
```
So the kernel has registered it as an input device. Sure enough, `/dev/input/by-id/usb-Streamzap__Inc._Streamzap_Remote_Control-event-if00` existed. So how could I get all the keys to work?

It turns out that this is a slightly convoluted process.

Firstly, you can use `ir-keytable` to make sure that the kernel lirc module recognizes the remote, and that it captures keypresses correctly. 
```shell
$ ir-keytable
Found /sys/class/rc/rc0/ (/dev/input/event0) with:
Driver streamzap, table rc-streamzap
Supported protocols: NEC RC-5 RC-6 JVC SONY SANYO LIRC RC-5-SZ SHARP XMP other 
Enabled protocols: LIRC RC-5-SZ 
Name: Streamzap PC Remote Infrared Rec
bus: 3, vendor/product: 0e9c:0000, version: 0x0100
Repeat delay = 500 ms, repeat period = 125 ms

$ ir-keytable -t
<mash some ir keys>
Testing events. Please, press CTRL-C to abort.
1485896642.136353: event type EV_MSC(0x04): scancode = 0x28d3
1485896642.136353: event type EV_KEY(0x01) key_down: KEY_RIGHT(0x0001)
1485896642.136353: event type EV_SYN(0x00).
1485896642.248345: event type EV_MSC(0x04): scancode = 0x28d3
1485896642.248345: event type EV_SYN(0x00).
1485896642.493787: event type EV_KEY(0x01) key_up: KEY_RIGHT(0x0001)
1485896642.493787: event type EV_SYN(0x00).
1485896643.232517: event type EV_MSC(0x04): scancode = 0x28d1
1485896643.232517: event type EV_KEY(0x01) key_down: KEY_LEFT(0x0001)
1485896643.232517: event type EV_SYN(0x00).
1485896643.336477: event type EV_MSC(0x04): scancode = 0x28d1
1485896643.336477: event type EV_SYN(0x00).
1485896643.583773: event type EV_KEY(0x01) key_up: KEY_LEFT(0x0001)
1485896643.583773: event type EV_SYN(0x00).
```
Next up is the mapping file. This lives in `/etc/rc_keymaps` and tells the driver how to map different ir codes to the actual keys. Debian ships a streamzap file in `/lib/udev/rc_keymaps/streamzap`, so this can just be copied to `/etc/rc_keymaps/`

Finally, lirc just needs to be installed and configured to use the inputdevice as a `devinput` device:

In `/etc/lirc/hardware.conf` the important bits:
```
LOAD_MODULES=true

# Run "lircd --driver=help" for a list of supported drivers.
DRIVER="devinput"
# usually /dev/lirc0 is the correct setting for systems using udev 
DEVICE="/dev/input/by-id/usb-Streamzap__Inc._Streamzap_Remote_Control-event-if00"
```
and in `/etc/lirc/lircd.conf`:
```
include "/usr/share/lirc/remotes/devinput/lircd.conf.devinput"
```
Assuming that both Kodi and lircd are configured to start on boot, this should now produce a fully-working IR remote in Kodi when it starts up.

### Customization

I wanted to change a few mappings for some functions in Kodi. Specifically, the coloured buttons have some default actions that aren't that useful to me (start PVR, view pictures etc.). These can be changed by overriding Kodi's `remotes.xml` file. Copy the default from `/usr/share/kodi/system/keymaps/remote.xml` to `/home/kodi/.kodi/userdata/keymaps/remote.xml` and editing that lets you customize what logical key maps to which Kodi function. Simple.

Next thing to do is to work out what to do with the old hardware...