import $ from "jquery";

export class Locator {
    private locationEndpoint = "https://www.growse.com/location/";

    public getLocation() {
        $.getJSON(this.locationEndpoint, function (data) {
            $(document).ready(function () {
                $('#location').append(`<p>Last seen floating around near <a href="http://maps.google.com/?q=${data.latitude},${data.longitude}">
                ${data.name}</a>. ${data.totalDistance.toLocaleString()} miles this year.</p>`);
            });
        }).then(r => console.log(r));
    }
}

