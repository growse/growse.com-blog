---
layout: post
title: "Android *really* doesn't like broken IPv6 networks."
---
I got a [Nexus 7](http://www.google.com/nexus/7/). Sorry.

With that out of the way, I thought I'd write about something interesting that I discovered, as a result of having a dreadful setup experience with the Nexus.

But first, some background.

My ISP is [AAISP](http://aaisp.net.uk/) and they're *awesome*. One of the things that they provide is native IPv6 connectivity, which is a useful thing, especially if you've got kit to support it. For a long time, I used a Cisco 877 as both a DSL modem and router. However, due to some fairly well documented issues between the Alcatel DSL chipset in the 877 and BT's DSL kit in the exchange, I decided to stop using the 877 for DSL duties, and bought a Draytek Vigor 120 modem instead. This is a lovely thing, and basically just translates ATM to Ethernet. The 877 just initiates a PPPoE session with the Draytek, instead of a PPPoA session over its own DSL equipment. In theory, this should give me the benefits of using the 877 as a router, but with the stability of a sensible DSL modem not fighting with the exchange.

This setup works perfectly for IPv4. However, mysteriously, this breaks IPv6 routing in a non-obvious way. IPv6 packets get from the router to the internet without any issue (I called the ISP, they did a lot of checking), but devices behind the router have issues. Effectively, any packet smaller than about 500 bytes goes through without issue. Between 500 and 700 bytes, it starts to progressively drop packets until packet loss reaches 100% for packets > ~700 bytes.

This is obviously very broken. It's also apparently the 877 doing this wrong, which is weird. I'm on the latest IOS firmware (15.1(4)M4) and if I had more time, I'd raise this with Cisco. As it stands, I'm actually looking at replacing the 877 with a [PfSense](http://www.pfsense.org/) box, but that's a story for another day.

Anyway, the upshot of all this is that the internet effectively stopped working properly for clients. IPv6 clients believed they could access IPv6 sites, because small packets worked. However, as soon as any serious data started to get pulled down, it would fall over as none of the packets would get through. This broke many sites on the internet that advertise IPv6 connectivity: Google, Facebook, Youtube etc. 

As an interim, I blocked all IPv6 traffic on the router by putting in a traffic filter. In theory, this means that all traffic should be forced over IPv4. This appeared to work. Until I turned on the Nexus 7.

This is where things got weird. Stuff was randomly crashing all over the place, straight out of the box. I factory reset it a couple of times, applied a system update (which worked fine), all to no avail. Specifically, in Google Play, it refused to show any screenshots and also refused to download any app updates. Thankfully, I vaguely know what I'm doing with Android devices, and thought it would be a good idea to take a peek at what the logcat (lolcat!) was doing. Interestingly, I got a lot of the following:

    E/AndroidRuntime( 5366): FATAL EXCEPTION: pool-2-thread-5
    E/AndroidRuntime( 5366): java.lang.SecurityException: failed to connect to /2a00:1450:400b:c01::84 (port 80) after 60000ms: isConnected failed: EACCES (Permission denied)


and

    E/Volley  ( 3867): [273] NetworkDispatcher.run: Unhandled exception java.lang.SecurityException: failed to connect to /2a00:1450:400b:c01::84 (port 80) after 5000ms: isConnected failed: EACCES (Permission denied)

It's trying to download stuff via IPv6, and the router is saying NO! Mostly because that's what I told the router to say by putting that traffic filter on. What's interesting is how Android is handling this result. It's got an IPv6 address from the router, so believes it can fetch IPv6 data, but instead of falling back to IPv4, it's just crashing all over the place. In my view, this is a bug. Yes my IPv6 setup is broken, on purpose, but there's a perfectly valid IPv4 fallback mechanism that could be used instead.

By taking the IPv6 address off the internal VLAN and stopping the router from advertising any IPv6 addresses at all, everything works perfectly. I've not checked if there's an open bug against Android for this, but if there isn't, I'll see if I can get one filed. 