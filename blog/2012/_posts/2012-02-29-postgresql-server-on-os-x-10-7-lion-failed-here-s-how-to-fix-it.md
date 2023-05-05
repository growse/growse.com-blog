---
layout: post
title: "PostgreSQL Server on OS X 10.7 Lion? Failed? Here's how to fix it"
---

So after playing with [a Macbook Pro]({% post_url /2012/2012-02-27-adventures-in-mac-land %}) I decided to start doing
something useful with it. The excellent [MacPorts](http://www.macports.org/) project has a lot of useful bits of
software for doing unix-y development on. Things like RabbitMQ, PostgreSQL etc.

However, upon trying to install PostgreSQL 9.1 server, it ran into a fairly inexplicable error:

    ---<  Staging postgresql91-server into destroot
    Error: Target org.macports.destroot returned: shell command failed (see log for details)

The log revealed that it was failing on a `chown` step, while trying to set the ownership of a directory to
the `postgres` user.

Taking a quick stroll through `/etc/passwd` revealed no such user. However, there was a `_postgres` user. Somewhere,
something changed, and no-one updated the script.

I found the solution
in [this Apple listserver thread](http://lists.apple.com/archives/webobjects-dev/2011/Aug/msg00120.html). If you can't
be bothered to read it, just do the following:

    sudo dscl . -append /Users/_postgres RecordName postgres
    sudo dscl . -append /Groups/_postgres RecordName postgres
    sudo dscl . -change /Users/_postgres UserShell /usr/bin/false /bin/bash

And all will be well. Hopefully.
