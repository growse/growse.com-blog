//= require highlight
//= require jquery-3.1.1.min
//= require jquery.nanoscroller
//= require jquery.timeago


hljs.initHighlightingOnLoad();

$(function () {
    // Year expanding functionality
    $("li.year>a").click(function () {
        $(this).parent().next().slideToggle(100);
        return false;
    });

    $('time.timeago').timeago();
    $('button.svgsave').on('click', function () {
        var html = d3.select("svg")
            .attr("version", 1.1)
            .attr("xmlns", "http://www.w3.org/2000/svg")
            .node().parentNode.innerHTML;

        var imgsrc = 'data:image/svg+xml;base64,' + btoa(html);
        var img = '<img src="' + imgsrc + '">';
        d3.select("#svgdataurl").html(img);


        var canvas = document.querySelector("canvas"),
            context = canvas.getContext("2d");

        var image = new Image();
        image.src = imgsrc;
        image.onload = function () {
            context.drawImage(image, 0, 0);

            var canvasdata = canvas.toDataURL("image/png");

            var pngimg = '<img src="' + canvasdata + '">';
            d3.select("#pngdataurl").html(pngimg);

            var a = document.createElement("a");
            a.download = "sample.png";
            a.href = canvasdata;
            a.click();
        };
    });
    $(document).keyup(function (e) {
        if (e.keyCode == 27) { // escape key maps to keycode `27`
            growse.clearForm();
        }
    });
    // if (post_url) {
    //     $.get('/posts.json', function (data) {
    //         data.posts.forEach(function (d) {
    //             $("#articlenav").append("<li data-datestamp=\"" + d.date + "\" data-id=\"" + d.title + "\"><a " + (post_url == d.url ? "class=\"here\"" : "") + " href=\"" + d.url + "\" title=\"" + d.title + "\"><span>" + d.title + "</span></a> </li>");
    //         });
    //         //Scroll the left nav to the right point.
    //         var hereClass = '.here';
    //         if ($(hereClass).length > 0) {
    //             var percentagedown = ($(hereClass).position().top / $(window).height()) * 100;
    //             if (percentagedown > 50) {
    //                 var value = $('.here').position().top - ($(window).height() / 2) + ($('nav ul li:first').height() / 2);
    //                 $(".nano").nanoScroller({
    //                     scrollTop: value
    //                 });
    //             } else {
    //                 $(".nano").nanoScroller();
    //             }
    //         }
    //     });
    // }
});

var growse = {
    search: function () {
        console.trace("search");
        var urlVars = getUrlVars();
        console.log(urlVars);
    },
    getUrlVars: function () {
        var vars = [], hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    }
};