---
layout: post
title: "Getting a Huawei E220 3G working on 3 with Ubuntu 8.04"
---
I've never pre-ordered anything in my life. But when I saw that the Eee 901
was on [pre-order at Amazon][1], I seized the moment and ordered. A little
expensive, compared to the 900, but should be worth it. I've gotten a bit
annoyed with having to carry a huuuuuge laptop everywhere, so something tiny
that I can just use for web / email / ssh out and about would be ideal.

However, this is all fine if I were to be near a wireless access point. But
what if I'm in the park? Enter the Huawei E220 HSDPA 3G modem. These USB
thingies tend to come with the mobile internet bundles you see from the
various mobile companies. The one I've got is hooked up to [3][2]. I know this
works on windows - there's software on the modem itself that you can pull down
and run. However, I've no plans to run windows on the Eee, so I've just spent
the last hour figuring out how to get it working in Ubuntu. Turns out that if
you know how, it's surprisingly easy:

  1. Go to [https://forge.betavine.net][3]

  2. Download and install the latest VMC Card Driver Linux

  3. Plug in the modem - you should see some messages in the syslog about
finding the device. If you're not sure, check to see if /dev/ttyUSB0 exists.
If it does, you're in business. If not, you're screwed.

  4. Load up the Vodafone app - I found it in my applications menu

  5. Give it a phone number of *99#, any username / password you want and an
APN of three.co.uk. The DHCP DNS servers didn't work for me for some reason,
so I put in the [OpenDNS][4] servers as static instead. Try it DHCP first
though

  6. Press 'connect'

  7. Yay!

All I need to do now is wait 10 days for the Eee to show up :)

   [1]: http://www.amazon.co.uk/gp/product/B001C9Z3ZU?ie=UTF8&tag=pht-21&linkCode=as2&camp=1634&creative=6738&creativeASIN=B001C9Z3ZU

   [2]: http://www.three.co.uk

   [3]: https://forge.betavine.net

   [4]: http://www.opendns.com

