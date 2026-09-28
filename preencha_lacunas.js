/* ==========================================================================
   preencha_lacunas.js — equivalente a preencha_lacunas.py
   Renderiza uma questão do tipo "preencher lacunas": enunciado com um espaço
   em branco e alternativas para escolher a resposta correta.
   ========================================================================== */

const PreenchaLacunas = (() => {

  /**
   * Renderiza a questão dentro do elemento container.
   * @param {Object} questao - registro da tabela "questoes" (tipo === 'lacuna')
   * @param {HTMLElement} container
   * @param {Function} aoResponder - callback(acertou:boolean, pontos:number)
   */
  function renderizar(questao, container, aoResponder) {
    const opcoesEmbaralhadas = _embaralhar([...(questao.opcoes || [])]);

    const enunciadoComLacuna = (questao.enunciado || '').replace(
      '___',
      '<span class="lacuna-vazio" id="lacuna-alvo">?</span>'
    );

    container.innerHTML = `
      <p class="lacuna-enunciado">${enunciadoComLacuna}</p>
      <div class="lacuna-opcoes" id="lacuna-opcoes"></div>
    `;

    const areaOpcoes = container.querySelector('#lacuna-opcoes');
    opcoesEmbaralhadas.forEach(opcao => {
      const botao = document.createElement('button');
      botao.type = 'button';
      botao.className = 'lacuna-opcao';
      botao.textContent = opcao;
      botao.addEventListener('click', () => _selecionar(opcao, questao, container, aoResponder));
      areaOpcoes.appendChild(botao);
    });
  }

  function _selecionar(opcaoEscolhida, questao, container, aoResponder) {
    const botoes = container.querySelectorAll('.lacuna-opcao');
    const acertou = opcaoEscolhida === questao.resposta_correta;

    botoes.forEach(botao => {
      botao.disabled = true;
      if (botao.textContent === questao.resposta_correta) {
        botao.classList.add('correta');
      } else if (botao.textContent === opcaoEscolhida && !acertou) {
        botao.classList.add('incorreta');
      }
    });

    const alvo = container.querySelector('#lacuna-alvo');
    if (alvo) alvo.textContent = questao.resposta_correta;

    setTimeout(() => aoResponder(acertou, acertou ? questao.pontos : 0), 700);
  }

  function _embaralhar(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  return { renderizar };
})();
