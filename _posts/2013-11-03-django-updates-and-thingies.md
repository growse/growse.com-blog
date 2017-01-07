---
layout: post
title: "Django updates and thingies"
---
It's been a while since I properly looked at the code for this site, so decided to give it a bit of an overhaul. In the process, I thought I'd make it look a bit different. 

It's still running Django, but updated with some bits and pieces that makes more sense now that I understand how Django actually works. Specifically:

* [django-secure](https://readthedocs.org/projects/django-secure/) is helping with providing HSTS capabilities, and always-to-ssl type functionality. 
* [django-pipeline](http://django-pipeline.readthedocs.org/en/latest/) for auto-compiling of SCSS and minification of Javascript. 
* I'm storing the content in markdown, and then rendering on the fly. Coupled with [django-markdown](https://pypi.python.org/pypi/django-markdown) and [Pygments](http://pygments.org/), this strikes a pretty good balance between easy of use and awesome syntax highlighting.

There's still a few issues that need to be sorted out, most of them around content. Also, the funky left scrolly thingie might not work across all browsers, and I need to responsivize the whole thing. Still, all good works in progress.

