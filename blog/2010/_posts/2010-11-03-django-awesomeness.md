---
layout: post
title: "Django. Awesomeness."
---
I always had a bit of a soft spot for [Sun][1]. Their account managers were
friendly, they made cool things (Solaris, dtrace, ZFS, Glassfish, OpenOffice
etc.) and they basically seemed to be the result of what would happen if you
took a bunch of hardware and software engineer geeks, locked them in a room
and just let them get on with doing useful stuff. Unfortunately, they don't
appear to have been that good at making money.

Enter [Oracle][2]. Boooo. Hisssss.

At first, things went great. Rumours of mothballing of SPARC, Solaris and
other cool things were initially unfounded. But now the dust has settled, and
things have been creeping along slowly. Things like: the openoffice.org
foundation ditching Oracle and renaming (effectively forking) OO to
[LibreOffice][3]; the [removal of the bargain-basement MySQL support
option][4], so now it costs a minimum of $2000 to get support (was $599); the
[cancellation of OpenSolaris][5]. Etc. Etc.

A while back, I rebuilt this site (and a couple of others) on the
JSP/JPA/Glassfish stack, because at the time it looked awesome. I'd get to
learn Java properly and make use of good quality software that was free.

But now I'm nervous. How long will it be before I don't get glassfish for
free? How long before I find myself tied to an unacceptably proprietary
software stack? James Gosling recently said ["With Oracle it doesn't have to
make sense, it just has to make money"][6] and that seems to be consistent
with Oracle's actions.

So now I'm looking to rebuild everything, again. But with what?

I started reading around, and found an [interesting video][7] comparing some
popular web frameworks. This seemed interesting, because the premise
specifically seemed to be comparing popular web frameworks as an alternative
to J2EE. [Django][8] scored pretty well, and I've heard many good things about
it, and so I decided to give it a go.

In short, I'm impressed. In a remarkably short time, I've built around 80-90%
of the functionality of the site. I know very little python, but have still
managed to put something together that works and needs practically zero
configuration. I fully realise that in the case of a framework, the dev is
hugely shielded from the amount of lifting that goes on under the covers (all
of which adds to latency and hurts performance) but everything feels
lightweight, efficient and easy. I like it.

   [1]: http://en.wikipedia.org/wiki/Sun_Microsystems

   [2]: http://www.oracle.com (Oracle)

   [3]: http://www.documentfoundation.org/download/ (LibreOffice)

   [4]: http://oracle.sys-con.com/node/1597782

   [5]: http://sstallion.blogspot.com/2010/08/opensolaris-is-dead.html

   [6]: http://www.basementcoders.com/transcripts/James_Gosling_Transcript.html

   [7]: http://video.google.com/videoplay?docid=6297126166376226181#

   [8]: http://www.djangoproject.com/ (Django)
