---
layout: post
title: "Making Slimbox2 play nice with HTML5"
---
[Slimbox2](http://www.digitalia.be/software/slimbox2) is a neat little picture popup viewer that works with jQuery. I use it in a few places here and there and while some think it outdated, I quite like it.

The problem it has is that it relies on the 'rel' tag of an HTML anchor tag. This is fine in the world of HTML4.0/XHTML1.0, but HTML5 defines only very specific possible values for the 'rel' tag. Therefore, using slimbox in this way causes invalid HTML5.

Thankfully, there is a simple fix. Simple replace all:
```html
<a rel="lightbox" href="...">
```

with a different attribute, `data-rel` (or whatever you like)
``` html
<a data-rel="lightbox" href="...">
```


Then, the slimbox javascript code just needs a little tweak. Specifically, the following replacement needs to be made:
``` javascript
if (!/android|iphone|ipod|series60|symbian|windows ce|blackberry/i.test(navigator.userAgent)) {
    jQuery(function($) {
        $("a[rel^='lightbox']").slimbox({/* Put custom options here */}, null, function(el) {
            return (this == el) || ((this.rel.length > 8) && (this.rel == el.rel));
         });
    });
}
```

Replace with this:
``` javascript
if (!/android|iphone|ipod|series60|symbian|windows ce|blackberry/i.test(navigator.userAgent)) {
    jQuery(function($) {
        $("a[data-rel^='lightbox']").slimbox({/* Put custom options here */}, null, function(el) {
            return (this == el) || ((this.attributes['data-rel'].value.length > 8) && (this.attributes['data-rel'].value == el.attributes['data-rel'].value));
        });
    });
}
```

Simple!
