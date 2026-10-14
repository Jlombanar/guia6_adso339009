import { loadComponent, loadSharedComponents } from "./component-loader.js";

const tabs = [...document.querySelectorAll('[role="tab"]')];

async function activateTab(selectedTab, moveFocus = false) {
  for (const tab of tabs) {
    const isSelected = tab === selectedTab;
    tab.setAttribute("aria-selected", String(isSelected));
    tab.tabIndex = isSelected ? 0 : -1;
    const panel = document.getElementById(tab.getAttribute("aria-controls"));
    panel.hidden = !isSelected;
    if (isSelected && !panel.dataset.loaded) {
      panel.setAttribute("aria-busy", "true");
      try {
        await loadComponent(panel, `components/views/${panel.dataset.view}`);
        panel.dataset.loaded = "true";
      } catch (error) {
        console.error(error);
        panel.textContent = "No fue posible cargar esta sección. Abre la página mediante un servidor local.";
      } finally {
        panel.removeAttribute("aria-busy");
      }
    }
  }
  if (moveFocus) selectedTab.focus();
}

for (const [index, tab] of tabs.entries()) {
  tab.addEventListener("click", () => activateTab(tab));
  tab.addEventListener("keydown", (event) => {
    let nextIndex;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = tabs.length - 1;
    if (nextIndex !== undefined) {
      event.preventDefault();
      activateTab(tabs[nextIndex], true);
    }
  });
}

loadSharedComponents();
if (tabs[0]) activateTab(tabs[0]);
