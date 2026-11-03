/* =========================================================
   SERVICE PAGE — fills service.html from services-data.js
   Link format: service.html?s=consultancy
   ========================================================= */
(function () {
  if (typeof SGEN_SERVICES === "undefined") return;

  const params = new URLSearchParams(location.search);
  const svc =
    SGEN_SERVICES.find((x) => x.id === params.get("s")) || SGEN_SERVICES[0];
  const $ = (id) => document.getElementById(id);
  const num = String(svc.num).padStart(2, "0");

  // Banner
  document.title = `${svc.title.replace(/&amp;/g, "&")} | S-Gen Energy & Infra Pvt Ltd`;
  $("svcBannerImg").style.backgroundImage = `url("${encodeURI(svc.img)}")`;
  $("svcNum").textContent = `Service ${num}`;
  $("svcTitle").innerHTML = svc.title;
  $("svcCrumb").innerHTML = svc.title;
  $("svcTagline").textContent = svc.tagline;

  // Overview
  $("svcHeading").innerHTML = svc.title;
  $("svcIntro").innerHTML = svc.intro.map((p) => `<p>${p}</p>`).join("");

  // What we offer
  $("svcOffers").innerHTML = svc.offers
    .map(
      (o, i) => `
    <div class="offer-card reveal">
      <span class="offer-num">${String(i + 1).padStart(2, "0")}</span>
      <p>${o}</p>
    </div>`,
    )
    .join("");

  // Other services
  $("svcOthers").innerHTML = SGEN_SERVICES.filter((x) => x.id !== svc.id)
    .map(
      (x) => `
    <a class="other-card reveal" href="service.html?s=${x.id}">
      <div class="service-icon">${x.icon}</div>
      <div>
        <h3>${x.title}</h3>
        <span class="btn-link">View Service <span aria-hidden="true">→</span></span>
      </div>
    </a>`,
    )
    .join("");
})();
