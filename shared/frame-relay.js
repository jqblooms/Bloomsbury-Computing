// For a page that only wraps one editor iframe (PyScratch, FlowScratch,
// TurboBot): passes messages between that iframe and the Bloomsbury
// Computing site that embeds this page, in both directions.
//   up:   progress reports (PS_TUTORIAL_COMPLETE, FS_TUTORIAL_COMPLETE,
//         LEVEL_COMPLETE) and every BC_* request, such as a cloud save
//   down: every BC_* reply from the site, such as a restored save
// Load it at the end of the page, after the iframe.
(function () {
  "use strict";
  if (window.parent === window) return;
  var frame = document.querySelector("iframe");
  var UP = /^(BC_|PS_TUTORIAL_COMPLETE$|FS_TUTORIAL_COMPLETE$|LEVEL_COMPLETE$)/;
  window.addEventListener("message", function (event) {
    var data = event.data;
    if (!data || typeof data.type !== "string" || !frame || !frame.contentWindow) return;
    if (event.source === frame.contentWindow && UP.test(data.type)) {
      window.parent.postMessage(data, "*");
    } else if (event.source === window.parent && data.type.indexOf("BC_") === 0) {
      frame.contentWindow.postMessage(data, "*");
    }
  });
})();
