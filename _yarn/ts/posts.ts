import OverlayScrollbars from 'overlayscrollbars';

interface Post {
    readonly title: string;
    readonly date: string;
    readonly url: string;
}

interface PostList {
    readonly posts: Array<Post>
}

export class Posts {
    private readonly disabledPaths = ["/search.html"];
    private readonly enabled: boolean = true;

    constructor() {
        this.enabled = !this.disabledPaths.includes(document.location.pathname);
    }

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


    public displayPostList() {
        if (!this.enabled) {
            return;
        }
        document.querySelector("nav#postlist")?.classList.remove("hidden");
        const hereClass = 'here';
        fetch('/posts.json')
            .then(response => response.json() as Promise<PostList>)
            .then(postList => {
                postList.posts.forEach(function (post: Post) {
                    const li = document.createElement("li");
                    const a = document.createElement("a");
                    a.setAttribute("href", post.url);
                    a.setAttribute("title", post.title);

                    const span = document.createElement("span");
                    span.innerText = post.title;
                    li.setAttribute("data-datestamp", post.date);
                    li.setAttribute("data-id", post.title);
                    if (document.location.pathname.endsWith(post.url)) {
                        a.classList.add(hereClass);
                    }
                    a.append(span);
                    li.append(a);
                    document.getElementById("articlenav")?.appendChild(li);
                });
                if (document.location.pathname == "/") {
                    document.querySelector("#articlenav > li:first > a")?.classList.add(hereClass)
                }
                const postListElement = document.getElementById("postlist")!;
                const overlayScrollbars = OverlayScrollbars(postListElement, this.overlayScrollBarOptions);
                overlayScrollbars.scroll({y: 0});
                const windowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
                const currentNavLink = document.querySelector(`ul#articlenav>li>a.${hereClass}`);
                const currentNavLinkTop = currentNavLink?.getBoundingClientRect().top;
                const percentageDown = (currentNavLinkTop!! / windowHeight) * 100;
                if (percentageDown > 50) {
                    const value = currentNavLinkTop!! - (windowHeight / 2) + (document.querySelector('nav#postlist ul li')?.getBoundingClientRect().height! / 2);
                    overlayScrollbars.scroll({y: value});
                } else {
                    overlayScrollbars.scroll({y: 0});
                }
            });
    }
}