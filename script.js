const STORAGE_KEY = "lyrovianJurisdiction";
const STORAGE_ISLAND = "lyrovianIsland";

const jurisdictionNameMap = {
  "lyrophia": "Hegemonic State of Lyrophia",
  "phelpem": "Realm of Phelpem",
  "eudaemonia": "Rectorate of Eudaemonia",
  "jaokin": "Principality of Jaokin",
  "datsuhon": "Datsuhon-shu",
  "kingsreach": "Commonwealth of Kingsreach",
  "tsa": "Territory of the Stravens Archipelago (Restricted)",
  "keydon": "Bailiwick of Keydon",
  "enropen": "Directorate of Enropen",
  "imidei": "Duchy of Imidei",
  "ortemphil": "Kingdom of Ortemphil",
  "saoverissimo": "Insular Republic of São Veríssimo"
};

function setBrandFallback() {
  const mark = document.querySelector(".brand-mark");
  const img = mark?.querySelector("img");
  if (!mark || !img) return;
  img.addEventListener("error", () => {
    mark.classList.add("is-fallback");
  });
}

function applyJurisdiction(value) {
  const isRestricted = value === "tsa";
  document.body.classList.toggle("is-restricted", isRestricted);
  document.querySelectorAll("[data-current-jurisdiction]").forEach((el) => {
    el.textContent = jurisdictionNameMap[value] || "Hegemonic State of Lyrophia";
  });

  document.querySelectorAll("[data-restricted-hide]").forEach((el) => {
    el.classList.toggle("hidden", isRestricted);
  });

  document.querySelectorAll("[data-start-button]").forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) return;
    button.disabled = isRestricted;
    button.textContent = isRestricted ? "Start (Restricted)" : "Start application";
  });

  document.querySelectorAll("[data-service-card]").forEach((card) => {
    if (!(card instanceof HTMLElement)) return;
    const allowed = card.dataset.allowed === "tsa";
    card.classList.toggle("hidden", isRestricted && !allowed);
  });

  document.querySelectorAll("[data-restriction-banner]").forEach((banner) => {
    banner.setAttribute("aria-hidden", (!isRestricted).toString());
  });
}

function wireJurisdictionSelectors() {
  const selectElements = document.querySelectorAll("[data-jurisdiction-select]");
  if (!selectElements.length) return;

  const stored = localStorage.getItem(STORAGE_KEY) || "lyrophia";
  selectElements.forEach((select) => {
    if (!(select instanceof HTMLSelectElement)) return;
    select.value = stored;
    select.addEventListener("change", () => {
      localStorage.setItem(STORAGE_KEY, select.value);
      applyJurisdiction(select.value);
    });
  });
  applyJurisdiction(stored);
}

function wireIslandSelectors() {
  const islandElements = document.querySelectorAll("[data-island-select]");
  if (!islandElements.length) return;
  const stored = localStorage.getItem(STORAGE_ISLAND) || "fornland";
  islandElements.forEach((select) => {
    if (!(select instanceof HTMLSelectElement)) return;
    select.value = stored;
    select.addEventListener("change", () => {
      localStorage.setItem(STORAGE_ISLAND, select.value);
      document.querySelectorAll("[data-current-island]").forEach((el) => {
        el.textContent = select.value === "strathland" ? "Strathland" : "Fornland";
      });
    });
  });
  document.querySelectorAll("[data-current-island]").forEach((el) => {
    el.textContent = stored === "strathland" ? "Strathland" : "Fornland";
  });
}

function wireGovernmentFilters() {
  const searchInput = document.querySelector("[data-gov-search]");
  const filterSelect = document.querySelector("[data-gov-filter]");
  const cards = Array.from(document.querySelectorAll("[data-gov-card]"));
  if (!searchInput || !filterSelect || !cards.length) return;

  const updateResults = () => {
    const term = searchInput.value.trim().toLowerCase();
    const category = filterSelect.value;
    let visibleCount = 0;

    cards.forEach((card) => {
      const text = (card.dataset.search || card.textContent || "").toLowerCase();
      const tags = (card.dataset.tags || "").toLowerCase();
      const matchesTerm = !term || text.includes(term) || tags.includes(term);
      const matchesCategory = category === "all" || card.dataset.category === category;
      const shouldShow = matchesTerm && matchesCategory;
      card.classList.toggle("hidden", !shouldShow);
      if (shouldShow) visibleCount += 1;
    });

    const count = document.querySelector("[data-gov-count]");
    if (count) {
      // Ensure the count element acts as a live region so screen readers announce updates
      if (!count.hasAttribute("aria-live")) {
        count.setAttribute("aria-live", "polite");
      }
      if (!count.hasAttribute("role")) {
        count.setAttribute("role", "status");
      }
      const label = visibleCount === 1 ? "focus area" : "focus areas";
      count.textContent = `${visibleCount} ${label}`;
    }
  };

  searchInput.addEventListener("input", updateResults);
  filterSelect.addEventListener("change", updateResults);
  updateResults();
}

function wireBriefingTabs() {
  const tabs = Array.from(document.querySelectorAll("[data-briefing-tab]"));
  const panels = Array.from(document.querySelectorAll("[data-briefing-panel]"));
  if (!tabs.length || !panels.length) return;

  const updateTabFocus = (activeIndex) => {
    tabs.forEach((tab, index) => {
      tab.tabIndex = index === activeIndex ? 0 : -1;
    });
  };

  const activateTab = (target) => {
    let activeIndex = -1;
    tabs.forEach((tab, index) => {
      const isActive = tab.dataset.tabTarget === target;
      if (isActive) {
        activeIndex = index;
      }
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive.toString());
    });
    panels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.briefingPanel === target);
    });
    if (activeIndex !== -1) {
      updateTabFocus(activeIndex);
    }
  };

  // Initialize roving tabindex so that only the active tab (or the first tab)
  // is reachable via Tab, per WAI-ARIA tab pattern.
  let initialIndex = tabs.findIndex(
    (tab) => tab.classList.contains("is-active") || tab.getAttribute("aria-selected") === "true"
  );
  if (initialIndex === -1) {
    initialIndex = 0;
  }
  updateTabFocus(initialIndex);

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tabTarget;
      if (target) {
        activateTab(target);
        tab.focus();
      }
    });

    tab.addEventListener("keydown", (event) => {
      const key = event.key;
      let newIndex = -1;

      if (key === "ArrowRight" || key === "Right") {
        event.preventDefault();
        newIndex = (index + 1) % tabs.length;
      } else if (key === "ArrowLeft" || key === "Left") {
        event.preventDefault();
        newIndex = (index - 1 + tabs.length) % tabs.length;
      } else if (key === "Home") {
        event.preventDefault();
        newIndex = 0;
      } else if (key === "End") {
        event.preventDefault();
        newIndex = tabs.length - 1;
      } else if (key === "Enter" || key === " ") {
        const target = tab.dataset.tabTarget;
        if (target) {
          event.preventDefault();
          activateTab(target);
        }
        return;
      } else {
        return;
      }

      if (newIndex >= 0 && newIndex < tabs.length) {
        const newTab = tabs[newIndex];
        const target = newTab.dataset.tabTarget;
        if (target) {
          activateTab(target);
          newTab.focus();
        }
      }
    });
  });
}

function updateGovRefresh() {
  const refresh = document.querySelector("[data-gov-refresh]");
  if (!refresh) return;
  const time = new Date();
  refresh.textContent = time.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

setBrandFallback();
wireJurisdictionSelectors();
wireIslandSelectors();
wireGovernmentFilters();
wireBriefingTabs();
updateGovRefresh();
