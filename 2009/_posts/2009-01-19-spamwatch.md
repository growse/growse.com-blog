---
layout: post
title: "SpamWatch"
---
I get a lot of spam. I found a neat little script as part of [Exim4][1] called
eximstats that looks at mail logs and makes a little report on how many
messages a particular exim installation has handled. Thinking this was
interesting, I started to hang onto my logs and promptly forgot about it.

I came back to this thing some time ago, and decided that a much more
interesting thing (from my point of view) would be to see if the amount of
spam I get on a daily basis changes, in light of world botnet-destroying
events. So I decided to hack together no less than 4 different scripts that
would figure out each day, how many spam messages I received.

This total figure per day includes both the emails that I reject out of hand
because they're obviously spam, and those that get dropped in my spam folder
because they might be spam. It doesn't include mails that spamassassin didn't
think were spam, but which later turned out to be. Therefore any variation
might be just as likely to be cause by spamassassin going wrong, than by any
other sort of major world event.

And because I like graphs, I made it into a graph. 

   [1]: http://www.exim.org/

