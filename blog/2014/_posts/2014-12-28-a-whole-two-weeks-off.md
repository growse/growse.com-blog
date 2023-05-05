---
layout: post
title: "A whole two weeks off"
---

Following my previous exciting [day off]({% post_url /2014/2014-11-28-a-day-off %}), I'm currently in the middle of a
lovely two week pause from "work". I imagine that I'm not alone in this though, given the season etc. On the plus side,
skiing happens at the end of this week, and that will be awesome.

From my list last time, I've completed most of the things on it. I've bought 3 replacement bowls, fitted a hilariously
loud horn to the bike, had lunch, bought a new Z-wave switch and fiddled with some web bits. However, I did run down a
bit of a garden path with this whole golang thing though, which I thought was worth digging into.

So far, I've got a working prototype of a golang application which does the basic blog functionality. Along the way,
I've learned a lot of things, mostly positive, and mostly what others have written about. Suffice to say, the built-in
webserver is great, and the profiling invaluable.

Along the way, I had to solve a caching problem. I was originally using memcache, but thought that I'd get better
performance with fewer dependencies if I just shoved everything in a map. Concurrent access then becomes a problem, so
I've forked and altered a [thread-safe map](https://github.com/growse/concurrent-map) implementation to use as a cache (
I only need to stored byte arrays). I've got some TODOs on that, specifically implement a cache size limit and provide a
better interface for storing/retrieving structs. Also, writing more tests. Tests. Oh, tests.

So, it looks promising. I've still no clue as to whether this is a good idea or not.
