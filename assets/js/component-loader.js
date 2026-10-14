export async function loadComponent(target, url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`No se pudo cargar ${url}: ${response.status}`);
  target.innerHTML = await response.text();
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
}
