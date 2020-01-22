---
layout: post
title: "Workarounds for IE"
---
Earlier on, [Ben][1] asked me how to get a div to show above a select box in
IE6. Turns out that there's a bug in IE which means that select controls will
always show above divs, regardless of z-indexing. Anyway, after a bit of
digging, I found a fix:

    <!-- How to get a div to go over a select box in IE--> <!-- The general theory
        is that an iframe needs to be placed in the same position as the div that
        floats over the control. The iframe also needs to be included after every
        other control, as IE 6 layers controls in the order they're declared. In this
        case, I have a div (id="f1") I want to position at 0,0 and show on request. It
        is styled in a way so that when the javascript function runs to show it, it
        should appear over the select control. I also include an iframe which has the
        same positioning and sizing properties as the div I want to show
        (class="float"). The final piece of styling is to the z-index of the div to be
        higher than the iframe, so that it appears above. Now the javascript method
        simply shows both the iframe and the div, and the select box is hidden. Works
        well in both FF and IE6, and on HTTPS sites. -->
    <html>
    <head>
        <style>
            .float {
                top: 0;
                left: 0;
                width: 300px;
                height: 50px;
                display: none;
                position: absolute;
                background: white;
            }
    
            #f1 {
                z-index: 3;
                border: 1px solid blue;
            }
    
            iframe {
                z-index: 1;
            }
    
            select {
                border: 1px solid green;
            } </style>
        <script language="javascript"
                type="text/javascript"> function showfloat() {
            document.getElementById('f1').style.display = 'block';
            document.getElementById('f2').style.display = 'block';
        } </script>
    </HEAD>
    <BODY>
    <div id="f1" class="float"> This is some testing text</div>
    <FORM>
        <select id="test">
            <option value="1">Test item 1</option>
            <option
                    value="2">Test item 2
            </option>
            <option value="3">Test item 3</option>
            <option value="4">Test item 4</option>
            <option value="5">Test item 5</option>
            <option value="6">Test item 6</option>
            <option value="7">Test item 7</option>
        </select> <input type="text"/></form>
    <p><a
            href="javascript:showfloat()">Show</a></p>
    <iframe id="f2" class="float"
            src="javascript:'<html></html';" scrolling="no" frameborder="0"></iframe>
    <div
            id="f1" class="float"> This is some testing text
    </div>
    </body>
    </html>

Thanks to [these guys][2] for pointing me in the right direction.

   [1]: http://www.benhaines.co.uk

   [2]: http://weblogs.asp.net/bleroy/archive/2005/08/09/how-to-put-a-div-over-a-select-in-ie.aspx
