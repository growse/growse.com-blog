---
layout: post
title: "Check your PoE budgets!"
description: "How weird PoE device behaviour could be caused by not enough power juice"
---

Power over ethernet (PoE) is a magical thing. Having had enough of dealing with eleventy billion different incompatible AC/DC adapters and then dealing with the inevitable drawer/box/cupboard of sadness, the idea that you can power a device over *the same cable* that you deliver connectivity over is a good one. I'm a little bit obsessed. PoE or bust.

Over the last few years, in the Current House, the number of connected devices owned has gone up a little bit. Having acquired a couple of [PoE switches]({% post_url /2020/2020-01-23-adventures-with-asymmetric-routing-and-firewalls %}), which enabled me to do things like [locate my modem where there's no power socket]({% post_url /2020/2020-01-06-powering-a-draytek-vigor-130-using-poe %}), I've tended to take advantage of the new world of possibilities and acquired things that are PoE-able. Including

- Wifi Access points
- Phones
- Doorbells
- Other switches (!)

## Too much power?

A few weeks ago I did a silly thing. I cut the phone line to the house. There was a good, yet faulty reason for this at the time, but it left me without a decent internet connection. Thankfully, the 4G backup thingie that I'd set up a while ago seemed to work ok, but because it went to a different ISP, the VoIP connection stopped working.

Having previously fitted a fancy doorbell that can (and will!) initiate a SIP call to my mobile, not having an external VoIP service meant that I could no longer tell when someone was pressing the doorbell. Dependencies! 

Digging out a spare IP phone lying around and wiring it into the switch near the front door, I told the doorbell to just phone that instead. Problem solved, albeit temporarily.

Except.... some time later I noticed that the WiFi AP also on that switch had started behaving badly. Random reboots, mostly at night. In the worst case, every few minutes. Not so much during the day. These two things did not appear to be correlated at the time, and it just seemed like the AP was faulty. After much resetting and re-provisioning, the reboots persisted. There was nothing in any of the logs that indicated why it might be doing that, so it didn't seem like a software issue.

It later occurred to me that a reason why computery things sometimes behave badly is if they're not getting enough power, or the power supply isn't how they like it. It could well be that an unclean or inadequate power supply could cause a device to reboot itself. But this AP is PoE! And there's infinite amounts of power available over PoE! Just keep plugging all the things in and be happy.

No. The switch the AP was plugged into is a [Unifi USW Flex](http://web.archive.org/web/20210412193455/https://store.ui.com/collections/unifi-network-switching/products/usw-flex) which can "provide up to 15W PoE output". Apparently if I'd powered the switch itself off an 802.3bt PoE source, that goes up to 46W, but I've just daisy chained it off a [Unifi US-8-150](https://web.archive.org/web/20210527084430/https://www.ui.com/unifi-switching/unifi-switch-8-150w/) which only provides 802.3at at best. Let's take a look to see what the power usage is on the Flex: 

{% include image.html alt="Unifi switchports power usage" src="/assets/img/2021-05-27-check-your-poe-budgets/switchports.png" %}

Oh. That adds up to about 13W, and while watching the numbers I saw it spike as high as 18W. 18 is more than 15. I also helpfully labelled every port (Port 1 is upstream), so what's that on "Port 5" drawing 4W? It's the IP phone I plugged in a few weeks ago. Apparently, it needs 4W to sit there, doing nothing.

This now starts to make sense. It also fits with why the AP was rebooting more at night. The little camera I have watching over the kitchen (to make sure Dog is not stealing things) has IR LEDs to see in the dark, and these are probably only powered at night. Light level drops, camera switches on IR LEDs to see, more power draw pushes the demand over the supply capability and the AP reboots.

So there we have it. Power is not, in fact, infinite.