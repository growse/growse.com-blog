---
layout: post
title: "Geo tracking and me"
---
About a year ago, there was some sort of debacle about Google tracking everyone's phone location and storing it somewhere. Some people went and made some cool maps. It was all rather pretty.

I decided at the time that I'd take the opportunity to brush up on my Android and D3 skills, and do something similar, but in a more home-grown sort of way. So, I wrote an Android app that uses the [Little Fluffy Location Library](https://code.google.com/p/little-fluffy-location-library/) to periodically grab my location (every 15 minutes I think) and POST it to an endpoint where I'd log it. At some point in the middle of last year, I thought it'd be interesting to grab the currently connected wifi SSID and GSM network mode (2G, 3G, EDGE etc.) and store that as well. Maybe there'd be something useful there.

Well, it's 2015 now, which means I've got one year's worth of data. And when I crunch the numbers, it turns out that I travelled about *57,046.30 miles*. Now, that's somewhat overly precise, given that I'm just adding up the straight line distance between points captured 15 minutes apart, with an accuracy that's sometimes only as good as the nearest km, and obviously only when the phone is on. But still, that puts my average speed for 2014 at *2.11mph*. This might seem high, but I've actually been a fair few places this year. I decided to crack out [D3](http://d3js.org/), and especially [D3 Geo Projections](https://github.com/mbostock/d3/wiki/Geo-Projections) in order to make some pictures.

![Everywhere](/assets/img/png-transparent.png){:class="lazyload" data-src="/assets/img/2015-01-01-geo-tracking-and-me/geo-tracking-and-me1.png"}


![Just the UK](/assets/img/png-transparent.png){:class="lazyload" data-src="/assets/img/2015-01-01-geo-tracking-and-me/geo-tracking-and-me2.png"}


I'm not brilliant with javascript, and D3 isn't the most intuitive library, so there's probably a million ways these could be better. Still, it's nice to look back on the year and remember that, gosh, actually I ended up doing rather a lot. Australia and California probably account for the bulk of the mileage. But at the same time, it's nice to look and reminisce about the hoilday in the Canaries, the epic bikeroadtrip to a a farflung, damp corner of Ireland, and that one time I went to Devon.

On the todo list next will be things like better map detail, varying line colour depending on timestamp, animating the line, maybe hooking into some sort of photo service API to tie into the photos I took during the year. The Android app needs a bit of work as well - it'd be nice to vary the frequency of updates depending on how much I'm moving around. It seems that more movement = more frequent polling will help to reduce some of the alarming giant straight lines between some points on the map, although they're probably more likely due to a dead phone battery rather than anything else.