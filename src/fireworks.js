(function () {
  "use strict";

  const DEFAULT_COLORS = [
    "#26ccff", "#a25afd", "#ff5e7e",
    "#88ff5a", "#fcff42", "#ffa62d", "#ff36ff",
  ];

  var count = 500;
  var defaults = {
    origin: { y: 0.8 },
  };

  function fire(particleRatio, opts) {
    return confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  function shootFromCorners() {
    const commonOptions = {
      spread: 40,
      startVelocity: 120,
      decay: 0.93,
      ticks: 300,
      gravity: 3.5,
      scalar: 1.9,
      colors: DEFAULT_COLORS,
      shapes: ["square", "circle"],
    };

    fire(0.5, {
      ...commonOptions,
      origin: { x: -0.2, y: 1.2 },
      angle: 60,
      drift: 0.8,
    });

    fire(0.5, {
      ...commonOptions,
      origin: { x: 1.2, y: 1.2 },
      angle: 120,
      drift: -0.8,
    });
  }

  function shootLight() {
    count = 200;
    const commonOptions = {
      spread: 40,
      startVelocity: 100,
      decay: 0.93,
      ticks: 300,
      gravity: 3.5,
      scalar: 1.5,
      colors: DEFAULT_COLORS,
      shapes: ["square", "circle"],
    };

    fire(0.5, {
      ...commonOptions,
      origin: { x: -0.2, y: 1.2 },
      angle: 60,
      drift: 0.8,
    });

    fire(0.5, {
      ...commonOptions,
      origin: { x: 1.2, y: 1.2 },
      angle: 120,
      drift: -0.8,
    });
  }

  function shootNormal() {
    count = 500;
    shootFromCorners();
  }

  function shootParty() {
    count = 800;

    // Dual corner cannons (main effect from utools-confetti)
    const commonOptions = {
      spread: 40,
      startVelocity: 120,
      decay: 0.93,
      ticks: 300,
      gravity: 3.5,
      scalar: 1.9,
      colors: DEFAULT_COLORS,
      shapes: ["square", "circle"],
    };

    fire(0.4, {
      ...commonOptions,
      origin: { x: -0.2, y: 1.2 },
      angle: 60,
      drift: 0.8,
    });

    fire(0.4, {
      ...commonOptions,
      origin: { x: 1.2, y: 1.2 },
      angle: 120,
      drift: -0.8,
    });

    // Additional center celebration burst
    setTimeout(function () {
      count = 800;
      fire(0.25, {
        spread: 26,
        startVelocity: 55,
        origin: { y: 0.7 },
        colors: DEFAULT_COLORS,
      });
      fire(0.2, {
        spread: 60,
        origin: { y: 0.7 },
        colors: DEFAULT_COLORS,
      });
      fire(0.35, {
        spread: 100,
        decay: 0.91,
        scalar: 0.8,
        origin: { y: 0.7 },
        colors: DEFAULT_COLORS,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 25,
        decay: 0.92,
        scalar: 1.2,
        origin: { y: 0.7 },
        colors: DEFAULT_COLORS,
      });
      fire(0.1, {
        spread: 120,
        startVelocity: 45,
        origin: { y: 0.7 },
        colors: DEFAULT_COLORS,
      });
    }, 250);
  }

  const SHOOTERS = {
    light: shootLight,
    normal: shootNormal,
    party: shootParty,
  };

  function celebrate(strength) {
    const shoot = SHOOTERS[strength] || shootNormal;
    shoot();
  }

  function reset() {
    if (typeof confetti === "function") {
      confetti.reset();
    }
  }

  window.__aiFireworks = { celebrate, reset };
})();
