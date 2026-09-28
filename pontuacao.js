/* ==========================================================================
   pontuacao.js — equivalente a pontuacao.py
   Regras de pontuação e verificação de aprovação:
   - Meta: 100 pontos em conteúdo.js (questões fáceis=2, médias=3, difíceis=4 +
     curtidas contam como atividade extra)
   - Meta: 2 respostas no fórum
   - Meta: 10 minutos (600s) assistidos em shorts.js
   Se as 3 metas forem batidas: APROVADO (mostra botão Sair).
   Caso contrário: REPROVADO (permite recomeçar as atividades).
   ========================================================================== */

const Pontuacao = (() => {

  const META_PONTOS_CONTEUDO = 100;
  const META_RESPOSTAS_FORUM = 2;
  const META_SEGUNDOS_SHORTS = 10 * 60; // 10 minutos

  function adicionarPontosConteudo(pontos) {
    const usuario = Perfil.getUsuarioAtual();
    if (!usuario) return;
    Perfil.atualizarLocal({ pontos_conteudo: (usuario.pontos_conteudo || 0) + pontos });
    Perfil.sincronizarComTabela();
  }

  function registrarCurtida() {
    const usuario = Perfil.getUsuarioAtual();
    if (!usuario) return;
    // Curtidas contam como atividade: cada curtida vale 1 ponto extra de engajamento
    Perfil.atualizarLocal({ curtidas_dadas: (usuario.curtidas_dadas || 0) + 1 });
    Perfil.sincronizarComTabela();
  }

  function registrarRespostaForum() {
    const usuario = Perfil.getUsuarioAtual();
    if (!usuario) return;
    Perfil.atualizarLocal({ respostas_forum: (usuario.respostas_forum || 0) + 1 });
    Perfil.sincronizarComTabela();
  }

  function adicionarTempoShorts(segundos) {
    const usuario = Perfil.getUsuarioAtual();
    if (!usuario) return;
    Perfil.atualizarLocal({ tempo_shorts_seg: (usuario.tempo_shorts_seg || 0) + segundos });
    Perfil.sincronizarComTabela();
  }

  function obterProgresso() {
    const usuario = Perfil.getUsuarioAtual() || {};
    return {
      pontosConteudo: usuario.pontos_conteudo || 0,
      respostasForum: usuario.respostas_forum || 0,
      segundosShorts: usuario.tempo_shorts_seg || 0,
      curtidasDadas: usuario.curtidas_dadas || 0,
      metaPontos: META_PONTOS_CONTEUDO,
      metaForum: META_RESPOSTAS_FORUM,
      metaSegundosShorts: META_SEGUNDOS_SHORTS
    };
  }

  function verificarAprovacao() {
    const p = obterProgresso();
    const aprovado = p.pontosConteudo >= p.metaPontos &&
                      p.respostasForum >= p.metaForum &&
                      p.segundosShorts >= p.metaSegundosShorts;

    Perfil.atualizarLocal({ aprovado });
    Perfil.sincronizarComTabela();
    return { aprovado, progresso: p };
  }

  function renderizarTela() {
    const p = obterProgresso();

    document.getElementById('pt-pontos-atual').textContent = p.pontosConteudo;
    document.getElementById('pt-forum-atual').textContent = p.respostasForum;
    document.getElementById('pt-shorts-atual').textContent = Math.floor(p.segundosShorts / 60);
    document.getElementById('pt-curtidas-atual').textContent = p.curtidasDadas;

    const pctPontos = Math.min(100, (p.pontosConteudo / p.metaPontos) * 100);
    const pctForum = Math.min(100, (p.respostasForum / p.metaForum) * 100);
    const pctShorts = Math.min(100, (p.segundosShorts / p.metaSegundosShorts) * 100);

    document.getElementById('barra-pontos').style.width = pctPontos + '%';
    document.getElementById('barra-forum').style.width = pctForum + '%';
    document.getElementById('barra-shorts').style.width = pctShorts + '%';

    document.getElementById('resultado-final').classList.add('oculto');
  }

  function _formatarTempo(segundos) {
    const min = Math.floor(segundos / 60);
    const seg = Math.floor(segundos % 60);
    return `${min}min ${seg}s`;
  }

  function exibirResultado() {
    const { aprovado, progresso } = verificarAprovacao();
    const painel = document.getElementById('resultado-final');
    const conteudo = document.getElementById('resultado-conteudo');
    const btnVerificar = document.getElementById('btn-verificar-pontuacao');

    painel.classList.remove('oculto', 'aprovado', 'reprovado');

    if (aprovado) {
      painel.classList.add('aprovado');
      conteudo.innerHTML = `
        <i class="fa-solid fa-circle-check"></i>
        <h3>Parabéns, você foi APROVADO! 🎉</h3>
        <p>Você atingiu todas as metas: ${progresso.pontosConteudo} pontos em conteúdo,
        ${progresso.respostasForum} respostas no fórum e ${_formatarTempo(progresso.segundosShorts)} de shorts.</p>
        <button id="btn-sair-aprovado" class="btn-primario"><i class="fa-solid fa-right-from-bracket"></i> Sair do jogo</button>
      `;
      document.getElementById('btn-sair-aprovado')?.addEventListener('click', () => Main.sair());
      btnVerificar.classList.add('oculto');
    } else {
      painel.classList.add('reprovado');
      const faltamPontos = Math.max(0, progresso.metaPontos - progresso.pontosConteudo);
      const faltamForum = Math.max(0, progresso.metaForum - progresso.respostasForum);
      const faltamSegundos = Math.max(0, progresso.metaSegundosShorts - progresso.segundosShorts);
      conteudo.innerHTML = `
        <i class="fa-solid fa-circle-xmark"></i>
        <h3>Ainda não foi dessa vez — REPROVADO</h3>
        <p>
          ${faltamPontos > 0 ? `Faltam <strong>${faltamPontos} pontos</strong> em Conteúdo. ` : ''}
          ${faltamForum > 0 ? `Faltam <strong>${faltamForum} resposta(s)</strong> no Fórum. ` : ''}
          ${faltamSegundos > 0 ? `Faltam <strong>${_formatarTempo(faltamSegundos)}</strong> assistindo Shorts.` : ''}
        </p>
        <button id="btn-recomecar" class="btn-primario"><i class="fa-solid fa-rotate-right"></i> Continuar atividades</button>
      `;
      document.getElementById('btn-recomecar')?.addEventListener('click', () => Main.irPara('menu'));
      btnVerificar.classList.remove('oculto');
    }
  }

  function inicializar() {
    document.getElementById('btn-verificar-pontuacao')?.addEventListener('click', exibirResultado);
  }

  return {
    inicializar,
    adicionarPontosConteudo,
    registrarCurtida,
    registrarRespostaForum,
    adicionarTempoShorts,
    obterProgresso,
    verificarAprovacao,
    renderizarTela
  };
})();
