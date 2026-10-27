// 1. Modo oscuro: agrega o quita la clase "dark" en <html>
const botonTema = document.getElementById("boton-tema");

function aplicarTema(oscuro) {
  document.documentElement.classList.toggle("dark", oscuro);
  botonTema.setAttribute("aria-pressed", String(oscuro));
  botonTema.textContent = oscuro ? "☀️ Modo claro" : "🌙 Modo oscuro";
}

botonTema.addEventListener("click", () => {
  const oscuro = !document.documentElement.classList.contains("dark");
  aplicarTema(oscuro);
  try {
    localStorage.setItem("tema", oscuro ? "oscuro" : "claro");
  } catch {}
});

try {
  aplicarTema(localStorage.getItem("tema") === "oscuro");
} catch {}

// 2. Botones "Copiar": copian el código del bloque al portapapeles
document.querySelectorAll(".copiar").forEach((boton) => {
  boton.addEventListener("click", async () => {
    const codigo = boton.closest("figure").querySelector("code").textContent;
    try {
      await navigator.clipboard.writeText(codigo);
      boton.textContent = "¡Copiado!";
    } catch {
      boton.textContent = "No se pudo copiar";
    }
    setTimeout(() => (boton.textContent = "Copiar"), 1500);
  });
});

// 3. Botón para volver al índice
const botonArriba = document.getElementById("volver-arriba");

window.addEventListener("scroll", () => {
  botonArriba.hidden = window.scrollY < 400;
});
