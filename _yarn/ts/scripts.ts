import highlightjs from "highlight.js";
import {Locator} from "./location";
import {Posts} from "./posts";

new Locator().getLocation();
new Posts().getPostList();
highlightjs.initHighlightingOnLoad();


//
// const growse = {
//     searchEndpoint: "https://www.growse.com/search/",
//     locationEndpoint: "https://www.growse.com/location/",
//     search: function () {
//         if (window.location.pathname === '/search.html') {
//             $('.nano').hide();
//             const urlVars = this.getUrlVars();
//             $.post(this.sear)
//             $.post(this.searchEndpoint, urlVars, function (response) {
//                 growse.clearSearchResults();
//                 $('#searchterm').text(decodeURIComponent(urlVars['a']));
//                 $('#totalhits').text(response.totalHits);
//                 response.hits.forEach(function (hit) {
//                     let date = hit.id.split('-', 4).slice(0, 3).join('-');
//                     let url = "/"
//                         + hit.id.split('-').slice(0, 3).join('/')
//                         + "/"
//                         + hit.id.split('-').slice(3).join('-');
//                     url = url.substr(0, url.indexOf('.md')) + ".html";
//                     let thistemplate = $($('#searchResultTemplate').html());
//                     thistemplate.find('a.title').text(hit.fields.Title);
//                     thistemplate.find('a.title').prop("href", url);
//                     thistemplate.find('time').text($.format.date(new Date(date), "dd/MM/yyyy"));
//                     thistemplate.find('time').attr("datetime", date);
//                     thistemplate.find('p.fragment').html(hit.fragments.Body);
//                     $("#searchresults>ol").append(thistemplate);
//                 });
//             });
//         }
//     },
//     clearSearchResults: function () {
//         $("#searchresults>ol").empty();
//     },
//     getUrlVars: function () {
//         let vars = {}, hash;
//         const hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
//         for (let i = 0; i < hashes.length; i++) {
//             hash = hashes[i].split('=');
//
//             vars[hash[0]] = hash[1];
//         }
//         return vars;
//     },

// };
//
//
// growse.search();
// growse.getLocation();
// growse.getPostList();
//
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").then(function (registration) {
        console.log("SW registered on: ", registration.scope);
    }).catch(function (err) {
        console.log("SW registration failed: ", err);
    });
}