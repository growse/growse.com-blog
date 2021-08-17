---
layout: post
title: "Introducing Spamwatch"
---
I've [talked a little bit before about spam][1] and how I handle it. I've
owned this domain for quite a while now, and it has (seemingly) appropriately
become the target for the everyday spam king. Back in April last year, I
started to keep my mailserver logs as a sort of experiment, the idea being
that I'd look again a year later to see how much spam I received in that year.

Well, I got a little impatient. And when I get impatient I write hideously
inelegant scripts that nevertheless get the job done. I decided that I wanted
to make a graph of my daily spam rejects / deliveries and that lovely charts
at [amcharts][2] would be a good way of displaying this nicely. Great in
theory, but I had to get the data together. Given that my mailserver rotates
it's logs at 6am GMT, I had to write a script to take each day's logs, munge
them all together, re-categorize them by per day and then count them. Also, it
needs to update it every day, without reprocessing the whole lot. A lot of
cursing later I got something working, and I've put the results over at
[SpamWatch][3]. I'm not quite sure what the purpose of this is, or what the
graph is meant to show. I'll think of something.

   [1]: /2008/08/21/wonderful-spam.html

   [2]: http://www.amcharts.com/

   [3]: /2009/01/19/spamwatch.html

