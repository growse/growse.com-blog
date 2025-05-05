---
layout: post
title: "Migration to Slicehost"
---
Well, with [cable][1] dropping to its lowest level in a number of years, the
monthly rental on the server that hosts this and a number of other sites was
becoming a bit more than I liked.

I helped [Robin][2] configure a server for his [D4H][3] site a while back, and
remembered that he was using [Slicehost][4]. Dimly remembering that they were
quite good (and cheap) and not using any other market research, [Ben][5] and I
got us a slice. Overall, I'm impressed. We've got the 512MB option whilst we
migrate and then we'll move up to something bigger once everything is over.
For $38 per month though, we get a 64-bit Xen-based VM, which seems to be on a
dual dual-core Opteron box along with 512MB RAM, 20GB space and 200GB
bandwidth. Ample for the moment. Even when we scale that up to a sensible
amount of memory, it works out cheaper than what we were using before. Also,
migrating from a physical box to a VM means that we're no longer responsible
for the hardware and can enjoy the IO performance of a large RAID 10 array,
rather than rely on a single disk. Neat. Equally nice was the time between
deciding that I wanted one and logging into the box was about 2 minutes.
They'd allocated, configured and built my choice of OS in an amazingly fast
time. The support is good too - I wanted an extra IP address (an extra $2 per
month) and they were very responsive over email.

I'll have to give it some time before I can wholly recommend them, but things
are looking good.

This site is the only domain that I've moved over so far. I'll move all the
services over and then the websites last methinks. If anything breaks, ignore
it and I'll figure it out eventually.

   [1]: http://en.wikipedia.org/wiki/Cable_(foreign_exchange)

   [2]: http://www.bytesurgery.com/blog/index.php

   [3]: http://www.decisionsforheroes.com

   [4]: http://www.slicehost.com/

   [5]: http://www.benhaines.co.uk
