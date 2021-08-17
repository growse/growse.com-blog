---
layout: post
title: "Migrating Adobe Lightroom to Darktable"
---

## Back in the olden days

I remember when Lightroom came out. It was a brilliant, slightly expensive piece of software to help manage and process RAW image files off cameras. I got my first proper camera (a Canon 350D) back in 2006, and since then my photo collection has grown to ~45k images. Over 13 years (!), Lightroom has been brilliantly useful in letting me catalogue, search, export and generally manage the collection. For me (as I imagine it is for a lot of people), this photo archive is probably the best documentation of "what I've done", "where I've been" and "who I've done those things with". Now that phone cameras are absurdly good, I've got multiple sources for photos as well - it's not just stuff I've captured when I happen to be holding a big Canon thing.

But over the years, I've started to realise that locking such a valuable resource into a single application and vendor is probably not the best idea. Adobe have also seemed to realise this and now it's no longer possible to buy Lightroom as a one-off purchase, [you must buy a "subscription" instead](https://www.adobe.com/uk/creativecloud/plans.html?promoid=VG52KLH7&mv=other). Now, on the one hand, £10pm for software to manage all my photos is a bargain. On the other (and this bit is important), there's *no way to extract images and their edits accurately into a different application*. The edits can be exported as XMP sidecars, sure, but the data is proprietary and the ability for another application to be able to faithfully reproduce those changes is essentially zero. Given Adobe's not exactly got a [brilliant history](https://www.bbc.co.uk/news/technology-49973337) with screwing their paying customers over (they're practically inviting people to pirate their stuff) it's only a matter of time before they screw me over as well.

So while I'm happy in general to give someone money for this problem, I'm much less happy about being locked in. Looking around, the obvious competitor that meets my needs of "don't be locked in" is [Darktable](https://www.darktable.org/).  

## Darktable

Darktable is both open source and apparently sworn-by for a lot of people who are a lot more serious about photography than me. Having such a healthy community around a piece of open source software is usually a good sign. Version 3.0.0 [just came out](https://www.darktable.org/2019/12/darktable-30/) so I had a quick poke around.

So far, it seems pretty powerful. The challenge I have is that I'm so used to the "Lightroom way" of doing things, that any deviation from this feels wrong somehow. What's clear though is the vast majority of what I like to do to pictures is readily available here, and actually some of the automation looks to be even more useful than what exists today in LR.   

They do try to [address the LR import issue head-on](https://www.darktable.org/2013/02/importing-lightroom-development/) and so you can provide XMP sidecar files saved from LR and Darktable will try to apply some of the edits that it can read (e.g. crops, some levels etc.). Playing around with this though it's not particularly reliable - I've yet to get an image imported with the correct crop.

So I think I'm resigned to just slowly importing the back catalogue and re-applying the edits. This will take Some Time To Do, but I think it's going to be worth it in the end.

