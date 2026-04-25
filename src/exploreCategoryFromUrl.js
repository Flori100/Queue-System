/**
 * Reads ?category=<slug> on Explore and shows matching listings only.
 * Slugs map to the same labels used in data-category across the page.
 */

const SLUG_TO_CANONICAL = {
  barber: "Barbershop",
  barbershop: "Barbershop",
  "hair-salon": "HairSalon",
  hairsalon: "HairSalon",
  hair: "HairSalon",
  spa: "Spa",
  nails: "Nails",
  beauty: "Nails",
  fitness: "Fitness",
  gym: "Fitness",
  dentist: "Dentist",
  dental: "Dentist",
  dermatology: "Dermatology",
  derm: "Dermatology",
  taxi: "Taxi",
};

function slugToCanonical(slug) {
  if (!slug) {
    return "";
  }
  return SLUG_TO_CANONICAL[String(slug).toLowerCase()] || "";
}

function resolveCardCategory(card) {
  const own = card.getAttribute("data-category");
  if (own) {
    return own;
  }
  const sec = card.closest("[data-explore-category]");
  return sec ? sec.getAttribute("data-category") || "" : "";
}

function mixedSectionRelevant(canonical) {
  return canonical === "Nails" || canonical === "Fitness";
}

function applyExploreCategoryFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const slug = (params.get("category") || "").trim().toLowerCase();
  const canonical = slugToCanonical(slug);

  const h1 = document.getElementById("explore-heading");
  const emptyEl = document.getElementById("explore-filter-empty");
  const sections = document.querySelectorAll("[data-explore-category]");

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    sec.classList.remove("explore-category--filter-match", "explore-category--filter-hidden");
    const cards = sec.querySelectorAll(".place-card");
    for (let j = 0; j < cards.length; j++) {
      cards[j].classList.remove("place-card--explore-filter-hidden");
    }
  }

  const mapCaption = document.querySelector(".explore-split__map-caption");

  if (!canonical) {
    document.body.classList.remove("explore-page--filtered");
    document.title = "All esses – QList";
    if (h1) {
      h1.textContent = "All esses";
    }
    if (emptyEl) {
      emptyEl.hidden = true;
      emptyEl.textContent = "";
    }
    if (mapCaption) {
      mapCaption.textContent = "Map shows listings in this category.";
    }
    return;
  }

  document.body.classList.add("explore-page--filtered");
  document.title = canonical + " – QList";
  if (h1) {
    h1.textContent = canonical;
  }
  if (mapCaption) {
    mapCaption.textContent = "Map — " + canonical;
  }

  let anyVisible = false;
  let firstMatch = null;

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    const secCat = sec.getAttribute("data-category");
    const isMixed = !secCat;

    if (isMixed) {
      if (!mixedSectionRelevant(canonical)) {
        sec.classList.add("explore-category--filter-hidden");
        continue;
      }
      let secVisible = false;
      const cards = sec.querySelectorAll(".place-card");
      for (let j = 0; j < cards.length; j++) {
        const card = cards[j];
        const cat = resolveCardCategory(card);
        if (cat !== canonical) {
          card.classList.add("place-card--explore-filter-hidden");
        } else {
          secVisible = true;
        }
      }
      if (secVisible) {
        anyVisible = true;
        sec.classList.add("explore-category--filter-match");
        if (!firstMatch) {
          firstMatch = sec;
        }
      } else {
        sec.classList.add("explore-category--filter-hidden");
      }
      continue;
    }

    if (secCat === canonical) {
      sec.classList.add("explore-category--filter-match");
      anyVisible = true;
      if (!firstMatch) {
        firstMatch = sec;
      }
    } else {
      sec.classList.add("explore-category--filter-hidden");
    }
  }

  if (emptyEl) {
    if (!anyVisible) {
      emptyEl.hidden = false;
      emptyEl.textContent = "No listings in this category yet.";
    } else {
      emptyEl.hidden = true;
      emptyEl.textContent = "";
    }
  }

  if (firstMatch) {
    window.requestAnimationFrame(function () {
      var reduceMotion =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      firstMatch.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  }
}

function init() {
  applyExploreCategoryFromUrl();
  window.addEventListener("popstate", applyExploreCategoryFromUrl);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
