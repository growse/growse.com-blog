---
layout: post
title: "The joy of discovering new tools"
---
I love tools. They're brilliant precipitations of knowledge and learning into a single artifact, designed to solve a single specific problem. Or, at least, they should be - if your tool is

Good tools often have a huge amount of time, effort and expertise put into crafting them, and often their only purpose is to help other builders / tinkerers build other things more easily. There's a sort of metaness / layerness that's quite enjoyable.

This appears to be especially true in software, where every developer relies on tools that have been designed and built to make some task easier. Sometimes it gets a bit weirdly circular where the tool itself is used to build a better version of itself (e.g. the [golang compiler is now written in golang](https://dave.cheney.net/2014/09/01/gos-runtime-c-to-go-rewrite-by-the-numbers)). This is all oddly pleasing.

Anyhow, rambling aside, I find tools pleasing. So it's nice to discover new ones, even if they're not particularly new. Here's a couple I've been playing with recently:

## FPM

For some reason, packaging software is hard. Given that software should be immutable and easy to deploy, packaging is an obvious solution to this. And yet there are seemingly billions of different packaging formats (deb, rpm, msi, gem etc) and the process of going from a build artifact to a package varies hugely in terms of process and difficulty.

[Jorden Sissel](https://github.com/jordansissel), the guy behind [Logstash](https://github.com/elastic/logstash) apparently decided to do something about this, and wrote [FPM](https://github.com/jordansissel/fpm).

I've a few little software projects that up until now have existed without giving much thought to packaging. To deploy them has been a case of simply using rsync, ssh, or similar to copy the build artifact to the target and then restart whatever service needed restarting. Packaging was seen as an unachievable dream. FPM fixes all of this - in a single command, it's possible to take whatever build artifact and construct a deb file (I use Debian. I care about deb files) that can then be distributed to an apt repository to deploy wherever.

This blog is built on [Jekyll](https://jekyllrb.com/). Deploying new posts / updates used to be a case of running `jekyll b` and then copying the resulting `_site` folder to the server. Rebuilding the server meant having to remember to find the build output and re-copy it to the right place. Now, with fpm, I can issue a single command:

    bundle exec fpm -s dir -t deb -n growse-com-jekyll --prefix /var/www/ -p _site -a noarch  -v 1.0.0-$CIRCLE_BUILD_NUM _site/=growse-jekyll

This creates a single deb file which, when installed, puts the whole jekyll site in the correct location on the target. (I use [CircleCI](https://circleci.com/) for building, hence the `$CIRCLE_BUILD_NUM` var).

Once created, I can then use [deb-s3](https://github.com/krobertson/deb-s3) to upload the deb file to an apt repository on Amazon's S3. Deploying a new version is a simple case of `apt-get upgrade`.

This is so simple, it's possible to use this approach for the smallest things. I've been playing with [Sensu](https://sensuapp.org/) for some monitoring, and I wanted a check to tell me how many apt packages were due an update on an endpoint. I'm sure there used to be a plugin for this, but I couldn't find anything. After putting together a [tiny shell script](https://github.com/growse/sensu-check-apt), I can now package this up and deploy it in the same way across all the servers that I care about.

## Wireguard

I can't remember where I discovered [Wireguard](https://www.wireguard.com/), but at some point it made it onto my list of "Things I should get around to looking at eventually". I've often run into problems being on hostile networks where traffic is blocked or altered and have used a number of different [solutions]({% post_url /2014/2014-05-05-ssh-vpn-in-ubuntu-using-networkmanager %}) to solve this problem in the past. A lot of the time, these solutions are complex and quite brittle.

Wireguard tries to solve the "I'd like two machines to communicate with each other in a way that is secret and resistant to interference". Previously, IPsec was the main thing that worked in this space - it works, but can be challenging to set up and (mis-)configure. By contrast, Wireguard is pretty seamless. It also uses modern cryptography primitives, including the noise framework (the same used at Signal and by WhatsApp) and is formally verified. There's been a lot of effort put into doing the security bit right, without losing sight of the end goal of making it usable.

The [interworkings](https://www.wireguard.com/protocol/) page describes how it works, but configuring two endpoints to communicate is as simple as generating public/private keys on each endpoint, and adding the public key of each endpoint to the other hosts' configuration. The systems can then be configured to route none, some or all traffic over the wireguard interface. The tooling is very easy - logging onto a hostile network, I can simply `wg-quick up wg0` on my laptop and immediately be connected to my home network as if I were at home.

Another useful use case is to deploy it on a remote server that I want to connect to my test monitoring system at home. I can create a wireguard interface on the server that only routes my home subnet, and now the server can send metrics / alerts to my home endpoint without having to fiddle with the firewall too much.

I've still got a bit more tinkering to do, I'd like to work out how a) IPv6 addressing and b) dynamic addressing (currently each host needs a specified IP address) might work.

It's much easier than OpenVPN though, and that's a good thing.
