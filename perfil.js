/* ==========================================================================
   perfil.js — equivalente a perfil.py
   Cadastro/edição de perfil: nome, avatar, cor primária, cor de fundo, fonte.
   O perfil é persistido em localStorage (sessão do navegador) e sincronizado
   com a tabela "usuarios" para fins de estatísticas/pontuação.
   ========================================================================== */

const Perfil = (() => {
  const CHAVE_LOCAL = 'perere_usuario';

  let usuarioAtual = null;
  let corPrimariaEscolhida = '#7c3aed';
  let corFundoEscolhida = '#0f172a';
  let fonteEscolhida = "'Inter', sans-serif";
  let avatarBase64 = 'images/avatar-padrao.png';

  function getUsuarioAtual() {
    return usuarioAtual;
  }

  function carregarDoStorage() {
    const bruto = localStorage.getItem(CHAVE_LOCAL);
    if (!bruto) return null;
    try {
      usuarioAtual = JSON.parse(bruto);
      return usuarioAtual;
    } catch {
      return null;
    }
  }

  function salvarNoStorage() {
    localStorage.setItem(CHAVE_LOCAL, JSON.stringify(usuarioAtual));
  }

  function aplicarTema() {
    if (!usuarioAtual) return;
    const raiz = document.documentElement;
    raiz.style.setProperty('--cor-primaria', usuarioAtual.cor_primaria);
    raiz.style.setProperty('--fonte-usuario', usuarioAtual.fonte);

    // Converte hex para rgb para uso em rgba()
    const rgb = _hexParaRgb(usuarioAtual.cor_primaria);
    raiz.style.setProperty('--cor-primaria-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);

    if (usuarioAtual.cor_fundo === 'imagem') {
      raiz.style.setProperty('--cor-fundo-imagem', "url('images/fundo.png')");
      raiz.style.setProperty('--cor-fundo', '#0f172a');
      document.body.classList.remove('tema-claro');
    } else {
      raiz.style.setProperty('--cor-fundo-imagem', 'none');
      raiz.style.setProperty('--cor-fundo', usuarioAtual.cor_fundo);
      // Detecta se a cor de fundo é clara para ajustar contraste do texto
      const claro = _corEhClara(usuarioAtual.cor_fundo);
      document.body.classList.toggle('tema-claro', claro);
    }
  }

  function _hexParaRgb(hex) {
    const resultado = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return resultado ? {
      r: parseInt(resultado[1], 16),
      g: parseInt(resultado[2], 16),
      b: parseInt(resultado[3], 16)
    } : { r: 124, g: 58, b: 237 };
  }

  function _corEhClara(hex) {
    const { r, g, b } = _hexParaRgb(hex);
    const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminancia > 0.7;
  }

  function _configurarSeletoresCor() {
    document.querySelectorAll('#cores-primarias .cor-opcao').forEach(botao => {
      botao.addEventListener('click', () => {
        document.querySelectorAll('#cores-primarias .cor-opcao').forEach(b => b.classList.remove('selecionada'));
        botao.classList.add('selecionada');
        corPrimariaEscolhida = botao.dataset.cor;
      });
    });
    document.querySelectorAll('#cores-fundo .cor-opcao').forEach(botao => {
      botao.addEventListener('click', () => {
        document.querySelectorAll('#cores-fundo .cor-opcao').forEach(b => b.classList.remove('selecionada'));
        botao.classList.add('selecionada');
        corFundoEscolhida = botao.dataset.fundo;
      });
    });
    document.querySelectorAll('.fonte-opcao').forEach(botao => {
      botao.addEventListener('click', () => {
        document.querySelectorAll('.fonte-opcao').forEach(b => b.classList.remove('selecionada'));
        botao.classList.add('selecionada');
        fonteEscolhida = botao.dataset.fonte;
      });
    });

    // Seleciona padrões visuais iniciais
    document.querySelector('#cores-primarias .cor-opcao')?.classList.add('selecionada');
    document.querySelector('#cores-fundo .cor-opcao')?.classList.add('selecionada');
    document.querySelector('.fonte-opcao')?.classList.add('selecionada');
  }

  function _configurarUploadAvatar() {
    const input = document.getElementById('input-avatar');
    const preview = document.getElementById('preview-avatar');
    input?.addEventListener('change', () => {
      const arquivo = input.files[0];
      if (!arquivo) return;
      const leitor = new FileReader();
      leitor.onload = (e) => {
        avatarBase64 = e.target.result;
        preview.src = avatarBase64;
      };
      leitor.readAsDataURL(arquivo);
    });
  }

  async function _submeterFormulario(evento) {
    evento.preventDefault();
    const nome = document.getElementById('input-nome').value.trim();
    if (!nome) return;

    const idRealExistente = _possuiIdReal(usuarioAtual) ? usuarioAtual.id : null;

    usuarioAtual = {
      id: idRealExistente, // será preenchido com o ID real da tabela logo abaixo
      nome,
      avatar: avatarBase64,
      cor_primaria: corPrimariaEscolhida,
      cor_fundo: corFundoEscolhida,
      fonte: fonteEscolhida,
      pontos_conteudo: usuarioAtual?.pontos_conteudo || 0,
      curtidas_dadas: usuarioAtual?.curtidas_dadas || 0,
      respostas_forum: usuarioAtual?.respostas_forum || 0,
      tempo_shorts_seg: usuarioAtual?.tempo_shorts_seg || 0,
      aprovado: usuarioAtual?.aprovado || false,
      respostasDadas: usuarioAtual?.respostasDadas || {},
      shortsAvaliados: usuarioAtual?.shortsAvaliados || {},
      shortsCurtidos: usuarioAtual?.shortsCurtidos || {},
      postsCurtidos: usuarioAtual?.postsCurtidos || {}
    };

    try {
      const payload = {
        nome: usuarioAtual.nome,
        avatar: 'perfil-local',
        cor_primaria: usuarioAtual.cor_primaria,
        cor_fundo: usuarioAtual.cor_fundo,
        fonte: usuarioAtual.fonte,
        pontos_conteudo: usuarioAtual.pontos_conteudo,
        curtidas_dadas: usuarioAtual.curtidas_dadas,
        respostas_forum: usuarioAtual.respostas_forum,
        tempo_shorts_seg: usuarioAtual.tempo_shorts_seg,
        aprovado: usuarioAtual.aprovado,
        ultima_sessao: Date.now()
      };

      if (idRealExistente) {
        // Usuário já existente: ATUALIZA o mesmo registro (não cria duplicata)
        await Dados.atualizar('usuarios', idRealExistente, payload);
        usuarioAtual.id = idRealExistente;
      } else {
        // Novo usuário: cria exatamente 1 registro real e guarda o ID retornado
        const criado = await Dados.criar('usuarios', payload);
        usuarioAtual.id = criado.id;
      }
    } catch (e) {
      console.warn('Não foi possível sincronizar usuário na tabela:', e);
    }

    salvarNoStorage();
    aplicarTema();

    document.dispatchEvent(new CustomEvent('perfil:definido'));
  }

  function _possuiIdReal(usuario) {
    // Um ID real é o UUID retornado pela Table API (não gerado localmente)
    return !!(usuario && usuario.id && !String(usuario.id).startsWith('local_'));
  }

  function preencherFormularioParaEdicao() {
    if (!usuarioAtual) return;
    document.getElementById('input-nome').value = usuarioAtual.nome;
    document.getElementById('preview-avatar').src = usuarioAtual.avatar;
    avatarBase64 = usuarioAtual.avatar;
    corPrimariaEscolhida = usuarioAtual.cor_primaria;
    corFundoEscolhida = usuarioAtual.cor_fundo;
    fonteEscolhida = usuarioAtual.fonte;

    document.querySelectorAll('#cores-primarias .cor-opcao').forEach(b => {
      b.classList.toggle('selecionada', b.dataset.cor === corPrimariaEscolhida);
    });
    document.querySelectorAll('#cores-fundo .cor-opcao').forEach(b => {
      b.classList.toggle('selecionada', b.dataset.fundo === corFundoEscolhida);
    });
    document.querySelectorAll('.fonte-opcao').forEach(b => {
      b.classList.toggle('selecionada', b.dataset.fonte === fonteEscolhida);
    });
  }

  function atualizarLocal(camposParciais) {
    usuarioAtual = { ...usuarioAtual, ...camposParciais };
    salvarNoStorage();
  }

  async function sincronizarComTabela() {
    if (!_possuiIdReal(usuarioAtual)) return;
    try {
      await Dados.atualizar('usuarios', usuarioAtual.id, {
        pontos_conteudo: usuarioAtual.pontos_conteudo,
        curtidas_dadas: usuarioAtual.curtidas_dadas,
        respostas_forum: usuarioAtual.respostas_forum,
        tempo_shorts_seg: usuarioAtual.tempo_shorts_seg,
        aprovado: usuarioAtual.aprovado,
        ultima_sessao: Date.now()
      });
    } catch (e) {
      console.warn('Falha ao sincronizar pontuação:', e);
    }
  }

  function inicializar() {
    _configurarSeletoresCor();
    _configurarUploadAvatar();
    document.getElementById('form-perfil')?.addEventListener('submit', _submeterFormulario);
  }

  return {
    inicializar,
    getUsuarioAtual,
    carregarDoStorage,
    aplicarTema,
    preencherFormularioParaEdicao,
    atualizarLocal,
    sincronizarComTabela
  };
})();
