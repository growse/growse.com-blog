---
layout: post
title: "Django FastCGI Upstart scripts"
---

A lot of people don't like [Upstart](http://upstart.ubuntu.com/), complaining that it's a pointless solution to
something that was never a problem in the first place. I'm nowhere near clever enough to have an opinion on this, but I
like rolling with the times.

This site (and a few others I look after) runs on [Django](https://www.djangoproject.com/) which is my current
favourite-CMS-of-the-month. Django runs as a bunch of FastCGI processes which are then fronted by
a [Lighttpd](http://www.lighttpd.net/) reverse-proxy. This is all well and good, but when the server reboots, there
needs to be some nice way of telling the FastCGI processes to start up. I'd previously rolled my own rather buggy init.d
script, but there was no telling whether it would actually work from one reboot to the next.

Trawling the net, I found someone had written a (seemingly) decent upstart FastCGI script over at [Sam Bashton's blog](
https://web.archive.org/web/20120526004402/http://blog.bashton.com/2011/using-django-fastcgi-with-upstart/).
Bastardising this, I created my own version:

     description "Basic Django fcgi Upstart config"
     author "Sam Bashton"

     start on (net-device-up and local-filesystems and runlevel [2345])
     stop on runlevel [016]

     respawn
     chdir /home/growse/django-sites/growse_com
     exec su -s /bin/sh -c 'exec "$0" "$@"' www-data -- /home/growse/django-sites/growse_com/manage.py runfcgi method=prefork socket=/home/growse/django-sites/run/growse_com.socket pidfile=/home/growse/django-sites/run/growse_com.pid minspare=4 maxspare=8 maxchildren=128 maxrequests=65535 daemonize=false

Several reboots later, this seems to work perfectly.

I quite like the theory behind upstart. Create a conf file, drop some dependencies and definitions in it and just add it
to /etc/init. Not altogether sure what the fuss is all about...
