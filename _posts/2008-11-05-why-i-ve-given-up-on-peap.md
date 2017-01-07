---
layout: post
title: "Why I've given up on PEAP"
---
Wireless security always seems one of those things that's fairly easy to get
right. It's reasonably well established what security mechanisms and
encryption algorithms are feasibly breakable and which aren't. What's always
been the problem (for me) is management.

If you want to do the home-based or "personal" security mechanisms, you have
two options: WEP or some variant of WPA (there's WPA, WPA2 with either TKIP or
AES). WEP is fairly trivial to crack given enough packets, so that leaves WPA
as being the recommended approach. However, most people will just pick a short
and simple WPA password that they can remember so they don't have to write it
down. The downside to this is that by being short and simple, it's fairly easy
to brute-force. Therefore, the recommendation is to pick a pass-string of
maximum length (63 chars I believe) and randomness. You're never going to
remember that, so you have to either write it down, or stick it in a text file
somewhere. This leads to two problems, a security one and a convenience one.
Firstly, if you write it down, someone else can steal it. Secondly, if you've
got it in a text file, when a guest wants to hook up to the wireless, you have
to faff with USB keys and copying and pasting things.

Thankfully, there's a better way, but it adds complexity. [EAP][1] can be used
to authenticate clients to a network. It can work on both wired and also
wireless and be implemented in a number of ways. On the wireless side, some of
those ways are *awful* (e.g. LEAP which is rather easily broken) and some of
those are much better. PEAP seems to be one of the more popular given that
it's fairly widely implemented in wireless clients and isn't proprietary to
one particular company. The wireless access point (WAP) basically sees a
client connecting and passes the EAP conversation off to an authentication
server, like [FreeRADIUS][2]. Great, but you've got to maintain your own
FreeRADIUS server and database of users. Not a problem in a corporate
environment (at which this approach is targeted) but a bit overkill for the
home. Still I like tinkering with things, so I ran this for a year.

But then, problems. Getting your wireless client / WAP / FreeRADIUS server all
talking nicely can be a bit of a black art. It's not helped by things like
Debian's decision not to compile SSL (and therefore TLS, TTLS and PEAP)
support into their FreeRAIDUS package. I've spent many hours troubleshooting
odd little problems which manifest themselves mainly as "the wireless is
broken". Last night was the last straw and I've decided that life is too short
to waste maintaining services that just seem to break all the time. It's been
fun getting it working, but it's not for me. Back to USB sticks and long pass
strings I think.

   [1]: http://en.wikipedia.org/wiki/Extensible_Authentication_Protocol

   [2]: http://freeradius.org/

