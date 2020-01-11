---
layout: post
title: "Powering a Draytek Vigor 130 using PoE"
---

# Clutter

Moving house a little while ago, I was a little annoyed to find out that the BT master socket (for the ADSL connection) was located at the opposite end of the house to what would have been useful. For a while, I had a window sill cluttered with modem (Draytek Vigor 130), router (Linux box) & media converter (TP-link MC220L), and then weaved a very long (80m?) bit of fibre through the house to get to the Home Office (where All The Work Happens).

Eventually, I borrowed an SDS drill, and ran some cat6 round the outside of the house and moved the router to the office and just sent the PPPoE side of the router down the external cable to the modem. But I was still left with a slightly annoying problem: the modem still needed to be plugged in for power and this was quite awkward given the location of the various power sockets. Maybe there's a better way to power it?

# Power over copper

Most computery device thingies run on DC power. Which is both great, because it's easy to make and reason about, and also bad because most power distribution is AC as it's far more efficient. One of the problems that this gives is that every single little device needs a huge (and sometimes quite inefficient) power supply that can convert AC to DC. Once you get past a handful of devices, each with enormous power bricks / supplies, you start to wonder if there's an alternative. AC's great for sending power over long distances, but a lot of electronic devices tend to be located quite near each other and are also often low-power devices, meaning that the current demand (and therefore associated infrastructure demand) is normally pretty small.
  
Usefully, some other people had the same thought a while back, and [Power over Ethernet](https://en.wikipedia.org/wiki/Power_over_Ethernet) was invented. The reasoning being that a lot of these low-voltage, low-power DC devices tend to also need to be on the end of a network cable (max run 100m), so maybe we could just chuck some amps down the wire? Nowadays there's a whole range of things that can be powered this way, typically things like phones, small network devices (e.g. Wifi access points) and security cameras. You can even now power [your Raspberry Pi with PoE](https://www.raspberrypi.org/blog/introducing-power-over-ethernet-poe-hat/).

Digging around, I discovered that, like many devices, the Draytek requires 12V DC. PoE (802.3af) runs at 48V, but you can buy magic boxes that will both split the power bit out from a PoE-carrying network cable and also step it down to pretty much whatever voltage you like.

I ended up taking a punt on the [TP-link TL-POE10R](https://www.tp-link.com/uk/business-networking/accessory/tl-poe10r/) which is both pretty cheap and does 12V. Annoyingly, the power cable you get with has a 2.5mm plug on both ends, whereas the Draytek needs a 2.1mm plug. Usefully, adapters exist.

Amazingly (I'm not sure why it's amazing, it's pretty straightforward), it worked! The window sill is now much tidier, and I'm now wondering what other low-power DC devices I can also power this way.


 