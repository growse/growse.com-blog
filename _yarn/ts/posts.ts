export class Posts {
    public getPostList(): void {

        $.get('/posts.json', function (data) {
            $(document).ready(function () {
                data.posts.forEach(function (d) {
                    $("#articlenav").append("<li data-datestamp=\"" + d.date + "\" data-id=\"" + d.title + "\"><a " + (post_url === d.url ? "class=\"here\"" : "") + " href=\"" + d.url + "\" title=\"" + d.title + "\"><span>" + d.title + "</span></a> </li>");
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
        });

    }
}
