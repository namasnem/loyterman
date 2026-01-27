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
      count.textContent = `${visibleCount} focus areas`;
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

  const activateTab = (target) => {
    tabs.forEach((tab) => {
      const isActive = tab.dataset.tabTarget === target;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive.toString());
    });
    panels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.briefingPanel === target);
    });
  };

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tabTarget;
      if (target) activateTab(target);
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
