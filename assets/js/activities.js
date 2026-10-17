import { fetchComponent, loadSharedComponents } from "./component-loader.js";

const viewer = document.getElementById("visor");
const viewerTitle = document.getElementById("viewer-title");
const viewerContent = document.getElementById("viewer-content");
let lastActivity = null;
let requestId = 0;

function findActivityLink(id) {
  return id ? document.querySelector(`.activity-explore[href="#${CSS.escape(id)}"]`) : null;
}

function activityTitle(link) {
  const card = link.closest("article");
  const code = card.querySelector(".activity-code")?.firstChild.textContent.trim();
  const name = card.querySelector("h3, h4").textContent.trim().replace(/\s+/g, " ");
  return code && code !== "Punto de partida" ? `${code} · ${name}` : name;
}

async function showActivity(id, link) {
  document.getElementById("actividades").hidden = true;
  viewer.hidden = false;
  viewerTitle.textContent = activityTitle(link);
  viewer.scrollIntoView({ block: "start" });
  viewerTitle.focus({ preventScroll: true });
  lastActivity = id;

  const { view } = link.dataset;
  if (viewerContent.dataset.view === view) return;
  const request = ++requestId;
  viewerContent.setAttribute("aria-busy", "true");
  try {
    const html = await fetchComponent(`components/views/${view}`);
    if (request !== requestId) return;
    viewerContent.innerHTML = html;
    viewerContent.dataset.view = view;
  } catch (error) {
    console.error(error);
    viewerContent.textContent = "No fue posible cargar esta actividad. Abre la página mediante un servidor local.";
    delete viewerContent.dataset.view;
  } finally {
    if (request === requestId) viewerContent.removeAttribute("aria-busy");
  }
}

function showCatalog(id) {
  viewer.hidden = true;
  document.getElementById("actividades").hidden = false;
  const returnLink = id === "actividades" ? findActivityLink(lastActivity) : null;
  if (returnLink) returnLink.focus();
  else if (id) document.getElementById(id)?.scrollIntoView();
}

function route() {
  const id = decodeURIComponent(location.hash.slice(1));
  const link = findActivityLink(id);
  if (link) showActivity(id, link);
  else showCatalog(id);
}

window.addEventListener("hashchange", route);
document.addEventListener("adso:componentsLoaded", route, { once: true });
loadSharedComponents();
