---
layout: post
title: "Getting MsDeploy to not delete everything it sees"
---
Microsoft's [Web Deploy](http://www.iis.net/download/webdeploy) is a brilliant, brilliant thing. However, in the event you want to do a 'sync' deploy to an IIS server but not have it delete things that aren't in the source, you need to pass this slightly arcane switch:

    -enableRule:DoNotDeleteRule

Cunning.
