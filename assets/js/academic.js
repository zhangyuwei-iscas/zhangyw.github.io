/* Academic homepage interactions: footer year, scroll reveal, nav scroll-spy.
   Adapted from https://github.com/Laip11/academic-homepage-template */

(function () {
  "use strict";

  // Set current year in footer
  var yearSpan = document.getElementById("current-year");
  if (yearSpan) yearSpan.textContent = new Date().getFullYear();

  // Scroll reveal for staggered animation
  function initScrollReveal() {
    var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var revealSelector = [
      "#main-content .section-title",
      "#main-content .subsection-title",
      "#main-content .lead",
      "#main-content .collab-callout",
      "#main-content .recruit-callout",
      "#main-content .publications-toolbar",
      "#main-content .paper-card",
      "#main-content .exp-card",
      "#main-content .service-tile",
      "#main-content .modern-list li"
    ].join(", ");

    var markVisible = function (element) {
      element.classList.add("reveal", "is-visible");
    };

    var prepareElement = function (element, staggerIndex) {
      if (element.classList.contains("reveal")) return;
      element.classList.add("reveal");
      if (staggerIndex !== undefined) {
        element.style.setProperty("--reveal-delay", Math.min(staggerIndex, 5) * 50 + "ms");
      }
    };

    var elements = Array.prototype.slice.call(document.querySelectorAll(revealSelector));
    if (elements.length === 0) return;

    if (reducedMotion) {
      elements.forEach(markVisible);
      return;
    }

    var staggerParents = Array.prototype.slice.call(
      document.querySelectorAll("#main-content .modern-list")
    );

    staggerParents.forEach(function (parent) {
      var children = Array.prototype.slice.call(parent.querySelectorAll(":scope > li"));
      children.forEach(function (child, index) {
        prepareElement(child, index);
      });
    });

    elements.forEach(function (element) {
      prepareElement(element);
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -20px 0px"
      }
    );

    elements.forEach(function (element) {
      if (!element.classList.contains("is-visible")) {
        observer.observe(element);
      }
    });
  }

  // Active navigation highlighting on scroll (bidirectional scroll-spy)
  function initNavObserver() {
    var navLinks = Array.prototype.slice.call(
      document.querySelectorAll(".site-nav .nav-links a[href^='#']")
    );
    var sectionMap = new Map();
    navLinks.forEach(function (link) {
      var href = link.getAttribute("href");
      if (!sectionMap.has(href)) sectionMap.set(href, []);
      sectionMap.get(href).push(link);
    });

    var sectionElements = Array.from(sectionMap.keys())
      .map(function (href) {
        return document.querySelector(href);
      })
      .filter(Boolean);

    if (sectionElements.length === 0) return;

    sectionElements.sort(function (a, b) {
      return (
        a.getBoundingClientRect().top +
        window.pageYOffset -
        (b.getBoundingClientRect().top + window.pageYOffset)
      );
    });

    var isClickScrolling = false;
    var scrollEndTimer = null;
    var currentActiveId = null;

    var setActiveSection = function (id) {
      if (!id || id === currentActiveId) return;
      currentActiveId = id;
      navLinks.forEach(function (link) {
        link.classList.remove("active");
      });
      var activeLinks = sectionMap.get("#" + id) || [];
      activeLinks.forEach(function (link) {
        link.classList.add("active");
        link.scrollIntoView({ behavior: "smooth", inline: "nearest", block: "nearest" });
      });
    };

    navLinks.forEach(function (link) {
      link.addEventListener("click", function (e) {
        var href = link.getAttribute("href");
        if (!href || !href.startsWith("#")) return;
        var target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        isClickScrolling = true;
        setActiveSection(href.slice(1));
        history.pushState(null, "", href);

        var nav = document.querySelector(".site-nav");
        var navBottom = nav ? nav.getBoundingClientRect().bottom : 58;
        var targetRect = target.getBoundingClientRect();
        var targetY = window.pageYOffset + targetRect.top - (navBottom + 16);

        window.scrollTo({
          top: Math.max(0, targetY),
          behavior: "smooth"
        });
      });
    });

    var brand = document.querySelector(".site-nav .nav-brand");
    if (brand) {
      brand.addEventListener("click", function (e) {
        e.preventDefault();
        history.pushState(null, "", " ");
        window.scrollTo({ top: 0, behavior: "smooth" });
        navLinks.forEach(function (link) {
          link.classList.remove("active");
        });
        currentActiveId = null;
      });
    }

    var endClickScroll = function () {
      if (!isClickScrolling) return;
      isClickScrolling = false;
      updateActiveSection();
    };

    if ("onscrollend" in window) {
      window.addEventListener("scrollend", endClickScroll, { passive: true });
    }
    window.addEventListener("wheel", function () { isClickScrolling = false; }, { passive: true });
    window.addEventListener("touchmove", function () { isClickScrolling = false; }, { passive: true });

    var updateActiveSection = function () {
      if (isClickScrolling) return;

      var nav = document.querySelector(".site-nav");
      var navBottom = nav ? nav.getBoundingClientRect().bottom : 58;
      var vh = window.innerHeight;
      var maxScroll = Math.max(0, document.documentElement.scrollHeight - vh);
      var remainingScroll = Math.max(0, maxScroll - window.pageYOffset);

      if (remainingScroll < 90) {
        var lastEl = sectionElements[sectionElements.length - 1];
        if (lastEl) setActiveSection(lastEl.id);
        return;
      }

      var baseProbe = navBottom + 50;
      var probeY = baseProbe;
      var bottomZone = Math.max(340, vh * 0.4);
      if (remainingScroll < bottomZone) {
        var t = 1 - remainingScroll / bottomZone;
        probeY = baseProbe + t * (vh * 0.75 - baseProbe);
      }

      var activeId = null;
      for (var i = 0; i < sectionElements.length; i++) {
        var rect = sectionElements[i].getBoundingClientRect();
        if (rect.top <= probeY) {
          activeId = sectionElements[i].id;
        } else {
          break;
        }
      }

      if (activeId) {
        setActiveSection(activeId);
      } else {
        setActiveSection(sectionElements[0].id);
      }
    };

    var ticking = false;
    window.addEventListener("scroll", function () {
      clearTimeout(scrollEndTimer);
      scrollEndTimer = setTimeout(endClickScroll, 160);

      if (!ticking) {
        window.requestAnimationFrame(function () {
          updateActiveSection();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    updateActiveSection();
    window.addEventListener("resize", updateActiveSection);
  }

  function init() {
    initScrollReveal();
    initNavObserver();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
