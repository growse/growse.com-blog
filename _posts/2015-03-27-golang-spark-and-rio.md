---
layout: post
title: "Golang, Spark and Rio"
---
The things in the title aren't necessarily connected, but sum up what's being going on over the last few weeks.

Golang
---

Go has been generating a bit of hype recently, some of it justified and some of it not. I've been fiddling about with it [for a while now](/2014/12/28/a-whole-two-weeks-off/) and set myself the goal of trying to rewrite this blog in golang to get a better understanding of how it worked. 

Firstly, I looked around to see what web frameworks were available for go, and settled on [gin](http://gin-gonic.github.io/gin/). Gin uses [httprouter](https://github.com/julienschmidt/httprouter), a high-performance http router for go, but adds useful things like templating and middleware. There was a bit of a learning curve at first, but it felt quite comfortable once I got to know it. There's a few quirks, such as the whole POST-variables-must-be-bound-to-a-struct-with-the-right-tags-on-it pattern, but other than that, it's quite intuitive.

I'd expected templating to work a bit like [Django templates](https://docs.djangoproject.com/en/1.7/topics/templates/), and to a large extent it does. There's some differences in template nesting and custom functions, but nothing surprising.

For caching, I wanted something that basically achieved what a simple [memcached](http://memcached.org/) deployment achieves, but without the overhead of installing, running, managing and connecting to a separate process. Basically, an in-memory, threadsafe, expiring key-value store. I forked an implementation of a thread-safe map I found and added in the bits I need, and called it [concurrent-expiring-map](https://github.com/growse/concurrent-expiring-map). It seems to work fairly well - gin tells me that a page from cache is returned to the client in a few hundred microseconds, as opposed to 5-20ms for a non-cached page. 

Database migrations have always been a pain, although the best I've seen is [Django's 1.7 implementation](https://docs.djangoproject.com/en/1.7/topics/migrations/). I wanted something fairly simple, and found [github.com/tanel/dbmigrate](https://github.com/tanel/dbmigrate) which seemed to fit the bill.

Finally, it was clear that gin wasn't going to give me anything to help with static assets, so I turned to [grunt](http://gruntjs.com/) which nicely handles SCSS compilation and minification, JS minification and bundling, and cache-busting.

Adding in a handful of tests and wiring the whole thing up to [CircleCI](https://circleci.com/) means the whole thing gets deployed as soon as I do a `git push`, which is rather pleasant.

All in all, it works rather well, but I wouldn't necessarily say that golang was a natural fit for writing web apps. It's great for developing little system tools, or even larger bits of software, but for web there's probably a better way. Golang is fairly simple - it famously has no generics, and feels quite procedural. Developing in it makes you feel like you're doing a lot of the lower-level trudge work yourself (there's no useful / sane ORM for example). That said, the ecosystem is great, and if you need a library to do something, there's usually a good selection.

Spark
---

I've also been doing a lot of work with [Spark](https://spark.apache.org/) recently. I stumbled across a bug, which ended up giving me a nice insight into how the Spark development process is run. I initially filed a [bug](https://issues.apache.org/jira/browse/SPARK-5655) which received absolutely no attention whatsoever. A few days later, it occurred to me that I'd probably get more traction if I attempted to fix the problem myself. After forking on github, tracking the issue down, writing a patch and sending a PR, the whole thing was turned around really quickly. The patch was reviewed, discussed and eventually accepted in around a day or so. It's always nice to be listed in the [release notes](https://spark.apache.org/releases/spark-release-1-3-0.html) (along with 173 other people).

So, if you're running Spark on a secure YARN cluster and find that the YARN auxiliary shuffle service actually works, that was me. I fixed that.

Rio de Janeiro
---

I went to Rio. This was both brilliant and frustrating. It's a very special place - imagine a mountainous landscape drawn by a 4-year-old, and then sprinkle some buildings, beaches and roads over the top, and you've got Rio. As well as being very hot (33°C in autumn) with great beaches and cheap drinks everywhere, there's lots to do and see. 

The downside is that I could never live there. Nothing works, and everyone seems to just accept that this is a fact of life. For example, in a restaurant, a waiter will typically bring over a multitude of card machines because he knows that at least one of them will probably not work. About a quarter of taxi drivers have no idea where anything is. About 80% of cash machines don't work, for various non-specific reasons. And yet, somehow, Brazil is becoming a significant player in science and technology. 

So, people should go. But only if you're not irrationally irritated by things that should work but don't. The beach works, as does the sea. That's all you really need.