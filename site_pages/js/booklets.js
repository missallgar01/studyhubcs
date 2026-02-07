 // Toggle topic sections open/closed
  document.querySelectorAll('.topic-header').forEach(header => {
    header.addEventListener('click', () => {
      const section = header.parentElement;
      section.classList.toggle('collapsed');
      section.classList.toggle('expanded');
    });
  });

  // Show / hide individual answers
  document.querySelectorAll('.answer-toggle').forEach(btn => {
    const answer = btn.nextElementSibling;
    if (!answer) return;

    // ensure hidden initially (CSS also sets .answer display:none)
    answer.style.display = 'none';

    btn.addEventListener('click', () => {
      const open = answer.style.display === 'block';
      answer.style.display = open ? 'none' : 'block';
      btn.textContent = open ? 'Show answer' : 'Hide answer';
    });
  });

  /* -----------------------------
     Print button
  ------------------------------ */
  const printBtn = document.getElementById("printBtn");
  if (printBtn) {
    printBtn.addEventListener("click", () => {
      window.print();
    });
  }

  (function () {
  /**
   * Tabs can be laid out in two ways:
   *  1) Panels live inside the same [data-tabs] root (classic pattern)
   *  2) Panels live elsewhere in the DOM (e.g., a sibling .ds-panels container)
   *
   * To support both, we derive the panel set from the aria-controls IDs on the tabs.
   */
  function getControlledPanels(tabsRoot) {
    const tabs = Array.from(tabsRoot.querySelectorAll('[role="tab"]'));
    const ids = tabs
      .map(t => t.getAttribute('aria-controls'))
      .filter(Boolean);

    // De-duplicate while preserving order
    const seen = new Set();
    const uniqueIds = ids.filter(id => (seen.has(id) ? false : (seen.add(id), true)));

    return uniqueIds
      .map(id => document.getElementById(id))
      .filter(Boolean);
  }

  function activateTab(tabsRoot, newTab) {
    const tabs = Array.from(tabsRoot.querySelectorAll('[role="tab"]'));
    const panels = getControlledPanels(tabsRoot);

    // Update tabs
    tabs.forEach(tab => {
      const selected = tab === newTab;
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.tabIndex = selected ? 0 : -1;
    });

    // Update panels (only those controlled by this tab set)
    const targetId = newTab.getAttribute('aria-controls');
    panels.forEach(panel => {
      panel.hidden = panel.id !== targetId;
    });

    newTab.focus();
  }

  document.querySelectorAll('[data-tabs]').forEach(tabsRoot => {
    const tabs = Array.from(tabsRoot.querySelectorAll('[role="tab"]'));
    if (!tabs.length) return;

    // Click to switch
    tabsRoot.addEventListener('click', (e) => {
      const tab = e.target.closest('[role="tab"]');
      if (!tab || !tabsRoot.contains(tab)) return;
      activateTab(tabsRoot, tab);
    });

    // Keyboard navigation
    tabsRoot.addEventListener('keydown', (e) => {
      const current = e.target.closest('[role="tab"]');
      if (!current) return;

      const idx = tabs.indexOf(current);
      if (idx === -1) return;

      let nextIdx = null;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') nextIdx = (idx + 1) % tabs.length;
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   nextIdx = (idx - 1 + tabs.length) % tabs.length;
      if (e.key === 'Home') nextIdx = 0;
      if (e.key === 'End')  nextIdx = tabs.length - 1;

      if (nextIdx !== null) {
        e.preventDefault();
        activateTab(tabsRoot, tabs[nextIdx]);
      }
    });

    // Ensure one tab is active on load
    const selected = tabs.find(t => t.getAttribute('aria-selected') === 'true') || tabs[0];
    activateTab(tabsRoot, selected);
  });
})();

