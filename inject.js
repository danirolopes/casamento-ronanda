/**
 * DOM tweaks that CSS cannot reach, plus font-aware loader handling.
 */
(function () {
  document.documentElement.dataset.customProxy = "true";

  var TITLE = "Casamento Maria Fernanda e Ronaldo";
  var FONT_WAIT_MS = 5000;
  var RSVP_WARMUP_MS = 2000;

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

  function isRsvpHash() {
    return /^#\/?rsvp(?:$|[/?#])/.test(location.hash);
  }

  function loadRsvpIframe(iframe) {
    if (!iframe || iframe.dataset.rsvpLoaded) return;
    iframe.dataset.rsvpLoaded = "true";
    iframe.removeAttribute("data-rsvp-pending");
    if (iframe.dataset.rsvpSrc) {
      iframe.src = iframe.dataset.rsvpSrc;
    }
  }

  function prefetchUrl(href, as) {
    if (!href || document.querySelector('link[rel="prefetch"][href="' + href + '"]')) {
      return;
    }

    var link = document.createElement("link");
    link.rel = "prefetch";
    if (as) {
      link.as = as;
    }
    link.href = href;
    document.head.appendChild(link);
  }

  function prefetchRsvpAssets() {
    if (document.documentElement.dataset.rsvpPrefetch) return;
    document.documentElement.dataset.rsvpPrefetch = "true";

    var iframe = document.getElementById("rsvp-invites-iframe");
    if (!iframe || !iframe.dataset.rsvpSrc) return;

    prefetchUrl("/casar-painel/rsvp-boot.js", "script");
    prefetchUrl("/casar-painel/rsvp.css", "style");
    prefetchUrl("/casar-painel/fonts/DREAMLINE.OTF");

    fetch(iframe.dataset.rsvpSrc, { credentials: "same-origin" })
      .then(function (response) {
        return response.text();
      })
      .then(function (html) {
        html.replace(/(?:src|href)="(\/casar-painel\/(?:js|css)\/[^"]+)"/g, function (_, url) {
          prefetchUrl(url, url.indexOf("/css/") !== -1 ? "style" : "script");
          return "";
        });
      })
      .catch(function () {});
  }

  function warmRsvpIframe() {
    var iframe = document.getElementById("rsvp-invites-iframe");
    loadRsvpIframe(iframe);
  }

  function scheduleRsvpWarmup() {
    prefetchRsvpAssets();

    if (isRsvpHash()) {
      warmRsvpIframe();
      return;
    }

    var warmed = false;
    function warmOnce() {
      if (warmed) return;
      warmed = true;
      warmRsvpIframe();
    }

    setTimeout(warmOnce, RSVP_WARMUP_MS);

    document.addEventListener(
      "scroll",
      function () {
        warmOnce();
      },
      { once: true, passive: true }
    );

    document.addEventListener(
      "touchstart",
      function () {
        warmOnce();
      },
      { once: true, passive: true }
    );
  }

  function lazyLoadRsvpIframe() {
    var iframe = document.getElementById("rsvp-invites-iframe");
    if (!iframe || iframe.dataset.rsvpLazyInit) return;

    iframe.dataset.rsvpLazyInit = "true";

    var src = iframe.getAttribute("src");
    if (!src) return;

    iframe.dataset.rsvpSrc = src;
    iframe.dataset.rsvpPending = "true";
    iframe.removeAttribute("src");
    iframe.setAttribute("loading", "lazy");

    if ("requestIdleCallback" in window) {
      requestIdleCallback(scheduleRsvpWarmup, { timeout: RSVP_WARMUP_MS + 500 });
    } else {
      setTimeout(scheduleRsvpWarmup, RSVP_WARMUP_MS);
    }
  }

  function addRsvpCtaButton() {
    if (document.getElementById("rsvp-cta-fixed")) return;

    var button = document.createElement("a");
    button.id = "rsvp-cta-fixed";
    button.className = "rsvp-cta-fixed";
    button.href = "#rsvp";
    button.textContent = "Confirme sua presença!";

    function primeRsvp() {
      prefetchRsvpAssets();
      warmRsvpIframe();
    }

    button.addEventListener("mouseenter", primeRsvp, { once: true });
    button.addEventListener("touchstart", primeRsvp, { once: true, passive: true });
    button.addEventListener("click", function (event) {
      primeRsvp();

      var target = document.getElementById("rsvp") || document.querySelector(".section-rsvp");
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", "#rsvp");
    });

    document.body.appendChild(button);
  }

  function onDomReady() {
    lazyLoadRsvpIframe();
    addRsvpCtaButton();
  }

  holdLoaderUntilFonts();

  document.addEventListener("DOMContentLoaded", onDomReady, true);
})();
