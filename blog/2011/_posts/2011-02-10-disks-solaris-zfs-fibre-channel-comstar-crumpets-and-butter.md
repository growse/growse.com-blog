---
layout: post
title: "Disks, Solaris, ZFS, Fibre Channel, COMSTAR, Crumpets and Butter."
---
I did a thing.

Because I'm moving house (yes yes, old news, I know) one of the things that
I'm looking to downsize on is the amount of space my dvd collection takes up
in my living room. At the moment, it's "far too much" and in the new house,
it's bordering on "ridiculous". So I came up with a plan: Rip each dvd
entirely to disk, plug it into [XBMC][1] and enjoy the vast amount of free
space I just created.

However, there's a problem. My current storage box thingie is too small, and
doesn't have any room for any more capacity. There was only one option: build
a new storage box thingie!

I had grand plans this time. I had a fairly hefty requirements list around
availability, redundancy, performance and capacity, so in short I needed
something that worked, worked well and had the ability to grow bigger in the
future. [ZFS][2] was the obvious choice. I know that previously I've [ranted
about Oracle][3] and how they're potentially quite evil, but on balance, ZFS
is too awesome to miss. It comes with a big dollop of Oracle-shaped risk, but
for this application that's a risk I'm prepared to take.

Hardware first: I bought one of [these][4]. If the link's dead, it's a 4U
rackmount 20 bay SAS hotswap case. Not cheap, but it turns out that hotswap
rackmount cases generally aren't. Into this I stuck an old SMP motherboard
with 2 AMD Opteron 265s in it, which I just happened to have lying around. I
also bought a couple of Q-Logic QLA2340 2GB fibre cards (£20 each on ebay). I
also had 8 500GB disks lying around, so that was a good start.

Software: I like Solaris, but OpenSolaris seems to be in a bit of limbo at the
moment. In the spirit of throwing caution to the wind, I plumped with
[Nexenta][5], which is basically OpenSolaris with a GNU userland. So it feels
GNU-y, but is actually Solaris. I've used it before and it's fairly solid.

So, I started to set everything up. Predictably, I hit problems instantly. I
guess I should be pleasantly surprised that a bunch of hardware that's been
collecting dust for the past 3 years should actually work, but it did. At
first. The problems came with the software. The Nexenta installation went
without a hitch, but when it next booted, the Solaris kernel promptly told me
that a number of AMD Errata hadn't been corrected in the BIOS, before promptly
giving me a kernel panic with:
```
panic[cpu2]/thread=fec203a0: Too many lgrps for platform (4)
```
Great.

Solaris' recommendation was that I update the BIOS, which might be tricky
given that Iwill went out of business 4 years ago. They also recommended that
I turn NUMA off in the BIOS, which wasn't an option that I was given. It turns
out there is no solution to this, and with Iwill not existing and the open
source Solaris kernel in a current state of limbo, not likely to be a solution
either. Luckily, the system boots after going through a panic/reboot cycle
about 10 times. No idea what's going on there.

So I set up the zpool with the 8 disks in a mirrored config and all goes well.
Next step is to expose a zvol as a FC lun through the QLogic card. This didn't
work. I spent several days reading, configuring, reading, shouting, writing
and more reading, all of which culminated in [this post][6] on
[ServerFault][7] (I earned the 'mothball' badge for that!). I came to a simple
conclusion: you can't make a 2GB QLogic card a FC target on Solaris. Can't be
done. Impossible. You either need a QLogic 4Gb card (£200 on ebay) or an
Emulex card (£20 on ebay). I went with Emulex - specifically an LP10000DC
dual-port thingie.

A few days later, this turned up, and worked. Properly. You have to set a
`target-mode=1` setting in the `/kernel/drv/emlxs.conf` and make sure the
firmware is up to date, but other than that, smoothness. I'm properly
impressed with COMSTAR too - the configuration required to get something up
and running is so minimal:
```shell
$ zfs create -V 500g tank/comstar/target1
$ sbdadm create-lu /dev/zvol/rdsk/tank/comstar/target1
$ stmfadm add-view
```
And that's it. You can get more complex with host groups and target groups,
but that's not really necessary for something like this. What's more, because
it's ZFS, you get built-in SMB and NFS sharing, deduplication, compression,
fault tolerance etc. all for free. That said, I'd recommend you turn dedup off
for zvols, unless you want write speeds of 2MB/s. Works perfectly fine for
regular ZFS filesystems though.

So, for several thousand pounds less than what EMC/NetApp/whoever would have
charged, I've got a decent NAS/SAN box at home that does what I need it to do,
mostly. There's still problems - I need a new motherboard at some point to get
around the kernel panic issue, and the write performance on zvols through
COMSTAR is weirdly bursty.

I guess I'd suggest that if you want something that works first time without
any shouting, spend a lot of money. If you like a lot of head-scratching,
shouting, reading and a general sense of achievement when it does all work,
build it yourself.

   [1]: http://xbmc.org/

   [2]: http://en.wikipedia.org/wiki/ZFS

   [3]: /2010/11/03/django-awesomeness.html

   [4]: http://www.xcase.co.uk/X-Case-RM-420-Hotswap-4u-p/case-rm420.htm

   [5]: http://nexenta.org/

   [6]: http://serverfault.com/questions/230427/solaris-fibre-channel-target-configure-qlogic-qla2340

   [7]: http://serverfault.com/
