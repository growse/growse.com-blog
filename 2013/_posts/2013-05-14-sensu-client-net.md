---
layout: post
title: "Sensu-client.net"
---
More software! Yes!

In the spirit of my last post, I've decided to release even more software. From the same factory of 'surely-this-can't-be-the-best-way-of-doing-this-I-can-maybe-do-better', I was playing with [sensu](http://www.sonian.com/cloud-monitoring-sensu/) (this, btw, is awesome) and noticed that the windows experience wasn't as good.

Sensu is written in ruby and the build/deploy process is quite unixy-geared. There is an MSI build, but I had some significant issues with it. Specifically, the fact that it drags it's own Ruby runtime around with it, the fact that it's quite hard to get debug logging out of the windows client, and non-obvious service installation / maintenance made me try and find a better way of doing it. The sensu client code is actually pretty simple, and Windows already has a giant managed runtime it lugs around with itself. 

I therefore wrote a sensu client in .NET. It's open source and over at [https://github.com/growse/sensu-client.net](https://github.com/growse/sensu-client.net). As before, license is BSD (again, need to update the repository).

For those that love installers, the latest is on the [github project release page](https://github.com/growse/sensu-client.net/releases).

There's some key functionality missing. Specifically, it won't do client side config variables, it doesn't like metrics, and passive checks are a no-no. All of these are fairly trivial to implement, so when I get round to it, I'll update it.