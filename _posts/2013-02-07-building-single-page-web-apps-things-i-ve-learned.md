---
layout: post
title: "Building single-page web apps. Things I've learned."
---
Over the past week or so, I've been building a thing for work. Specifically, it's a web app that provides a dashboard/interface into a [Cloudstack](http://incubator.apache.org/cloudstack/) installation. Why are we using Cloudstack and not [Openstack](http://www.openstack.org/)? Don't ask.

The default interface that ships with Cloudstack is functional, but useless. However, the Cloudstack [API](http://download.cloud.com/releases/3.0.0/api_3.0.0/TOC_User.html) is actually fairly comprehensive and sane. Weirdly, the awful web interface exclusively calls the API, but manages to totally cock up being a) usable and b) pretty, so out of frustration, I started making my own.

After a few days, it's at the point where it's basically functional for virtual machines. Our cloudstack implementation doesn't have all of the capabilities exposed, probably due to them not existing in hardware (things like load balancers etc.) so I focussed mainly on things that would be useful. What I ended up with was a one-page [Bootstrap](http://twitter.github.com/bootstrap/) and [Handlebars](http://handlebarsjs.com/) app, with hashbangs for url routing and a lot of javascript in the background. It's worth pointing out that this approach only worked because it was an internally facing app, not designed to be indexed (or even seen) by Google, and that I don't care about people using non-HTML5 browsers.

Here's what I learned:

1. No matter what the project is, I'll probably find a better way of doing it when I'm past the point of wanting to throw it all away and start again. In this case, it probably would have made more sense to use [ember.js](http://emberjs.com/).
2. [jQuery Tiny Pub/Sub](https://github.com/cowboy/jquery-tiny-pubsub) is pretty awesome for keeping views in sync with underlying data structures. Definately using this pattern again.
3. Browser history state is more tricky than you think. If you have a link, or button that will change the history state, just use that to change the state (&lt;a href="#!/awesome/"&gt;Link&lt;/a&gt;) and let your 'onhashchange' magic figure out the rest. Save onclick=method for when you want to do something like pull up a modal. Or do something destructive/changing.
4. Visual Studio 2012 with Resharper is not a bad HTML/JS/CSS editor. You could do a lot worse.
5. Namespaces. Dammit.
6. If you want to put anything other than a simple primitive in HTML5 storage, it's probably not going to work that reliably.
7. Loading, or 'in progress' indicators is a hard problem. Do you subtly remind the users that something's going on, or do you go for the full on 'disable the display with a big loading image until I'm finished' approach?

It's not finished yet. Hopefully more than just me will end up using it. Annoyingly, it's probably never going to end up open source, which is a shame because it could be quite useful for someone.