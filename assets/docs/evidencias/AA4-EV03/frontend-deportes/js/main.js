/* =========================================================
   main.js · Sesión, utilidades y lógica de cada página
   Cada <body> declara su página con data-pagina="…".
   ========================================================= */
"use strict";

const Sesion = {
  CLAVE: "deportes-sesion",
  actual() {
    try {
      return JSON.parse(sessionStorage.getItem(this.CLAVE));
    } catch {
      return null;
    }
  },
  iniciar(usuario) {
    sessionStorage.setItem(this.CLAVE, JSON.stringify(usuario));
  },
  cerrar() {
    sessionStorage.removeItem(this.CLAVE);
  },
};

/* ---------- Utilidades ---------- */
const formatoPesos = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const pesos = (valor) => formatoPesos.format(valor);
const fechaLarga = (iso) => {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
};

let temporizadorAviso;
function avisar(mensaje) {
  const aviso = document.getElementById("aviso");
  if (!aviso) return;
  aviso.textContent = mensaje;
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => (aviso.textContent = ""), 3000);
}

// Crea elementos sin usar innerHTML con datos (evita inyección de HTML)
function crear(etiqueta, atributos = {}, ...hijos) {
  const el = document.createElement(etiqueta);
  for (const [k, v] of Object.entries(atributos)) {
    if (k === "texto") el.textContent = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (v !== false && v !== null && v !== undefined) el.setAttribute(k, v === true ? "" : v);
  }
  el.append(...hijos.filter(Boolean));
  return el;
}

/* ---------- Encabezado común ---------- */
function actualizarContador() {
  const total = Carrito.totalUnidades();
  document.querySelectorAll(".contador").forEach((c) => {
    c.textContent = total || "";
    c.dataset.valor = total;
  });
  const enlace = document.getElementById("enlace-carrito");
  if (enlace) enlace.setAttribute("aria-label", `Carrito, ${total} ${total === 1 ? "producto" : "productos"}`);
}

function iniciarEncabezado(usuario) {
  const nombre = document.getElementById("usuario-nombre");
  if (nombre) nombre.textContent = usuario.nombre.split(" ")[0];
  document.getElementById("btn-salir")?.addEventListener("click", () => {
    Sesion.cerrar();
    location.href = "login.html";
  });
  actualizarContador();
  document.addEventListener("carrito:cambio", actualizarContador);
}

/* ---------- Login ---------- */
function paginaLogin() {
  const form = document.getElementById("form-login");
  const alerta = document.getElementById("alerta-login");
  Validacion.activar(form);

  if (new URLSearchParams(location.search).has("registro")) {
    alerta.className = "alerta alerta--exito";
    alerta.textContent = "Cuenta creada. Ya puedes iniciar sesión.";
    alerta.hidden = false;
  }

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    alerta.hidden = true;
    if (!Validacion.validarFormulario(form)) return;
    const usuario = API.iniciarSesion(form.correo.value.trim(), form.clave.value);
    if (!usuario) {
      alerta.className = "alerta alerta--error";
      alerta.textContent = "Correo o contraseña incorrectos. Revisa los datos e inténtalo de nuevo.";
      alerta.hidden = false;
      form.clave.value = "";
      form.clave.focus();
      return;
    }
    Sesion.iniciar(usuario);
    location.href = "catalogo.html";
  });
}

/* ---------- Registro ---------- */
function paginaRegistro() {
  const form = document.getElementById("form-registro");
  const alerta = document.getElementById("alerta-registro");
  Validacion.activar(form);

  // La confirmación debe coincidir con la contraseña
  const confirmar = form.confirmar;
  const revisarCoincidencia = () =>
    confirmar.setCustomValidity(confirmar.value && confirmar.value !== form.clave.value ? "Las contraseñas no coinciden." : "");
  confirmar.addEventListener("input", revisarCoincidencia);
  form.clave.addEventListener("input", revisarCoincidencia);

  form.addEventListener("submit", (evento) => {
    evento.preventDefault();
    alerta.hidden = true;
    revisarCoincidencia();
    if (!Validacion.validarFormulario(form)) return;
    try {
      API.registrar({
        nombre: form.nombre.value.trim(),
        edad: Number(form.edad.value),
        correo: form.correo.value.trim(),
        clave: form.clave.value,
      });
      location.href = "login.html?registro=ok";
    } catch (error) {
      alerta.textContent = error.message;
      alerta.hidden = false;
      form.correo.focus();
    }
  });
}

/* ---------- Catálogo ---------- */
function insigniaStock(stock) {
  if (stock === 0) return crear("span", { class: "badge badge--agotado", texto: "Agotado" });
  if (stock <= 5) return crear("span", { class: "badge badge--bajo", texto: `Quedan ${stock}` });
  return crear("span", { class: "badge badge--ok", texto: `Stock: ${stock}` });
}

