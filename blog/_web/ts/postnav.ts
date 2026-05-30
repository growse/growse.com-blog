interface Post {
  readonly title: string;
  readonly url: string;
  readonly date: string;
}

interface PostList {
  readonly posts: Array<Post>;
}

/**
 * The post list nav is server rendered with a window of posts either side of
 * the current one, which is all a reader without JavaScript ever needs. This
 * enhances it: scroll near either end and the rest of the archive is fetched
 * once and swapped in, keeping the reader's position.
 */
export class PostNav {
  private readonly nav = document.querySelector<HTMLElement>("nav#postlist");
  private readonly list =
    document.querySelector<HTMLUListElement>("#articlenav");
  private readonly edgeThreshold = 300;
  private expanded = false;
  private restingScrollTop = 0;

  public enhance() {
    if (this.nav == null || this.list == null) {
      return;
    }
    // Hidden below this width, so there is nothing to scroll or enhance.
    if (!window.matchMedia("(min-width: 1024px)").matches) {
      return;
    }
    this.list.querySelector("a.here")?.scrollIntoView({ block: "center" });
    // scrollIntoView above queues a scroll event of its own. Remember where it
    // left us so that event does not read as the reader scrolling, which would
    // fetch the whole list on every page load.
    this.restingScrollTop = this.nav.scrollTop;
    this.nav.addEventListener("scroll", () => this.onScroll(), {
      passive: true,
    });
  }

  private onScroll() {
    if (this.expanded || this.nav == null) {
      return;
    }
    if (this.nav.scrollTop === this.restingScrollTop) {
      return;
    }
    const fromTop = this.nav.scrollTop;
    const fromBottom =
      this.nav.scrollHeight - this.nav.scrollTop - this.nav.clientHeight;
    if (fromTop > this.edgeThreshold && fromBottom > this.edgeThreshold) {
      return;
    }
    this.expanded = true;
    void this.expand();
  }

  private async expand() {
    const nav = this.nav!;
    const list = this.list!;
    let posts: Array<Post>;
    try {
      const response = await fetch("/posts.json");
      posts = ((await response.json()) as PostList).posts;
    } catch {
      this.expanded = false; // let a later scroll try again
      return;
    }

    // Measure the entry the reader is on before and after the swap, so the
    // list does not jump under them when the earlier posts are prepended.
    const offsetBefore =
      list.querySelector("a.here")?.getBoundingClientRect().top ?? 0;

    const current = document.location.pathname;
    const replacement = document.createDocumentFragment();
    for (const post of posts) {
      replacement.appendChild(this.renderPost(post, post.url === current));
    }
    list.replaceChildren(replacement);

    const offsetAfter =
      list.querySelector("a.here")?.getBoundingClientRect().top ?? 0;
    nav.scrollTop += offsetAfter - offsetBefore;
  }

  private renderPost(post: Post, current: boolean): HTMLLIElement {
    const li = document.createElement("li");
    li.setAttribute("data-datestamp", post.date);
    const a = document.createElement("a");
    a.setAttribute("href", post.url);
    a.setAttribute("title", post.title);
    if (current) {
      a.classList.add("here");
    }
    const span = document.createElement("span");
    span.textContent = post.title;
    a.appendChild(span);
    li.appendChild(a);
    return li;
  }
}
