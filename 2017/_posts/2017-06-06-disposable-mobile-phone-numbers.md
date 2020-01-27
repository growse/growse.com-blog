---
layout: post
title: "Disposable mobile phone numbers"
---
I recently moved house, and part of that whole bundle of stress/joy is having to deal with many different organisations to let them know that I've changed my address. Annoyingly, it seems that more and more companies insist on having a mobile phone number.

After doing a little bit of research, it turns out that what they actually mean is any number that starts '07'. [Andrew's and Arnold](https://www.aaisp.net.uk/) have been my ISP for a while (they're great!) and I've had [VoIP service from them for a little while]({% post_url /2007/2007-03-19-setting-up-home-voip-with-asterisk %}). This has basically involved having a Raspberry Pi running Asterisk and hosting a landline number. There are many benefits to do this, one of which is automatic recording of calls (and emailing the recording once the call is done).

It turns out that in addition to being able to buy a landline number, they'll also sell you a [mobile number](http://www.aaisp.net.uk/kb-telecoms-07.html). This works in basically exactly the same way - incoming calls come through to asterisk, where you can treat it as another incoming line. Usefully, AAISP also provide a way to handle incoming SMS messages. I've got it configured to just email me, but there are also options to post to a URL.

There's quite a few different ways in which routing incoming calls from organisations through a PBX is useful, for those times when they decide to sell their database to someone who doesn't care about the law, or (more commonly) someone breaks in and steals the data before relentlessly spamming and/or phishing you.

For the truely paranoid, you could in theory buy a bunch of numbers and give them out to different 'classes' of people: one for friends, one for family, one for mostly trustworthy companies, one for annoying internet portal sign-up forms etc. 
 
 