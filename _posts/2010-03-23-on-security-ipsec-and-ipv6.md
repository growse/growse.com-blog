---
layout: post
title: "On security, IPsec and IPv6"
---
As technical problems go, getting [IPsec][1] working properly would usually
score about a 7 on my imaginary 1-10 scale of 'things that I think are
difficult'. However, for some reason, I found myself dabbling with this very
issue in order to solve a particular problem.

I've got a couple of development servers at home, where I do a lot of work for
both myself and other people. Occasionally, I need to be able to access these
remotely, but keep other people out at the same time. Now, there's a number of
different solutions for this, most of them slightly clunky. It did occur to me
that these servers are IPv6 capable, and through the use of [AICCU][2] I can
have IPv6 wherever I go. I had a plan.

What I really wanted was to be able to connect to these servers remotely, over
any service/port and have that connection authenticated and encrypted. A full-
whack VPN would probably do it, but I've had bad experiences with that. On-
demand IPsec seemed a better idea, as that's independent of what the traffic
above it is (web, SMTP, etc.).

After some tinkering, I'm nearly there. I'm at the point where I can do on-
demand ESP IPsec between a mobile, remote Linux client and a development
server, authenticated with x509 certificates. Mostly using [IPsec tools][3]
and Racoon. What I need to test next is other flavours of Linux, Windows and
certificate revocation. Then I'll do a proper write-up.

   [1]: http://en.wikipedia.org/wiki/IPsec

   [2]: http://en.wikipedia.org/wiki/AICCU

   [3]: http://ipsec-tools.sourceforge.net/

