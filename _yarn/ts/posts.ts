import $ from "jquery";

import OverlayScrollbars from 'overlayscrollbars';
import jqXHR = JQuery.jqXHR;

interface Post {
    readonly title: string;
    readonly date: string;
    readonly url: string;
}

interface PostList {
    readonly posts: Array<Post>
}

export class Posts {
    private overlayScrollBarOptions: OverlayScrollbars.Options = {
        className: "os-theme-light",
        resize: "none",
        sizeAutoCapable: false,
        clipAlways: false,
        normalizeRTL: true,
        paddingAbsolute: false,
        autoUpdate: null,
        autoUpdateInterval: 33,
        nativeScrollbarsOverlaid: {
            showNativeScrollbars: false,
            initialize: true
        },
        overflowBehavior: {
            x: "hidden",
            y: "visible-scroll"
        },
        scrollbars: {
            visibility: "visible",
            autoHide: "leave",
            autoHideDelay: 400,
            dragScrolling: true,
            clickScrolling: false,
            touchSupport: true,
            snapHandle: false
        }
    };

    private fetchPostList(): jqXHR {
        return $.getJSON('/posts.json');
    }

    public getPostList() {
        const hereClass = 'here';
        this.fetchPostList().then(data => {
            $(() => {
                (<PostList>data).posts.forEach(function (post: Post) {
                    const li = $("<li>");
                    const a = $("<a>", {href: post.url, title: post.title});
                    const span = $("<span>", {text: post.title});
                    // span.text(post.title);
                    li.data("datestamp", post.date);
                    li.data("id", post.title);
                    if (document.location.pathname.endsWith(post.url)) {
                        a.addClass(hereClass);
                    }
                    a.append(span);
                    li.append(a);
                    $("#articlenav").append(li);
                });
                if (document.location.pathname == "/") {
                    $("#articlenav > li:first > a").addClass(hereClass)
                }

                let postListElement = document.getElementById("postlist")!;
                let overlayScrollbars = OverlayScrollbars(postListElement, this.overlayScrollBarOptions);

                //Scroll the left nav to the right point.
                if ($("." + hereClass).length > 0 && $(window).height()) {
                    const windowHeight = $(window).height()!;
                    const percentageDown = ($(`.${hereClass}`).position().top / windowHeight) * 100;
                    if (percentageDown > 50) {
                        const value = $('.here').position().top - (windowHeight / 2) + ($('nav ul li:first').height()! / 2);
                        overlayScrollbars.scroll({y: value});
                    } else {
                        overlayScrollbars.scroll({y: 0});
                    }
                }
            });
        })
    }
}