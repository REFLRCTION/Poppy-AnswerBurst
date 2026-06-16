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

  let settings = DEFAULT_SETTINGS;
  let activeSessions = new Map();
  const celebratedElements = new WeakSet();

  /* ── Settings ──────────────────────────────────────────── */
  function loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(DEFAULT_SETTINGS, (s) => {
        settings = { ...DEFAULT_SETTINGS, ...s, sites: { ...DEFAULT_SETTINGS.sites, ...(s.sites || {}) } };
        resolve();
      });
    });
  }

  chrome.storage.onChanged.addListener(() => loadSettings());

  /* ── Site detection ────────────────────────────────────── */
  const SITE = detectSite();

  function detectSite() {
    const h = location.hostname;
    if (h.includes("chatgpt.com") || h.includes("chat.openai.com")) return "chatgpt";
    if (h.includes("claude.ai")) return "claude";
    if (h.includes("gemini.google.com")) return "gemini";
    if (h.includes("perplexity.ai")) return "perplexity";
    if (h.includes("poe.com")) return "poe";
    return null;
  }

  if (!SITE) return;

  /* ── Session tracking ──────────────────────────────────── */
  function startSession(id) {
    activeSessions.set(id, { site: SITE, interrupted: false, text: "", timer: null, ended: false });
  }

  function endSession(id, interrupted) {
    const session = activeSessions.get(id);
    if (!session || session.ended) return;
    session.ended = true;
    session.interrupted = interrupted;
    if (session.timer) clearTimeout(session.timer);
  }

  /* ── Celebration trigger ────────────────────────────────── */
  function maybeCelebrate(text, interrupted, element) {
    if (!settings.enabled) return;
    if (!settings.sites[SITE]) return;
    if (element && celebratedElements.has(element)) return;
    if (interrupted && settings.skipOnInterrupt) {
      if (element) celebratedElements.add(element);
      activeSessions.clear();
      return;
    }
    const len = (text || "").trim().length;
    if (len < settings.minAnswerLength) return;

    if (element) celebratedElements.add(element);
    chrome.runtime.sendMessage({
      type: "AI_COMPLETED",
      strength: settings.strength,
      interrupted: !!interrupted,
    });
    activeSessions.clear();
  }

  /* ── Site-specific observers ───────────────────────────── */

  // ── ChatGPT ──────────────────────────────
  function observeChatGPT() {
    let currentId = null;
    let accumulatingText = "";

    const mo = new MutationObserver((mutations) => {
      // Detect stop button → user can interrupt
      const stopBtn = document.querySelector('button[aria-label="Stop generating"], button[data-testid="stop-button"]');
      // Detect "stopped" indicator
      const stoppedBadge = document.querySelector('[class*="stopped"], [class*="turn-stop"]');

      // Detect response blocks
      const responseBlocks = document.querySelectorAll('[data-message-author-role="assistant"]');

      for (const block of responseBlocks) {
        const text = block.textContent || "";
        // Check if this response is still streaming (has a typing indicator or is actively being written)
        const isStreaming = block.querySelector('[class*="typing"], [class*="result-streaming"], [class*="streaming"]')
          || !!stopBtn;

        if (isStreaming) {
          if (!currentId) {
            currentId = "gpt-" + Date.now();
            startSession(currentId);
          }
          accumulatingText = text;
        } else {
          if (currentId) {
            // Check if interrupted — ChatGPT shows "[stopped]" or similar
            const wasInterrupted = !!stoppedBadge
              || text.includes("Stopped generating")
              || block.querySelector('[class*="stopped"]');

            endSession(currentId, wasInterrupted);
            maybeCelebrate(text, wasInterrupted, block);
            currentId = null;
            accumulatingText = "";
          }
        }
      }
    });

    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  // ── Claude ───────────────────────────────
  function observeClaude() {
    let currentId = null;

    const mo = new MutationObserver(() => {
      const stopBtn = document.querySelector('button[aria-label="Stop"], button[aria-label="Abort request"], fieldset button[aria-label="Stop"]');
      const responseElements = document.querySelectorAll('[data-is-streaming]');

      for (const el of responseElements) {
        const isStreaming = el.getAttribute("data-is-streaming") === "true";

        if (isStreaming && !currentId) {
          currentId = "claude-" + Date.now();
          startSession(currentId);
        } else if (!isStreaming && currentId) {
          const text = el.textContent || "";

          const wasInterrupted = el.querySelector('[class*="aborted"], [class*="cancelled"]')
            || text.trim().length < 20 && !text.includes(".");

          endSession(currentId, wasInterrupted);
          maybeCelebrate(text, wasInterrupted, el);
          currentId = null;
        }
      }

      if (!stopBtn && currentId) {
        const latestStreaming = document.querySelector('[data-is-streaming="true"]');
        if (!latestStreaming) {
          const responses = document.querySelectorAll('[data-is-streaming="false"]');
          const last = responses[responses.length - 1];
          if (last) {
            const text = last.textContent || "";
            const wasInterrupted = text.trim().length < 50
              || last.querySelector('[class*="aborted"]')
              || endsMidSentence(text);

            endSession(currentId, wasInterrupted);
            maybeCelebrate(text, wasInterrupted, last);
            currentId = null;
          }
        }
      }
    });

    mo.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["data-is-streaming"] });
  }

  // ── Gemini ───────────────────────────────
  function observeGemini() {
    let currentId = null;

    const mo = new MutationObserver(() => {
      const stopBtn = document.querySelector('button[aria-label="Stop generating"], button[aria-label="Stop"]');
      const modelResponses = document.querySelectorAll('message-content[model-response], .model-response');

      for (const el of modelResponses) {
        const isStreaming = !!stopBtn || el.querySelector('.loading-indicator, [class*="typing"]');

        if (isStreaming && !currentId) {
          currentId = "gemini-" + Date.now();
          startSession(currentId);
        } else if (!isStreaming && currentId) {
          const text = el.textContent || "";
          const wasInterrupted = text.includes("Response stopped")
            || el.querySelector('[class*="stopped"], [class*="cancelled"]');

          endSession(currentId, wasInterrupted);
          maybeCelebrate(text, wasInterrupted, el);
          currentId = null;
        }
      }
    });

    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  // ── Perplexity ──────────────────────────
  function observePerplexity() {
    let currentId = null;

    const mo = new MutationObserver(() => {
      const stopBtn = document.querySelector('button[aria-label="Stop"], button[class*="stop"]');
      const answers = document.querySelectorAll('[class*="prose"]');

      for (const el of answers) {
        const isStreaming = !!stopBtn;

        if (isStreaming && !currentId) {
          currentId = "perp-" + Date.now();
          startSession(currentId);
        } else if (!isStreaming && currentId) {
          const text = el.textContent || "";
          const wasInterrupted = !!el.querySelector('[class*="stopped"], [class*="cancelled"]');

          endSession(currentId, wasInterrupted);
          maybeCelebrate(text, wasInterrupted, el);
          currentId = null;
        }
      }
    });

    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  // ── Poe ─────────────────────────────────
  function observePoe() {
    let currentId = null;

    const mo = new MutationObserver(() => {
      const stopBtn = document.querySelector('button[class*="Stop"], button[aria-label="Stop"]');
      const botMessages = document.querySelectorAll('[class*="Message_botMessage"]');

      for (const el of botMessages) {
        const isStreaming = !!stopBtn || el.querySelector('[class*="StreamingMessage"]');

        if (isStreaming && !currentId) {
          currentId = "poe-" + Date.now();
          startSession(currentId);
        } else if (!isStreaming && currentId) {
          const text = el.textContent || "";
          const wasInterrupted = !!el.querySelector('[class*="cancelled"], [class*="Cancelled"]')
            || text.includes("Cancelled");

          endSession(currentId, wasInterrupted);
          maybeCelebrate(text, wasInterrupted, el);
          currentId = null;
        }
      }
    });

    mo.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  /* ── Helpers ───────────────────────────────────────────── */
  function endsMidSentence(text) {
    const t = text.trim();
    if (t.length < 50) return true;
    const last = t[t.length - 1];
    // If doesn't end with typical sentence-ending punctuation
    return ![". ! ? …:：".includes(last)];
  }

  /* ── Init ──────────────────────────────────────────────── */
  loadSettings().then(() => {
    const observers = {
      chatgpt: observeChatGPT,
      claude: observeClaude,
      gemini: observeGemini,
      perplexity: observePerplexity,
      poe: observePoe,
    };

    const fn = observers[SITE];
    if (fn) fn();
  });
})();
