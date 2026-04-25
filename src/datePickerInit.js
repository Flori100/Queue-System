function collectDatePickerInstances() {
  const ids = [
    {
      btn: "date-picker-btn",
      labelFull: "date-picker-label-full",
      labelCompact: "date-picker-label-compact",
      dropdown: "date-picker-dropdown",
      grid: "date-picker-grid",
      month: "date-picker-month",
      year: "date-picker-year",
      prev: "date-picker-prev",
      next: "date-picker-next",
    },
  ];
  const out = [];
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const btn = document.getElementById(id.btn);
    const labelFull = document.getElementById(id.labelFull);
    const labelCompact = document.getElementById(id.labelCompact);
    const dropdown = document.getElementById(id.dropdown);
    const grid = document.getElementById(id.grid);
    const monthSelect = document.getElementById(id.month);
    const yearSelect = document.getElementById(id.year);
    const prevBtn = document.getElementById(id.prev);
    const nextBtn = document.getElementById(id.next);
    if (!btn || !labelFull || !dropdown || !grid || !monthSelect || !yearSelect || !prevBtn || !nextBtn) {
      continue;
    }
    const wrap = btn.closest(".date-picker-wrap");
    if (!wrap) continue;
    out.push({
      wrap,
      btn,
      labelFull,
      labelCompact,
      dropdown,
      grid,
      monthSelect,
      yearSelect,
      prevBtn,
      nextBtn,
    });
  }
  return out;
}

