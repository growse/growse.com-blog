---
layout: post
title: "NAppUpdate"
---
In software, there are certain things which make you just want to shout
"WHY!!!???" at the developer/product manager/QA tester. Sometimes, these are
small things, like a particular insistence on using a TRUE/FALSE enum instead
of a boolean. Or they're much bigger things, like why Adobe Premiere CS4
doesn't give you a way of burning a timecode into an render output (seriously,
a simple checkbox is all that's needed). One of the things that's always
bugged me is the lack of a decent application update library in the .NET
framework.

Sure, there's [ClickOnce][1], but if you want to do anything slightly complex
with it, it's useless. There's also [Application Updater Block][2], but it's
heavy, an all-or-nothing solution with documentation that says "This content
is outdated and is no longer being maintained". Hmmm.

I wouldn't describe myself as a .NET expert, but this seems to be a hole that
needs to be filled. I was therefore quite pleased to stumble across
[NAppUpdate][3]. I've started to do some testing and contributing some code to
it, and really hope it turns into a functional, easy-to-use .NET application
updater library. It turns out, the answer to the question 'How do I keep an
application up to date?' is very far from trivial (thanks, Microsoft, for non-
consistent permissions and UAC), so the challenge will be to create something
that (a) works and (b) makes it look easy.

As it gets a bit more mature, I'm going to integrate it into [Feedling][4] as
a proper test. Feedling's picking up one or two users now, so it'd be good to
try it on an actual userbase.

Of course, none of this would be necessary if Windows had a sensible
application packaging system, like [apt][5]. What's even crazier is that
they've already got a sensible application packaging / updating system, in
Windows Update. You just can't use it.

Microsoft: WHY!!!!???

   [1]: http://en.wikipedia.org/wiki/ClickOnce

   [2]: http://msdn.microsoft.com/en-us/library/ff650611.aspx

   [3]: http://www.code972.com/blog/2010/08/nappupdate-application-auto-update-framework-for-dotnet/

   [4]: http://feedling.sourceforge.net

   [5]: http://en.wikipedia.org/wiki/Advanced_Packaging_Tool
