import $ from "jquery";
import jqXHR = JQuery.jqXHR;

interface Location {
    readonly latitude: number;
    readonly longitude: number;
    readonly name: string;
    readonly totalDistance: number
}

export class Locator {
    private locationEndpoint = "https://www.growse.com/location/";

    public fetchLocation(): jqXHR {
        return $.getJSON(this.locationEndpoint)
    }

    public getLocation() {
        this.fetchLocation().then(data => {
            $(() => {
                let location = <Location>data;
                $('#location').append(`<p>Last seen floating around near <a href="http://maps.google.com/?q=${location.latitude},${location.longitude}">
                ${location.name}</a>. ${location.totalDistance.toLocaleString()} miles this year.</p>`);
            });
        });
    }
}

