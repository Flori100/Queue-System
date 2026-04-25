/**
 * Filter values must match `data-category` on cards. Labels are shown in the UI
 * (grid, input) and may differ for readability.
 */
const CATEGORY_CHIPS = [
  {
    value: "Barbershop",
    label: "Barbershop",
    tileClass: "services-picker-grid__tile--barber",
    svg:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><line x1="20" y1="4" x2="8.12" y2="15.88"></line><line x1="14.47" y1="14.48" x2="20" y2="20"></line><line x1="8.12" y1="8.12" x2="12" y2="12"></line></svg>',
  },
  {
    value: "Spa",
    label: "Spa",
    tileClass: "services-picker-grid__tile--spa",
    svg:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3c-4 4-6 7.5-6 11a6 6 0 0 0 12 0c0-3.5-2-7-6-11Z"></path><path d="M12 22v-3"></path></svg>',
  },
  {
    value: "Nails",
    label: "Nails",
    tileClass: "services-picker-grid__tile--nails",
    svg:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 11V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6"></path><path d="M8 11h8v8a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-8Z"></path><path d="M10 15h4"></path></svg>',
  },
  {
    value: "Fitness",
    label: "Fitness",
    tileClass: "services-picker-grid__tile--fitness",
    svg:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="6" y1="12" x2="18" y2="12"></line><rect x="2" y="8" width="4" height="8" rx="1"></rect><rect x="18" y="8" width="4" height="8" rx="1"></rect></svg>',
  },
  {
    value: "Taxi",
    label: "Taxi",
    tileClass: "services-picker-grid__tile--taxi",
    svg:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 17h14v-3l-1.5-4.5A1 1 0 0 0 16.5 9h-9a1 1 0 0 0-.95.68L5 14v3Z"></path><path d="M3 17h2"></path><path d="M19 17h2"></path><circle cx="7.5" cy="17.5" r="1.5"></circle><circle cx="16.5" cy="17.5" r="1.5"></circle><path d="M8 9V7a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"></path></svg>',
  },
];

const CATEGORIES = CATEGORY_CHIPS.map(function (c) {
  return c.value;
});

/** Scroll target within `#home-discover` when focusing a category from elsewhere (single browse rail). */
function homeDiscoverySectionIdForCategoryValue(value) {
  const v = String(value || "")
    .trim()
    .toLowerCase();
  if (
    v === "barbershop" ||
    v === "hairsalon" ||
    v === "spa" ||
    v === "nails" ||
    v === "fitness" ||
    v === "dentist" ||
    v === "dermatology"
  ) {
    return "home-trending-popular";
  }
  return "";
}

function chipMetaForValue(value) {
  for (let i = 0; i < CATEGORY_CHIPS.length; i++) {
    if (CATEGORY_CHIPS[i].value === value) {
      return CATEGORY_CHIPS[i];
    }
  }
  return null;
}

/** Suggestions list appears once the trimmed query has at least this many characters (use 1 to show after first character). */
const MIN_QUERY_CHARS = 2;

function idInForm(form, baseId) {
  return form.querySelector("#" + baseId);
}

function listIsGrid(row) {
  return row.listEl.classList.contains("services-picker-dropdown__list--grid");
}

function resetListClass(row) {
  row.listEl.className = "services-picker-dropdown__list";
}

function gatherPickerRows() {
  const main = document.getElementById("mainContent");
  const forms = [document.getElementById("hero-search-bar")].filter(Boolean);
  const rows = [];
  for (let i = 0; i < forms.length; i++) {
    const form = forms[i];
    const combo = idInForm(form, "services-picker-combobox");
    const input = idInForm(form, "services-picker-input");
    const clearBtn = idInForm(form, "services-picker-clear");
    const chevronBtn = idInForm(form, "services-picker-chevron");
    const dropdown = idInForm(form, "services-picker-dropdown");
    const listEl = idInForm(form, "services-picker-list");
    if (!combo || !input || !chevronBtn || !dropdown || !listEl || !main) {
      continue;
    }
    rows.push({
      form,
      combo,
      input,
      clearBtn,
      chevronBtn,
      dropdown,
      listEl,
      wrap: combo.closest(".services-picker-wrap"),
    });
  }
  return { main, rows };
}

