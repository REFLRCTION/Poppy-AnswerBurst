(function () {
  "use strict";

  const DEFAULT_SETTINGS = {
    enabled: true,
    strength: "normal",
    minAnswerLength: 0,
    skipOnInterrupt: true,
    sites: {
      chatgpt: true,
      claude: true,
      gemini: true,
      perplexity: true,
      poe: true,
    },
  };

  const enabled = document.getElementById("enabled");
  const minAnswerLength = document.getElementById("minAnswerLength");
  const skipOnInterrupt = document.getElementById("skipOnInterrupt");
  const status = document.getElementById("status");
  const test = document.getElementById("test");
  const siteInputs = Array.from(document.querySelectorAll("[data-site]"));
  const strengthInputs = Array.from(document.querySelectorAll('input[name="strength"]'));

  let settings = DEFAULT_SETTINGS;
  let saveTimer = null;

  function mergeSettings(next) {
    return {
      ...DEFAULT_SETTINGS,
      ...(next || {}),
      sites: {
        ...DEFAULT_SETTINGS.sites,
        ...((next && next.sites) || {}),
      },
    };
  }

  function render() {
    enabled.checked = settings.enabled;
    minAnswerLength.value = String(settings.minAnswerLength);
    skipOnInterrupt.checked = settings.skipOnInterrupt;

    for (const input of strengthInputs) {
      input.checked = input.value === settings.strength;
    }

    for (const input of siteInputs) {
      input.checked = Boolean(settings.sites[input.dataset.site]);
    }
  }

  function setStatus(text) {
    status.textContent = text;
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      status.textContent = "";
    }, 1400);
  }

  function save() {
    chrome.storage.sync.set(settings, () => {
      setStatus("Saved");
    });
  }

  function readForm() {
    const selectedStrength = strengthInputs.find((input) => input.checked);
    const nextSites = {};

    for (const input of siteInputs) {
      nextSites[input.dataset.site] = input.checked;
    }

    settings = mergeSettings({
      enabled: enabled.checked,
      strength: selectedStrength ? selectedStrength.value : "normal",
      minAnswerLength: Math.max(0, Number.parseInt(minAnswerLength.value, 10) || 0),
      skipOnInterrupt: skipOnInterrupt.checked,
      sites: nextSites,
    });

    save();
  }

  chrome.storage.sync.get(DEFAULT_SETTINGS, (stored) => {
    settings = mergeSettings(stored);
    render();
  });

  enabled.addEventListener("change", readForm);
  minAnswerLength.addEventListener("change", readForm);
  skipOnInterrupt.addEventListener("change", readForm);

  for (const input of strengthInputs) {
    input.addEventListener("change", readForm);
  }

  for (const input of siteInputs) {
    input.addEventListener("change", readForm);
  }

  test.addEventListener("click", () => {
    chrome.runtime.sendMessage(
      {
        type: "AI_ANSWER_FIREWORKS_CELEBRATE",
        strength: settings.strength,
      },
      (response) => {
        if (response && response.ok) {
          setStatus("Sent");
          return;
        }
        setStatus("Cannot inject");
      }
    );
  });
})();
