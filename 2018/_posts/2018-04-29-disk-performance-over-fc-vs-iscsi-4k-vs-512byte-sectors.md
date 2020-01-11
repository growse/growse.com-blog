---
layout: post
title: "Disk performance over FC vs iSCSI, 4k vs 512byte sectors"
---
I've [messed around](/2016/03/19/more-fibre-channel-nonsense.html) with [fibre channel](/2011/02/10/disks-solaris-zfs-fibre-channel-comstar-crumpets-and-butter.html) a little in the past, and have persisted in running some sort of fibre channel thing. For the past few years, I've had a few disks on my local PC hosted on my local [FreeNAS](http://www.freenas.org/) system. 4Gbit fibre-channel kit has now reached the point of obsolescence, which means absurdly cheap prices on ebay (even the 8GB stuff is getting cheap now). For the cost of a couple of adapters and a small length of magic glass, you too can forego having to stuff multiple annoying disks into your case and instead shove them into a noisy box and banish them all to the end of the garden.

Some people might say "why not use iSCSI instead?", and I thought I'd quickly test some performance numbers to see what I'm missing out on. I created a 500GB ZVol and exposed it as a target. I could then see this on my desktop (Windows 10) both via the fibre card, and also via the built-in Windows iSCSI client. Network is simple 1GbE.
 
I then ran [atto benchmark](https://www.atto.com/disk-benchmark/):

### iSCSI

![iSCSI](/assets/img/png-transparent.png){:class="lazyload" data-src="/assets/img/2018-04-29-disk-performance-over-fc-vs-iscsi-4k-vs-512byte-sectors/iscsi.png"}

### 4GB FC

![FC](/assets/img/png-transparent.png){:class="lazyload" data-src="/assets/img/2018-04-29-disk-performance-over-fc-vs-iscsi-4k-vs-512byte-sectors/fc.png"}


So, fairly obviously, the iSCSI drive is bumping into the 1GbE network limitation, which has a theoretical max throughput of 125MB/s. The FC link has a limit of 500MB/s and it looks like that's getting closer to that. 

However, looking at the smaller size reads and all the write speeds the FC also perfoms better, especially at smaller writes. Once you get to larger write sizes, I think the write limit of the NAS starts to become the limiting factor.

Of course, this is all deeply unscientific - I'm comparing a software target / initiator with the FC cards, where a lot of the work is done in hardware. It'd be interesting to repeat this test using proper, dedicated NICs that had fancy built-in iSCSI capabilities. Or even using multi-path - multiple paths between initiator and target can increase throughput.    

## Sectors!

While I was there, I thought I'd compare the new 500GB target with my existing 1,329GB target. The disks in my NAS are all 4k sector disks, but the older target had been configured with 512-byte sectors. This means a) more operations needed for a given long write and b) the NAS was having to work to 'translate' 512-byte sector writes into 4k sector disks. The new target I created for this test was configured with 4k, so *in theory* should perform a little better. I ran the same test on my 512-byte sector FC target:

![FC 512-byte](/assets/img/png-transparent.png){:class="lazyload" data-src="/assets/img/2018-04-29-disk-performance-over-fc-vs-iscsi-4k-vs-512byte-sectors/fc-512.png"}


The biggest difference appears to be on write performance. Reads look about the same, but the 4k sector target shows roughly a doubling in throughput on larger writes, and even more dramatic improvement on smaller writes.

I think I'll retire the old ZVol and migrate over to a new one.