export function initServicesPicker() {
  if (typeof document === "undefined" || !document.body) return;
  if (document.body.dataset.qlistServicesPickerInit === "1") return;
  const gathered = gatherPickerRows();
  const main = gathered.main;
  const pickerRows = gathered.rows;
  if (!main || pickerRows.length === 0) {
    return;
  }
  document.body.dataset.qlistServicesPickerInit = "1";

  let docClickBound = false;
  let activeCategory = "";
  let committedDisplayLabel = "All services";
  /** @type {typeof pickerRows[0] | null} */
  let openRow = null;

  function allCards() {
    return Array.from(main.querySelectorAll(".place-card"));
  }

  function notifyFiltersChanged() {
    document.dispatchEvent(new CustomEvent("qlist:filters-changed"));
  }

  function syncCategoryToCards() {
    const cards = allCards();
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const cat = card.getAttribute("data-category") || "";
      const hide = !!(activeCategory && cat !== activeCategory);
      card.classList.toggle("place-card--category-hidden", hide);
    }
    notifyFiltersChanged();
  }

  function syncHomeCategoryCards() {
    const rail = main.querySelector(".home-category-rail");
    if (!rail) {
      return;
    }
    const links = rail.querySelectorAll(".home-category-card[data-category]");
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const cat = link.getAttribute("data-category") || "";
      const isActive = !!activeCategory && cat === activeCategory;
      link.classList.toggle("home-category-card--active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    }
  }

  function getQuery(row) {
    return row.input.value.trim();
  }

  /** Query used for suggestion filtering (default label is not a search string). */
  function getFilterQuery(row) {
    const v = getQuery(row);
    if (v.toLowerCase() === "all services") {
      return "";
    }
    return v;
  }

  function syncInputFromCommitted() {
    for (let r = 0; r < pickerRows.length; r++) {
      const row = pickerRows[r];
      row.input.value = activeCategory ? committedDisplayLabel : "";
    }
    updateClearButtonVisibility();
  }

  function updateClearButtonVisibility() {
    for (let r = 0; r < pickerRows.length; r++) {
      const row = pickerRows[r];
      if (!row.clearBtn) continue;
      const hasText = getQuery(row).length > 0;
      row.clearBtn.hidden = !hasText;
      row.clearBtn.tabIndex = hasText ? 0 : -1;
    }
  }

  function updateAriaLabel() {
    const label = activeCategory
      ? "Service category. " + committedDisplayLabel + "."
      : "Service category. All services. Type to search categories.";
    for (let r = 0; r < pickerRows.length; r++) {
      pickerRows[r].input.setAttribute("aria-label", label);
    }
  }

  function updateOptionActiveStates(listEl) {
    if (!listEl) return;
    const allOpt = listEl.querySelector('[data-category-value=""]');
    if (allOpt) {
      allOpt.classList.toggle("services-picker-option--active", !activeCategory);
    }
    const gridTiles = listEl.querySelectorAll(".services-picker-grid__tile[data-category]");
    for (let j = 0; j < gridTiles.length; j++) {
      const t = gridTiles[j];
      const v = t.getAttribute("data-category") || "";
      t.classList.toggle("services-picker-grid__tile--active", !!activeCategory && v === activeCategory);
    }
    const opts = listEl.querySelectorAll(".services-picker-option[data-category]");
    for (let k = 0; k < opts.length; k++) {
      const opt = opts[k];
      const v = opt.getAttribute("data-category") || "";
      opt.classList.toggle("services-picker-option--active", !!activeCategory && v === activeCategory);
    }
  }

  function setActiveCategory(value, displayLabel) {
    activeCategory = value || "";
    committedDisplayLabel = displayLabel || "All services";
    syncInputFromCommitted();
    for (let r = 0; r < pickerRows.length; r++) {
      const row = pickerRows[r];
      if (value) {
        row.combo.setAttribute("data-active-category", value);
      } else {
        row.combo.removeAttribute("data-active-category");
      }
    }
    updateAriaLabel();
    syncCategoryToCards();
    syncHomeCategoryCards();
    if (openRow && openRow.listEl.children.length) {
      updateOptionActiveStates(openRow.listEl);
    }
  }

  function attachOptionMouseDown(el) {
    el.addEventListener("mousedown", function (e) {
      e.preventDefault();
    });
  }

  function buildCategoryGrid(row) {
    const listEl = row.listEl;
    listEl.innerHTML = "";
    listEl.className = "services-picker-dropdown__list services-picker-dropdown__list--grid";

    const liAll = document.createElement("li");
    liAll.className = "services-picker-grid__all-row";
    const allBtn = document.createElement("button");
    allBtn.type = "button";
    allBtn.className = "services-picker-grid__all services-picker-option";
    allBtn.setAttribute("data-category-value", "");
    allBtn.setAttribute("role", "option");
    allBtn.textContent = "All services";
    attachOptionMouseDown(allBtn);
    allBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      setActiveCategory("", "All services");
      close(row);
    });
    liAll.appendChild(allBtn);
    listEl.appendChild(liAll);

    for (let i = 0; i < CATEGORY_CHIPS.length; i++) {
      const meta = CATEGORY_CHIPS[i];
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.className = "services-picker-grid__tile " + meta.tileClass;
      b.setAttribute("data-category", meta.value);
      b.setAttribute("role", "option");
      b.setAttribute("aria-label", meta.label);
      const icon = document.createElement("span");
      icon.className = "services-picker-grid__tile-icon";
      icon.innerHTML = meta.svg;
      const lab = document.createElement("span");
      lab.className = "services-picker-grid__tile-label";
      lab.textContent = meta.label;
      b.appendChild(icon);
      b.appendChild(lab);
      attachOptionMouseDown(b);
      (function (value, label) {
        b.addEventListener("click", function (e) {
          e.stopPropagation();
          setActiveCategory(value, label);
          close(row);
          row.input.focus();
        });
      })(meta.value, meta.label);
      li.appendChild(b);
      listEl.appendChild(li);
    }

    updateOptionActiveStates(listEl);
  }

  function filterCategories(query) {
    const q = query.toLowerCase();
    return CATEGORIES.filter(function (c) {
      return c.toLowerCase().indexOf(q) !== -1;
    });
  }

  function buildSearchList(query, row) {
    const listEl = row.listEl;
    listEl.innerHTML = "";
    resetListClass(row);
    const matches = filterCategories(query);

    if (matches.length === 0) {
      const li = document.createElement("li");
      const empty = document.createElement("p");
      empty.className = "services-picker-empty";
      empty.textContent = "No results";
      li.appendChild(empty);
      listEl.appendChild(li);
      return;
    }

    for (let i = 0; i < matches.length; i++) {
      const cat = matches[i];
      const li = document.createElement("li");
      const b = document.createElement("button");
      b.type = "button";
      b.className = "services-picker-option";
      b.setAttribute("data-category", cat);
      b.setAttribute("role", "option");
      const chip = chipMetaForValue(cat);
      b.textContent = chip ? chip.label : cat;
      attachOptionMouseDown(b);
      (function (c) {
        b.addEventListener("click", function (e) {
          e.stopPropagation();
          const m = chipMetaForValue(c);
          setActiveCategory(c, m ? m.label : c);
          close(row);
        });
      })(cat);
      li.appendChild(b);
      listEl.appendChild(li);
    }

    updateOptionActiveStates(listEl);
  }

  function commitInputValue(row) {
    const v = getQuery(row);
    if (!v || v.toLowerCase() === "all services") {
      setActiveCategory("", "All services");
      return;
    }
    const q = v.toLowerCase();
    for (let i = 0; i < CATEGORY_CHIPS.length; i++) {
      const meta = CATEGORY_CHIPS[i];
      if (meta.value.toLowerCase() === q || meta.label.toLowerCase() === q) {
        setActiveCategory(meta.value, meta.label);
        return;
      }
    }
    const fuzzy = CATEGORIES.filter(function (c) {
      const lc = c.toLowerCase();
      const meta = chipMetaForValue(c);
      const lab = meta ? meta.label.toLowerCase() : "";
      return lc.indexOf(q) !== -1 || lab.indexOf(q) !== -1 || q.indexOf(lc) === 0;
    });
    if (fuzzy.length === 1) {
      const c = fuzzy[0];
      const m = chipMetaForValue(c);
      setActiveCategory(c, m ? m.label : c);
      return;
    }
    syncInputFromCommitted();
  }

  function pickerWrapsContain(target) {
    for (let r = 0; r < pickerRows.length; r++) {
      const w = pickerRows[r].wrap;
      if (w && w.contains(target)) return true;
    }
    return false;
  }

  function onDocClick(e) {
    if (pickerWrapsContain(e.target)) return;
    let commitRow = null;
    for (let r = 0; r < pickerRows.length; r++) {
      if (document.activeElement === pickerRows[r].input) {
        commitRow = pickerRows[r];
        break;
      }
    }
    if (!commitRow) {
      commitRow = openRow || pickerRows[0];
    }
    if (commitRow) {
      commitInputValue(commitRow);
    }
    closeAll();
  }

  function bindDoc() {
    if (docClickBound) return;
    docClickBound = true;
    document.addEventListener("click", onDocClick);
  }

  function unbindDoc() {
    if (!docClickBound) return;
    docClickBound = false;
    document.removeEventListener("click", onDocClick);
  }

  function isOpen(row) {
    return row.dropdown.classList.contains("is-open");
  }

  function open(row) {
    for (let r = 0; r < pickerRows.length; r++) {
      const other = pickerRows[r];
      if (other !== row && isOpen(other)) {
        close(other);
      }
    }
    openRow = row;
    row.dropdown.classList.add("is-open");
    row.dropdown.setAttribute("aria-hidden", "false");
    row.input.setAttribute("aria-expanded", "true");
    window.requestAnimationFrame(function () {
      bindDoc();
    });
  }

  function close(row) {
    row.dropdown.classList.remove("is-open");
    row.dropdown.setAttribute("aria-hidden", "true");
    row.input.setAttribute("aria-expanded", "false");
    row.listEl.innerHTML = "";
    resetListClass(row);
    if (openRow === row) {
      openRow = null;
    }
    const anyStillOpen = pickerRows.some(function (x) {
      return isOpen(x);
    });
    if (!anyStillOpen) {
      unbindDoc();
    }
  }

  function closeAll() {
    for (let r = 0; r < pickerRows.length; r++) {
      const row = pickerRows[r];
      if (isOpen(row)) {
        row.dropdown.classList.remove("is-open");
        row.dropdown.setAttribute("aria-hidden", "true");
        row.input.setAttribute("aria-expanded", "false");
        row.listEl.innerHTML = "";
        resetListClass(row);
      }
    }
    openRow = null;
    unbindDoc();
  }

  function applyTypingState(row) {
    const q = getFilterQuery(row);
    if (q.length >= MIN_QUERY_CHARS) {
      buildSearchList(q, row);
      if (!isOpen(row)) {
        open(row);
      }
      return;
    }
    if (!isOpen(row)) {
      return;
    }
    if (listIsGrid(row) && q.length > 0) {
      close(row);
      return;
    }
    if (!listIsGrid(row)) {
      close(row);
    }
  }

  function openCategoryPanelIfEmpty(row) {
    if (document.activeElement !== row.input) {
      return;
    }
    if (getQuery(row).length !== 0) {
      return;
    }
    if (isOpen(row) && listIsGrid(row)) {
      return;
    }
    buildCategoryGrid(row);
    open(row);
  }

  function wireRow(row) {
    const combo = row.combo;
    const input = row.input;
    const clearBtn = row.clearBtn;
    const chevronBtn = row.chevronBtn;
    const dropdown = row.dropdown;
    const wrap = row.wrap;

    combo.addEventListener("click", function (e) {
      if (e.target === chevronBtn || chevronBtn.contains(e.target)) {
        return;
      }
      if (clearBtn && (e.target === clearBtn || clearBtn.contains(e.target))) {
        return;
      }
      input.focus();
    });

    chevronBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (isOpen(row) && openRow === row && listIsGrid(row)) {
        close(row);
        return;
      }
      buildCategoryGrid(row);
      open(row);
    });

    input.addEventListener("input", function () {
      updateClearButtonVisibility();
      applyTypingState(row);
      openCategoryPanelIfEmpty(row);
    });

    input.addEventListener("focus", function () {
      updateClearButtonVisibility();
      openCategoryPanelIfEmpty(row);
    });

    wrap.addEventListener("focusout", function () {
      window.requestAnimationFrame(function () {
        if (wrap && wrap.contains(document.activeElement)) {
          return;
        }
        commitInputValue(row);
        close(row);
      });
    });

    if (clearBtn) {
      clearBtn.addEventListener("mousedown", function (e) {
        e.preventDefault();
      });
      clearBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        setActiveCategory("", "All services");
        closeAll();
        updateClearButtonVisibility();
        input.focus();
      });
    }

    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        if (isOpen(row)) {
          e.preventDefault();
          syncInputFromCommitted();
          close(row);
        }
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        commitInputValue(row);
        close(row);
      }
    });

    dropdown.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  for (let i = 0; i < pickerRows.length; i++) {
    wireRow(pickerRows[i]);
  }

  document.addEventListener(
    "qlist:browse-category",
    function (e) {
      const d = e && e.detail;
      if (!d || typeof d !== "object") return;
      const value = d.value != null ? String(d.value) : "";
      const label = d.label != null ? String(d.label) : value;
      const scrollToSection = d.scrollToSection === true;
      const reduceMotion =
        window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const behavior = reduceMotion ? "auto" : "smooth";

      if (scrollToSection) {
        setActiveCategory("", "All services");
        closeAll();
        const sectionId = homeDiscoverySectionIdForCategoryValue(value);
        const section = sectionId ? document.getElementById(sectionId) : null;
        const discover = document.getElementById("home-discover");
        const target =
          section && typeof section.scrollIntoView === "function"
            ? section
            : discover && typeof discover.scrollIntoView === "function"
              ? discover
              : null;
        if (target) {
          target.scrollIntoView({ behavior, block: "start" });
        }
        return;
      }

      if (!value) {
        setActiveCategory("", "All services");
      } else {
        setActiveCategory(value, label || value);
      }
      closeAll();
      const discover = document.getElementById("home-discover");
      if (discover && typeof discover.scrollIntoView === "function") {
        discover.scrollIntoView({ behavior, block: "start" });
      }
    },
    false,
  );

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    let openR = null;
    for (let r = 0; r < pickerRows.length; r++) {
      if (isOpen(pickerRows[r])) {
        openR = pickerRows[r];
        break;
      }
    }
    if (!openR) return;
    e.preventDefault();
    syncInputFromCommitted();
    close(openR);
    openR.input.focus();
  });

  setActiveCategory("", "All services");
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initServicesPicker, { once: true });
} else {
  initServicesPicker();
}
