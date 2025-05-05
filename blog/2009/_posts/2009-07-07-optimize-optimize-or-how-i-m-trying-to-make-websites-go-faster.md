---
layout: post
title: "Optimize! OPTIMIZE!!!!!!!! (or, How I'm Trying To Make Websites Go Faster)"
---
Something that's become a bit of a strange obsession of mine recently is site
optimization for speed. I've worked on a few web projects in the past few
years and one of the main things that I've learned is that performance is as
important as functionality. It's easy to build a site that works and then
declare the job done - far more difficult to make it perform and scale
properly. I tend to use this site as a bit of a sandbox for experimenting with
what works and what doesn't. Which is probably why bits of it are broken a lot
of the time.

There's a whole bunch of different things that can be done, some of which are
worth doing, and others aren't. Some also take up a lot of effort, others less
so. The easy stuff is what most people know - compression and caching
lifetime. If you get these right, you're probably most of the way there to
getting good performance out of a particular codebase. For image compression,
one of the most important things I found was that image quality isn't half as
important as a lot of people think. When I was building the images for this
site, I was trying to make them look as good as possible. These images are
just pointers! Navigational aids that make the site more pleasant to use. No-
one's going to spend more than a couple of seconds looking at them, so no-
one's going to care that there's a slight bit of dithering on the blue in a
particular area. Realising that, I managed to cut the size of one of the
sprites from 70KB down to about 20KB. Doing that sort of thing everywhere can
add to up to a big saving.

For text compression, there's a number of approaches. Webservers and browsers
have supported gzip for quite a while now, and it's remarkably effective.
Yahoo think that [gzip reduces the size of web content by 70% can be used by
90% of the browsers out there][1]. Good stuff. But on top of that, there's
more. I use a nice app called [Minify][2] that can take a collection of
javascript or CSS files and serve them up over a single request. You take a
hit on the first request, as the php concatenates the files and strips out
anything unnecessary, but it gets cached on the server side after that. Yahoo
again reckon that minifying before gzip'ing can save another 5% on size. It's
also less work for the webserver and browser to do, as the uncompressed data
is smaller.

On top of that, there's a couple of extra things that can be done. If there's
a lot of images, serve them from multiple subdomains. The browser can then put
in lots of simultaneous requests across these different subdomains and load
the complete image set faster. [Pagespeed][3] and [Firebug][4] are absolutely
invaluable for messing around with this sort of thing.

However, all of this is useless unless the application code works well. I
moved from Apache/CGI to Lighttpd/FastCGI a while back and saw some progress,
but a little itch tells me that it could be better. There's a couple of things
I need to investigate which may improve speed a bit. I may even ditch Perl as
a platform (Oh No!) and do a rewrite in something like Java. Just wait for
this to break again :)

   [1]: http://developer.yahoo.com/performance/rules.html#gzip

   [2]: http://code.google.com/p/minify/

   [3]: http://code.google.com/speed/page-speed/

   [4]: https://addons.mozilla.org/en-US/firefox/addon/1843