export function initDatePicker() {
  if (typeof document === "undefined" || !document.body) return;
  if (document.body.dataset.qlistDatePickerInit === "1") return;

  const instances = collectDatePickerInstances();
  if (!instances.length) return;
  document.body.dataset.qlistDatePickerInit = "1";

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  let view = new Date();
  view.setDate(1);
  let selected = null;
  let docClickBound = false;
  const cy0 = new Date().getFullYear();
  const YEAR_MIN = cy0 - 120;
  const YEAR_MAX = cy0 + 25;

  function sameDay(a, b) {
    return (
      !!a &&
      !!b &&
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  function syncLabelsAndAria() {
    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      if (selected) {
        const fullDate = selected.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
        const compactDate = selected.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        inst.labelFull.textContent = fullDate;
        if (inst.labelCompact) inst.labelCompact.textContent = compactDate;
        inst.btn.setAttribute(
          "aria-label",
          "Choose appointment date. Selected " +
            selected.toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            }) +
            ".",
        );
      } else {
        inst.labelFull.textContent = "Any time";
        if (inst.labelCompact) inst.labelCompact.textContent = "Time";
        inst.btn.setAttribute("aria-label", "Choose appointment date. Any time.");
      }
    }
  }

  function fillMonthYearSelects() {
    const y = view.getFullYear();
    const m = view.getMonth();
    for (let k = 0; k < instances.length; k++) {
      const monthSelect = instances[k].monthSelect;
      const yearSelect = instances[k].yearSelect;
      monthSelect.innerHTML = "";
      for (let i = 0; i < 12; i++) {
        const opt = document.createElement("option");
        opt.value = String(i);
        opt.textContent = monthNames[i];
        if (i === m) opt.selected = true;
        monthSelect.appendChild(opt);
      }
      yearSelect.innerHTML = "";
      for (let yy = YEAR_MIN; yy <= YEAR_MAX; yy++) {
        const yOpt = document.createElement("option");
        yOpt.value = String(yy);
        yOpt.textContent = String(yy);
        if (yy === y) yOpt.selected = true;
        yearSelect.appendChild(yOpt);
      }
    }
  }

  function fillOneGrid(grid) {
    grid.innerHTML = "";
    const y = view.getFullYear();
    const m = view.getMonth();
    const firstDow = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const today = new Date();
    const lead = firstDow;

    for (let p = 0; p < lead; p++) {
      const pad = document.createElement("span");
      pad.className = "date-picker__day date-picker__day--pad";
      pad.textContent = "0";
      grid.appendChild(pad);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(y, m, d);
      const dayBtn = document.createElement("button");
      dayBtn.type = "button";
      dayBtn.className = "date-picker__day";
      dayBtn.textContent = String(d);
      dayBtn.setAttribute("aria-label", monthNames[m] + " " + d + ", " + y);
      if (sameDay(cellDate, today)) dayBtn.classList.add("date-picker__day--today");
      if (selected && sameDay(cellDate, selected)) dayBtn.classList.add("date-picker__day--selected");
      dayBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        selected = new Date(cellDate.getFullYear(), cellDate.getMonth(), cellDate.getDate());
        syncLabelsAndAria();
        closeAll();
      });
      grid.appendChild(dayBtn);
    }

    const total = lead + daysInMonth;
    const tail = total % 7 === 0 ? 0 : 7 - (total % 7);
    for (let t = 0; t < tail; t++) {
      const pad2 = document.createElement("span");
      pad2.className = "date-picker__day date-picker__day--pad";
      pad2.textContent = "0";
      grid.appendChild(pad2);
    }
  }

  function renderGrid() {
    for (let g = 0; g < instances.length; g++) {
      fillOneGrid(instances[g].grid);
    }
  }

  function syncViewFromSelects(sourceInst) {
    const mi = parseInt(sourceInst.monthSelect.value, 10);
    const yi = parseInt(sourceInst.yearSelect.value, 10);
    if (!isNaN(mi) && !isNaN(yi)) {
      view.setFullYear(yi, mi, 1);
    }
  }

  function refresh() {
    fillMonthYearSelects();
    renderGrid();
  }

  function wrapsContain(target) {
    for (let i = 0; i < instances.length; i++) {
      if (instances[i].wrap.contains(target)) return true;
    }
    return false;
  }

  function onDocClick(e) {
    if (wrapsContain(e.target)) return;
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

  function isInstOpen(inst) {
    return !inst.dropdown.hidden;
  }

  function closeAll() {
    for (let i = 0; i < instances.length; i++) {
      const inst = instances[i];
      inst.dropdown.hidden = true;
      inst.btn.setAttribute("aria-expanded", "false");
    }
    unbindDoc();
  }

  function open(inst) {
    closeAll();
    inst.dropdown.hidden = false;
    inst.btn.setAttribute("aria-expanded", "true");
    if (selected) {
      view = new Date(selected.getFullYear(), selected.getMonth(), 1);
    } else {
      const t = new Date();
      view = new Date(t.getFullYear(), t.getMonth(), 1);
    }
    refresh();
    window.setTimeout(bindDoc, 0);
  }

  function wireInstance(inst) {
    inst.btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (isInstOpen(inst)) closeAll();
      else open(inst);
    });

    inst.dropdown.addEventListener("click", function (e) {
      e.stopPropagation();
    });

    inst.prevBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      view.setMonth(view.getMonth() - 1);
      if (view.getFullYear() < YEAR_MIN) view = new Date(YEAR_MIN, 0, 1);
      fillMonthYearSelects();
      renderGrid();
    });

    inst.nextBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      view.setMonth(view.getMonth() + 1);
      if (view.getFullYear() > YEAR_MAX) view = new Date(YEAR_MAX, 11, 1);
      fillMonthYearSelects();
      renderGrid();
    });

    inst.monthSelect.addEventListener("change", function () {
      syncViewFromSelects(inst);
      fillMonthYearSelects();
      renderGrid();
    });

    inst.yearSelect.addEventListener("change", function () {
      syncViewFromSelects(inst);
      fillMonthYearSelects();
      renderGrid();
    });
  }

  for (let wi = 0; wi < instances.length; wi++) {
    wireInstance(instances[wi]);
  }

  syncLabelsAndAria();

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    let openInst = null;
    for (let i = 0; i < instances.length; i++) {
      if (isInstOpen(instances[i])) {
        openInst = instances[i];
        break;
      }
    }
    if (!openInst) return;
    e.preventDefault();
    closeAll();
    openInst.btn.focus();
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initDatePicker, { once: true });
  } else {
    initDatePicker();
  }
}

