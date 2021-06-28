interface Location {
    readonly latitude: number;
    readonly longitude: number;
    readonly name: string;
    readonly totalDistance: number
}

export class Locator {
    private locationEndpoint = "https://location.growse.com/location/";

    public getLocation() {
        fetch(this.locationEndpoint)
            .then(response => {
                if (response.status != 200) {
                    throw `HTTP error: ${response.status}`
                }
                return response
            })
            .then(response => response.json() as Promise<Location>)
            .then(data => {
                let location = <Location>data;
                document.getElementById('location')!!.innerHTML =
                    `<p>Last seen floating around near <a href="http://maps.google.com/?q=${location.latitude},${location.longitude}">
                ${location.name}</a>. ${location.totalDistance.toLocaleString()} miles this year.</p>`;
            }).catch(reason => {
                console.error(`Error fetching location: ${reason}`)
            }
        )
    }
}

