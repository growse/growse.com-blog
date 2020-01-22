---
layout: post
title: "Unifi wireless AP and IPv6 weirdness"
---
I've got a couple of [Unifi AP](http://www.ubnt.com/unifi#UnifiHardware) wireless access points at home, and they're rather good in many ways. They work well together, are easily configurable, , aren't very expensive and are actually just little linux boxes inside. All good things.

However, they seem to have some slightly odd bugs. Here's one I spent a while figuring out.

I've got a linux box serving as a router. It's running all the usual router-y things, including `radvd` and `wide-dhcp6-server` for handing out IPv6 addresses. These are configured so that devices on the network should get a router advertisement that indicates that they should do a DHCPv6 request, and pick up their addressing / DNS / etc from there. This works great.

Until a few days ago. Stuff just stopped getting IPv6 addresses, and were stuck with just a link-local. IPv4 worked fine, and statically addressed IPv6 devices still had connectivity. Plainly, something in the router advertisement world was broken.

I spent a while troubleshooting this, disabling the DHCPv6 server and just trying to assign using `radvd`. Still nothing. I played around with just running the DHCPv6 server and using `dhclient -v -6 wlan0` on a wireless client. I could see the DHCPv6 server get the solicit, and publish the advertisement. Then, nothing.

I then decided to just run `radvd` and this time do a `tcpdump` on both router and client, filtering on all ICMPv6 traffic:

    tcpdump -vv -x -X -s 1500 -i any icmp6

I set the `MaxRtrAddresInterval` to be 10, so I would expect an ICMPv6 packet to be sent from the router at least every 10s. Sure enough, `tcpdump` on the server showed packets leaving the router. On the wireless client, nothing was coming in. I ran the same `tcpdump` on a wired, statically-addressed client - this saw the ICMPv6 packets without any issue. So now I knew it was a wireless problem

I randomly searched around for a bit, and poked in the Unifi management page. I came across a random page somewhere where someone was talking about disabling rogue DHCP solicitations across their wifi network. I aimlessly clicked a setting that I thought should be set in the Unifi configuration. Suddenly, the APs deicded that this meant they should reprovision themselves. Everything dropped off the network, and when I reconnected, suddenly IPv6 was working again. Somehow, reprovisioning the APs had caused router advertisement traffic to be delivered again to wireless clients.

This is odd. I'm still not sure why this should happen. If it happens again, I'm going to remove devices from the network to make sure it's not a rogue device somewhere causing issues. If it's not that, then it would appear to be a bug in the AP firmware. Weird.