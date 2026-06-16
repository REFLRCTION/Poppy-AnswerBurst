(function () {
  "use strict";

  const DEFAULT_STRENGTH = "normal";
  const BLOCKED_PROTOCOLS = ["chrome:", "edge:", "about:", "devtools:", "chrome-extension:"];

  function isInjectableUrl(url) {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return !BLOCKED_PROTOCOLS.includes(parsed.protocol);
    } catch (error) {
      return false;
    }
  }

  async function getActiveTab() {
    const tabs = await chrome.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });
    return tabs && tabs[0] ? tabs[0] : null;
  }

  async function injectConfettiAndFire(tabId, strength) {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["src/lib/confetti.js"],
    });

    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["src/fireworks.js"],
    });

    await chrome.scripting.executeScript({
      target: { tabId },
      func: (nextStrength) => {
        if (window.__aiFireworks && typeof window.__aiFireworks.celebrate === "function") {
          window.__aiFireworks.celebrate(nextStrength);
        }
      },
      args: [strength || DEFAULT_STRENGTH],
    });
  }

  // AI completion — fire on current active tab (may be different from AI tab)
  async function onAICompleted(strength, interrupted) {
    if (interrupted) {
      const data = await chrome.storage.sync.get({ skipOnInterrupt: true });
      if (data.skipOnInterrupt) return;
    }

    const tab = await getActiveTab();
    if (!tab || !tab.id || !isInjectableUrl(tab.url)) return;

    try {
      await injectConfettiAndFire(tab.id, strength || DEFAULT_STRENGTH);
    } catch (error) {
      // Silently fail — tab may have navigated or be restricted
    }
  }

  // Test button — fire on current active tab
  async function celebrateActiveTab(strength) {
    const tab = await getActiveTab();
    if (!tab || !tab.id || !isInjectableUrl(tab.url)) {
      return { ok: false, reason: "active_tab_not_injectable" };
    }

    try {
      await injectConfettiAndFire(tab.id, strength);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        reason: error && error.message ? error.message : "inject_failed",
      };
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message) return false;

    if (message.type === "AI_COMPLETED") {
      onAICompleted(message.strength, message.interrupted);
      return false;
    }

    if (message.type === "AI_ANSWER_FIREWORKS_CELEBRATE") {
      celebrateActiveTab(message.strength).then(sendResponse);
      return true;
    }

    return false;
  });
})();