function tarjetaProducto(p) {
  const enCarrito = Carrito.cantidadDe(p.Id_producto);
  const agotado = p.Stock === 0;
  const sinMas = !agotado && enCarrito >= p.Stock;
  return crear(
    "li",
    {},
    crear(
      "article",
      { class: "tarjeta-producto", "aria-labelledby": `prod-${p.Id_producto}` },
      crear("img", { class: "tarjeta-producto__imagen", src: `img/${p.imagen}`, alt: "", width: 160, height: 120, loading: "lazy" }),
      crear("h2", { class: "tarjeta-producto__nombre", id: `prod-${p.Id_producto}`, tabindex: -1, texto: p.Nombre }),
      crear("p", { class: "tarjeta-producto__precio" }, crear("data", { value: p.Precio, texto: pesos(p.Precio) })),
      insigniaStock(p.Stock),
      crear(
        "div",
        { class: "tarjeta-producto__pie" },
        crear("button", {
          class: "btn btn--accion btn--bloque",
          type: "button",
          disabled: agotado || sinMas,
          "aria-describedby": `prod-${p.Id_producto}`,
          texto: agotado ? "Agotado" : sinMas ? "Máximo en carrito" : enCarrito ? "Agregar otro" : "Agregar",
          onclick: () => {
            Carrito.agregar(p.Id_producto);
            avisar(`${p.Nombre} se agregó al carrito.`);
            pintarCatalogo();
            // Al volver a pintar, el foco regresa a la misma tarjeta
            const boton = document.querySelector(`[aria-describedby="prod-${p.Id_producto}"]`);
            (boton.disabled ? document.getElementById(`prod-${p.Id_producto}`) : boton).focus();
          },
        })
      )
    )
  );
}

const filtroCatalogo = { texto: "", categoria: "Todos" };

function pintarCatalogo() {
  const rejilla = document.getElementById("rejilla");
  const estado = document.getElementById("estado-catalogo");
  const texto = filtroCatalogo.texto.toLowerCase();
  const lista = API.productos().filter(
    (p) =>
      (filtroCatalogo.categoria === "Todos" || p.categoria === filtroCatalogo.categoria) &&
      p.Nombre.toLowerCase().includes(texto)
  );
  rejilla.replaceChildren(...lista.map(tarjetaProducto));
  document.getElementById("sin-resultados").hidden = lista.length > 0;
  estado.textContent = `${lista.length} ${lista.length === 1 ? "producto" : "productos"}`;
}

function paginaCatalogo() {
  const buscador = document.getElementById("buscar");
  document.getElementById("form-buscar").addEventListener("submit", (e) => e.preventDefault());
  buscador.addEventListener("input", () => {
    filtroCatalogo.texto = buscador.value.trim();
    pintarCatalogo();
  });
  document.querySelectorAll(".filtros__opcion").forEach((boton) => {
    boton.addEventListener("click", () => {
      document.querySelectorAll(".filtros__opcion").forEach((b) => b.setAttribute("aria-pressed", "false"));
      boton.setAttribute("aria-pressed", "true");
      filtroCatalogo.categoria = boton.dataset.categoria;
      pintarCatalogo();
    });
  });
  document.getElementById("limpiar-busqueda").addEventListener("click", () => {
    buscador.value = "";
    filtroCatalogo.texto = "";
    pintarCatalogo();
    buscador.focus();
  });
  pintarCatalogo();
}

/* ---------- Carrito ---------- */
function itemCarrito(p) {
  const cambiar = (n) => {
    Carrito.cambiarCantidad(p.Id_producto, n);
    pintarCarrito();
    document.getElementById(`cant-${p.Id_producto}`)?.focus();
  };
  return crear(
    "li",
    { class: "item-carrito" },
    crear("img", { class: "item-carrito__imagen", src: `img/${p.imagen}`, alt: "", width: 160, height: 120 }),
    crear(
      "div",
      {},
      crear("h2", { class: "item-carrito__nombre", texto: p.Nombre }),
      crear("p", { class: "item-carrito__precio", texto: `${pesos(p.Precio)} c/u · Subtotal ${pesos(p.Precio * p.Cantidad)}` }),
      crear(
        "div",
        { class: "cantidad", role: "group", "aria-label": `Cantidad de ${p.Nombre}` },
        crear("button", {
          class: "cantidad__btn", type: "button", "aria-label": "Quitar una unidad", texto: "−",
          disabled: p.Cantidad <= 1, onclick: () => cambiar(p.Cantidad - 1),
        }),
        crear("input", {
          class: "cantidad__valor", id: `cant-${p.Id_producto}`, type: "number", inputmode: "numeric",
          min: 1, max: p.Stock, value: p.Cantidad, "aria-label": "Cantidad",
          onchange: (e) => cambiar(Number(e.target.value) || 1),
        }),
        crear("button", {
          class: "cantidad__btn", type: "button", "aria-label": "Agregar una unidad", texto: "+",
          disabled: p.Cantidad >= p.Stock, onclick: () => cambiar(p.Cantidad + 1),
        })
      )
    ),
    crear("button", {
      class: "btn btn--icono", type: "button", "aria-label": `Quitar ${p.Nombre} del carrito`, texto: "🗑",
      onclick: () => {
        Carrito.quitar(p.Id_producto);
        avisar(`${p.Nombre} se quitó del carrito.`);
        pintarCarrito();
      },
    })
  );
}

