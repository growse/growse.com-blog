---
layout: post
title: "Wonderful SPAM"
---
I started a bit of an experiment a while ago. I'd stop the historical logs on
my mailserver from being deleted and then see how much spam I get in a year. I
started this on April 21st, and here's where I'm up to.

My mailserver has rejected 143,737 messages from 105,062 hosts. Of those
messages; 80,586 messages were rejected because they were attempted to deliver
to known blacklisted addresses and 41,543 were blocked for attempting to use
me as a relay. Interestingly, this means that 85% of the spams I get through I
don't need to run through spamassassin at all, which saves fairly
significantly on processing time.

I suppose a quick word about what I use and how it's configured. I use
[spamassassin][1] and [exim4][2]. I like exim, mainly because once you get
past it's rather strange configuration setup, it's really powerful.

My mailserver is configured to be the primary MX for my domain. When mail
comes in the door, it's inspected to make sure that the target address really
is a domain I own and that the full address hasn't been blacklisted. If either
of these is true, the connection is closed. If the mail is accepted, it is
then run through spamassassin. If the mail was delivered over an authenticated
connection, then the server assumes it's coming from a person allowed to use
it as a relay, and then forwards it on. Spamassassin is configured to do it's
usual bunch of checks, with a few tweaks to scoring. I run bayesian checks
against a postgres database of data and that's fairly good at sorting stuff
out. If the message goes above a certain threshold, it gets dumped in a spam
folder which I then later use for bayesian learning. Anything else gets dumped
in my inbox.

On the whole, it works well. I get the occasional false positive and have to
copy stuff out of my spam folder. Any mail that I reject normally gets passed
onto my secondary MX server, which is just a forwarder to my gmail account.
Whilst 95% of that ends up in gmail's spam folder, some mails which I've said
are deffinately spam end up in my gmail inbox. Looks like I do this better
than Google :)

Things I want to investigate in the future are greylisting and tarpitting.
I've just not got round to figuring these out yet and seeing as this is
currently working quite well, I've not much motivation. One bored day I will
though.

And yes, the BEST MAN DIARY is coming. Soon!

   [1]: http://spamassassin.apache.org/

   [2]: http://www.exim.org/
