---
layout: post
title: "As promised... FlickrPuttr!"
---
So, [last time around]({% post_url /2012/2012-06-10-all-flickr-uploaders-suck-so-i-m-going-to-write-my-own %}) I said something about uploading to Flickr being a really bad experience, and that I was going to write my own.

This is now (somewhat) done.

And yes, I called it [FlickrPuttr](https://github.com/growse/FlickrPuttr).

It's by no means finished, there's a few bugs to sort out and a *lot* of functionality missing, but most of that is fluffy frivolous stuff. It's a python script that depends on this [FlickrAPI python library](http://www.stuvel.eu/flickrapi) (which is awesome, and available in pip).

In short, the idea is that you point it at a directory, it gets you to auth with Flickr, and then it uploads all the photos in that directory to Flickr, creating sets along the way. The sets are named according to the last directory name that the photo is in. So if you point it at 'photos' and there's an image in 'photos/awesome/Brazil/yes/IMG_384.jpg', the set will be called 'yes'. This is mostly because I organise my photos sensibly, but YMMV.

Uploaded photos to Flickr are tagged with 'FlickrPuttr' and (I think) the name of the set as well. FlickrPuttr doesn't delete images.

I'm going to dump this on the Flickr App Garden to see if anyone else likes it, but as usual, if it's useful to me, that's all I really care about.

Next up, a script that'll do backups to cloud locations. After that, a [Pocket](http://getpocket.com/) client for Metro. Actually, that last one might end up being [Feedling](http://feedling.net), but reborn.