function pintarCarrito() {
  const detalle = Carrito.detalle();
  const hayItems = detalle.length > 0;
  document.getElementById("carrito-vacio").hidden = hayItems;
  document.getElementById("carrito-contenido").hidden = !hayItems;
  document.getElementById("lista-carrito").replaceChildren(...detalle.map(itemCarrito));
  const unidades = Carrito.totalUnidades();
  document.getElementById("res-unidades").textContent = `Productos (${unidades})`;
  document.getElementById("res-subtotal").textContent = pesos(Carrito.totalPesos());
  document.getElementById("res-total").textContent = pesos(Carrito.totalPesos());
}

function paginaCarrito(usuario) {
  const modal = document.getElementById("modal-confirmar");
  document.getElementById("btn-confirmar").addEventListener("click", () => {
    document.getElementById("confirmar-texto").textContent =
      `Se registrarán ${Carrito.totalUnidades()} productos por un total de ${pesos(Carrito.totalPesos())}.`;
    modal.showModal();
  });
  document.getElementById("btn-cancelar").addEventListener("click", () => modal.close());
  document.getElementById("form-confirmar").addEventListener("submit", (evento) => {
    evento.preventDefault();
    try {
      const id = API.crearPedido(usuario.id_user, Carrito.items());
      Carrito.vaciar();
      location.href = `pedidos.html?nuevo=${id}`;
    } catch (error) {
      modal.close();
      avisar(error.message);
      pintarCarrito();
    }
  });
  pintarCarrito();
}

/* ---------- Mis pedidos ---------- */
function paginaPedidos(usuario) {
  const pedidos = API.pedidosDe(usuario.id_user);
  const cuerpo = document.getElementById("cuerpo-pedidos");
  const modal = document.getElementById("modal-detalle");
  const nuevo = Number(new URLSearchParams(location.search).get("nuevo"));

  document.getElementById("sin-pedidos").hidden = pedidos.length > 0;
  document.getElementById("tabla-pedidos").hidden = pedidos.length === 0;
  if (nuevo) {
    const alerta = document.getElementById("alerta-pedido");
    alerta.textContent = `¡Pedido N.º ${nuevo} registrado! Puedes ver su detalle en la tabla.`;
    alerta.hidden = false;
  }

  const abrirDetalle = (p) => {
    document.getElementById("detalle-titulo").textContent = `Pedido N.º ${p.Id_pedido} · ${fechaLarga(p.Fecha)}`;
    document.getElementById("detalle-cuerpo").replaceChildren(
      ...p.lineas.map((l) =>
        crear("tr", {},
          crear("td", { texto: l.Nombre }),
          crear("td", { class: "num", texto: l.Cantidad }),
          crear("td", { class: "num", texto: pesos(l.subtotal) })
        )
      )
    );
    document.getElementById("detalle-total").textContent = pesos(p.total);
    modal.showModal();
  };

  cuerpo.replaceChildren(
    ...pedidos.map((p) =>
      crear("tr", { "aria-current": p.Id_pedido === nuevo ? "true" : false },
        crear("th", { scope: "row", texto: p.Id_pedido }),
        crear("td", {}, crear("time", { datetime: p.Fecha, texto: fechaLarga(p.Fecha) })),
        crear("td", { class: "num opcional", texto: p.lineas.reduce((s, l) => s + l.Cantidad, 0) }),
        crear("td", { class: "num", texto: pesos(p.total) }),
        crear("td", {},
          crear("button", {
            class: "btn btn--texto", type: "button", texto: "Ver detalle",
            "aria-label": `Ver detalle del pedido ${p.Id_pedido}`, onclick: () => abrirDetalle(p),
          })
        )
      )
    )
  );
}

/* ---------- Arranque ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const pagina = document.body.dataset.pagina;
  if (pagina === "login") return paginaLogin();
  if (pagina === "registro") return paginaRegistro();

  // Las páginas de la tienda exigen sesión iniciada
  const usuario = Sesion.actual();
  if (!usuario) {
    location.replace("login.html");
    return;
  }
  iniciarEncabezado(usuario);
  if (pagina === "catalogo") paginaCatalogo();
  if (pagina === "carrito") paginaCarrito(usuario);
  if (pagina === "pedidos") paginaPedidos(usuario);
});
