/* =========================================================
   validacion.js · Validación accesible de formularios
   Usa la API de validación de HTML5 (required, type, min,
   maxlength…) y muestra mensajes propios en .campo__error.
   ========================================================= */
"use strict";

const Validacion = (() => {
  function mensajePara(entrada) {
    const v = entrada.validity;
    // data-nombre permite un texto natural: «Escribe tu correo.»
    const etiqueta = entrada.dataset.nombre || "este campo";
    if (v.valueMissing) return `Escribe ${etiqueta}.`;
    if (v.typeMismatch && entrada.type === "email") return "Escribe un correo válido, por ejemplo lg@mail.co.";
    if (v.tooShort) return `Usa al menos ${entrada.minLength} caracteres.`;
    if (v.tooLong) return `Usa máximo ${entrada.maxLength} caracteres.`;
    if (v.rangeUnderflow) return `El valor mínimo es ${entrada.min}.`;
    if (v.rangeOverflow) return `El valor máximo es ${entrada.max}.`;
    if (v.badInput || v.stepMismatch) return "Escribe un número entero.";
    if (v.customError) return entrada.validationMessage;
    return "";
  }

  function mostrarError(entrada, mensaje) {
    const error = document.getElementById(`${entrada.id}-error`);
    entrada.setAttribute("aria-invalid", mensaje ? "true" : "false");
    if (!error) return;
    error.textContent = mensaje;
    error.hidden = !mensaje;
  }

  function validarCampo(entrada) {
    const mensaje = entrada.checkValidity() ? "" : mensajePara(entrada);
    mostrarError(entrada, mensaje);
    return !mensaje;
  }

  // Devuelve true si todo es válido; si no, lleva el foco al primer error
  function validarFormulario(formulario) {
    const entradas = [...formulario.querySelectorAll(".campo__entrada")];
    const invalidas = entradas.filter((e) => !validarCampo(e));
    if (invalidas.length) invalidas[0].focus();
    return invalidas.length === 0;
  }

  // Valida al salir del campo y vuelve a validar mientras se corrige
  function activar(formulario) {
    formulario.noValidate = true;
    formulario.querySelectorAll(".campo__entrada").forEach((entrada) => {
      entrada.addEventListener("blur", () => entrada.value && validarCampo(entrada));
      entrada.addEventListener("input", () => {
        if (entrada.getAttribute("aria-invalid") === "true") validarCampo(entrada);
      });
    });
  }

  return { activar, validarCampo, validarFormulario, mostrarError };
})();
