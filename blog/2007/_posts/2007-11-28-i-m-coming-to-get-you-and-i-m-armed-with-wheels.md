---
layout: post
title: "I'm coming to get you and I'm armed with wheels."
---
It may amuse some to learn that I've started taking driving lessons. Hurrah!
Having spent the last three mornings dribbling around roads near Stockport I
can safely say that this driving thing isn't half as difficult as I thought it
would be. I've a mild tendency to nearly crash into things, but I'm sure that
will happily evolve into a habit of actually crashing into things, given
enough time. All I can say is that it's now a _long_ time since I was 17 and
it's about time.

In other news an interesting thing happened at work. Whilst building an
ASP.NET application designed to serve the needs of a few thousand people, we
(the team! go team!) were considering ways in which the implementation costs
could be cut down. Being a big(ish) company, we have things called "standards"
which the cynics amongst us would claim only exist to get in everyone's way.
Of course, it's actually a good idea to only have a few selected bits of
technology and platforms on which everything is built, because then it's a lot
easier to support, but I digress.

The "standard" in this case was to build the database on [Microsoft SQL
Server][1]. Now, unfortunately, this is about $20k per CPU. Given our habit of
building things a) twice and b) on big hardware, this would have been an
outlay of (2x 4-way boxes) $160k. This is a lot of money, easily dwarfing the
amount that needed to be spent on trivial things like, hardware, people, that
kind of thing. So we needed an alternative. As far as I knew, the only other
standard was Oracle, which is ridiculous. So, throwing caution to the wind, I
put the whole thing on [MySQL][2] running on RedHat and didn't tell anyone.

I was surprised. It ran a lot quicker. I didn't quite believe this, so I did
some tests using [JMeter][3]. Surprisingly, I found that under load, the MySQL
backend gave about a 3-fold performance improvement to the application over
the MSSQL backend. I should point out that not much else changed - the db
schema was the same, with the same triggers, stored procedures and indexes
etc. Now, some people may say that this says a lot about my ability to tune a
MySQL database versus a MSSQL database and they're probably right. However,
I'm not a database expert and managed to get the MySQL db running a lot faster
using only the internet (specifically the fabulous site: [The MySQL
performance blog][4]) and a bit of guesswork. To me, that says a lot.

As it happens, the hand of the standards police has pointed at me, and it
turns out that [PostgreSQL][5] on Solaris is also a standard. This has the
advantage of being both cheap and supported, so I now have to once again go
through a lengthy migration process to move everything over. Hopefully I'll
learn something in the meantime.

So, the moral of the story is: Don't listen to people. Mostly.

   [1]: http://www.microsoft.com/sql/default.mspx

   [2]: http://www.mysql.com/

   [3]: http://jakarta.apache.org/jmeter/

   [4]: http://www.mysqlperformanceblog.com/

   [5]: http://www.postgresql.org/
