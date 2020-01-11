"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Posts = /** @class */ (function () {
    function Posts() {
    }
    Posts.prototype.getPostList = function () {
        $.get('/posts.json', function (data) {
            $(document).ready(function () {
                data.posts.forEach(function (d) {
                    $("#articlenav").append("<li data-datestamp=\"" + d.date + "\" data-id=\"" + d.title + "\"><a " + (post_url === d.url ? "class=\"here\"" : "") + " href=\"" + d.url + "\" title=\"" + d.title + "\"><span>" + d.title + "</span></a> </li>");
                });
                //Scroll the left nav to the right point.
                var hereClass = '.here';
                if ($(hereClass).length > 0) {
                    var percentagedown = ($(hereClass).position().top / $(window).height()) * 100;
                    if (percentagedown > 50) {
                        var value = $('.here').position().top - ($(window).height() / 2) + ($('nav ul li:first').height() / 2);
                        $(".nano").nanoScroller({
                            scrollTop: value
                        });
                    }
                    else {
                        $(".nano").nanoScroller();
                    }
                }
            });
        });
    };
    return Posts;
}());
exports.Posts = Posts;
