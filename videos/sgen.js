document.addEventListener("DOMContentLoaded", () => {
  /* =========================================================
     BASIC ELEMENTS
     ========================================================= */
  const header = document.getElementById("siteHeader");
  const menuBtn = document.getElementById("menuBtn");
  const mainNav = document.getElementById("mainNav");
  const yearEl = document.getElementById("year");
  const backToTop = document.getElementById("backToTop");

  const slides = Array.from(document.querySelectorAll(".hero-slide"));
  const dotsWrap = document.getElementById("heroPagination");
  const hero = document.querySelector(".hero-viewport");
  const progressBar = document.getElementById("heroProgress");

  const applyModal = document.getElementById("applyFormWrap");
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
    mainNav
      .querySelectorAll("a")
      .forEach((link) => link.addEventListener("click", closeMenu));

    // Close menu when clicking outside
    document.addEventListener("click", (event) => {
      if (!mainNav.contains(event.target) && !menuBtn.contains(event.target))
        closeMenu();
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
    let isHovering = false; // true while the mouse is on the hero banner
    let leaveTimer = null;
    let mouseX = -1; // last mouse position on the page
    let mouseY = -1;
    let wasInside = false;
    let lastTouch = 0; // phones: ignore the fake mouse events that come after a tap
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
                letterEl.style.setProperty(
                  "--letter-delay",
                  `${0.2 + letterIndex * 0.03}s`,
                );
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
            Array.from(node.childNodes).forEach((child) =>
              processNode(child, clone),
            );
          }
        }

        const fragment = document.createDocumentFragment();
        Array.from(heading.childNodes).forEach((child) =>
          processNode(child, fragment),
        );
        heading.innerHTML = "";
        heading.appendChild(fragment);
        heading.dataset.wordsAnimated = "true";
      });
    }

    function animateHeroWords() {
      document
        .querySelectorAll(".hero-slide h1")
        .forEach((h) => h.classList.remove("animate-words"));
      const activeHeading = document.querySelector(".hero-slide.active h1");
      if (!activeHeading) return;
      requestAnimationFrame(() =>
        requestAnimationFrame(() =>
          activeHeading.classList.add("animate-words"),
        ),
      );
    }

    /* ---------- Progress bar ---------- */
    function restartProgress() {
      if (!progressBar) return;
      progressBar.style.setProperty("--auto", `${slideTime()}ms`);
      progressBar.classList.remove("run");
      void progressBar.offsetWidth; // force reflow so animation restarts
      progressBar.classList.add("run");
    }
    function pauseProgress(paused) {
      if (progressBar)
        progressBar.style.animationPlayState = paused ? "paused" : "running";
    }

    wrapHeroWords();

    /* ---------- Pagination dots ---------- */
    const dots = [];
    if (dotsWrap) {
      slides.forEach((_, index) => {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
        dot.addEventListener("click", () => {
          current = index;
          showSlide(current, true);
        });
        dots.push(dot);
        dotsWrap.appendChild(dot);
      });
    }

    /* ---------- Hero video (slide 1): wide video for laptop, tall for mobile ---------- */
    const heroVideo = document.getElementById("heroVideo");
    if (heroVideo) {
      const isTall = window.matchMedia(
        "(max-width: 768px) and (orientation: portrait)",
      ).matches;
      heroVideo.src = isTall ? heroVideo.dataset.tall : heroVideo.dataset.wide;
    }
    // play the video only while its slide is showing, from the start each time
    function syncVideo(index) {
      if (!heroVideo) return;
      if (slides[index].contains(heroVideo)) {
        heroVideo.currentTime = 0;
        heroVideo.play().catch(() => {});
      } else {
        heroVideo.pause();
      }
    }

    // each slide can have its own time: data-duration="18000" (ms). Others use AUTO_TIME.
    function slideTime() {
      return Number(slides[current].dataset.duration) || AUTO_TIME;
    }

    /* ---------- Show slide ---------- */
    function showSlide(index, restart = false) {
      slides.forEach((slide, i) =>
        slide.classList.toggle("active", i === index),
      );
      dots.forEach((dot, i) => dot.classList.toggle("active", i === index));
      animateHeroWords();
      syncVideo(index);
      restartProgress();
      if (isHovering) {
        stopAuto();
        pauseProgress(true);
        return;
      }
      if (restart) startAuto();
    }

    function nextSlide() {
      current = (current + 1) % slides.length;
      showSlide(current);
    }
    function prevSlide() {
      current = (current - 1 + slides.length) % slides.length;
      showSlide(current);
    }

    /* ---------- Auto slide ---------- */
    // true when the mouse is on the hero banner (checked two ways, so it never misses)
    function mouseOnHero() {
      return isHovering || pointInHero();
    }

    function startAuto() {
      stopAuto();
      if (mouseOnHero()) {
        pauseProgress(true); // mouse is on the banner: stay on this slide
        return;
      }
      autoTimer = setTimeout(() => {
        if (mouseOnHero()) {
          pauseProgress(true); // mouse came onto the banner: don't move
          return;
        }
        nextSlide();
        startAuto();
      }, slideTime());
      pauseProgress(false);
    }
    function stopAuto() {
      if (autoTimer) {
        clearTimeout(autoTimer);
        autoTimer = null;
      }
    }

    showSlide(current);
    startAuto();

    /* ---------- Pause on hover, go to next slide 1 sec after cursor leaves ---------- */
    // We watch where the mouse is on the whole page and check if it is inside the banner.
    // This works the same in Firefox, Chrome and Edge.

    function pointInHero() {
      if (!hero || mouseX < 0) return false;
      const r = hero.getBoundingClientRect();
      return mouseX >= r.left && mouseX <= r.right && mouseY >= r.top && mouseY <= r.bottom;
    }

    function checkMouse() {
      const inside = pointInHero();
      if (inside && !wasInside) {
        // mouse came onto the banner: stop
        isHovering = true;
        clearTimeout(leaveTimer);
        stopAuto();
        pauseProgress(true);
      } else if (!inside && wasInside) {
        // mouse left the banner: next slide after 1 second, then continue
        isHovering = false;
        clearTimeout(leaveTimer);
        leaveTimer = setTimeout(() => {
          nextSlide();
          startAuto();
        }, 1000);
      }
      wasInside = inside;
    }

    document.addEventListener("touchstart", () => { lastTouch = Date.now(); }, { passive: true });
    document.addEventListener("mousemove", (e) => {
      if (Date.now() - lastTouch < 1000) return;
      mouseX = e.clientX;
      mouseY = e.clientY;
      checkMouse();
    });
    // scrolling moves the banner under a still mouse, so check again
    window.addEventListener("scroll", checkMouse, { passive: true });
    // mouse went out of the browser window
    document.documentElement.addEventListener("mouseleave", () => {
      mouseX = -1;
      mouseY = -1;
      checkMouse();
    });

    /* ---------- Swipe on mobile ---------- */
    let touchX = null;
    hero?.addEventListener(
      "touchstart",
      (e) => {
        touchX = e.touches[0].clientX;
      },
      { passive: true },
    );
    hero?.addEventListener("touchend", (e) => {
      if (touchX === null) return;
      const diff = e.changedTouches[0].clientX - touchX;
      if (Math.abs(diff) > 50) {
        diff < 0 ? nextSlide() : prevSlide();
        startAuto();
      }
      touchX = null;
    });

    /* ---------- Keyboard arrows ---------- */
    document.addEventListener("keydown", (e) => {
      if (applyModal?.classList.contains("open")) return;
      if (document.getElementById("lightbox")?.classList.contains("open"))
        return;
      if (e.key === "ArrowRight") {
        nextSlide();
        startAuto();
      }
      if (e.key === "ArrowLeft") {
        prevSlide();
        startAuto();
      }
    });
  }

  /* =========================================================
     HEADER SHADOW + ACTIVE NAV LINK + BACK TO TOP
     ========================================================= */
  const navLinks = Array.from(document.querySelectorAll("#mainNav a")).filter(
    (a) => {
      const href = a.getAttribute("href") || "";
      return (
        href.startsWith("#") &&
        href.length > 1 &&
        !a.classList.contains("nav-cta-mobile") &&
        !a.closest(".dropdown-menu")
      );
    },
  );

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
      if (top <= probe && top > best) {
        best = top;
        activeHref = a.getAttribute("href");
      }
    });

    // Our Projects is part of Services, so highlight "Services" there
    const projects = document.getElementById("projects");
    if (projects) {
      const pTop = projects.getBoundingClientRect().top + window.scrollY;
      if (pTop <= probe && pTop > best) activeHref = "#services";
    }

    navLinks.forEach((a) =>
      a.classList.toggle("active", a.getAttribute("href") === activeHref),
    );
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* =========================================================
     SCROLL REVEAL ANIMATION
     ========================================================= */
  const revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    // Small stagger for cards placed side by side
    revealEls.forEach((el) => {
      const siblings = Array.from(el.parentElement.children).filter((c) =>
        c.classList.contains("reveal"),
      );
      const i = siblings.indexOf(el);
      if (siblings.length > 1)
        el.style.transitionDelay = `${Math.min(i, 5) * 0.08}s`;
      observer.observe(el);
    });
  } else {
    revealEls.forEach((el) => el.classList.add("in-view"));
  }

  /* =========================================================
     CARD CLICK — ZOOM IN & OUT ANIMATION
     ========================================================= */
  document
    .querySelectorAll(
      ".vmv-card, .service-card, .product-card, .policy-card, .job-card, .leader-card",
    )
    .forEach((card) => {
      card.addEventListener("click", (event) => {
        // Don't animate when a button or link inside the card is clicked
        if (event.target.closest("a, button")) return;

        card.classList.remove("card-zoom");
        void card.offsetWidth; // restart animation on every click
        card.classList.add("card-zoom");
      });
      card.addEventListener("animationend", () =>
        card.classList.remove("card-zoom"),
      );
    });

  /* =========================================================
     MISSION VIEW MORE / VIEW LESS
     ========================================================= */
  const toggleBtn = document.querySelector(".btn-view-toggle");
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
     OUR PROJECTS — LIGHTBOX (click a photo to see it big)
     ========================================================= */
  const lightbox = document.getElementById("lightbox");
  const lbImg = document.getElementById("lbImg");
  const lbCaption = document.getElementById("lbCaption");
  const projectItems = Array.from(document.querySelectorAll(".project-item"));
  let lbIndex = 0;

  function showPhoto(index) {
    lbIndex = (index + projectItems.length) % projectItems.length; // loop around
    const item = projectItems[lbIndex];
    lbImg.src = item.getAttribute("href");
    lbImg.alt = item.dataset.caption || "";
    lbCaption.textContent = item.dataset.caption || "";
  }

  function openLightbox(index) {
    showPhoto(index);
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  }

  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  }

  if (lightbox && projectItems.length) {
    projectItems.forEach((item, i) => {
      item.addEventListener("click", (event) => {
        event.preventDefault(); // stay on the page, don't open the image file
        openLightbox(i);
      });
    });

    lightbox
      .querySelector(".lb-close")
      .addEventListener("click", closeLightbox);
    lightbox
      .querySelector(".lb-prev")
      .addEventListener("click", () => showPhoto(lbIndex - 1));
    lightbox
      .querySelector(".lb-next")
      .addEventListener("click", () => showPhoto(lbIndex + 1));

    // click on the dark background closes it
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });

    // keyboard: Esc closes, arrows change photo
    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("open")) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") showPhoto(lbIndex + 1);
      if (e.key === "ArrowLeft") showPhoto(lbIndex - 1);
    });

    // swipe on phones
    let lbTouchX = null;
    lightbox.addEventListener(
      "touchstart",
      (e) => {
        lbTouchX = e.touches[0].clientX;
      },
      { passive: true },
    );
    lightbox.addEventListener("touchend", (e) => {
      if (lbTouchX === null) return;
      const diff = e.changedTouches[0].clientX - lbTouchX;
      if (Math.abs(diff) > 50) showPhoto(diff < 0 ? lbIndex + 1 : lbIndex - 1);
      lbTouchX = null;
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
    button.addEventListener("click", () =>
      openApply(button.dataset.role || "Position"),
    );
  });

  applyModal
    ?.querySelectorAll("[data-close]")
    .forEach((el) => el.addEventListener("click", closeApply));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && applyModal?.classList.contains("open"))
      closeApply();
  });

  if (careersForm) {
    careersForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const applyMsg = document.getElementById("applyMsg");
      if (applyMsg)
        applyMsg.textContent =
          "✓ Application submitted successfully. Our team will review your CV shortly.";
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