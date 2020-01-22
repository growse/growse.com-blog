---
layout: post
title: "Eventlog To Syslog.NET"
---
In the world of systems and infrastructure, logging is an interesting problem. The basic premise is that systems log stuff, and people read logs. Therefore, it's useful to have all your logs in the same place. That's why people in the unix world invented Syslog.

Microsoft, however, took a different view (as usual) and came up with Eventlog. If you have a heterogeneous infrastructure, making these things play together properly is a bit awkward.

I noticed that there's a few solutions out there for fowarding Eventlogs to Syslog servers, using a variety of protocols. However, most of these are either commercial solutions ($$$$$$$), or are weirdly awkward (I'm looking at you [Snare](http://www.intersectalliance.com/projects/BackLogNT/)), or don't seem to be particularly well-maintained, or supportive of the latest [Syslog standards](http://tools.ietf.org/html/rfc5424) ([Eventlog To Syslog](https://code.google.com/p/eventlog-to-syslog/)).

I liked Eventlog To Syslog, and was initially looking at patching this to support RFC5424, crucially to get timezone support in the timestamp field. However, my C isn't brilliant, and so I eventually decided to implement from scratch in .NET, given that I know .NET, and all the things should be .NET. I wanted a Windows service that hooked into as many Eventlogs as it could find, and produce RFC5424 syslog messages and send them to a remote host over TCP and UDP.

To my surprise, it didn't take that long to get something that basically works. I've decided to open source it (probably under BSD license, need to update the repo with that) here: [https://github.com/growse/EventlogToSyslog.NET](https://github.com/growse/EventlogToSyslog.NET). For those of you who just want the DOWNLOADS!!!! there's a link to an MSI installer on the Github repo.

I've learned a fair bit about writing codes to RFC standards during this. Specifically, I've learned to never write code that has to consume data, for fear of having to cater for a million edge cases. Writing code that produces data according to spec is much easier.

With version 0.1.0.0 out the door, I now need to test this thing. I also need to stop this breaking in cases where I know it'll break. 