/* =========================================================
   HERO JS — CLEAN + FIXED + PERFECT WORD SPACING
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  const slides = Array.from(document.querySelectorAll(".hero-slide"));
  if (!slides.length) return;

  let current = 0;
  let autoTimer = null;
  const AUTO_TIME = 5000;

  /* =========================================================
     PAGINATION DOTS (optional)
     ========================================================= */
  const dotsWrap = document.getElementById("heroPagination");
  const dots = [];
  if (dotsWrap) {
    dotsWrap.innerHTML = "";
    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.className = "dot";
      dot.type = "button";
      dot.addEventListener("click", () => goTo(i, true));
      dotsWrap.appendChild(dot);
      dots.push(dot);
    });
  }

  /* =========================================================
     FIXED H1 TEXT SPLITTING  — CLEAN & CORRECT
     ========================================================= */
  function wrapHeadingChars() {
    slides.forEach(slide => {
      const h1 = slide.querySelector("h1");
      if (!h1 || h1.dataset.wrapped === "true") return;

      const original = h1.innerHTML.trim();
      const temp = document.createElement("div");
      temp.innerHTML = original;

      let finalHTML = "";

      temp.childNodes.forEach(node => {

        /* ---------- TEXT NODE ---------- */
        if (node.nodeType === Node.TEXT_NODE) {
          for (let ch of node.textContent) {
            if (ch === " ") {
              finalHTML += `<span class="char space"></span>`;
            } else {
              finalHTML += `<span class="char">${ch}</span>`;
            }
          }
        }

        /* ---------- ELEMENT NODE (gradient-text etc.) ---------- */
        else if (node.nodeType === Node.ELEMENT_NODE) {
          let inner = "";
          for (let ch of node.textContent) {
            inner += ch === " "
              ? `<span class="char space"></span>`
              : `<span class="char">${ch}</span>`;
          }
          finalHTML += `<span class="${node.className}">${inner}</span>`;
        }
      });

      h1.innerHTML = finalHTML;
      h1.dataset.wrapped = "true";
    });
  }

  /* =========================================================
     LETTER ANIMATION (correct + smooth)
     ========================================================= */
  function animateSlideHeading(index) {

    slides.forEach(s => {
      const all = s.querySelectorAll(".char");
      all.forEach(ch => {
        ch.classList.remove("in");
        ch.style.transitionDelay = "";
      });
    });

    const slide = slides[index];
    if (!slide) return;

    const chars = slide.querySelectorAll(".char");
    let delay = 0;

    chars.forEach(ch => {
      ch.style.transitionDelay = `${delay}ms`;
      delay += ch.classList.contains("space") ? 5 : 22;
    });

    requestAnimationFrame(() => {
      chars.forEach(ch => ch.classList.add("in"));
    });
  }

  /* Initialize split */
  wrapHeadingChars();

  /* =========================================================
     SLIDESHOW FUNCTIONS
     ========================================================= */
  function show(i) {
    slides.forEach((s, idx) => s.classList.toggle("active", idx === i));
    dots.forEach((d, idx) => d.classList.toggle("active", idx === i));
    animateSlideHeading(i);
  }

  function next() {
    current = (current + 1) % slides.length;
    show(current);
  }

  function prev() {
    current = (current - 1 + slides.length) % slides.length;
    show(current);
  }

  function goTo(i, restart = false) {
    current = (i + slides.length) % slides.length;
    show(current);
    if (restart) restartAuto();
  }

  function startAuto() {
    stopAuto();
    autoTimer = setInterval(next, AUTO_TIME);
  }

  function stopAuto() {
    clearInterval(autoTimer);
    autoTimer = null;
  }

  function restartAuto() {
    startAuto();
  }

  /* INITIAL LOAD */
  show(current);
  if (slides.length > 1) startAuto();

  /* Pause on hover (desktop only) */
  const hero = document.querySelector(".hero-viewport");
  if (hero && matchMedia("(hover:hover)").matches) {
    hero.addEventListener("mouseenter", stopAuto);
    hero.addEventListener("mouseleave", startAuto);
  }

  /* Arrow controls */
  document.getElementById("nextSlide")?.addEventListener("click", () => {
    next(); restartAuto();
  });
  document.getElementById("prevSlide")?.addEventListener("click", () => {
    prev(); restartAuto();
  });

  
  /* =========================================================
     MISSION CARD TOGGLE
     ========================================================= */
  const missionCard = document.querySelector(".mission-card");

  if (missionCard) {
    const toggleBtn = missionCard.querySelector(".btn-view-toggle");
    const fullText = missionCard.querySelector(".mission-full");

    if (toggleBtn && fullText) {
      const updateBtn = () => {
        const open = fullText.classList.contains("open");
        toggleBtn.textContent = open ? "View Less" : "View More";
        toggleBtn.classList.toggle("is-open", open);
      };

      updateBtn();

      toggleBtn.addEventListener("click", e => {
        e.preventDefault();
        fullText.classList.toggle("open");
        updateBtn();
      });
    }
  }

});
