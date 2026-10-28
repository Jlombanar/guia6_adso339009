/* =========================================================
   carrito.js · Estado del carrito de compras
   Guarda solo { Id_producto, Cantidad } por usuario; el
   nombre y el precio se leen siempre de la capa de datos.
   ========================================================= */
"use strict";

const Carrito = (() => {
  const clave = () => `deportes-carrito-${Sesion.actual()?.id_user ?? "anonimo"}`;

  function items() {
    try {
      return JSON.parse(localStorage.getItem(clave())) || [];
    } catch {
      return [];
    }
  }

  function guardar(lista) {
    localStorage.setItem(clave(), JSON.stringify(lista));
    document.dispatchEvent(new CustomEvent("carrito:cambio"));
  }

  function cantidadDe(id) {
    return items().find((i) => i.Id_producto === id)?.Cantidad ?? 0;
  }

  // Devuelve la cantidad final; nunca supera el stock
  function agregar(id, cantidad = 1) {
    const producto = API.producto(id);
    const lista = items();
    const item = lista.find((i) => i.Id_producto === id);
    const actual = item ? item.Cantidad : 0;
    const nueva = Math.min(actual + cantidad, producto.Stock);
    if (item) item.Cantidad = nueva;
    else if (nueva > 0) lista.push({ Id_producto: id, Cantidad: nueva });
    guardar(lista);
    return nueva;
  }

  function cambiarCantidad(id, cantidad) {
    const producto = API.producto(id);
    const lista = items();
    const item = lista.find((i) => i.Id_producto === id);
    if (!item) return;
    item.Cantidad = Math.max(1, Math.min(cantidad, producto.Stock));
    guardar(lista);
  }

  function quitar(id) {
    guardar(items().filter((i) => i.Id_producto !== id));
  }

  function vaciar() {
    guardar([]);
  }

  // Une cada ítem con los datos del producto
  function detalle() {
    return items()
      .map((i) => ({ ...API.producto(i.Id_producto), Cantidad: i.Cantidad }))
      .filter((p) => p.Id_producto !== undefined);
  }

  const totalUnidades = () => items().reduce((s, i) => s + i.Cantidad, 0);
  const totalPesos = () => detalle().reduce((s, p) => s + p.Precio * p.Cantidad, 0);

  return { items, agregar, cambiarCantidad, quitar, vaciar, detalle, cantidadDe, totalUnidades, totalPesos };
})();
