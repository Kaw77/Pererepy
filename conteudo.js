/* ==========================================================================
   conteudo.js — equivalente a conteúdo.py
   Blog dinâmico: lista de posts com "continue lendo", leitura completa,
   curtidas e, ao final de cada post, uma questão (lacuna ou combinação)
   que soma pontos na meta de 100 pontos de conteúdo.
   ========================================================================== */

const Conteudo = (() => {
  let posts = [];
  let questoes = [];
  let questoesUsadasPorPost = {}; // postId -> questaoId já vinculada

  async function carregarFeed() {
    const feedEl = document.getElementById('conteudo-feed');
    feedEl.innerHTML = '<p style="text-align:center;color:var(--cor-texto-suave);">Carregando posts...</p>';
    try {
      posts = await Dados.listarTudo('posts');
      if (!questoes.length) questoes = await Dados.listarTudo('questoes');

      if (!posts.length) {
        feedEl.innerHTML = '<p style="text-align:center;color:var(--cor-texto-suave);">Nenhum post disponível ainda.</p>';
        return;
      }

      feedEl.innerHTML = posts.map(post => _renderCardPost(post)).join('');

      feedEl.querySelectorAll('.post-card').forEach(card => {
        card.addEventListener('click', () => abrirPost(card.dataset.id));
      });
    } catch (e) {
      console.error(e);
      feedEl.innerHTML = '<p style="text-align:center;color:#ef4444;">Erro ao carregar conteúdo.</p>';
    }
  }

  function _renderCardPost(post) {
    const usuario = Perfil.getUsuarioAtual();
    const jaCurtiu = usuario?.postsCurtidos?.[post.id];
    return `
      <article class="post-card" data-id="${post.id}">
        <span class="post-categoria-tag">${_escapar(post.categoria)}</span>
        <h3 class="post-card-titulo">${_escapar(post.titulo)}</h3>
        <p class="post-card-resumo">${_escapar(post.resumo)}</p>
        <div class="post-card-rodape">
          <span class="post-card-autor"><i class="fa-solid fa-user"></i> ${_escapar(post.autor)}</span>
          <span class="post-curtidas-badge"><i class="fa-solid fa-heart"></i> ${post.curtidas || 0}</span>
          <span class="post-continuar">Continue lendo <i class="fa-solid fa-arrow-right"></i></span>
        </div>
      </article>
    `;
  }

  async function abrirPost(postId) {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    document.getElementById('post-categoria-topo').textContent = post.categoria;
    const container = document.getElementById('post-leitura-container');
    const usuario = Perfil.getUsuarioAtual();
    const jaCurtiu = !!usuario?.postsCurtidos?.[post.id];

    container.innerHTML = `
      <p class="post-leitura-categoria">${_escapar(post.categoria)}</p>
      <h2 class="post-leitura-titulo">${_escapar(post.titulo)}</h2>
      <p class="post-leitura-autor"><i class="fa-solid fa-user"></i> ${_escapar(post.autor)}</p>
      <p class="post-leitura-texto">${_escapar(post.conteudo_completo)}</p>
      <div class="post-leitura-acoes">
        <button class="btn-curtir ${jaCurtiu ? 'curtido' : ''}" id="btn-curtir-post" data-id="${post.id}">
          <i class="fa-solid fa-heart"></i> <span id="curtir-post-contagem">${post.curtidas || 0}</span> Curtir
        </button>
      </div>
      <section class="quiz-secao" id="quiz-secao">
        <h3><i class="fa-solid fa-puzzle-piece"></i> Desafio Rápido</h3>
        <p class="quiz-progresso">Responda corretamente para ganhar pontos na sua meta de 100 pontos!</p>
        <div id="quiz-area"></div>
      </section>
    `;

    document.getElementById('btn-curtir-post').addEventListener('click', () => _curtirPost(post));

    _renderizarQuizParaPost(post);

    Main.mostrarTela('post');
  }

  async function _curtirPost(post) {
    const usuario = Perfil.getUsuarioAtual();
    if (usuario?.postsCurtidos?.[post.id]) {
      Utils.mostrarToast('Você já curtiu este post!', 'info');
      return;
    }
    post.curtidas = (post.curtidas || 0) + 1;
    document.getElementById('curtir-post-contagem').textContent = post.curtidas;
    document.getElementById('btn-curtir-post').classList.add('curtido');

    const postsCurtidos = { ...(usuario.postsCurtidos || {}), [post.id]: true };
    Perfil.atualizarLocal({ postsCurtidos });
    Pontuacao.registrarCurtida();

    try {
      await Dados.atualizar('posts', post.id, { curtidas: post.curtidas });
    } catch (e) { console.warn(e); }

    Utils.mostrarToast('Post curtido! ❤️', 'success');
  }

  function _escolherQuestaoParaPost(post) {
    // Escolhe uma questão determinística mas variada, evitando repetir a
    // mesma questão para o mesmo post na mesma sessão.
    if (questoesUsadasPorPost[post.id]) {
      return questoes.find(q => q.id === questoesUsadasPorPost[post.id]);
    }
    if (!questoes.length) return null;
    const indice = Math.floor(Math.random() * questoes.length);
    const questao = questoes[indice];
    questoesUsadasPorPost[post.id] = questao.id;
    return questao;
  }

  function _renderizarQuizParaPost(post) {
    const area = document.getElementById('quiz-area');
    const questao = _escolherQuestaoParaPost(post);

    if (!questao) {
      area.innerHTML = '<p>Nenhuma questão disponível no momento.</p>';
      return;
    }

    const aoResponder = (acertou, pontos) => {
      if (acertou) {
        Pontuacao.adicionarPontosConteudo(pontos);
        area.innerHTML += `
          <div class="quiz-resultado">
            <i class="fa-solid fa-circle-check"></i>
            <p class="quiz-pontos-ganhos">Você ganhou +${pontos} pontos!</p>
            <button class="btn-secundario" id="btn-proxima-questao"><i class="fa-solid fa-rotate"></i> Tentar outra questão</button>
          </div>
        `;
      } else {
        area.innerHTML += `
          <div class="quiz-resultado">
            <i class="fa-solid fa-circle-info" style="color:#f59e0b;"></i>
            <p class="quiz-pontos-ganhos">Resposta incorreta. A correta foi destacada acima.</p>
            <button class="btn-secundario" id="btn-proxima-questao"><i class="fa-solid fa-rotate"></i> Tentar outra questão</button>
          </div>
        `;
      }
      document.getElementById('btn-proxima-questao')?.addEventListener('click', () => {
        delete questoesUsadasPorPost[post.id];
        _renderizarQuizParaPost(post);
      });
    };

    if (questao.tipo === 'lacuna') {
      PreenchaLacunas.renderizar(questao, area, aoResponder);
    } else {
      DescubraCombinacoes.renderizar(questao, area, aoResponder);
    }
  }

  function _escapar(texto) {
    const div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
  }

  return { carregarFeed, abrirPost };
})();

/* Utilitário compartilhado de toast, usado por vários módulos */
const Utils = (() => {
  let timeoutId = null;
  function mostrarToast(mensagem, tipo = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    const icones = { success: 'fa-circle-check', info: 'fa-circle-info', error: 'fa-circle-xmark' };
    toast.innerHTML = `<i class="fa-solid ${icones[tipo] || icones.info}"></i> ${mensagem}`;
    toast.classList.add('mostrar');
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => toast.classList.remove('mostrar'), 2600);
  }
  return { mostrarToast };
})();
