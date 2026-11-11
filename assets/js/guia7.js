// El menú lateral se comparte con la Guía 6: aquí se marca la Guía 7 como actual.
// activities.js carga los componentes y el catálogo, igual que en explorar.html.
function markCurrentGuide() {
  const links = document.querySelectorAll(".guide-link");
  links.forEach((link) => {
    const isGuide7 = link.getAttribute("href") === "guia7.html";
    link.classList.toggle("is-current", isGuide7);
    if (isGuide7) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
    link.querySelector(".guide-state")?.remove();
  });
  const current = document.querySelector('.guide-link[href="guia7.html"]');
  current?.insertAdjacentHTML("beforeend", '<span class="guide-state">Actual</span>');
}

document.addEventListener("adso:componentsLoaded", markCurrentGuide, { once: true });
