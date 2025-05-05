---
layout: post
title: "Temperature Sensors and Raspberry Pis (again)"
---

[Previously]({% post_url /2019/2019-11-01-promtail-apt-packages-and-home-made-environment-sensors %}) I was fiddling around with getting a working environment sensor with a Rapsberry Pi Zero and a BME280.

One thing that was annoying me was how I was connecting the BME280 to the rPi itself. The pins on the BME280s that I had didn't match the pinout on the rPi, so I had an awkward length of jumper cables that the BME280 hung off.

It turns out that you can get BME280 breakouts that are pin-compatible with the rPi - [Pimoroni does one](https://shop.pimoroni.com/products/bme280-breakout). In theory, this means you can just mount the BME280 directly on the rPi itself and not have to deal with the fragility of jumper cables. So I got one of these, stuck some pins / headers on and set it up.

{% include image.html alt="Pimoroni BME280 on a Raspberry Pi" src="/assets/img/2020-10-27-temperature-sensors-and-raspberry-pis-again/BME280.jpg" %}

Whilst it's nicer and more compact, I did notice that the temperature wasn't very accurate - it seemed to read quite high. Comparing it to other thermometer-measury-thingies, it seemed to be about 5 deg high, which is a lot. Now, it's possible that it's just this particular chip is reading high for whatever reason, but the temerature trace itself was quite awkwardly random and didn't seem to follow the expected temperature profile of the room. Could its proximity to the rPi be affecting it?

So I got some more jumper cables out and spaced it about 150mm away from the rPi, and suddenly:

{% include image.html alt="Week-long temperature chart" src="/assets/img/2020-10-27-temperature-sensors-and-raspberry-pis-again/temperature-graph.png" %}

Not only has the temperature reading dropped down to something much closer to what I'd expect, but now it's nicely following the heating profile of the room.

There's a lesson here somewhere. Something about your sensor affecting the very environment it's trying to measure? I'm going to get an ESP8266 and see if that has the same problem next.
