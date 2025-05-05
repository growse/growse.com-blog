---
layout: post
title: "On being surprised at new things that actually work. Yes Microsoft, I'm looking at you."
---
I've mentioned [Feedling][1] [before][2]. For those of you who can't be
bothered to click on links or with a broken mouse, Feeling is an RSS reader
for windows that quietly sits on the desktop behind everything else.

Wen I first wrote it, I had a quite clear idea of what I wanted it to look
like. I wanted to blend it with the desktop wallpaper - it had to sit behind
everything without fussing, and just appear as if it were an interactive part
of the desktop. Naturally, this means overlaying text directly on the
wallpaper image and this also means transparency. And doing transparency means
per-pixel alpha blending. If you know what that means in this context, great.
Bear with me.

Computer display areas are digital affairs - you have a grid of pixels which
you can colour anything you want. However, real world shapes (circles,
triangles, text) have edges that don't run on the grid. Therefore, if you want
to draw a solid line at an angle to the pixel grid, you need to be smart about
how you colour the pixels so that you give the illusion of a straight line and
not a jagged one.

The problem with the winforms library is that it's not particularly good,
mostly because it's quite old and cannibalized. One thing it really doesn't
allow you to do is to have a transparent form with controls that are properly
anti-aliased against everything else. However, I discovered (through [this
article on CodeProject][3]) that what you can do is draw properly anti-aliased
images with transparency. You've got to much around in native-Win32-land for a
bit, and it's not particularly elegant. However, I basically used this and
used GDI to draw text directly onto the form, giving some semblance of
prettyness.

Enter [WPF][4], which seems to be Microsoft's attempt at saying "That winforms
stuff, chuck that, use this". It's much, much, much better. All that faffing
about with transparency has been reduced to sticking some labels on a form,
making the form transparent, and just having it work. Even cool things like
colour animations are quite neatly handled. I've cut down on both code lines
and bugs, and ended up with something a lot more stable. I'll be releasing
v0.8 soon, then everyone can revel in it.

It's not all sweetness and roses yet, WPF is still missing some key desktop
controls, such as NotifyIcon, a decent color picker, any sort of font chooser
etc. You have to steal these from winforms still. That said, it's a better app
now, and mostly that's Microsoft's doing.

   [1]: /2008/02/26/feedling-an-rss-reader.html

   [2]: /2008/03/14/hooked-on-sourceforge.html

   [3]: http://www.codeproject.com/KB/GDI-plus/perpxalpha_sharp.aspx

   [4]: http://msdn.microsoft.com/en-us/library/ms754130.aspx?ppud=4
