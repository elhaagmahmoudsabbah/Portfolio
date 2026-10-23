(() => {
  "use strict";

  const root = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");
  const navbar = document.getElementById("siteNavbar");
  const backToTop = document.getElementById("backToTop");
  const mainNav = document.getElementById("mainNav");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Theme: persist the visitor's preference.
  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (themeIcon) {
      themeIcon.className = theme === "dark" ? "bi bi-sun-fill" : "bi bi-moon-stars-fill";
    }
    if (themeToggle) {
      themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
      themeToggle.setAttribute("title", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    }
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.setAttribute("content", theme === "dark" ? "#092328" : "#F8F9FA");
  }

  let initialTheme = root.getAttribute("data-theme") || "dark";
  try {
    const savedTheme = localStorage.getItem("mahmoud-theme");
    if (savedTheme === "dark" || savedTheme === "light") initialTheme = savedTheme;
  } catch (error) { /* localStorage may be unavailable in private contexts */ }
  applyTheme(initialTheme);

  themeToggle?.addEventListener("click", () => {
    const nextTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    try { localStorage.setItem("mahmoud-theme", nextTheme); } catch (error) {}
  });

  // Navbar and back-to-top scroll states.
  function updateScrollUI() {
    const scrolled = window.scrollY > 25;
    navbar?.classList.toggle("scrolled", scrolled);
    backToTop?.classList.toggle("visible", window.scrollY > 500);
  }
  updateScrollUI();
  window.addEventListener("scroll", updateScrollUI, { passive: true });

  backToTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? "auto" : "smooth" });
  });

  // Close the mobile navigation after choosing a section.
  document.querySelectorAll("#mainNav .nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth < 992 && mainNav?.classList.contains("show") && window.bootstrap) {
        bootstrap.Collapse.getOrCreateInstance(mainNav).hide();
      }
    });
  });

  // Reveal elements only when they enter the viewport.
  const revealElements = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    revealElements.forEach((element) => revealObserver.observe(element));
  } else {
    revealElements.forEach((element) => element.classList.add("is-visible"));
  }

  // Highlight the navigation item for the section currently in view.
  const navLinks = [...document.querySelectorAll('#mainNav .nav-link[href^="#"]')];
  const observedSections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          const isActive = link.getAttribute("href") === `#${entry.target.id}`;
          link.classList.toggle("active", isActive);
          if (isActive) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-30% 0px -55% 0px", threshold: 0 });
    observedSections.forEach((section) => sectionObserver.observe(section));
  }

  // Animate skill bars once, when their panel becomes visible.
  const skillMeters = document.querySelectorAll(".skill-meter");
  const fillSkill = (meter) => {
    const bar = meter.querySelector(".progress-bar");
    const value = Math.min(100, Math.max(0, Number(meter.dataset.progress) || 0));
    if (bar) bar.style.width = `${value}%`;
  };
  if ("IntersectionObserver" in window && !prefersReducedMotion) {
    const skillObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          fillSkill(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });
    skillMeters.forEach((meter) => skillObserver.observe(meter));
  } else {
    skillMeters.forEach(fillSkill);
  }

  // Simple project filters.
  const filterButtons = document.querySelectorAll(".filter-btn");
  const projectItems = document.querySelectorAll(".project-item");
  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter || "all";
      filterButtons.forEach((item) => {
        const active = item === button;
        item.classList.toggle("active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      projectItems.forEach((item) => {
        const matches = filter === "all" || item.dataset.category === filter;
        item.classList.toggle("is-hidden", !matches);
        if (matches) item.classList.add("is-visible");
      });
    });
    button.setAttribute("aria-pressed", String(button.classList.contains("active")));
  });

  // Contact form: validate locally, then prepare an email draft.
  const contactForm = document.getElementById("contactForm");
  const formStatus = document.getElementById("formStatus");
  contactForm?.querySelectorAll("input, textarea").forEach((field) => {
    field.addEventListener("input", () => {
      field.classList.remove("is-invalid");
      if (formStatus) formStatus.textContent = "";
    });
  });

  contactForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (formStatus) formStatus.textContent = "";

    const name = document.getElementById("contactName");
    const email = document.getElementById("contactEmail");
    const subject = document.getElementById("contactSubject");
    const message = document.getElementById("contactMessage");
    const fields = [name, email, subject, message];
    let firstInvalid = null;

    fields.forEach((field) => {
      const invalid = !field.checkValidity();
      field.classList.toggle("is-invalid", invalid);
      if (invalid && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      if (formStatus) formStatus.textContent = "Please check the highlighted fields.";
      return;
    }

    const mailSubject = encodeURIComponent(subject.value.trim());
    const mailBody = encodeURIComponent(
      `Hi Mahmoud,\n\n${message.value.trim()}\n\nFrom: ${name.value.trim()}\nReply email: ${email.value.trim()}`
    );
    if (formStatus) formStatus.textContent = "Opening your email app with the message ready to send...";
    window.location.href = `mailto:elhaagmahmoudsabbah@gmail.com?subject=${mailSubject}&body=${mailBody}`;
  });

  // Dynamic footer year.
  const yearElement = document.getElementById("copyrightYear");
  if (yearElement) yearElement.textContent = new Date().getFullYear();
})();
