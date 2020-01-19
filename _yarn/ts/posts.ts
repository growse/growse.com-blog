import $ from "jquery";

interface Post {
    readonly title: string;
    readonly date: string;
    readonly url: string;
}

export class Posts {

    public getPostList(): void {
        const hereClass = 'here';
        $.getJSON('/posts.json').then(data => {
            $(document).ready(() => {
                data.posts.forEach(function (result: Object) {
                    const post: Post = <Post>result;
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
            });

            //Scroll the left nav to the right point.

            if ($(hereClass).length > 0 && $(window).height()) {
                const windowHeight = $(window).height()!;
                const percentageDown = ($(`.${hereClass}`).position().top / windowHeight) * 100;
                if (percentageDown > 50) {
                    const value = $('.here').position().top - (windowHeight / 2) + ($('nav ul li:first').height()! / 2);
                    $(".nano").nanoScroller({
                        scrollTop: value
                    });
                } else {
                    $(".nano").nanoScroller();
                }
            }
        })
    }
}


