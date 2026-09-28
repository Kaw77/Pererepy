/* ==========================================================================
   forum.js — equivalente a tutorias_duvidas.py
   Fórum de dúvidas: usuários publicam tópicos (dúvidas) e respondem
   comentários de outros membros do grupo. Cada resposta soma na meta de
   2 respostas necessárias para aprovação. Nome exibido é o nome do perfil.
   ========================================================================== */

const Forum = (() => {
  let comentarios = [];

  async function carregar() {
    const lista = document.getElementById('lista-topicos');
    lista.innerHTML = '<p style="text-align:center;color:var(--cor-texto-suave);">Carregando tópicos...</p>';
    try {
      comentarios = await Dados.listarTudo('comentarios');
      _renderizarTopicos();
    } catch (e) {
      console.error(e);
      lista.innerHTML = '<p style="text-align:center;color:#ef4444;">Erro ao carregar o fórum.</p>';
    }
  }

  function _agruparPorTopico() {
    const grupos = {};
    comentarios.forEach(c => {
      const chave = c.topico;
      if (!grupos[chave]) grupos[chave] = [];
      grupos[chave].push(c);
    });
    return grupos;
  }

  function _renderizarTopicos() {
    const lista = document.getElementById('lista-topicos');
    const grupos = _agruparPorTopico();
    const titulos = Object.keys(grupos);

    if (!titulos.length) {
      lista.innerHTML = '<p style="text-align:center;color:var(--cor-texto-suave);">Nenhuma dúvida publicada ainda. Seja o primeiro!</p>';
      return;
    }

    lista.innerHTML = titulos.map(titulo => {
      const itens = grupos[titulo];
      const perguntaPrincipal = itens.find(c => c.tipo === 'pergunta') || itens[0];
      const respostas = itens.filter(c => c !== perguntaPrincipal);

      return `
        <article class="topico-card" data-topico="${_escapar(titulo)}">
          <h3 class="topico-titulo"><i class="fa-solid fa-circle-question"></i> ${_escapar(titulo)}</h3>
          <div class="comentario">
            <img class="comentario-avatar" src="images/avatar-padrao.png" alt="Avatar de ${_escapar(perguntaPrincipal.autor_nome)}">
            <div class="comentario-corpo">
              <p class="comentario-nome">${_escapar(perguntaPrincipal.autor_nome)}</p>
              <p class="comentario-texto">${_escapar(perguntaPrincipal.texto)}</p>
            </div>
          </div>
          <div class="comentario-respostas">
            ${respostas.map(r => `
              <div class="comentario">
                <img class="comentario-avatar" src="images/avatar-padrao.png" alt="Avatar de ${_escapar(r.autor_nome)}">
                <div class="comentario-corpo">
                  <p class="comentario-nome">${_escapar(r.autor_nome)} <span class="comentario-tag-resposta">resposta</span></p>
                  <p class="comentario-texto">${_escapar(r.texto)}</p>
                </div>
              </div>
            `).join('')}
          </div>
          <form class="forum-resposta-form" data-topico="${_escapar(titulo)}">
            <input type="text" class="perfil-input" placeholder="Escreva uma resposta..." maxlength="300" required>
            <button type="submit" class="btn-icone" aria-label="Enviar resposta"><i class="fa-solid fa-paper-plane"></i></button>
          </form>
        </article>
      `;
    }).join('');

    lista.querySelectorAll('.forum-resposta-form').forEach(form => {
      form.addEventListener('submit', _enviarResposta);
    });
  }

  async function _enviarResposta(evento) {
    evento.preventDefault();
    const form = evento.target;
    const input = form.querySelector('input');
    const texto = input.value.trim();
    if (!texto) return;

    const usuario = Perfil.getUsuarioAtual();
    const topico = form.dataset.topico;

    try {
      await Dados.criar('comentarios', {
        post_id: 'geral',
        topico,
        autor_nome: usuario?.nome || 'Anônimo',
        autor_avatar: '',
        texto,
        tipo: 'resposta',
        respondendo_a: ''
      });

      Pontuacao.registrarRespostaForum();
      Utils.mostrarToast('Resposta publicada! +1 na sua meta do fórum', 'success');
      input.value = '';
      await carregar();
    } catch (e) {
      console.error(e);
      Utils.mostrarToast('Erro ao enviar resposta.', 'error');
    }
  }

  async function _publicarNovoTopico(evento) {
    evento.preventDefault();
    const inputTitulo = document.getElementById('input-topico-titulo');
    const inputTexto = document.getElementById('input-topico-texto');
    const titulo = inputTitulo.value.trim();
    const texto = inputTexto.value.trim();
    if (!titulo || !texto) return;

    const usuario = Perfil.getUsuarioAtual();

    try {
      await Dados.criar('comentarios', {
        post_id: 'geral',
        topico: titulo,
        autor_nome: usuario?.nome || 'Anônimo',
        autor_avatar: '',
        texto,
        tipo: 'pergunta',
        respondendo_a: ''
      });

      Utils.mostrarToast('Dúvida publicada com sucesso!', 'success');
      inputTitulo.value = '';
      inputTexto.value = '';
      await carregar();
    } catch (e) {
      console.error(e);
      Utils.mostrarToast('Erro ao publicar dúvida.', 'error');
    }
  }

  function _escapar(texto) {
    const div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
  }

  function inicializar() {
    document.getElementById('form-novo-topico')?.addEventListener('submit', _publicarNovoTopico);
  }

  return { carregar, inicializar };
})();
