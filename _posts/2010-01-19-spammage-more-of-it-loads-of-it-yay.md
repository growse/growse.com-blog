---
layout: post
title: "Spammage. More of it. Loads of it! Yay!"
---
For some reason, my ongoing battle against spam isn't yet fully won.
Whilst the current combination of MTAs, counter-measures and cluster-bombs are
effective, there's still a few problems.

Actually, there's one specific problem: I don't have enough resources
(specifically, memory) to run my spamassassin bayesian filter any more. I'm
getting a mail from cron pretty much every day detailing the times at which
spamassassin fell over the previous day, mostly due to running out of room in
which to manoeuvre. Yesterday, it fell over 5 times.

I've always been interested in the idea of greytrapping and tarpitting mail.
Simply put, this is a fairly simple way of detecting spam that assumes that
most spammers don't obey the SMTP RFC standard. The greytrapping bit works by
initially rejecting all unrecognised From/To/IP Address tuples with a "Try
again later" message. Proper mailservers obey this and when they reconnect a
bit later get allowed through. Spamming botnets have an aim to deliver as much
mail as fast as possible, so tend to ignore this and not bother reconnecting.

The tarpitting bit takes a blacklist and slows down the connection of any
blacklisted IP address, basically only allowing something silly like one byte
every hour. The idea of this is to use up the resources of the evil mailserver
by holding the connection open as long as possible.

The obvious way to do this is to use [spamd][2] on [OpenBSD][3]. Rather than
being an MTA in its own right, this basically sits in front of the MTA and
does the above cleverness. It's also meant to be quite efficient, because it
doesn't care about the mail body.

Now, I hear you ask, what if the spammer does obey the SMTP RFC and delivers a
mail later? Won't they get whitelisted? Well, yes. But this is why spamd on
its own isn't a good idea. So I'll be keeping my existing content filtering
thingie in place. The nice thing is that the expensive process of looking
through the mail content won't happen on every single mail that drops into my
mailserver, but only those that get past spamd. This should (in theory) stop
it from falling over.

The main problem I have now, is that if I implement this, my [spamwatch][4]
stats will go all screwy, because there's no real way to know how many spams
that spamd rejects (you can deliver multiple mails over a single SMTP
session). I'll keep it going, and hopefully there'll be a huge dropoff in the
number of spams rejected by spamassassin, because they'll be caught by the
spamd filter. It'll be interesting finding out.

   [2]: http://www.openbsd.org/spamd/

   [3]: http://www.openbsd.org/

   [4]: http://www.growse.com/projects/spamwatch/

