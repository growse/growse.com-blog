---
layout: post
title: "Feedling, WPF and making stuff look pretty"
---
One of my [new year's resolutions](/2011/01/16/some-kind-of-new-thing-for-the-new-year-and-all-that.html) was to release a stable release of [Feedling](http://feedling.net). I have both good news and bad news to report: The bad news is that this isn't going to happen this year. The good news is that there's a very good reason for that.

It's not for lack of trying. I've done a fair amount of work in the little free time I've had this year, and I've both learned a lot and made it a better piece of software. All good things. However, the single biggest problem with it so far is that it's got an awful looking UI. 

I'm not a UI designer. I don't know how to make UIs look good. But, I'm prepared to try things and see what works. A while back, I took the decision to port the whole thing over to [WPF](http://msdn.microsoft.com/en-us/library/ms754130.aspx) because it let me do that actual display of feeds on the desktop a lot easier. The main options dialogs still looked a bit crap though.

Recently, I remembered that one of the things WPF is supposed to make really easy is the construction of really nice looking UIs, entirely from markup. It's a little analagous to how you can build really beautiful looking websites using nothing more than a bit of HTML5 and CSS3 - WPF has the same, if a little clunkier, idea of allowing you to spec out your gradients, animations, shadows etc. in nothing more than XML. Yay, XML.

So I decided to play with it for a bit to see what I could come up with. I can't do design, so I thought I'd try and replicate a set of widgets I know looks good on the web: [Bootstrap from Twitter](http://twitter.github.com/bootstrap/). 

It's been a steep learning curve so far, but I've got some buttons that look vaguely similar to what Bootstrap gives you, with similar hover and pressed behaviours.

Even if this doesn't get used for Feedling, I might stick it on github, because as far as I can tell, no-one else has been stupid enough to try and do this.