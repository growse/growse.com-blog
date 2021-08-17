---
layout: post
title: "Wiring in Chromecasts"
---

## Wifi Flakiness

For a while now, I've been having some intermittent problems with my Chromecasts. They work great, most of the time. But sometimes they're not visible on the network, or they are visible but can't be connected to, or can be connected to but won't play anything. Basically most variations on "sometimes broken".

Having never really had time to debug (when I notice it's broken is when I want to watch something, which is absolutely *not* when I want to debug something), I had gotten as far as figuring out that there was some weird interaction between the device, the wifi and something else. Sometimes rebooting the chromecast worked, sometimes restarting the cast source (phone) worked, sometimes only rebooting the AP worked.

It seemed pretty clear that something was wonky about the network. Something was getting lost somewhere. What was interesting is that when the problem was solved by rebooting the AP, the AP had been up for a while - typically > 3 months. Perhaps there's some internal state of the bridge on the AP that leaks something and falls over after a certain amount of time, but it's certainly not a reliable enough failure to be certain about that. I've [had issues before]({% post_url 2014/2014-04-23-unifi-wireless-ap-and-ipv6-weirdness %}) with Unifi APs dropping traffic randomly, but am wary of assuming it's the same thing here.

## Actual copper wires to the rescue 

Obviously, the best answer to all network problems is to hard-wire everything in. Wifi is a kludgy hack that's only useful if you have a device that's impractical to wire in. 

My chromecast does not fall into this category. It never moves, and there's a network switch next to it. Let's wire it in!

Google sells an adaptor for £15, but you can get cheaper versions elsewhere. I'm both cheap and a sucker for new random problems, so bought a cheap version. Having had this for about a month now, the problems seem.... solved? I'm sure it's just the placebo effect, but the whole thing seems more responsive and it's yet to not-show-up or not-play-a-thing yet.
