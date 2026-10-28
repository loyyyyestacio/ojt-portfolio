/* ==========================================================
   Portfolio of John Carlo B. Estacio: interactivity
   ========================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Theme toggle ---------- */
  var themeBtn = document.getElementById("theme-toggle");

  function currentTheme() {
    var set = root.getAttribute("data-theme");
    if (set) return set;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function syncThemeButton() {
    var dark = currentTheme() === "dark";
    themeBtn.setAttribute("aria-label", dark ? "Switch to light theme" : "Switch to dark theme");
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#0E1A22" : "#12232E");
  }

  themeBtn.addEventListener("click", function () {
    var next = currentTheme() === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    syncThemeButton();
  });
  syncThemeButton();

  /* ---------- Mobile navigation ---------- */
  var navToggle = document.getElementById("nav-toggle");
  var nav = document.getElementById("site-nav");

  function setNav(open) {
    nav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  navToggle.addEventListener("click", function () {
    setNav(navToggle.getAttribute("aria-expanded") !== "true");
  });
  nav.addEventListener("click", function (e) {
    if (e.target.closest("a")) setNav(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") setNav(false);
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 760) setNav(false);
  });

  /* ---------- Highlight the nav link of the section in view ---------- */
  var links = Array.prototype.slice.call(document.querySelectorAll(".nav a"));
  var sections = links
    .map(function (a) { return document.querySelector(a.getAttribute("href")); })
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          var active = a.getAttribute("href") === "#" + entry.target.id;
          a.classList.toggle("is-active", active);
          if (active) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Back to top button ---------- */
  var fab = document.getElementById("fab-top");
  var ticking = false;

  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(function () {
      fab.hidden = window.scrollY < 700;
      ticking = false;
    });
  }, { passive: true });

  fab.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* ---------- Missing image placeholders ---------- */
  document.querySelectorAll("img[data-fallback]").forEach(function (img) {
    var holder = img.closest("figure");
    function markMissing() { if (holder) holder.classList.add("img-missing"); }
    if (img.complete && img.naturalWidth === 0) markMissing();
    img.addEventListener("error", markMissing);
  });

  /* ---------- Exhaust fan preview ---------- */
  var simToggle = document.getElementById("sim-toggle");
  var simPanel = document.getElementById("sim-panel");
  var tempInput = document.getElementById("temp");
  var tempOut = document.getElementById("temp-out");
  var speedOut = document.getElementById("speed-out");
  var speedBar = document.getElementById("speed-bar");
  var statusEl = document.getElementById("sim-status");
  var blades = document.getElementById("fan-blades");

  // Illustrative thresholds: off below 26 °C, ramps from 30% to 100% at 40 °C
  var OFF_BELOW = 26;
  var FULL_AT = 40;

  function targetSpeed(t) {
    if (t < OFF_BELOW) return 0;
    if (t >= FULL_AT) return 100;
    return Math.round(30 + ((t - OFF_BELOW) / (FULL_AT - OFF_BELOW)) * 70);
  }

  var target = 0;
  var current = 0;
  var angle = 0;
  var last = 0;
  var running = false;

  function describe(speed, t) {
    if (speed === 0) return "Fan off. The room is comfortable.";
    if (speed < 50) return "Fan on low. The room is warming up.";
    if (speed < 85) return "Fan on medium. Pulling warm air out.";
    return "Fan at full speed. " + t + " °C is hot.";
  }

  function updateReadouts() {
    var t = Number(tempInput.value);
    target = targetSpeed(t);
    tempOut.textContent = t + " °C";
    speedOut.textContent = target + "%";
    speedBar.style.width = target + "%";
    statusEl.textContent = describe(target, t);
    if (!reduceMotion) startLoop();
  }

  function frame(now) {
    var dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    // Ease toward the target so the fan spins up and coasts down like a real motor
    current += (target - current) * Math.min(1, dt * 2.2);
    if (Math.abs(target - current) < 0.3) current = target;

    angle = (angle + (current / 100) * 1080 * dt) % 360;
    blades.setAttribute("transform", "rotate(" + angle.toFixed(1) + " 100 100)");

    if (current === 0 && target === 0) { running = false; return; }
    window.requestAnimationFrame(frame);
  }

  function startLoop() {
    if (running) return;
    running = true;
    last = performance.now();
    window.requestAnimationFrame(frame);
  }

  if (simToggle && simPanel && tempInput) {
    simToggle.addEventListener("click", function () {
      var open = !simPanel.classList.contains("is-open");
      simPanel.classList.toggle("is-open", open);
      simToggle.setAttribute("aria-expanded", String(open));
      simToggle.textContent = open ? "Hide preview" : "Live demo / preview";
      if (open) simPanel.removeAttribute("inert");
      else simPanel.setAttribute("inert", "");
      if (open) {
        updateReadouts();
        setTimeout(function () {
          simPanel.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
        }, 200);
      }
    });

    tempInput.addEventListener("input", updateReadouts);
    updateReadouts();
  }
})();
