import LazyLoad from "vanilla-lazyload";
import { Locator } from "./location";
import { PostNav } from "./postnav";
import { Search } from "./search";

new LazyLoad(
  {
    elements_selector: ".lazyload",
    use_native: true,
  },
  document.querySelectorAll(".lazyload"),
);
new Locator().getLocation();
new Search();
new PostNav().enhance();

import "../scss/main.scss";
import "../scss/critical.scss";

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then(function (registration) {
      console.log("SW registered on: ", registration.scope);
    })
    .catch(function (err) {
      console.log("SW registration failed: ", err);
    });
}
