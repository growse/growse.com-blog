---
layout: post
title: "Fibre broadband!"
description: "Bye Bye Openreach!"
---

For the last 12 months or so [CityFibre](https://cityfibre.com/) have been digging up most of [Wakefield](https://cityfibre.com/news/wakefield-set-for-full-fibre-boost-as-cityfibre-begins-27m-rollout), which happens to be roughly where I live. Supposedly, in return for this, the good people of this-end-of-West-Yorkshire would have the ability to banish OpenReach from their lives, and get a Proper Fibre Internet Connection, with actual Fibre Fibryness delivered to thier house.

I was somewhat nervous that this meant that anyone who wanted to use the network would be tied to a single provider, but no! A bunch of ISPs announced at some point mid-2022 that they would be able to provide their service through a CityFibre connection. Usefully, [my ISP (who I like)](https://www.aa.net.uk/etc/news/aa-to-introduce-cityfibre-backhauled-services/) jumped on this too.

Once the incessant roadworks and temporary traffic lights went away, I noticed a fibre loop coming out of the ground and LX-taped to my local pole. A few days after that, there was a box at the top of the pole with the fibre un-looped and plugged into it.

After a few weeks of hitting the "CAN I ORDER YOU YET??" button on the CityFibre website, it eventually screamed back "YESS!", so I pinged AAISP and asked them to sort it out.

A surprisingly short amount of time later, some vans and cranes showed up, then did some drilling and other complicated things involving the statutory highway clearance (5.2m) before leaving me with a small black box, some blinky lights and a hole in the wall. After a little bit of cabling and provisioning (somehow involving [VLAN 911](https://support.aa.net.uk/General_Router_Settings#CityFibre_FTTP)), I had a connection!

{% include image.html alt="Speed test" src="/assets/img/2023-03-31-fibre-broadband/cityfibre-speedtest.png" %}

## Is that... a power cable?

The only snag was that the ONT (that's Optical Network Teminator) is a powered, active device. A bit like... a modem?

Anyhow, there was an ugly power cable getting in the way. I like powering things over ethernet, the way the original founders intended, so after pulling the box off the wall and searching for "anatel gigapoint poe", [I came across this handy blog post](https://web.archive.org/web/20230331170834/https://andrewbesford.com/powering-a-calix-801g-v2-gigapoint-via-power-over-ethernet-poe-ae6e00da236d?gi=7cd73463deda) which explained that with a handy little injector device, you could power the ONT over PoE.

By sheer coincidence, I owned this exact little injector device because I'd used it to [power my Draytek Vigor 120]({% post_url 2020/2020-01-06-powering-a-draytek-vigor-130-using-poe %}) that I was using for my ADSL line. I'd just stopped using this, so re-purposed it, and it worked!

{% include image.html alt="PoE CityFibre ONT" src="/assets/img/2023-03-31-fibre-broadband/cityfibre-ont.jpeg" %}
