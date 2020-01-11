"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var jquery_1 = __importDefault(require("jquery"));
var Locator = /** @class */ (function () {
    function Locator() {
        this.locationEndpoint = "https://www.growse.com/location/";
    }
    Locator.prototype.getLocation = function () {
        jquery_1.default.getJSON(this.locationEndpoint, function (data) {
            jquery_1.default(document).ready(function () {
                jquery_1.default('#location').append("<p>Last seen floating around near <a href=\"http://maps.google.com/?q=" + data.latitude + "," + data.longitude + "\">\n                " + data.name + "</a>. " + data.totalDistance.toLocaleString() + " miles this year.</p>");
            });
        }).then(function (r) { return console.log(r); });
    };
    return Locator;
}());
exports.Locator = Locator;
