/* ==========================================================================
   relogio.js — equivalente a relógio.py
   Exibe o horário atual no topo da tela de Conteúdo, atualizado a cada segundo.
   ========================================================================== */

const Relogio = (() => {
  let intervaloId = null;

  function _formatar(data) {
    const h = String(data.getHours()).padStart(2, '0');
    const m = String(data.getMinutes()).padStart(2, '0');
    const s = String(data.getSeconds()).padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  function iniciar() {
    const elemento = document.getElementById('relogio-hora');
    if (!elemento) return;
    if (intervaloId) clearInterval(intervaloId);
    const atualizar = () => { elemento.textContent = _formatar(new Date()); };
    atualizar();
    intervaloId = setInterval(atualizar, 1000);
  }

  function parar() {
    if (intervaloId) clearInterval(intervaloId);
    intervaloId = null;
  }

  return { iniciar, parar };
})();
