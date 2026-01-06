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