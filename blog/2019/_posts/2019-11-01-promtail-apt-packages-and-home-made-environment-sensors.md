---
layout: post
title: "Promtail Apt packages and Home-made Environment sensors"
---

## Packaging

I'm a big fan of [fpm](https://github.com/jordansissel/fpm) - created a while back
by [@jordansissel](https://twitter.com/jordansissel/) in frustration at how hard it was to package software on a variety
of platforms, it does a nice job of simplifying the creation of a deb file. I care about this because I use Debian.

I also care about this because of an apparent trend for software maintainers to not bother packaging their software
properly any more. Often, binaries are just chucked "over the wall" and attached to a github release, or (worse) it's
some sort of docker image on a registry somewhere.

Look, I get it. Docker's great. But I don't want to run docker on my router - I just want
to `apt-get install awesome-thing` (carefully, via an ansible playbook of course). The "Hey look! We made a binary!"
crowd seem to be predominantly golang users. If you're not aware, if you write some golang code and compile it, your
output is (typically - not always) a single file containing the entire runtime and all dependencies. In many ways, this
is a bit like a docker image - a single binary "thing" you can ship to any host with the right architecture and OS and
just execute without having to worry about what's already present on the box. It's a nice idea, but it does seem to lead
people down the path of asking "What's the point?" when thinking about bundling their software in a
deb/rpm/msi/whatever.

## Promtail

One good example of this is the [Loki](https://github.com/grafana/loki/) project. Loki is a log ingest, storage and
ingest server and it's really very good. A total reaction to the over-complexity of ElasticSearch and its needy
ecosystem, Loki is simple to deploy and configure and then just quietly gets on with things. Sure, it does *much less*.
But this is why it's *great*.

Anyhow, the Loki guys realised they needed a machine agent that can collect logs and send them to a Loki server, so they
wrote [Promtail](https://github.com/grafana/loki/blob/master/docs/clients/promtail/README.md).

Given that today's hotness is to run everything on Kubernetes where deploying any software is no more than a simple
YAML-file away, of course there's a [docker image](https://hub.docker.com/r/grafana/promtail) for this. But I want to
run this on, amongst other things, my router. So I head to the github releases page
and ... [oh](https://github.com/grafana/loki/releases/tag/v0.4.0).

## Promtail-package

Bored of this state of affairs, and *really* wanting to use something so good and deploy it everywhere, I put a little
project together that builds the source and uses fpm to create a deb archive, before uploading the deb
to [my APT repo](https://apttoo.growse.com/).

[https://github.com/growse/promtail-package/](https://github.com/growse/promtail-package/)

This was also an interesting excuse to take a look at [Github Actions](https://github.com/features/actions), which is
basically Github's way of offering CI and other things. After using it on a few projects, it's a nicely implemented
feature - much easier to work with than something like Travis-CI (I *love* Travis but it drives me insane sometimes).
The only manual step here is that I subscribe to new releases on the Loki repository, and then bump the version number
in the `GNUmakefile` on the packaging repo. This triggers a build which checks out the tag, builds the binary (`amd64`
and `arm` currently), creates the deb files and uploads them to the repo.

Usefully, this approach is pretty easy to use as a template for any other bits of golang software I feel like packaging.
Which brings me to...

## Sensor-MQTT

A common "my first electronics / raspberry pi project" is building an environment sensor. This is pretty easy to do: get
something like a [Bosch BME280](https://www.bosch-sensortec.com/bst/products/all_products/bme280) sensor, solder a
header to it and then attach it to the I2C pins of your favourite tiny computer. Boot it up, and it's pretty
straightforward to then query the values over the I2C bus in a bunch of different programming languages.

I wanted to see how much the temperature and humidity varied in my home office, so I put one of these together. For the
software, I wanted to practise my golang skills and build a tiny daemon that can poll the sensor periodically and
publish the data over MQTT. This can then be pretty easily picked up and tracked
using [Home Assistant](https://www.home-assistant.io/).

[https://github.com/growse/sensor_mqtt](https://github.com/growse/sensor_mqtt)

As above, packages are created in the same way and then published onto my APT repository. Build enough devices and you
get pretty graphs:

{% include image.html alt="Temperature Graph" src="
/assets/img/2019-11-01-promtail-apt-packages-and-home-made-environment-sensors/temp_graph.png" %}
