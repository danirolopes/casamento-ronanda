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

    prefetchUrl("/casar-painel/rsvp-boot.js?v=2", "script");
    prefetchUrl("/casar-painel/rsvp.css?v=2", "style");
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

  var SLIDER_LAZY_RADIUS = 99;
  var preloadedSliderImages = {};

  function preloadCoupleSliderImages() {
    document.querySelectorAll('.slider-wrap img[data-u="image"]').forEach(function (img) {
      var url = img.currentSrc || img.getAttribute("src");
      if (!url || preloadedSliderImages[url]) return;

      preloadedSliderImages[url] = true;
      var loader = new Image();
      loader.decoding = "async";
      loader.src = url;
    });
  }

  function patchCoupleSliderOptions() {
    var getOptions = window.SDN_GET_SLIDER_OPTIONS;
    if (typeof getOptions !== "function" || getOptions.__coupleSliderPatch) return;

    window.SDN_GET_SLIDER_OPTIONS = function () {
      var options = getOptions();
      // Default lazy radius is 1 (current + 1 slide). Autoplay unloads distant
      // slides and refetches them on each loop; manual clicks stay nearby.
      options.$LazyLoading = SLIDER_LAZY_RADIUS;
      return options;
    };
    window.SDN_GET_SLIDER_OPTIONS.__coupleSliderPatch = true;
  }

  function patchCoupleSliderInit() {
    var startSlider = window.startSlider;
    if (typeof startSlider !== "function" || startSlider.__coupleSliderPatch) return;

    window.startSlider = function () {
      preloadCoupleSliderImages();
      return startSlider.apply(this, arguments);
    };
    window.startSlider.__coupleSliderPatch = true;
  }

  function fixCouplePhotoCarousel() {
    patchCoupleSliderOptions();
    patchCoupleSliderInit();
    preloadCoupleSliderImages();
  }

  var SITE_NAV_ITEMS = [
    {
      id: "casamento",
      href: "#casamento",
      label: "O Casamento",
      shortLabel: "Casamento",
      icon:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-4.35-9-7.5C1.5 11 2 7 5.5 5 8 3.5 10 4 12 6c2-2 4-2.5 6.5-1 3.5 2 4 6 2.5 8.5C18.5 16.65 12 21 12 21z"/></svg>',
    },
    {
      id: "rsvp",
      href: "#rsvp",
      label: "Confirmar presença",
      shortLabel: "Presença",
      primeRsvp: true,
      icon:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/></svg>',
    },
    {
      id: "presentes",
      href: "#presentes",
      label: "Presentes",
      shortLabel: "Presentes",
      icon:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12v8H4v-8h16m0-2H4c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-8c0-1.1-.9-2-2-2zm-2-6h-4V2h-4v2H6c-1.1 0-2 .9-2 2v2h16V6c0-1.1-.9-2-2-2z"/></svg>',
    },
    {
      id: "informacoes-importantes",
      href: "#informacoes-importantes",
      label: "Informações Importantes",
      shortLabel: "Informações",
      icon:
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>',
    },
  ];

  function getNavTarget(item) {
    return document.getElementById(item.id);
  }

  function bindNavLink(link, item) {
    function primeRsvp() {
      if (!item.primeRsvp) return;
      prefetchRsvpAssets();
      warmRsvpIframe();
    }

    link.addEventListener("mouseenter", primeRsvp, { once: true });
    link.addEventListener("touchstart", primeRsvp, { once: true, passive: true });
    link.addEventListener("click", function (event) {
      primeRsvp();

      var target = getNavTarget(item);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      history.replaceState(null, "", item.href);
    });
  }

  function createNavLink(item, variant) {
    var link = document.createElement("a");
    link.className = "site-nav-link";
    link.href = item.href;

    if (variant === "mobile") {
      var icon = document.createElement("span");
      icon.className = "site-nav-icon";
      icon.innerHTML = item.icon;
      link.appendChild(icon);
    }

    var label = document.createElement("span");
    label.className = "site-nav-label";
    label.textContent = variant === "mobile" ? item.shortLabel : item.label;

    link.appendChild(label);
    bindNavLink(link, item);
    return link;
  }

  function addSiteNavigation() {
    if (document.getElementById("site-nav-desktop")) return;

    var desktopNav = document.createElement("nav");
    desktopNav.id = "site-nav-desktop";
    desktopNav.className = "site-nav site-nav-desktop";
    desktopNav.setAttribute("aria-label", "Navegação principal");

    var desktopList = document.createElement("ul");
    desktopList.className = "site-nav-list";

    SITE_NAV_ITEMS.forEach(function (item) {
      var listItem = document.createElement("li");
      listItem.appendChild(createNavLink(item, "desktop"));
      desktopList.appendChild(listItem);
    });

    desktopNav.appendChild(desktopList);

    var header = document.querySelector(".sdn-topo .header");
    var headerCol = document.querySelector(".sdn-topo .header > .col2");

    if (!headerCol && header) {
      headerCol = document.createElement("div");
      headerCol.className = "col2";
      header.appendChild(headerCol);
    }

    if (headerCol) {
      headerCol.innerHTML = "";
      headerCol.appendChild(desktopNav);
    }

    var mobileNav = document.createElement("nav");
    mobileNav.id = "site-nav-mobile";
    mobileNav.className = "site-nav site-nav-mobile";
    mobileNav.setAttribute("aria-label", "Navegação principal");

    SITE_NAV_ITEMS.forEach(function (item) {
      mobileNav.appendChild(createNavLink(item, "mobile"));
    });

    document.body.appendChild(mobileNav);
  }

  function getGiftsControllerScope() {
    var root = document.querySelector(".sdn-presentes");
    if (!root || !window.angular) return null;

    var scope = angular.element(root).scope();
    return scope && scope.vm ? scope : null;
  }

  function clearGiftPostcardState(vm) {
    if (!vm || !vm.cart) return false;

    if (!vm.cart.postcard) {
      vm.cart.postcard = {};
    }

    var postcard = vm.cart.postcard;
    var changed = false;

    function set(key, value) {
      if (postcard[key] !== value) {
        postcard[key] = value;
        changed = true;
      }
    }

    set("enabled", false);
    set("send", false);
    set("id", undefined);
    set("value", undefined);
    set("value_with_discount", undefined);
    set("card_msg_showed", true);

    if (vm.extra && vm.extra.loadPostcardSlider) {
      vm.extra.loadPostcardSlider = false;
      changed = true;
    }

    if (vm.errors && vm.errors.presente_comprar_postcard) {
      vm.errors.presente_comprar_postcard = false;
      changed = true;
    }

    if (changed && typeof vm.getTotal === "function") {
      vm.getTotal();
    }

    return changed;
  }

  function patchGiftsController(vm, scope) {
    if (!vm || vm.__giftPostcardPatch) return;

    if (typeof vm.goToStep === "function") {
      var goToStep = vm.goToStep;
      vm.goToStep = function (name) {
        var result = goToStep.apply(this, arguments);
        if (name === "pre-cart2") {
          scope.$evalAsync(function () {
            clearGiftPostcardState(vm);
          });
        }
        return result;
      };
    }

    if (typeof vm.buy === "function") {
      var buy = vm.buy;
      vm.buy = function () {
        clearGiftPostcardState(vm);
        return buy.apply(this, arguments);
      };
    }

    if (typeof vm.selectPostCard === "function") {
      vm.selectPostCard = function () {};
    }

    if (typeof vm.selectRandomPostCard === "function") {
      vm.selectRandomPostCard = function () {};
    }

    if (typeof vm.togglePostcard === "function") {
      vm.togglePostcard = function () {
        clearGiftPostcardState(vm);
      };
    }

    vm.__giftPostcardPatch = true;
    clearGiftPostcardState(vm);
    scope.$applyAsync();
  }

  function disableGiftPostcards() {
    var scope = getGiftsControllerScope();
    if (!scope) return false;

    patchGiftsController(scope.vm, scope);
    return true;
  }

  function watchGiftPostcards() {
    if (disableGiftPostcards()) return;

    var root = document.querySelector(".section-presentes") || document.body;
    var observer = new MutationObserver(function () {
      if (disableGiftPostcards()) {
        observer.disconnect();
      }
    });

    observer.observe(root, { childList: true, subtree: true });

    var attempts = 0;
    var interval = setInterval(function () {
      if (disableGiftPostcards() || ++attempts > 40) {
        clearInterval(interval);
      }
    }, 500);
  }

  function onDomReady() {
    fixCouplePhotoCarousel();
    lazyLoadRsvpIframe();
    addSiteNavigation();
    watchGiftPostcards();
  }

  holdLoaderUntilFonts();

  document.addEventListener("DOMContentLoaded", onDomReady, true);
})();
