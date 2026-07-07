/**
 * RSVP iframe boot: defer decorative images and reveal UI once the form is ready.
 */
(function () {
  document.documentElement.classList.add("rsvp-loading");

  var deferredImages = [];
  var ready = false;

  function markReady() {
    if (ready) return;

    var interactive = document.querySelector(
      ".c-search-invites form, .c-invite-confirmation form, .c-invite-confirm-4-digits, .c-invites-results, .c-invites-not-found"
    );
    if (!interactive) return;

    ready = true;
    document.documentElement.classList.add("rsvp-ready");
    document.documentElement.classList.remove("rsvp-loading");
    releaseDeferredImages();
  }

  function deferImage(img) {
    if (!img || img.dataset.rsvpDeferred) return;

    var src = img.getAttribute("src");
    if (!src || src.indexOf("data:") === 0) return;

    img.dataset.rsvpDeferred = "true";
    img.dataset.rsvpSrc = src;
    img.removeAttribute("src");
    deferredImages.push(img);
  }

  function releaseDeferredImages() {
    deferredImages.forEach(function (img) {
      if (img.dataset.rsvpSrc) {
        img.src = img.dataset.rsvpSrc;
      }
    });
    deferredImages = [];
  }

  function scanNode(node) {
    if (!node || node.nodeType !== 1) return;
    if (node.tagName === "IMG") deferImage(node);
    if (node.querySelectorAll) {
      node.querySelectorAll("img").forEach(deferImage);
    }
  }

  new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      mutation.addedNodes.forEach(scanNode);
    });
    markReady();
  }).observe(document.documentElement, { childList: true, subtree: true });

  document.addEventListener("DOMContentLoaded", markReady, true);

  setTimeout(function () {
    if (!ready) {
      ready = true;
      document.documentElement.classList.add("rsvp-ready");
      document.documentElement.classList.remove("rsvp-loading");
      releaseDeferredImages();
    }
  }, 8000);
})();
