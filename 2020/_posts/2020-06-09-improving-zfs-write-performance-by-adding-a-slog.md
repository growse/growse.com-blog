---
layout: post
title: "Improving ZFS write performance by adding a SLOG"
---

## ZFS is great!

I've had a home NAS running ZFS for a pretty long time now. At the moment I'm running [FreeNAS](https://www.freenas.org/) 
but in the past have used both ZFS-on-Linux on Ubuntu, as well as plain Solaris (back when Solaris 
[was free software](https://en.wikipedia.org/wiki/OpenSolaris)).

It's mostly a frivolous platform for learning stuff, and currently I'm using it for a bunch of different things: a
file-store to keep archives of things on, a storage target for my toy Kubernetes cluster, a 
[FC disk target for my desktop]({% post_url 2020/2020-02-03-problems-with-unmounted-san-luns-and-windows-clients %}), and 
an NFS root for some [PXE-booted Raspberry Pis]({% post_url 2018/2018-08-29-pxe-booting-a-raspberry-pi %}).

At the moment, I've got 6 SATA disks in it, which provide about 10TB of space. ZFS is pretty good at using memory vaguely sensibly
for caching purposes (thanks to the [ARC](https://www.youtube.com/watch?v=F8sZRBdmqc0), so there's also 48GB of memory in there to
help with that. ZFS can also make use of a separate device to host a second layer of cache called the [L2ARC](http://www.brendangregg.com/blog/2008-07-22/zfs-l2arc.html)
and a lot of people have had success throwing SSDs in there to provide a bigger-but-still-quite-quick cache layer to further help read performance.

## Network Writes :(

While a lot of stuff I do is quite read-heavy, I've had an issue with write performance for a while. By default, writes on ZFS
(like a lot of other systems) are asynchronous - you only get a pause for sync if the application specifically asks for it.
[Disks are notorious liars](https://queue.acm.org/detail.cfm?id=2367378) about what they're doing and how they're doing it
mostly to cover up the fact that most disks are actually very slow. There's a lot of smoke and mirrors employed to hide this
and create the illusion of performance at the expense of data loss risk if the power suddenly disappears. Ultimately, a
data write isn't actually persistent until its made it out of all the volatile caching layers and sometimes it's difficult to know
exactly when that's happened.

So, disks are slow. Especially when it comes to *synchronous* writes. And super-especially when it comes to small, random synchronous
writes. How slow? This is taken from my FC-attached disk on my desktop (which has a 4K block-size):

{% include image.html alt="FC performance pre-SLOG" src="/assets/img/2020-06-09-improving-zfs-write-performance-by-adding-a-slog/prelog.png" %}

That memory and L2ARC is doing great for read performance. But write performance doesn't really get above 40MB/s and that's 
for chunky sequential writes. Smaller writes are between 1-2MB/s. Spinning disk drives are just slow.

This really affects things that are using NFS here - by default FreeNAS treats all writes coming in over NFS as synchronous,
which means that if you have a device that's using an NFSroot, performance is pretty bad. Many writes that an OS does are 
small (logging etc.) and the whole system really suffers.

## ZFS writes

In general, ZFS buffers writes through a range of structures. One of these is called the [ZFS Intent Log (ZIL)](https://www.ixsystems.com/blog/zfs-zil-and-slog-demystified/) 
which is essentially a non-volatile transaction log. A write that is requested makes its way through various volatile buffers
before eventually being appended to the ZIL. At some point later, the ZIL is flushed to the actual disks. But because the ZIL
is non-volatile, synchronous writes are acknowledged once the ZIL write is done.

The problem is that by default, the ZIL lives on the same ZFS vdevs as the underlying data because it has to be non-volatile - it's just a separate area of the zpool.
This means contention. Not only is the write to the ZIL slow (because disks are slow)but those writes and reads are competing with other disk activity. 

Usefully, ZFS gives you the option to move the ZIL to a separate device, or SLOG ('S' means 'separate' apparently). You can 
test to see the performance difference by creating a RAMdisk and adding that as an SLOG. While it makes for fun numbers it is a
**very bad idea**. Any writes that an OS *needs* to be persisted synchronously are now just living in memory (for potentially multiple seconds)
which means they're not safe. Don't do this.

It's tempting to take the same approach with the L2ARC - get a cheap SSD and use that. But there's a number of problems here: firstly, 
the SLOG is a very write-heavy buffer. *All* of the writes for the entire pool will go through it, and some (especially cheaper)
SSDs have durability issues making them not particularly suitable. Secondly, cheap SSDs lie to you - they'll happily claim
that the data is written before it actually is. There's a whole feature on SSDs called Power Loss Prevention (PLP) - only
really found on "enterprisey" drives - that's basically code for "I won't lie to you about writes".

PLP-enabled SSDs are quite expensive, but Intel's [Optane](https://www.intel.com/content/www/us/en/architecture-and-technology/intel-optane-technology.html)
thingies seem like they might be quite useful here. I managed to pick up a slightly older [58GB Optane 800p](https://www.intel.com/content/www/us/en/products/memory-storage/solid-state-drives/consumer-ssds/optane-ssd-8-series/optane-ssd-800p-series/800p-58gb-m-2-80mm-3d-xpoint.html)
which, while it doesn't have PLP specifically, does seem to get around the issue by not using write caching in the same way. 
Put another way, sync writes are actually persisted. The drive I got is NVMe, so I got a PCIe-NVMe adapter and plugged it in:

{% include image.html alt="FC performance post-SLOG" src="/assets/img/2020-06-09-improving-zfs-write-performance-by-adding-a-slog/postlog.png" %}

Hurray! Much better write performance.

So now I've hit the *next* bottleneck. It looks like that I'm not able to read/write any faster than about 412MB/s
over this FC connection. 412MB/s is about 3.2Gb/s so that feels like the limit of the 4Gb FC connection (at about 80% efficiency). 
I'll just go check the prices of 8Gb FC adapters on ebay...