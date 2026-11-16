interface Location {
  readonly latitude: number;
  readonly longitude: number;
  readonly name: string;
  readonly totalDistance: number;
}

export class Locator {
  private locationEndpoint = "https://location.growse.com/location/";

  /**
   * The location blurb is decoration, and lives on another origin, so it
   * waits until the page has loaded and the browser is idle rather than
   * competing with the article for the connection. It isn't fetched at all
   * where it isn't shown (the phone top bar has no room for it), or while
   * the page is only being prerendered on speculation.
   */
  public getLocationWhenIdle() {
    const target = document.getElementById("location");
    if (target == null || target.offsetParent == null) {
      return;
    }
    const whenIdle = () => {
      if ("requestIdleCallback" in window) {
        requestIdleCallback(() => this.getLocation(), { timeout: 5000 });
      } else {
        setTimeout(() => this.getLocation(), 0);
      }
    };
    const afterLoad = () => {
      if (document.readyState === "complete") {
        whenIdle();
      } else {
        window.addEventListener("load", whenIdle, { once: true });
      }
    };
    if (document.prerendering) {
      document.addEventListener("prerenderingchange", afterLoad, {
        once: true,
      });
    } else {
      afterLoad();
    }
  }

  private getLocation() {
    fetch(this.locationEndpoint)
      .then((response) => {
        if (response.status != 200) {
          throw `HTTP error: ${response.status}`;
        }
        return response;
      })
      .then((response) => response.json() as Promise<Location>)
      .then((location) => {
        // Built with DOM nodes rather than innerHTML so nothing in the
        // response is ever parsed as markup.
        const link = document.createElement("a");
        link.href = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
        link.textContent = location.name;
        const p = document.createElement("p");
        p.append(
          "Last seen floating around near ",
          link,
          `. ${location.totalDistance.toLocaleString()} miles this year.`,
        );
        document.getElementById("location")?.replaceChildren(p);
      })
      .catch((reason) => {
        console.error(`Error fetching location: ${reason}`);
      });
  }
}
