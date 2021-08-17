---
layout: post
title: "Moving house and detecting location using wifi"
---

Recently, I moved house. Not too far, I'm still in West Yorkshire ("Yarkshare"). This process also reminded me that there's a horrible bug in how phones detect their location, and how no-one really cares.

Most phones / location-aware devices use a bunch of different sources to figure out where they are. If they can see the sky, then GPS is one of the best data sources. If not though, they have to rely on other methods. This often includes trigangulation based on the GSM base stations it can see, but it also involves seeing what WiFi APs (via the BSSID) are nearby, and then consulting a database that maps BSSIDs to probable locations.

There's a few of these databases. Google has one (obviously), Mozilla has one (I've [written about]({% post_url /2017/2017-04-09-mozilla-location-services %}) contributing to that before). They all work the same way - rely on devices that have known good locations and capture what BSSIDs are in the vicinity. Then, if another device doesn't have a good fix but can see the same BSSIDs, then it's likely in a similar place.

The glaring flaw in this model is that if you physically move the location of the Wifi APs, it breaks.

So, I moved house. I have a bunch of Unifi APs that I use for Wifi and naturally they came with me. Two years of living in one place had "taught" the databases that these APs were in a specific place. So, when I installed them in the new place, my phone got very confused. Sometimes the location was correct (because of... GPS?) and sometimes I'd jump 20 miles away.

Now, I appreciate this doesn't happen very often. Most APs are installed in a mostly permanent way, which means that the assumption that a BSSID = a location is mostly solid. What I'm finding surprising is how long this issue is persisting. Presumably, when my phone has a good GPS fix, it's uploading that position along with the BSSIDs to Google/Mozilla/Whoever. However, the fact that it still gets confused as to where it is when it loses the GPS signal means that the amazingly clever "Let's AI everything" doesn't appear to have figured out that the physical location of the APs may have changed. Having my phone bounce back and forth between two locations 50 miles apart doesn't appear to have triggered any form of data invalidation.

Admittedly, it is getting a little better. I now have rooms where at one end of the room the location is correct, and 10 feet away it jumps 20 miles.

Computers are stupid.