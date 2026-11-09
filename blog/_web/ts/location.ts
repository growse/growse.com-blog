interface Location {
  readonly latitude: number;
  readonly longitude: number;
  readonly name: string;
  readonly totalDistance: number;
}

export class Locator {
  private locationEndpoint = "https://location.growse.com/location/";

  public getLocation() {
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
