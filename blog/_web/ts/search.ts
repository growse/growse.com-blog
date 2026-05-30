interface PagefindResultData {
  url: string;
  excerpt: string;
  content: string;
  meta: {
    title: string;
    date?: string;
    image?: string;
  };
}

interface PagefindSearchResult {
  id: string;
  data: () => Promise<PagefindResultData>;
}

interface PagefindAPI {
  init?: () => Promise<void>;
  search: (term: string) => Promise<{ results: PagefindSearchResult[] }>;
}

export class Search {
  private readonly activePaths = ["/search.html"];
  private readonly searchParamQueryStringName = "term";
  private readonly pageQueryStringName = "page";
  private readonly pageElementId = "pager";
  private readonly resultsPerPage = 10;

  constructor() {
    const searchDiv = document.querySelector("#search");
    if (searchDiv != null) {
      searchDiv.classList.add("visible");
      searchDiv
        .querySelector("input#searchbox")
        ?.setAttribute("name", this.searchParamQueryStringName);
    }
    if (this.activePaths.includes(document.location.pathname)) {
      const searchParams = new URLSearchParams(document.location.search);
      const searchTerm = searchParams.get(this.searchParamQueryStringName);
      const page = searchParams.get(this.pageQueryStringName);
      if (searchTerm != null) {
        this.search(searchTerm, page != null ? parseInt(page) : 1);
      } else {
        window.location.replace("/404");
      }
    }
  }

  private async search(searchTerm: string, page: number) {
    document.querySelector("#searchterm")!.textContent = searchTerm;
    try {
      // Path stored in variable so TypeScript skips module resolution (file is generated at build time)
      const pagefindPath = "/pagefind/pagefind.js";
      const pagefind = (await import(
        /* webpackIgnore: true */ pagefindPath
      )) as unknown as PagefindAPI;
      const searchResponse = await pagefind.search(searchTerm);
      const totalHits = searchResponse.results.length;
      const clampedPage = Math.max(
        1,
        Math.min(page, Math.ceil(totalHits / this.resultsPerPage) || 1),
      );
      const start = (clampedPage - 1) * this.resultsPerPage;
      const pageResults = searchResponse.results.slice(
        start,
        start + this.resultsPerPage,
      );

      const resultData = await Promise.all(pageResults.map((r: PagefindSearchResult) => r.data()));

      document.querySelector("#spinner")?.classList.add("hidden");
      document.querySelector("p#summary")?.classList.add("visible");
      document.querySelector("span#totalhits")!.textContent =
        totalHits.toLocaleString();

      const template = document.querySelector(
        "#searchResultTemplate",
      )! as HTMLTemplateElement;
      const list = document.querySelector("#searchResultList")!;
      for (const data of resultData) {
        list.appendChild(this.renderResult(template.content, data));
      }
      this.buildPager(this.pageElementId, totalHits, clampedPage);
    } catch {
      document.querySelector("#spinner")?.classList.add("hidden");
      document.querySelector("p#summary")?.classList.add("visible");
      document.querySelector("span#totalhits")!.textContent = "0";
    }
  }

  private buildPager(pagerDivId: string, totalHits: number, page: number) {
    if (totalHits == 0) {
      return;
    }
    const pages = Math.ceil(totalHits / this.resultsPerPage);
    if (pages == 1) {
      return;
    }
    const pager = document.querySelector(`#${pagerDivId}`);
    pager?.appendChild(this.buildPagerButton(1, "<<", "First Page"));
    pager?.appendChild(
      this.buildPagerButton(page > 1 ? page - 1 : 1, "<", "Previous Page"),
    );

    for (let ii = 1; ii <= pages; ii++) {
      pager?.appendChild(
        this.buildPagerButton(
          ii,
          ii.toString(),
          `page ${ii}`,
          ii == page ? ["current"] : ["absolutePage"],
        ),
      );
    }
    pager?.appendChild(
      this.buildPagerButton(page < pages ? page + 1 : pages, ">", "Next Page"),
    );
    pager?.appendChild(this.buildPagerButton(pages, ">>", "Last Page"));
  }

  private buildPagerButton(
    page: number,
    text: string,
    title: string,
    classList?: string[],
  ): HTMLElement {
    const pageLi = document.createElement("li");
    const pageLink = document.createElement("a");
    const url = new URL(document.URL);
    url.searchParams.set(this.pageQueryStringName, page.toString());
    pageLink.setAttribute("href", url.toString());
    pageLink.setAttribute("title", title);
    pageLink.textContent = text;
    classList?.forEach((c) => pageLink.classList.add(c));
    pageLi.appendChild(pageLink);
    return pageLi;
  }

  private renderResult(
    template: DocumentFragment,
    data: PagefindResultData,
  ): Node {
    template.querySelector(".title")!.textContent = data.meta.title;
    template.querySelector(".title")!.setAttribute("href", data.url);
    if (data.meta.date) {
      const publishedDate = new Date(data.meta.date);
      template.querySelector("time")!.textContent =
        publishedDate.toDateString();
      template
        .querySelector("time")!
        .setAttribute("datetime", publishedDate.toISOString());
    }
    template.querySelector(".fragment")!.innerHTML = data.excerpt;
    return document.importNode(template, true);
  }
}
