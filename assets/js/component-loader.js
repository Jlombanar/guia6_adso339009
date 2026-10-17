export async function fetchComponent(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo cargar ${url}: ${response.status}`);
  return response.text();
}

export async function loadComponent(target, url) {
  target.innerHTML = await fetchComponent(url);
}

export async function loadSharedComponents() {
  const components = [...document.querySelectorAll("[data-component]")];
  await Promise.all(components.map(async (target) => {
    try {
      await loadComponent(target, target.dataset.component);
    } catch (error) {
      console.error(error);
      target.textContent = "No fue posible cargar este componente.";
    }
  }));
  document.dispatchEvent(new CustomEvent("adso:componentsLoaded"));
}
