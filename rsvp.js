/**
 * RSVP confirmation form UX overrides for the Casar.com painel iframe.
 * Hides age group (defaults to adult) and replaces status select with radios (default: yes).
 */
(function () {
  function setSelectValue(select, value) {
    if (!select || select.value === value) {
      if (select && select.value === value) {
        select.dispatchEvent(new Event("input", { bubbles: true }));
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
      return;
    }
    select.value = value;
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function findFieldByLabel(container, labelText) {
    var labels = container.querySelectorAll(".c-label, label");
    for (var i = 0; i < labels.length; i++) {
      if (labels[i].textContent.indexOf(labelText) !== -1) {
        return labels[i].closest(".field");
      }
    }
    return null;
  }

  function findSelectByOptions(container, values) {
    var selects = container.querySelectorAll("select.c-select");
    for (var i = 0; i < selects.length; i++) {
      var options = Array.prototype.map.call(selects[i].options, function (opt) {
        return opt.value;
      });
      if (values.every(function (v) {
        return options.indexOf(v) !== -1;
      })) {
        return selects[i];
      }
    }
    return null;
  }

  function hideField(fieldEl) {
    if (!fieldEl) return;
    fieldEl.classList.add("rsvp-field-hidden");
  }

  function replaceSelectWithRadios(select, defaultValue) {
    if (!select || select.dataset.rsvpRadios) return;

    var wrapper = select.closest(".c-base-select-outlined");
    if (!wrapper) return;

    var groupName = "rsvp-status-" + Math.random().toString(36).slice(2, 9);
    var group = document.createElement("div");
    group.className = "rsvp-radio-group";
    group.setAttribute("role", "radiogroup");
    group.setAttribute("aria-label", "Status de confirmação");

    Array.prototype.forEach.call(select.options, function (option) {
      if (!option.value) return;

      var id = groupName + "-" + option.value;
      var label = document.createElement("label");
      label.className = "rsvp-radio-option";
      label.setAttribute("for", id);

      var input = document.createElement("input");
      input.type = "radio";
      input.name = groupName;
      input.id = id;
      input.value = option.value;
      input.checked = option.value === defaultValue;

      var text = document.createElement("span");
      text.className = "rsvp-radio-label";
      text.textContent = option.textContent.trim();

      label.appendChild(input);
      label.appendChild(text);

      input.addEventListener("change", function () {
        setSelectValue(select, input.value);
      });

      group.appendChild(label);
    });

    select.classList.add("rsvp-select-sr-only");
    select.dataset.rsvpRadios = "true";
    wrapper.classList.add("rsvp-status-field");
    wrapper.appendChild(group);

    setSelectValue(select, defaultValue);
  }

  function simplifyEmailLabel(form) {
    if (form.dataset.rsvpEmailLabel) return;

    var labels = form.querySelectorAll(".c-label, label");
    for (var i = 0; i < labels.length; i++) {
      var label = labels[i];
      if (label.textContent.indexOf("E-mail") === -1) continue;

      var br = label.querySelector("br");
      if (br) {
        var node = br;
        while (node) {
          var next = node.nextSibling;
          label.removeChild(node);
          node = next;
        }
      }

      form.dataset.rsvpEmailLabel = "true";
      break;
    }
  }

  function enhanceGuestName(guest) {
    if (guest.dataset.rsvpGuestName) return;

    var nameField = findFieldByLabel(guest, "Nome completo");
    if (!nameField) return;

    var input = nameField.querySelector("input.c-input");
    var wrapper = nameField.querySelector(".c-base-input-outlined");
    if (!wrapper) return;

    wrapper.classList.add("rsvp-name-field");

    if (wrapper.querySelector(".rsvp-guest-name")) {
      guest.dataset.rsvpGuestName = "true";
      return;
    }

    if (input && input.disabled && input.value.trim()) {
      var nameEl = document.createElement("p");
      nameEl.className = "rsvp-guest-name";
      nameEl.textContent = input.value.trim();
      input.classList.add("rsvp-select-sr-only");
      wrapper.insertBefore(nameEl, input);
    }

    guest.dataset.rsvpGuestName = "true";
  }

  function enhanceGuestBlock(guest) {
    if (guest.dataset.rsvpGuestEnhanced) return;

    enhanceGuestName(guest);

    var ageField = findFieldByLabel(guest, "Grupo de idade");
    var ageSelect = ageField
      ? ageField.querySelector("select.c-select")
      : findSelectByOptions(guest, ["adult", "child"]);

    if (ageSelect) {
      setSelectValue(ageSelect, "adult");
      hideField(ageSelect.closest(".field"));
    }

    var statusField = findFieldByLabel(guest, "Status de confirmação");
    var statusSelect = statusField
      ? statusField.querySelector("select.c-select")
      : findSelectByOptions(guest, ["yes", "no"]);

    if (statusSelect && !statusSelect.dataset.rsvpRadios) {
      replaceSelectWithRadios(statusSelect, "yes");
    }

    guest.dataset.rsvpGuestEnhanced = "true";
  }

  function enhanceConfirmationForm() {
    var confirmation = document.querySelector(".c-invite-confirmation");
    if (!confirmation) return;

    if (confirmation.querySelector(".description.final")) return;

    var form = confirmation.querySelector("form");
    if (!form) return;

    simplifyEmailLabel(form);

    var guests = form.querySelectorAll(".guest");
    if (!guests.length) return;

    guests.forEach(enhanceGuestBlock);
  }

  function run() {
    enhanceConfirmationForm();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }

  var observer = new MutationObserver(run);
  observer.observe(document.body, { childList: true, subtree: true });
})();
