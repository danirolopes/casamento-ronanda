/**
 * DOM tweaks that CSS cannot reach, plus font-aware loader handling.
 */
(function () {
  document.documentElement.dataset.customProxy = "true";

  var TITLE = "Casamento Maria Fernanda e Ronaldo";
  var FONT_WAIT_MS = 5000;

  function waitForFonts() {
    var loads = [
      document.fonts.load('400 36px "Dreamline"'),
      document.fonts.load('400 18px "Dreamline"'),
      document.fonts.load('300 16px Comfortaa'),
      document.fonts.load('300 1rem Comfortaa'),
    ];

    return Promise.all(loads)
      .catch(function () {})
      .then(function () {
        return document.fonts.ready;
      });
  }

  function releaseLoader() {
    document.title = TITLE;
    document.documentElement.classList.add("fonts-ready");

    var loader = document.getElementById("loading-site");
    if (!loader) return;

    HTMLElement.prototype.remove.call(loader);
  }

  function holdLoaderUntilFonts() {
    document.addEventListener(
      "DOMContentLoaded",
      function () {
        var loader = document.getElementById("loading-site");
        if (loader) {
          loader.remove = function () {};
        }

        Promise.race([
          waitForFonts(),
          new Promise(function (resolve) {
            setTimeout(resolve, FONT_WAIT_MS);
          }),
        ]).then(releaseLoader);
      },
      true
    );
  }

  function lazyLoadRsvpIframe() {
    var iframe = document.getElementById("rsvp-invites-iframe");
    if (!iframe || iframe.dataset.rsvpLazyInit) return;

    iframe.dataset.rsvpLazyInit = "true";

    var src = iframe.getAttribute("src");
    if (!src) return;

    iframe.dataset.rsvpSrc = src;
    iframe.removeAttribute("src");
    iframe.setAttribute("loading", "lazy");

    function loadIframe() {
      if (iframe.dataset.rsvpLoaded) return;
      iframe.dataset.rsvpLoaded = "true";
      iframe.src = iframe.dataset.rsvpSrc;
    }

    if (location.hash === "#rsvp") {
      loadIframe();
      return;
    }

    var target = iframe.closest(".section-rsvp") || iframe;
    if (!("IntersectionObserver" in window)) {
      loadIframe();
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) {
          loadIframe();
          observer.disconnect();
        }
      },
      { rootMargin: "400px 0px" }
    );
    observer.observe(target);
  }

  function onDomReady() {
    lazyLoadRsvpIframe();
  }

  holdLoaderUntilFonts();

  document.addEventListener("DOMContentLoaded", onDomReady, true);
})();
