---
layout: post
title: "Screw you Realtek"
description: ""
tags: [ "realtek", "kubernetes", "networking", "problems" ]
---

So I've got three nodes in my homelab k8s cluster (celebrated its 7'th birthday the other day 🎈 ) that are lovely little
lenovo M75 boxes. They're cheap, reasonably powerful, not too old, and make great k8s nodes for light workloads.
The big problem, however, is that they have Realtek RTL8111/8168/8211/8411 NICs in them, which are *not* good.

## The problems begin

A few months ago, I was troubleshooting soft-hangs, and the internet suggested that the in-kernel r8169 driver did not
behave very well under load. "My system stops responding when there's more than a dribble of network traffic" was a
common thing that people complained about. There was a suggestion that the the out-of-tree r8168 driver might work
better.

I run my k8s nodes on debian stable, and the r8168-dkms package is available there, so I give it a shot. The dkms
package takes care of building the kernel module and blacklisting the r8169 driver which makes switching pretty
straightforward. I blindly do this on the three k8s nodes that have this NIC, and reboot.

Problem fixed! No more soft-hangs!

## Some time later

At some point, I move house. When rebuilding / cabling the homelab, I notice that there's a little gentle jankyness. One
of the k8s nodes takse a *little* bit too long pulling container images from the local registry cache. Poking around,
nothing seems obviously wrong.

I run an `iperf` test across the node pool and oh dear:

```shell
[  1] local 2001:8b0:c8f:e8b0::2f port 5001 connected with 2001:8b0:c8f:e8b0::2c port 53764
[ ID] Interval       Transfer     Bandwidth
[  1] 0.0000-10.0204 sec  1.15 GBytes   987 Mbits/sec
[  2] local 2001:8b0:c8f:e8b0::2f port 5001 connected with 2001:8b0:c8f:e8b0::2e port 35998
[ ID] Interval       Transfer     Bandwidth
[  2] 0.0000-11.5529 sec  4.75 MBytes  3.45 Mbits/sec
```

987Mbit/s good. 3.45Mbit/s bad. These are roughly the same hardware, same driver, same OS, same switch.

I swap the cable, the switch port, no change. Claude (hah!) makes a suggestion that this is a jumbo frames problem.

> Does clamping the MTU on the iperf client help?

It turns out that `iperf -6 -M 1500` shows the performance back to line rate. Huh.

Everything's configured for jumbo frames. MTU of 9000. So why does this one host have a problem? Also, where between
1500 and 9000 does it stop behaving?

One binary chop later:

```shell
iperf -6 -N -M 7373 -c  thinknodebot
------------------------------------------------------------
Client connecting to thinknodebot, TCP port 5001
MSS req size 7373 bytes (per TCP_MAXSEG)
TCP window size: 16.0 KByte (default)
------------------------------------------------------------
[  1] local 2001:8b0:c8f:e8b0::1 port 56558 connected with 2001:8b0:c8f:e8b0::2e port 5001
[ ID] Interval       Transfer     Bandwidth
[  1] 0.0000-10.2512 sec  36.8 MBytes  30.1 Mbits/sec
```

Too big.

```shell
 iperf -6 -N -M 7371 -c  thinknodebot
------------------------------------------------------------
Client connecting to thinknodebot, TCP port 5001
MSS req size 7371 bytes (per TCP_MAXSEG)
TCP window size: 16.0 KByte (default)
------------------------------------------------------------
[  1] local 2001:8b0:c8f:e8b0::1 port 56136 connected with 2001:8b0:c8f:e8b0::2e port 5001
[ ID] Interval       Transfer     Bandwidth
[  1] 0.0000-10.0125 sec   960 MBytes   804 Mbits/sec
```

Works fine.

7372 is a very weird threshold. I also discover that iperf'ing the other way from the problem host to anything else
works great.

Something is wonky with the RX path on this one host. I'm out of ideas, so I ask Claude again

> Have you considered using the r8169 driver? the r8168 is a little problematic and you might get more stability with
> the in-kernel r8169.

*Sigh*.

I remove the r8168-dkms package, which restores the r8169 driver, and reboot. It works at line rate with jumbo frames.

I tear my hair out.