document.addEventListener("click", function (e) {
  const btn = e.target.closest(".print-tab-btn");
  if (!btn) return;

  const panel = btn.closest(".ds-panel");
  if (!panel) return;

  const printContent = panel.cloneNode(true);
  printContent.querySelectorAll(".tab-print").forEach(el => el.remove());

  const printWindow = window.open("", "", "width=900,height=650");
  printWindow.document.write(`
    <html>
      <head>
        <title>Print Section</title>
        <link rel="stylesheet" href="../../styles.css">
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();

  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 250);
});

function openTip() {
    document.getElementById("cmdModal").style.display = "block";
  }

  function closeTip() {
    document.getElementById("cmdModal").style.display = "none";
  }

  // Close modal if user clicks outside the box
  window.onclick = function (event) {
    const modal = document.getElementById("cmdModal");
    if (event.target === modal) {
      modal.style.display = "none";
    }
  };


  fetch("../command-words.html")
    .then(res => res.text())
    .then(html => {
      document.getElementById("command-words").innerHTML = html;
    });



/* -------------------- CSV PARSING -------------------- */
function parseKeywordsCsv(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length < 2) return [];

  const header = lines[0].split(",").map(h => h.trim().toLowerCase());
  const topicIdx = header.indexOf("topic");
  const keywordIdx = header.indexOf("keyword");
  const defIdx = header.indexOf("definition");

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const p = lines[i].split(",");
    if (p.length < 3) continue;

    rows.push({
      topic: p[topicIdx]?.trim() || "",
      keyword: p[keywordIdx]?.trim() || "",
      definition: p[defIdx]?.trim() || ""
    });
  }
  return rows;
}

let keywordRows = null;

async function loadKeywordsCsv() {
  if (keywordRows) return keywordRows;

  try {
    const r = await fetch("keywords.csv");
    const t = await r.text();
    keywordRows = parseKeywordsCsv(t);
    return keywordRows;
  } catch (e) {
    console.error("Could not load G-keywords.csv", e);
    keywordRows = [];
    return keywordRows;
  }
}

/* -------------------- HELPERS -------------------- */
function pickRandomN(arr, n) {
  // Fisher–Yates shuffle on a copy
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(n, a.length));
}

function renderKeywordCards(topicName, rows) {
  const intro = document.getElementById("keywordsIntro");
  const cards = document.getElementById("keywordCards");

  const matches = rows.filter(r => r.topic === topicName);

  cards.innerHTML = "";

  if (matches.length === 0) {
    intro.textContent = "No keywords found for this topic.";
    return;
  }

  intro.textContent = "Click a box to reveal the definition.";

  const chosen = pickRandomN(matches, 9);

  chosen.forEach(row => {
    const card = document.createElement("div");
    card.className = "keyword-card";
    card.addEventListener("click", () => card.classList.toggle("show"));

    const front = document.createElement("div");
    front.className = "keyword-front";
    front.textContent = row.keyword;

    const back = document.createElement("div");
    back.className = "keyword-back";
    back.textContent = row.definition;

    card.appendChild(front);
    card.appendChild(back);
    cards.appendChild(card);
  });
}

/* -------------------- OPEN KEYWORDS MODAL -------------------- */

let currentKeywordTopic = null;

async function openKeywordsModal(topicName) {
  currentKeywordTopic = topicName;

  const modal = document.getElementById("keywordsModal");
  const title = document.getElementById("keywordsTitle");
  const intro = document.getElementById("keywordsIntro");

  modal.classList.add("active");
  title.textContent = "Keywords – " + topicName;
  intro.textContent = "Loading keywords...";

  const rows = await loadKeywordsCsv();

  // Initial render (random 6)
  renderKeywordCards(topicName, rows);

  // Wire up regenerate button (idempotent)
  const regenBtn = document.getElementById("regenKeywordsBtn");
  if (regenBtn) {
    regenBtn.onclick = () => {
      // re-render with a new random selection
      renderKeywordCards(currentKeywordTopic, rows);
    };
  }
}

function closeKeywordsModal() {
  const modal = document.getElementById("keywordsModal");
  modal.classList.remove("active");
}
/* -------------------- EVENT WIRING (SAFE) -------------------- */

document.addEventListener("DOMContentLoaded", () => {

  /* PDF modal close rules */
  const pdfModal = document.getElementById("pdfModal");
  const pdfContent = document.querySelector(".pdf-modal-content");

  if (pdfModal) {
    pdfModal.addEventListener("click", e => {
      if (e.target === pdfModal) closePdf();
    });
  }
  if (pdfContent) {
    pdfContent.addEventListener("click", e => e.stopPropagation());
  }

  /* Keywords modal close rules */
  const kwModal = document.getElementById("keywordsModal");
  const kwContent = document.querySelector(".keywords-modal-content");

  if (kwModal) {
    kwModal.addEventListener("click", e => {
      if (e.target === kwModal) closeKeywordsModal();
    });
  }
  if (kwContent) {
    kwContent.addEventListener("click", e => e.stopPropagation());
  }

  /* Escape key closes whichever modal is open */
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closePdf();
      closeKeywordsModal();
    }
  });
});

//pdf modal

function openPdfModal(file, titleText) {
  const modal  = document.getElementById("pdfModal");
  const frame  = document.getElementById("pdfFrame");
  const title  = document.getElementById("pdfTitle");

  if (frame)  frame.src = file || "";
  if (title)  title.textContent = titleText || "Knowledge Organiser";
  if (modal)  modal.classList.add("active");
}

function closePdfModal() {
  const modal = document.getElementById("pdfModal");
  const frame = document.getElementById("pdfFrame");

  if (frame) frame.src = "";
  if (modal) modal.classList.remove("active");
}

document.addEventListener("DOMContentLoaded", function () {
  /* Wire up KO buttons */
  document.querySelectorAll(".btn[data-file]").forEach(link => {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      const file  = link.getAttribute("data-file");
      const title =
        link.closest("section")?.querySelector("h2")?.textContent.trim()
        || "Knowledge Organiser";
      openPdfModal(file, title);
    });
  });

  const modal     = document.getElementById("pdfModal");
  const content   = document.querySelector(".pdf-modal-content");
  const closeBtn  = document.getElementById("closePdf");

  /* Close via X button */
  if (closeBtn) {
    closeBtn.addEventListener("click", function () {
      closePdfModal();
    });
  }

  /* Close when clicking dark background */
  if (modal) {
    modal.addEventListener("click", function (e) {
      if (e.target === modal) {
        closePdfModal();
      }
    });
  }

  /* Don't close when clicking inside the white content card */
  if (content) {
    content.addEventListener("click", function (e) {
      e.stopPropagation();
    });
  }

  /* Close on Escape key */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closePdfModal();
    }
  });
});
