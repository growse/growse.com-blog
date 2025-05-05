---
layout: post
title: "Problems with RSS"
---
RSS is great. It's one of those things that was invented by someone somewhere
that no-one really knows but has nevertheless turned into this big monster
that is liberally sprinkled around the web.

It's a fundamentally simple concept: publish a little bit of data about a
website and let people access the data 'snippets' using some sort of reader
software (web- or desktop-based). From that small piece of data, people can
see at a glance whether their favourite website(s) has(ve) been updated
recently. If there's some new content, they can go to the website in a flurry
of excited activity if what they know about the new content seems to interest
them. All good.

Not really.

Something like this has so much potential to be really *really* good, but to
me it just doesn't seem well thought out. It's as if [XML][1] was invented and
the world suddenly went nuts. Suddenly people could throw data round in a flat
file that could be read by anything that could read XML (which everything can,
because so much XML is being thrown around) and this would stop all wars and
put Oracle out of business. Unfortunately, an XML document is pretty much just
a text file with bells and whistles and, whilst useful, doesn't necessarily
re-invent the internet. The whole how-useful-is-XML debate is a big one, and
I'm not going to argue either way about it here. Suffice to say, I'm
mentioning this because it was invented, and people (as they do) went a bit
mad. RSS was part of the product of this.

So, like I said, great idea in principle - stop everyone having to check their
favourite websites every hour for some breaking news. This saves on people's
time and bandwidth, both of which equal money. But I said it wasn't well
thought out. Here's why.

**RSS: What?** - No-one really know what RSS stands for. I always thought it
was Really Simple Syndication, but never really knew what that meant.
[Wikipedia][2] however seems to think that it also means Rich Site Summary,
RDF Site Summary and Real-time Simple Syndication. Reading about a bit, it
seems that these all refer to different standards created by different people,
which is fair enough but if you just say 'RSS', you could be talking about
anything. This leads me nicely to my next point:

**Standards** - I'm quite a big advocate of standards, simply for the reason
that it makes life easy for everyone. It means when I write some code for an
application, I can guarantee that it will work the same way for all users.
That's what the word 'standard' means. Most protocols out there have a defined
standard, and the lower-level you go, the more critical it becomes. High level
protocols such as [HTTP][3], [HTML][4] and [CSS][5] both have published
standards, but so does IP (RFC0849). HTML and CSS are interesting ones but,
again, that's a different debate. RSS comes in 4 different published versions
(from what I can see); 0.9,0.91,1.0 and 2.0. Some of these are more common
than others, but most sites don't tend to specify what type of RSS feed they
publish. It's just 'RSS'. Ultimately this means that as a developer writing an
RSS client, I have to build in 4 different specifications. Add in Atom and
other types of syndication protocols and it starts to get silly. It could be
much much worse, I admit, but why not just have one standard. Everything would
then be easier. That said, life could get a lot worse with [Microsoft's][6]
new [Simple List Extensions][7]. Microsoft are basically creating a new
'standard' by adding their own new 'tags' to RSS. Microsoft, please stop doing
this. If you think you can do something better, go do it better in the first
place.

**Clients** - When I found out about RSS, I though "great, so I need an RSS
reader". Back then, the market for RSS readers was all a bit of a melee and
there wasn't really anything that was any good. Still today, it seems that
there isn't any clear market leader in RSS readers. There's nothing that 80%
of RSS geeks can point a new user to and say "here, use this". I certainly
found nothing that I thought was good software, so I wrote my own, which I
still use. I would let other people have it, but frankly that wouldn't help
the situation. I'm actually not sure what would help, I'm mostly just ranting
here.

**Authentication** - Because the whole standards thing wasn't thought out very
well, they left all sorts of useful bits out of RSS feeds. For example, it's
all very well publishing a feed for anyone to read your blog, but what if you
want to publish a feed to a select group of people, and actively keep other
people out? Answer - you can't. Not really. Not properly. RSS doesn't support
authentication in any way. It could be argued that it doesn't need to seeing
as HTTP already supports its own authentication. The only downsides of that
are the username/password goes in the URL and therefore travels over the wire
in plain-text, and no-one really uses HTTP authentication for a user-friendly
experience. The first problem is solved by using SSL, but this isn't
necessarily convenient for the host and not that many clients actually support
SSL when fetching RSS feeds. The second problem has come about just because
most site designers recognised that it's a very bad idea to store passwords in
plaintext anywhere on either the server or the client. A lot of authentication
systems make use of issuing time-limited tokens to the client on a successful
login which is then stored in a cookie. Any subsequent requests for restricted
data will see the server ask the client for that token again and see if it
matches what it issued to that user. Of course I could just sniff your token,
but when it expires, I still don't know your password. In any case, I digress.
No-one's yet built a RSS client that supports the storing of cookies in order
to get at data that might be restricted. This makes life difficult and could
have been solved by just a little bit of forethought.

Anyway, that's what I think. Next, AJAX!

   [1]: http://www.w3.org/XML/

   [2]: http://en.wikipedia.org/wiki/RSS_(protocol)

   [3]: http://www.w3.org/Protocols/

   [4]: http://www.w3.org/MarkUp/

   [5]: http://www.w3.org/Style/CSS/

   [6]: http://www.microsoft.com/

   [7]: http://blogs.msdn.com/rssteam/archive/2006/03/28/563116.aspx
