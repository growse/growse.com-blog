---
layout: post
title: "The joy of mail"
---
After reading about [Richard's][1] attempt to get his email working properly,
I had a few ideas of my own to improve mail collection when you get a large
amount of spam. Currently I get around 400 spams a day, which isn't any where
near enough to worry me in terms of bandwidth and processor usage, but it's
annoying.

Generally, I filter it out pretty well, thanks to [Spamassassin][2]. In
general, every 10 minutes, the mailserver would download all the mail from my
host's pop server and then run it all through [Procmail][3]. This would then
send it to spamassassin which is running as a daemon. After getting the
return, procmail would then drop it into my maildir, after sorting it into
different folders depending on whether it's spam etc.

This was all fine and well, but had a few key problems. Firstly, the processor
load spiked once every ten minutes. This is fine, except it'd be a lot better
if it just burbled along at a constant all the time. Secondly, it meant that
it still dumped all the spam into my inbox. Ok, it's in a different folder,
but if I'd forget to clean it out in 3 months, I'm using up a lot of disk
space with spam.

It occurred to me that a much better solution would be to use the mailserver
as a proper mailserver, rather than a fetch-and-dump solution. So, on
Saturday, I opened a ticket with my host to get them to add an MX record for
growse.com pointing at my home server, and to leave the current MX records in
place at a lower priority. To my mild surprise, they did this in about 5
minutes on a Saturday afternoon. Not bad, not bad at all. Essentially, what
this means is that all the email will be attempted to be delivered to my home
mailserver directly. If it fails or is rejected for some reason, it'll then
try to deliver it to the host's mailserver.

The next decision was what mailserver to use. I'd played with [Exim][4] and
[Postfix][5] before and hated them both for different reasons. Remembering
that I hated postfix less, I installed that and tried to get it working. For
some inexplicable reason, it failed to do even the most basic of tasks, which
was deliver local mail. Despite knowing it was the endpoint for a domain, it
was still trying to do an MX lookup for mail sent locally to that domain, and
then failed to do an smtp connection to itself. No idea why, probably because
it's a stupid thing to do. This sent me on a wild goose chase about a routing
problem which meant that all ports on the external ip address where being
denied inside the network, which required a static route to fix it. Feeling
happy that I'd fixed a networking problem by myself (I'm learning! I really
am!), I was annoyed to find it still didn't fix the problem. Eventually coming
to the conclusion that postfix was shit, I decided to look at exim.

Now I hate exim. Mainly for it's documentation and lack of clarity of. It
seems to be written in the spirit of "You know all about exim and mail
delivery, so you're just reading the documentation for fun". Pretty useful if
you don't actually have a clue. In any case, I read it, re-read it, and then
abandoned it and just decided to guess at what the config variables meant.
Somehow, I managed to get it to work. I have no idea how. It delivers mail, it
runs it through clamav and then spamassassin, rejects mail with a spam score
more than 10, and dumps it in the right place. I'm actually slightly amazed
with myself about that. So now I've got a much better solution than I had
before, and all I need to do to it is to tell it to file what comes in and
labelled spam in a different directory, which should be simple.

Next, the art of skiing.

   [1]: http://www.radiac.net/

   [2]: http://spamassassin.apache.org/

   [3]: http://www.procmail.org/

   [4]: http://www.exim.org/

   [5]: http://www.postfix.org/
