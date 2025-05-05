---
layout: post
title: "The trouble with Openfiler, and other 'pre-built' appliances"
---
I've been spending some time with [OpenFiler][1] over the past few weeks, and
I've got mixed feelings about it. For those of you that don't know what it is,
it's a linux appliance that allows easy configuration of storage and making
that available on a network. It supports a bunch of things, SMB/CIFS, NFS,
iSCSI and on the face of it seems to work rather well. On the inside, it's
just rPath with LVM and some cleverness.

But then the small-yet-terribly-destructive bugs creep in, and you start to
spend more time trying to figure out what on earth's going on rather than
actually doing anything useful. This is a problem for me, because I like doing
useful things. For example, I've found that under certain circumstances, you
set up your physical volume, then your volume groups and then maybe an iSCSI
partition and an ext3 partition - all seems fine, but then for no reason it
drops the volume group. No idea what's happened. Google reveals nothing. I
could try and learn LVM properly and then wade through lots of logs to figure
out what's gone wrong, but that defeats the point of having a pre-built
appliance in the first place. The whole reason for going with OpenFiler was
that I didn't know anything about iSCSI on linux, and I didn't know anything
about LVM. If it fails, it should do so nicely and tell me what's happened as
opposed to just blanking me out and let me figure out myself what happened.
Sure, it's nice that I've got that option, but correctly diagnosing and fixing
the issue requires knowledge that would mean I probably wouldn't be using
OpenFiler in the first place.

Consequently, I'm building my filer myself, using VMWare, Debian, LVM and lots
of documentation. At least that way I'll learn something and actually be able
to fix it when it breaks.

   [1]: http://www.openfiler.com/
