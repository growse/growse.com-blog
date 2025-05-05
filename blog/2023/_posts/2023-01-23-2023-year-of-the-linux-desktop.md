---
layout: post
title: "Is 2023 the year of the Linux desktop?"
description: "An adventure in seeing if I can replace my Windows desktop with KDE"
---

I bought a new SSD recently. Prices are pretty good these days, and there was some sort of special offer that ultimately
meant that you could pick up a [Samsung 980 Pre PCIe 4.0 M.2 SSD](https://web.archive.org/web/20220612085348/https://www.samsung.com/uk/memory-storage/nvme-ssd/980-pro-with-heatsink-1tb-black-nvme-pcie-gen-4-mz-v8p1t0cw/)
for £100.

The last time I bought an M.2 SSD for my desktop was back in 2015, when I paid £72 for a [128GB Samsung SM951 M.2](https://semiconductor.samsung.com/newsroom/tech-blog/sm951-product-overview/).
So in 6 years, we've gone from £0.56/GB to £0.10/GB, and gone from a PCIe 3 to PCIe 4 interface. According to [UserBenchmark](https://ssd.userbenchmark.com/Compare/Samsung-980-Pro-NVMe-PCIe-M2-1TB-vs-Samsung-SM951-NVMe-PCIe-M2-128GB/m1302577vsm34737)
the 980 is not-quite twice-as-fast, so this is a pretty decent rate of progress.

## Why Windows?

I'd previously been running Windows 10 on my desktop, and was starting to run into a few issues. Doing big `gradle assmeble`
tasks caused lots of stuttering (something something IO scheduling), the sound card drivers just dropping out periodically
as well as plain running out of space - 128GB is not really enough.

I run [Arch Linux](https://archlinux.org/) on my Thinkpad T480s using KDE, and it's a pretty nice experience. Given that
I've got some slightly [weird hardware]({% post_url /2016/2016-03-19-more-fibre-channel-nonsense %}) on my desktop, I
thought it'd be a fun experiment to see if it worked here.

After a couple of false starts where I couldn't get one of the three monitors working (turns out, it helps to plug it in)
I've now got everything configured and... it works great!?

FC disks, steam, SMB mounts, audio - all of it works. Better still, it doesn't fall over when I do a big project build.

Maybe 2023 really will be the "year of the Linux desktop"?
