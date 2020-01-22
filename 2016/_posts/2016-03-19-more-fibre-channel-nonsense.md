---
layout: post
title: "More Fibre Channel Nonsense"
---
Fibre Channel lives on! Following from a brief [dabble](/2011/02/10/disks-solaris-zfs-fibre-channel-comstar-crumpets-and-butter/) in the past with using Fibre Channel, I decided that it was once again the time to see if I could make it work.

This was was all prompted by the replacement of my old [HP Microserver N40L](http://n40l.wikia.com/wiki/HP_MicroServer_N40L_Wiki) with the much newer G8 model. This broadly does the same thing, but lets you have more memory and better CPUs. Useful for running [ZFS on Linux](http://zfsonlinux.org/). 

So, I was pleasantly surprised to see that a tiny budget lets you buy 4Gb FC kit, rather than the 2G stuff I'd bought a few years ago. I picked up a couple of QLogic QLE 2460 cards and re-used the MM fibre that I had from before.

The main challenge was getting to play nicely with Linux. Before, I had used Solaris which has much better out-of-the-box support for FC targets and integrating it with ZFS. On Linux, [SCST](http://scst.sourceforge.net/) seemed to be the right solution. I was running Ubuntu 15.10, and initially found that someone had made some [SCST Packages on a PPA](https://launchpad.net/~scst/+archive/ubuntu/3.1.x). Adding this and then simply doing `apt install scst-dkms` was all that was needed to get up and running. Adding an FC target was as simple as creating a zfs volume (`zfs create -V 1T netank/vols/bumpvol1`) and then adding the configuration into the scst configuration file:

    HANDLER vdisk_blockio {
            DEVICE bumpvol1 {
                filename /dev/zvol/newtank/vols/bumpvol1
                nv_cache 0
            }
    }

    TARGET_DRIVER qla2x00t {
            TARGET 21:00:00:e0:8b:9b:bd:d5 {
                    enabled 1
                    LUN 0 bumpvol1
            }
    }

You've got to blacklist the kernel-supplied `qla2xxx` driver and use the `qla2x00t` instead. It's also important to set `sync=always` on the ZFS volume, and use `nv_cache 0` on the SCST side. A ZIL is apparently recommended to improve performance. There's a good discussion on the [SCST dev mailing list](https://sourceforge.net/p/scst/mailman/scst-devel/thread/53110470.7030106@vlnb.net/) about this.

This all trundled along great, until I had to reboot the box. When it came back, SCST wouldn't start. I narrowed it down to the kernel having been updated to v4.2.0-30, for which the scst-dkms package had failed to compile the relevant modules. It seemed that I had to either roll back the kernel, or find a different solution. Thankfully, the detailed instructions [on how to build SCST from source with the qla2x00t module](http://scst.sourceforge.net/qla2x00t-howto.html) , while a little daunting, worked great. Just need to remember to re-build these whenever there's a kernel upgrade.

Next steps are to pick up an absurdly cheap SSD and try and use that as a ZIL device to improve performance. I think I've run out of SATA slots on the Microserver though, so will have to come up with something.

Also, I bought a new piccolo. It squeaks pleasingly.