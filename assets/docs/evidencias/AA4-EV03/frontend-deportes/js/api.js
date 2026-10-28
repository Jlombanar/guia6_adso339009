/* =========================================================
   api.js · Capa de datos
   Simula el back-end con localStorage. Las tablas y columnas
   son las de la base de datos «deportes» (AA2-EV02). Cuando
   exista el servidor, solo se cambia este archivo por fetch().
   ========================================================= */
"use strict";

const API = (() => {
  const CLAVE = "deportes-bd";

  const SEMILLA = {
    Users: [
      { id_user: 1, NOmnbre: "Laura Gómez", Edad: 24, Correo: "lg@mail.co", Passwords: "Lg#2026" },
      { id_user: 2, NOmnbre: "Andrés Rojas", Edad: 31, Correo: "ar@mail.co", Passwords: "Ar#2026" },
    ],
    productos: [
      { Id_producto: 1, Nombre: "Balón de fútbol N.º 5", Precio: 89900, Stock: 30, categoria: "Balones", imagen: "balon.svg" },
      { Id_producto: 2, Nombre: "Raqueta de tenis", Precio: 245000, Stock: 12, categoria: "Accesorios", imagen: "raqueta.svg" },
      { Id_producto: 3, Nombre: "Camiseta deportiva", Precio: 59900, Stock: 50, categoria: "Ropa", imagen: "camiseta.svg" },
      { Id_producto: 4, Nombre: "Guayos de fútbol", Precio: 210000, Stock: 5, categoria: "Ropa", imagen: "guayos.svg" },
      { Id_producto: 5, Nombre: "Balón de baloncesto", Precio: 99900, Stock: 18, categoria: "Balones", imagen: "baloncesto.svg" },
      { Id_producto: 6, Nombre: "Rodilleras de voleibol", Precio: 45000, Stock: 3, categoria: "Accesorios", imagen: "rodilleras.svg" },
      { Id_producto: 7, Nombre: "Termo deportivo", Precio: 32000, Stock: 40, categoria: "Accesorios", imagen: "termo.svg" },
      { Id_producto: 8, Nombre: "Juego de pesas 10 kg", Precio: 120000, Stock: 0, categoria: "Accesorios", imagen: "pesas.svg" },
    ],
    pedido: [
      { Id_pedido: 1, id_user: 1, Fecha: "2026-10-20" },
      { Id_pedido: 2, id_user: 2, Fecha: "2026-10-21" },
    ],
    detalle_pedido: [
      { Id_detalle: 1, Id_pedido: 1, Id_producto: 1, Cantidad: 2 },
      { Id_detalle: 2, Id_pedido: 1, Id_producto: 3, Cantidad: 3 },
      { Id_detalle: 3, Id_pedido: 2, Id_producto: 2, Cantidad: 1 },
    ],
  };

  function leer() {
    try {
      const datos = JSON.parse(localStorage.getItem(CLAVE));
      if (datos) return datos;
    } catch (error) {
      console.warn("No se pudo leer localStorage", error);
    }
    return structuredClone(SEMILLA);
  }

  function guardar(bd) {
    try {
      localStorage.setItem(CLAVE, JSON.stringify(bd));
    } catch (error) {
      console.warn("No se pudo guardar en localStorage", error);
    }
  }

  // Equivale a AUTO_INCREMENT
  const siguienteId = (filas, campo) => filas.reduce((max, f) => Math.max(max, f[campo]), 0) + 1;

  return {
    productos() {
      return leer().productos;
    },

    producto(id) {
      return leer().productos.find((p) => p.Id_producto === id);
    },

    iniciarSesion(correo, clave) {
      const usuario = leer().Users.find((u) => u.Correo === correo && u.Passwords === clave);
      if (!usuario) return null;
      // Nunca se guarda la contraseña en la sesión
      return { id_user: usuario.id_user, nombre: usuario.NOmnbre };
    },

    registrar({ nombre, edad, correo, clave }) {
      const bd = leer();
      if (bd.Users.some((u) => u.Correo === correo)) {
        throw new Error("Ya existe una cuenta con ese correo.");
      }
      const nuevo = {
        id_user: siguienteId(bd.Users, "id_user"),
        NOmnbre: nombre,
        Edad: edad,
        Correo: correo,
        Passwords: clave,
      };
      bd.Users.push(nuevo);
      guardar(bd);
      return nuevo.id_user;
    },

    // Registra el pedido y su detalle, y descuenta el stock
    crearPedido(id_user, items) {
      const bd = leer();
      for (const item of items) {
        const prod = bd.productos.find((p) => p.Id_producto === item.Id_producto);
        if (!prod || prod.Stock < item.Cantidad) {
          throw new Error(`No hay stock suficiente de ${prod ? prod.Nombre : "un producto"}.`);
        }
      }
      const Id_pedido = siguienteId(bd.pedido, "Id_pedido");
      const hoy = new Date();
      const Fecha = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
      bd.pedido.push({ Id_pedido, id_user, Fecha });
      for (const item of items) {
        bd.detalle_pedido.push({
          Id_detalle: siguienteId(bd.detalle_pedido, "Id_detalle"),
          Id_pedido,
          Id_producto: item.Id_producto,
          Cantidad: item.Cantidad,
        });
        bd.productos.find((p) => p.Id_producto === item.Id_producto).Stock -= item.Cantidad;
      }
      guardar(bd);
      return Id_pedido;
    },

    // SELECT … FROM pedido JOIN detalle_pedido JOIN productos WHERE id_user = ?
    pedidosDe(id_user) {
      const bd = leer();
      return bd.pedido
        .filter((p) => p.id_user === id_user)
        .map((p) => {
          const lineas = bd.detalle_pedido
            .filter((d) => d.Id_pedido === p.Id_pedido)
            .map((d) => {
              const prod = bd.productos.find((x) => x.Id_producto === d.Id_producto);
              return { Nombre: prod.Nombre, Precio: prod.Precio, Cantidad: d.Cantidad, subtotal: prod.Precio * d.Cantidad };
            });
          return { ...p, lineas, total: lineas.reduce((s, l) => s + l.subtotal, 0) };
        })
        .sort((a, b) => b.Id_pedido - a.Id_pedido);
    },

    reiniciar() {
      localStorage.removeItem(CLAVE);
    },
  };
})();
