document.addEventListener("DOMContentLoaded", () => {

  /* =========================================================
     BASIC ELEMENTS
     ========================================================= */
  const header      = document.getElementById("siteHeader");
  const menuBtn     = document.getElementById("menuBtn");
  const mainNav     = document.getElementById("mainNav");
  const yearEl      = document.getElementById("year");
  const backToTop   = document.getElementById("backToTop");

  const slides      = Array.from(document.querySelectorAll(".hero-slide"));
  const dotsWrap    = document.getElementById("heroPagination");
  const hero        = document.querySelector(".hero-viewport");
  const progressBar = document.getElementById("heroProgress");

  const applyModal  = document.getElementById("applyFormWrap");
  const careersForm = document.getElementById("careersForm");
  const contactForm = document.getElementById("contactForm");
  const appliedRole = document.getElementById("appliedRole");


  /* =========================================================
     FOOTER YEAR
     ========================================================= */
  if (yearEl) yearEl.textContent = new Date().getFullYear();


  /* =========================================================
     MOBILE MENU
     ========================================================= */
  const closeMenu = () => {
    mainNav?.classList.remove("open");
    menuBtn?.classList.remove("open");
    menuBtn?.setAttribute("aria-expanded", "false");
  };

  if (menuBtn && mainNav) {
    menuBtn.addEventListener("click", () => {
      const isOpen = mainNav.classList.toggle("open");
      menuBtn.classList.toggle("open", isOpen);
      menuBtn.setAttribute("aria-expanded", String(isOpen));
    });

    // Close menu after clicking a link (mobile)
    mainNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));

    // Close menu when clicking outside
    document.addEventListener("click", (event) => {
      if (!mainNav.contains(event.target) && !menuBtn.contains(event.target)) closeMenu();
    });
  }


  /* =========================================================
     SERVICES DROPDOWN (mobile: tap the arrow)
     ========================================================= */
  document.querySelectorAll(".nav-dropdown").forEach((dd) => {
    const btn = dd.querySelector(".drop-btn");
    btn?.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = dd.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(isOpen));
    });
    // after choosing an item, close the list (and remove focus so it hides on desktop)
    dd.querySelectorAll(".dropdown-menu a").forEach((link) => {
      link.addEventListener("click", () => {
        dd.classList.remove("open");
        btn?.setAttribute("aria-expanded", "false");
        link.blur();
      });
    });
  });


  /* =========================================================
     HERO SLIDER
     ========================================================= */
  if (slides.length) {
    let current = 0;
    let autoTimer = null;
    const AUTO_TIME = 6000;

    if (progressBar) progressBar.style.setProperty("--auto", `${AUTO_TIME}ms`);

    /* ---------- Letter-by-letter heading animation ---------- */
    function wrapHeroWords() {
      document.querySelectorAll(".hero-slide h1").forEach((heading) => {
        if (heading.dataset.wordsAnimated === "true") return;

        let letterIndex = 0;

        function processNode(node, parent) {
          // Text node -> split into words, then letters
          if (node.nodeType === Node.TEXT_NODE) {
            node.textContent.split(/(\s+)/).forEach((part) => {
              if (!part) return;

              if (/^\s+$/.test(part)) {
                parent.appendChild(document.createTextNode(" "));
                return;
              }

              const word = document.createElement("span");
              word.className = "hero-word-wrap";

              part.split("").forEach((letter) => {
                const letterEl = document.createElement("span");
                letterEl.className = "hero-letter";
                letterEl.textContent = letter;
                letterEl.style.setProperty("--letter-delay", `${0.2 + letterIndex * 0.03}s`);
                word.appendChild(letterEl);
                letterIndex++;
              });

              parent.appendChild(word);
            });
            return;
          }

          // <br> tag
          if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "BR") {
            parent.appendChild(document.createElement("br"));
            return;
          }

          // Other elements (span etc.)
          if (node.nodeType === Node.ELEMENT_NODE) {
            const clone = node.cloneNode(false);
            parent.appendChild(clone);
            Array.from(node.childNodes).forEach((child) => processNode(child, clone));
          }
        }

        const fragment = document.createDocumentFragment();
        Array.from(heading.childNodes).forEach((child) => processNode(child, fragment));
        heading.innerHTML = "";
        heading.appendChild(fragment);
        heading.dataset.wordsAnimated = "true";
      });
    }

    function animateHeroWords() {
      document.querySelectorAll(".hero-slide h1").forEach((h) => h.classList.remove("animate-words"));
      const activeHeading = document.querySelector(".hero-slide.active h1");
      if (!activeHeading) return;
      requestAnimationFrame(() => requestAnimationFrame(() => activeHeading.classList.add("animate-words")));
    }

    /* ---------- Progress bar ---------- */
    function restartProgress() {
      if (!progressBar) return;
      progressBar.classList.remove("run");
      void progressBar.offsetWidth; // force reflow so animation restarts
      progressBar.classList.add("run");
    }
    function pauseProgress(paused) {
      if (progressBar) progressBar.style.animationPlayState = paused ? "paused" : "running";
    }

    wrapHeroWords();

    /* ---------- Pagination dots ---------- */
    const dots = [];
    if (dotsWrap) {
      slides.forEach((_, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
        dot.addEventListener("click", () => { current = index; showSlide(current, true); });
        dots.push(dot);
        dotsWrap.appendChild(dot);
      });
    }

    /* ---------- Show slide ---------- */
    function showSlide(index, restart = false) {
      slides.forEach((slide, i) => slide.classList.toggle("active", i === index));
      dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
      animateHeroWords();
      restartProgress();
      if (restart) startAuto();
    }

    function nextSlide() { current = (current + 1) % slides.length; showSlide(current); }
    function prevSlide() { current = (current - 1 + slides.length) % slides.length; showSlide(current); }

    /* ---------- Auto slide ---------- */
    function startAuto() { stopAuto(); autoTimer = setInterval(nextSlide, AUTO_TIME); pauseProgress(false); }
    function stopAuto()  { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } }

    showSlide(current);
    startAuto();

    /* ---------- Pause on hover, go to next slide 1 sec after cursor leaves ---------- */
    let leaveTimer = null;
    if (hero && matchMedia("(hover: hover)").matches) {
      hero.addEventListener("mouseenter", () => {
        clearTimeout(leaveTimer);
        stopAuto();
        pauseProgress(true);
      });
      hero.addEventListener("mouseleave", () => {
        clearTimeout(leaveTimer);
        leaveTimer = setTimeout(() => {
          nextSlide();   // next slide 1 second after cursor leaves
          startAuto();   // then continue every 6 seconds
        }, 1000);
      });
    }

    /* ---------- Arrows ---------- */
    document.getElementById("nextSlide")?.addEventListener("click", () => { nextSlide(); startAuto(); });
    document.getElementById("prevSlide")?.addEventListener("click", () => { prevSlide(); startAuto(); });

    /* ---------- Swipe on mobile ---------- */
    let touchX = null;
    hero?.addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
    hero?.addEventListener("touchend", (e) => {
      if (touchX === null) return;
      const diff = e.changedTouches[0].clientX - touchX;
      if (Math.abs(diff) > 50) { diff < 0 ? nextSlide() : prevSlide(); startAuto(); }
      touchX = null;
    });

    /* ---------- Keyboard arrows ---------- */
    document.addEventListener("keydown", (e) => {
      if (applyModal?.classList.contains("open")) return;
      if (e.key === "ArrowRight") { nextSlide(); startAuto(); }
      if (e.key === "ArrowLeft")  { prevSlide(); startAuto(); }
    });
  }


  /* =========================================================
     HEADER SHADOW + ACTIVE NAV LINK + BACK TO TOP
     ========================================================= */
  const navLinks = Array.from(document.querySelectorAll("#mainNav a")).filter((a) => {
    const href = a.getAttribute("href") || "";
    return href.startsWith("#") && href.length > 1 && !a.classList.contains("nav-cta-mobile") && !a.closest(".dropdown-menu");
  });

  function onScroll() {
    const y = window.scrollY;

    header?.classList.toggle("scrolled", y > 10);
    backToTop?.classList.toggle("show", y > 600);

    const probe = y + 160;
    let activeHref = "#home";
    let best = -1;

    navLinks.forEach((a) => {
      const section = document.querySelector(a.getAttribute("href"));
      if (!section) return;
      const top = section.getBoundingClientRect().top + window.scrollY;
      if (top <= probe && top > best) { best = top; activeHref = a.getAttribute("href"); }
    });

    navLinks.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === activeHref));
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();


  /* =========================================================
     SCROLL REVEAL ANIMATION
     ========================================================= */
  const revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    // Small stagger for cards placed side by side
    revealEls.forEach((el) => {
      const siblings = Array.from(el.parentElement.children).filter((c) => c.classList.contains("reveal"));
      const i = siblings.indexOf(el);
      if (siblings.length > 1) el.style.transitionDelay = `${Math.min(i, 5) * 0.08}s`;
      observer.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add("in-view"));
  }


  /* =========================================================
     CARD CLICK — ZOOM IN & OUT ANIMATION
     ========================================================= */
  document.querySelectorAll(".vmv-card, .service-card, .product-card, .policy-card, .job-card")
    .forEach((card) => {
      card.addEventListener("click", (event) => {
        // Don't animate when a button or link inside the card is clicked
        if (event.target.closest("a, button")) return;

        card.classList.remove("card-zoom");
        void card.offsetWidth; // restart animation on every click
        card.classList.add("card-zoom");
      });
      card.addEventListener("animationend", () => card.classList.remove("card-zoom"));
    });



  /* =========================================================
     MISSION VIEW MORE / VIEW LESS
     ========================================================= */
  const toggleBtn   = document.querySelector(".btn-view-toggle");
  const missionFull = document.querySelector(".mission-full");

  if (toggleBtn && missionFull) {
    toggleBtn.addEventListener("click", () => {
      const isOpen = missionFull.classList.toggle("open");
      toggleBtn.innerHTML = isOpen
        ? 'View Less <span aria-hidden="true">↑</span>'
        : 'View More <span aria-hidden="true">→</span>';
      toggleBtn.setAttribute("aria-expanded", String(isOpen));
    });
  }


  /* =========================================================
     CLIENT LOGOS — duplicate list for seamless scrolling
     ========================================================= */
  const clientsList = document.getElementById("clientsList");
  if (clientsList) {
    const original = Array.from(clientsList.children);
    // Repeat logos until the strip is wide enough, then double it for the loop
    let copies = Math.max(1, Math.ceil(8 / original.length));
    for (let c = 1; c < copies; c++) {
      original.forEach((li) => clientsList.appendChild(li.cloneNode(true)));
    }
    Array.from(clientsList.children).forEach((li) => {
      const clone = li.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clientsList.appendChild(clone);
    });
  }


  /* =========================================================
     CAREERS — APPLY MODAL
     ========================================================= */
  const openApply = (role) => {
    if (appliedRole) appliedRole.textContent = role;
    applyModal?.classList.add("open");
    applyModal?.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
    setTimeout(() => applyModal?.querySelector("input")?.focus(), 200);
  };

  const closeApply = () => {
    applyModal?.classList.remove("open");
    applyModal?.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  };

  document.querySelectorAll(".apply-btn").forEach((button) => {
    button.addEventListener("click", () => openApply(button.dataset.role || "Position"));
  });

  applyModal?.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeApply));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && applyModal?.classList.contains("open")) closeApply();
  });

  if (careersForm) {
    careersForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const applyMsg = document.getElementById("applyMsg");
      if (applyMsg) applyMsg.textContent = "✓ Application submitted successfully. Our team will review your CV shortly.";
      careersForm.reset();
      setTimeout(() => {
        closeApply();
        if (applyMsg) applyMsg.textContent = "";
      }, 2000);
    });
  }


  /* =========================================================
     CONTACT FORM
     ========================================================= */
  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault(); // remove this line once your Formspree ID is added
      const submitButton = contactForm.querySelector("button[type='submit']");
      if (!submitButton) return;

      const original = submitButton.textContent;
      submitButton.textContent = "✓ Message Sent";
      submitButton.disabled = true;

      setTimeout(() => {
        submitButton.textContent = original;
        submitButton.disabled = false;
        contactForm.reset();
      }, 2000);
    });
  }

});