interface SearchHitFields {
  readonly published: string;
  readonly title: string;
}

interface SearchHitFragment {
  readonly content?: string[];
}

interface SearchHit {
  readonly id: string;
  readonly score: number;
  readonly fragments: SearchHitFragment;
  readonly fields: SearchHitFields;
}

interface SearchResults {
  readonly totalHits: number;
  readonly timeTaken: number;
  readonly hits: SearchHit[];
}

export class Search {
  private readonly activePaths = ["/search.html"];
  private readonly searchParamQueryStringName = "term";
  private readonly pageQueryStringName = "page";
  private readonly pageElementId = "pager";
  private readonly resultsPerPage = 10;
  private searchURL = "https://www.growse.com/search/";

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
      if (document.location.hostname == "localhost") {
        this.searchURL = "http://localhost:3030/search/";
      }
      if (searchTerm != null) {
        this.search(searchTerm!!, page != null ? parseInt(page!!) : 1);
      } else {
        window.location.replace("/404");
      }
    }
  }

  private search(searchTerm: string, page: number) {
    document.querySelector("#searchterm")!!.textContent = searchTerm;
    const template = document.querySelector(
      "#searchResultTemplate",
    )!! as HTMLTemplateElement;
    const params = new FormData();
    params.set(this.searchParamQueryStringName, searchTerm);
    params.set(this.pageQueryStringName, page.toString());
    fetch(this.searchURL, { method: "POST", body: params })
      .then((response) => response.json())
      .then((response) => {
        const searchResults = response as SearchResults;
        document.querySelector("#spinner")?.classList.add("hidden");
        document.querySelector("p#summary")?.classList.add("visible");
        document.querySelector("span#totalhits")!!.textContent =
          searchResults.totalHits.toLocaleString();
        searchResults.hits.forEach((hit) => {
          const populatedSearchResult = this.putDataIntoTheSearchResultTemplate(
            template.content,
            hit,
          );
          document
            .querySelector("#searchResultList")
            ?.appendChild(populatedSearchResult);
        });
        this.buildPager(this.pageElementId, searchResults, page < 1 ? 1 : page);
      });
  }

  private buildPager(
    pagerDivId: string,
    searchResults: SearchResults,
    page: number,
  ) {
    if (searchResults.totalHits == 0) {
      return;
    }
    const pages = Math.ceil(searchResults.totalHits / this.resultsPerPage);
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
    let pageLi = document.createElement("li");
    let pageLink = document.createElement("a");
    let url = new URL(document.URL);
    url.searchParams.set(this.pageQueryStringName, page.toString());
    pageLink.setAttribute("href", url.toString());
    pageLink.setAttribute("title", title);
    pageLink.textContent = text;
    classList?.forEach((c) => pageLink.classList.add(c));
    pageLi.appendChild(pageLink);
    return pageLi;
  }

  private putDataIntoTheSearchResultTemplate(
    template: DocumentFragment,
    hit: SearchHit,
  ) {
    const publishedDate = new Date(hit.fields.published);
    template.querySelector(".title")!!.textContent = hit.fields.title;
    template.querySelector(".title")!!.setAttribute("href", hit.id);
    template.querySelector("time")!!.textContent = publishedDate.toDateString();
    template
      .querySelector("time")!!
      .setAttribute("datetime", publishedDate.toISOString());
    if (hit.fragments.content != null) {
      template.querySelector(".fragment")!!.innerHTML =
        hit.fragments.content.join("...");
    }
    return document.importNode(template, true);
  }
}
