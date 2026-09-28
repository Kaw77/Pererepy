/* ==========================================================================
   main.js — equivalente a main.py
   Ponto de entrada da aplicação. Importa (via <script>) perfil.js, define
   preferências, e conduz o fluxo do "while" de menu principal para as
   páginas conteudo.js, shorts.js e tutorias_duvidas.js, além da tela de
   pontuacao.js. Também mostra estatísticas gerais e o botão Sair.
   ========================================================================== */

const Main = (() => {
  let telaAnterior = 'menu';

  function mostrarTela(nomeTela) {
    document.querySelectorAll('.tela').forEach(tela => tela.classList.remove('tela-ativa'));
    const alvo = document.getElementById(`tela-${nomeTela}`);
    if (alvo) alvo.classList.add('tela-ativa');

    // Pausa recursos da tela de shorts ao sair dela
    if (nomeTela !== 'shorts') {
      Shorts.pausarTudo();
    }
    if (nomeTela !== 'conteudo') {
      Relogio.parar();
      document.getElementById('painel-calendario')?.classList.add('oculto');
    }
  }

  async function irPara(destino) {
    _tocarSom();
    EstatisticaVisita.registrarVisita(destino);

    switch (destino) {
      case 'menu':
        mostrarTela('menu');
        await _carregarMenu();
        break;
      case 'conteudo':
        telaAnterior = 'menu';
        mostrarTela('conteudo');
        Relogio.iniciar();
        Calendario.render();
        await Conteudo.carregarFeed();
        break;
      case 'shorts':
        telaAnterior = 'menu';
        mostrarTela('shorts');
        await Shorts.carregarFeed();
        break;
      case 'forum':
        telaAnterior = 'menu';
        mostrarTela('forum');
        await Forum.carregar();
        break;
      case 'pontuacao':
        telaAnterior = 'menu';
        mostrarTela('pontuacao');
        Pontuacao.renderizarTela();
        break;
      default:
        mostrarTela('menu');
    }
  }

  async function _carregarMenu() {
    const usuario = Perfil.getUsuarioAtual();
    if (!usuario) return;
    document.getElementById('menu-nome-usuario').textContent = usuario.nome;
    document.getElementById('menu-avatar').src = usuario.avatar || 'images/avatar-padrao.png';
    document.getElementById('menu-pontos-total').textContent = usuario.pontos_conteudo || 0;
    await EstatisticaVisita.carregarPainel();
  }

  function _tocarSom() {
    const audio = document.getElementById('som-menu');
    if (audio) {
      audio.currentTime = 0;
      audio.volume = 0.4;
      audio.play().catch(() => {});
    }
  }

  function sair() {
    if (confirm('Deseja realmente sair do jogo?')) {
      Shorts.pausarTudo();
      Relogio.parar();
      mostrarTela('perfil');
      Utils.mostrarToast('Até logo! Volte sempre para continuar aprendendo. 👋', 'info');
    }
  }

  function _configurarNavegacao() {
    document.querySelectorAll('.menu-card').forEach(card => {
      card.addEventListener('click', () => irPara(card.dataset.destino));
    });

    document.querySelectorAll('.btn-voltar').forEach(botao => {
      botao.addEventListener('click', () => irPara(botao.dataset.voltar));
    });

    document.getElementById('btn-sair')?.addEventListener('click', sair);

    document.getElementById('btn-editar-perfil')?.addEventListener('click', () => {
      Perfil.preencherFormularioParaEdicao();
      mostrarTela('perfil');
    });
  }

  async function _aoDefinirPerfil() {
    Perfil.aplicarTema();
    await irPara('menu');
  }

  async function inicializar() {
    // Inicializa todos os módulos (equivalente a "import" no main.py)
    Perfil.inicializar();
    Calendario.inicializar();
    Forum.inicializar();
    Pontuacao.inicializar();
    _configurarNavegacao();

    document.addEventListener('perfil:definido', _aoDefinirPerfil);

    // Tenta recuperar sessão anterior do usuário (localStorage)
    const usuarioSalvo = Perfil.carregarDoStorage();
    if (usuarioSalvo) {
      Perfil.aplicarTema();
      mostrarTela('menu');
      await _carregarMenu();
      EstatisticaVisita.registrarVisita('menu');
    } else {
      mostrarTela('perfil');
    }
  }

  return { inicializar, irPara, mostrarTela, sair };
})();

document.addEventListener('DOMContentLoaded', () => {
  Main.inicializar();
});
