---
layout: post
title: "Spamwatch, revised!"
---
Earlier in the year, when I [built][1] [SpamWatch][2], I put it together by
cobbling together lots of different scripts and hoping that it worked
together. Thinking that this wasn't very reliable, I decided to see if there
was a better way.

What I'm effectively trying to do is count the number of lines in a log file
between a set date range. Given that my log files seem to rotate at any time
they want, it's a bit of a challange to get a list of log lines for a
particular time period. Then it occurred to me: the best way of querying a
large set of data using different criteria is a database. All I had to do was
find a way of shoving my exim4 logs into a database, then I could query it and
get stats more reliably.

Syslog is the obvious answer here. Exim can happily send logs off to various
different places and by dumping it on syslog, I can pretty much do whatever I
want. I stumbled across [rsyslog][3], a syslog daemon that can throw log
entries into a database, so I set that up on a new VM and flicked the switch.
So far, it seems to be working. It's been a couple of days and my syslog table
is 50,000 lines long. Now I need to get some numbers out of it and compare
them to what I'm getting from the old fudge-and-gaffer-tape way.

   [1]: /2009/02/10/introducing-spamwatch.html

   [2]: /2009/01/19/spamwatch.html

   [3]: http://www.rsyslog.com/
