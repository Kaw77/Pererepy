/* ==========================================================================
   shorts.js — equivalente a shorts.py
   Feed vertical de vídeos curtos (scroll snap), com perguntas coerentes com
   a dinâmica do app, curtidas, e cronômetro de tempo assistido que soma
   para a meta de 10 minutos.
   ========================================================================== */

const Shorts = (() => {
  let shorts = [];
  let cronometroId = null;
  let segundosSessao = 0;
  let observer = null;

  async function carregarFeed() {
    const feedEl = document.getElementById('shorts-feed');
    feedEl.innerHTML = '<p style="color:#fff;text-align:center;padding-top:40px;">Carregando shorts...</p>';
    try {
      shorts = await Dados.listarTudo('shorts');
      shorts.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

      if (!shorts.length) {
        feedEl.innerHTML = '<p style="color:#fff;text-align:center;padding-top:40px;">Nenhum short disponível.</p>';
        return;
      }

      feedEl.innerHTML = shorts.map(short => _renderItem(short)).join('');
      _configurarInteracoes();
      _configurarAutoplay();
      _iniciarCronometro();
    } catch (e) {
      console.error(e);
      feedEl.innerHTML = '<p style="color:#ef4444;text-align:center;">Erro ao carregar shorts.</p>';
    }
  }

  function _renderItem(short) {
    const usuario = Perfil.getUsuarioAtual();
    const jaCurtiu = !!usuario?.shortsCurtidos?.[short.id];
    return `
      <div class="short-item" data-id="${short.id}">
        <video class="short-video" src="${short.url_video}" loop muted playsinline webkit-playsinline></video>
        <div class="short-overlay">
          <p class="short-titulo">${_escapar(short.titulo)}</p>
          <p class="short-descricao">${_escapar(short.descricao)}</p>
          <div class="short-pergunta-box">
            <p class="short-pergunta-texto"><i class="fa-solid fa-circle-question"></i> ${_escapar(short.pergunta)}</p>
            <div class="short-pergunta-opcoes" data-id="${short.id}">
              ${(short.opcoes || []).map(op => `<button class="short-pergunta-opcao" data-valor="${_escapar(op)}">${_escapar(op)}</button>`).join('')}
            </div>
          </div>
        </div>
        <div class="short-acoes">
          <button class="short-btn-curtir ${jaCurtiu ? 'curtido' : ''}" data-id="${short.id}">
            <i class="fa-solid fa-heart"></i>
            <span class="short-curtida-contagem">${short.curtidas || 0}</span>
          </button>
          <button class="short-btn-curtir" data-som="1" title="Ativar/desativar som">
            <i class="fa-solid fa-volume-xmark" id="icone-som-${short.id}"></i>
          </button>
        </div>
      </div>
    `;
  }

  function _configurarInteracoes() {
    document.querySelectorAll('.short-btn-curtir[data-id]').forEach(botao => {
      botao.addEventListener('click', () => _curtirShort(botao));
    });

    document.querySelectorAll('.short-pergunta-opcoes').forEach(container => {
      container.addEventListener('click', (evento) => {
        const botao = evento.target.closest('.short-pergunta-opcao');
        if (!botao || container.dataset.respondido) return;
        _responderPergunta(container, botao);
      });
    });

    document.querySelectorAll('.short-btn-curtir[data-som]').forEach(botao => {
      botao.addEventListener('click', (e) => {
        const item = e.target.closest('.short-item');
        const video = item.querySelector('video');
        video.muted = !video.muted;
        const icone = e.target.closest('button').querySelector('i');
        icone.className = video.muted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
      });
    });

    // Toque no vídeo alterna play/pause
    document.querySelectorAll('.short-video').forEach(video => {
      video.addEventListener('click', () => {
        if (video.paused) video.play(); else video.pause();
      });
    });
  }

  async function _curtirShort(botao) {
    const shortId = botao.dataset.id;
    const usuario = Perfil.getUsuarioAtual();
    if (usuario?.shortsCurtidos?.[shortId]) {
      Utils.mostrarToast('Você já curtiu este short!', 'info');
      return;
    }
    const short = shorts.find(s => s.id === shortId);
    short.curtidas = (short.curtidas || 0) + 1;
    botao.classList.add('curtido');
    botao.querySelector('.short-curtida-contagem').textContent = short.curtidas;

    const shortsCurtidos = { ...(usuario.shortsCurtidos || {}), [shortId]: true };
    Perfil.atualizarLocal({ shortsCurtidos });
    Pontuacao.registrarCurtida();

    try {
      await Dados.atualizar('shorts', shortId, { curtidas: short.curtidas });
    } catch (e) { console.warn(e); }

    Utils.mostrarToast('Short curtido! ❤️', 'success');
  }

  function _responderPergunta(container, botaoEscolhido) {
    const shortId = container.dataset.id;
    const short = shorts.find(s => s.id === shortId);
    const correta = botaoEscolhido.dataset.valor === short.resposta_correta;

    container.dataset.respondido = '1';
    container.querySelectorAll('.short-pergunta-opcao').forEach(botao => {
      if (botao.dataset.valor === short.resposta_correta) botao.classList.add('correta');
      else if (botao === botaoEscolhido) botao.classList.add('incorreta');
    });

    Utils.mostrarToast(correta ? 'Resposta correta! 🎯' : 'Quase lá! Continue assistindo e aprendendo.', correta ? 'success' : 'info');
  }

  function _configurarAutoplay() {
    const feedEl = document.getElementById('shorts-feed');
    if (observer) observer.disconnect();

    observer = new IntersectionObserver((entradas) => {
      entradas.forEach(entrada => {
        const video = entrada.target.querySelector('video');
        if (!video) return;
        if (entrada.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { root: feedEl, threshold: 0.6 });

    document.querySelectorAll('.short-item').forEach(item => observer.observe(item));
  }

  function _iniciarCronometro() {
    segundosSessao = 0;
    _pararCronometro();
    cronometroId = setInterval(() => {
      segundosSessao++;
      const min = String(Math.floor(segundosSessao / 60)).padStart(2, '0');
      const seg = String(segundosSessao % 60).padStart(2, '0');
      const el = document.getElementById('tempo-shorts-valor');
      if (el) el.textContent = `${min}:${seg}`;

      // A cada 5 segundos, persiste o tempo assistido na pontuação
      if (segundosSessao % 5 === 0) {
        Pontuacao.adicionarTempoShorts(5);
      }
    }, 1000);
  }

  function _pararCronometro() {
    if (cronometroId) clearInterval(cronometroId);
    cronometroId = null;
  }

  function pausarTudo() {
    _pararCronometro();
    if (observer) observer.disconnect();
    document.querySelectorAll('.short-video').forEach(v => v.pause());
  }

  function _escapar(texto) {
    const div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
  }

  return { carregarFeed, pausarTudo };
})();
