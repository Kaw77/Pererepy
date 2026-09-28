/* ==========================================================================
   calendario.js — equivalente a calendário.py
   Painel de calendário mensal simples, exibido na tela de Conteúdo.
   ========================================================================== */

const Calendario = (() => {
  let dataReferencia = new Date();

  const NOMES_MESES = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
  ];

  function render() {
    const grade = document.getElementById('cal-grade');
    const rotulo = document.getElementById('cal-mes-ano');
    if (!grade || !rotulo) return;

    const ano = dataReferencia.getFullYear();
    const mes = dataReferencia.getMonth();
    rotulo.textContent = `${NOMES_MESES[mes]} ${ano}`;

    const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
    const totalDias = new Date(ano, mes + 1, 0).getDate();

    const hoje = new Date();
    const ehMesAtual = hoje.getFullYear() === ano && hoje.getMonth() === mes;

    let html = '';
    for (let i = 0; i < primeiroDiaSemana; i++) {
      html += `<span class="cal-dia cal-vazio"></span>`;
    }
    for (let dia = 1; dia <= totalDias; dia++) {
      const ehHoje = ehMesAtual && hoje.getDate() === dia;
      html += `<span class="cal-dia ${ehHoje ? 'cal-hoje' : ''}">${dia}</span>`;
    }
    grade.innerHTML = html;
  }

  function mesAnterior() {
    dataReferencia = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() - 1, 1);
    render();
  }

  function mesSeguinte() {
    dataReferencia = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() + 1, 1);
    render();
  }

  function alternarPainel() {
    const painel = document.getElementById('painel-calendario');
    if (!painel) return;
    painel.classList.toggle('oculto');
    if (!painel.classList.contains('oculto')) render();
  }

  function inicializar() {
    document.getElementById('btn-abrir-calendario')?.addEventListener('click', alternarPainel);
    document.getElementById('cal-mes-anterior')?.addEventListener('click', mesAnterior);
    document.getElementById('cal-mes-seguinte')?.addEventListener('click', mesSeguinte);
  }

  return { inicializar, render };
})();
