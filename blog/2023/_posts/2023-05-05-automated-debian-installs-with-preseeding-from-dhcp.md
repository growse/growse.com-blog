---
layout: post
title: "Automated Debian installs with Preseeding from DHCP"
description: "Magic automation fun times!"
---

I had to re-build one of my kubernetes nodes recently, and so wearily downloaded the latest debian ISO, copied it to my [Ventoy](https://www.ventoy.net/en/index.html) USB key and booted into the installer.

The Debian installer asks quite a lot of questions, and I usually have the same answers to all of them. As I was waiting for something to complete, I was idly poking around in the documentation around [Preseed](https://wiki.debian.org/DebianInstaller/Preseed), which I knew was a way to provide an "answer" file to the installer to skip over lots of the questions. This had always seemed like a bit of a faff to set up in the past, but what caught my eye was a suggestion that you could provide the preseed configuration as a [DHCP option](https://wiki.debian.org/DebianInstaller/Preseed#Autoloading_the_preseeding_file_from_a_webserver_via_DHCP).

[I like DHCP options]({% post_url 2018/2018-08-29-pxe-booting-a-raspberry-pi %}), because they seem like nice, magic ways of settings configuration to devices on the network from a central place.

## Things you need

### A preseed answer file

Debian recommends that you start with an example, and the one for stable is [over on their website](https://www.debian.org/releases/stable/example-preseed.txt). It's pretty easy to follow, and I was able to get rid of a bunch of stuff that wasn't relevant to me.

In the end, I tweaked:

* Keyboard
* The APT proxy to use my network-hosted cache
* Disabled the root account
* Added a user account with a default password
* Timezone to UTC
* NTP server
* Disk partitioning
* Use UEFI booting
* APT packages to install
* Customize the SSH config to accept my SSH CA

and I dropped:

* Installer locale
* Installer network console
* Anything about the network that wasn't "auto" (I like sending things via DHCP)
* LVM / RAID partitioning

The only tricky bit here was the partitioning. I originally tried fiddling with a custom "recipe", but couldn't get that to work properly. Most of the time this landed me an error of "No root filesystem" or "Device too small", and was pretty frustrating to figure out what was going on.

I essentially wanted a pretty standard layout: 1 disk, a partition on `/boot`, an EFI partition, and then a root partition taking up the rest of the space. It turns out you can mostly achieve this with just:

```text
d-i partman-auto/disk string /dev/sda
d-i partman-auto/method string regular
d-i partman-auto/choose_recipe select atomic
```

Setting `d-i partman-auto/init_automatically_partition select biggest_free` does *not* work if you're overwriting an existing system, it relies on you having blank disks. Obviously, getting it to choose `/dev/sda` sort of relies on that being the actual disk you want to install the system to, but that's a pretty safe assumption for me.

The preseed config also lets you run both "early commands" and "late commands". Essentially, pre- and post-install shell commands. I took the opportunity to pull down my SSH CA public key and add that to the `sshd_config`:

```text
d-i preseed/late_command string wget -O /target/etc/ssh/trusted-user-ca-keys.pem http://myrouter:8001/trusted-user-ca-keys.pem && echo TrustedUserCAKeys /etc/ssh/trusted-user-ca-keys.pem >> /target/etc/ssh/sshd_config
```

### A webserver

When the debian installer boots in automatic mode, it's going to ultimately end up with a URL to fetch the preseed configuration from. So you need a webserver.

I just used `python3 -m http.server` on my router to serve it up. Wrapped up with some `systemd` unit files and it's basic but works.

```systemd
[Unit]
Description=Simple Web Server
After=network.target

[Service]
Type=simple
Restart=always
DynamicUser=yes
WorkingDirectory=/usr/local/share/http
ExecStart=/usr/bin/python3 -m http.server --bind :: 8001
CapabilityBoundingSet=
RestrictNamespaces=true
RestrictAddressFamilies=AF_INET AF_INET6
PrivateDevices=true
IPAddressAllow=127.0.0.1/8 ::1/128 192.168.2.0/24 2001:8b0:c8f:e8b0::/64
IPAddressDeny=any
ProtectProc=noaccess
ProtectClock=true

[Install]
WantedBy=multi-user.target
```

### The right DHCP configuration

I'm running [Kea DHCP](https://www.isc.org/kea/) as a DHCPv4 server, and the documentation is pretty comprehensive. It's not obvious from the documentation, but the magic option to set is `boot-file-name` value and *not* DHCP option 67 (`Bootfile-Name`). The value of this field is the URL that the installer is going to pull the configuration from, and it the configuration looks like this:

```json
{
  "Dhcp4": {
    "client-classes": [
      {
        "name": "deb-preseed",
        "test": "substring(option[vendor-class-identifier].text,0,3) == 'd-i'",
        "boot-file-name": "http://my-router:8001/bullseye.txt"
      }
    ]
  }
}
```

This creates a DHCP client class (a way of group DHCP clients together) selected based on the first 3 chars of the DHCPREQUEST vendor class identifier being `d-i` (which is what the Debian installer uses), and then sends the URL down in the DHCP response for those clients.

## What next?

This works really well. There's a few things that would make it even better but I'm going to do those at some other point.

First is the ISO booting. Currently, the default ISO comes up with a GRUB menu, and you have to specifically request an "Automated Install" (which just sets `auto=true` on the kernel command line). Having this auto-selected would be great. I suspect this will involve fiddling with the ISO itself.

Second is there's still a manual step if the installer detects multiple NICs. Despite setting `d-i netcfg/choose_interface select auto`, I still see a prompt on my test device that has both an ethernet NIC and a Wifi card. No idea why.

Finally, the kernel command line allows you to pass just a hostname into the `url` setting. The installer then does some magic and constructs a url to fetch the preseed config from: `http://<hostname>/d-i/<distribution>/preseed.cfg`. This is handy as you can then supply different configurations to different distributions. Unfortunately, this doesn't work with the DHCP `boot-file-name` parameter, which seems to only work if that's set to a whole URL.
