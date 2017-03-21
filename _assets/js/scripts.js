//= require highlight
//= require jquery-3.1.1.min
//= require jquery.nanoscroller
//= require jquery.timeago
//= require jquery.dateFormat.min


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
    if ('undefined' !== typeof post_url) {
        $.get('/posts.json', function (data) {
            data.posts.forEach(function (d) {
                $("#articlenav").append("<li data-datestamp=\"" + d.date + "\" data-id=\"" + d.title + "\"><a " + (post_url == d.url ? "class=\"here\"" : "") + " href=\"" + d.url + "\" title=\"" + d.title + "\"><span>" + d.title + "</span></a> </li>");
            });
            //Scroll the left nav to the right point.
            const hereClass = '.here';
            if ($(hereClass).length > 0) {
                const percentagedown = ($(hereClass).position().top / $(window).height()) * 100;
                if (percentagedown > 50) {
                    const value = $('.here').position().top - ($(window).height() / 2) + ($('nav ul li:first').height() / 2);
                    $(".nano").nanoScroller({
                        scrollTop: value
                    });
                } else {
                    $(".nano").nanoScroller();
                }
            }
        });
    }
    growse.getLocation();
});

const growse = {
    searchEndpoint: "https://www.growse.com/blevesearch",
    locationEndpoint: "https://www.growse.com/location",
    getLocation: function () {
        $.getJSON(this.locationEndpoint, function (data) {
            $('#location').append(`<p>Last seen floating around near <a href="http://maps.google.com/?q=${data.latitude},${data.longitude}">
                ${data.name}</a>. ${data.totalDistance.toLocaleString()} miles this year.</p>`)
        });
    },
    search: function () {
        $('.nano').hide();
        const urlVars = this.getUrlVars();
        $.post(this.searchEndpoint, urlVars, function (response) {
            growse.clearSearchResults();
            $('#searchterm').text(decodeURIComponent(urlVars['a']));
            $('#totalhits').text(response.totalHits);
            response.hits.forEach(function (hit) {
                let date = hit.id.split('-', 4).slice(0, 3).join('-');
                let url = "/"
                    + hit.id.split('-').slice(0, 3).join('/')
                    + "/"
                    + hit.id.split('-').slice(3).join('-');
                url = url.substr(0, url.indexOf('.md')) + ".html";
                let thistemplate = $($('#searchResultTemplate').html());
                thistemplate.find('a.title').text(hit.fields.Title);
                thistemplate.find('a.title').prop("href", url);
                thistemplate.find('time').text($.format.date(new Date(date), "dd/MM/yyyy"));
                thistemplate.find('time').attr("datetime", date);
                thistemplate.find('p.fragment').html(hit.fragments.Body);
                $("#searchresults>ol").append(thistemplate);
            });
        });
    }
    ,
    clearSearchResults: function () {
        $("#searchresults>ol").empty();
    }
    ,
    getUrlVars: function () {
        let vars = {}, hash;
        const hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for (let i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');

            vars[hash[0]] = hash[1];
        }
        return vars;
    }
};