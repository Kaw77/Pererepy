/* ==========================================================================
   descubra_combinacoes.js — equivalente a descubra_combinacoes.py
   Renderiza uma questão do tipo "descubra as combinações corretas": duas
   colunas embaralhadas onde o usuário deve ligar os pares corretos.
   ========================================================================== */

const DescubraCombinacoes = (() => {

  /**
   * @param {Object} questao - registro da tabela "questoes" (tipo === 'combinacao')
   *   questao.pares é um array de strings "esquerda::direita"
   * @param {HTMLElement} container
   * @param {Function} aoResponder - callback(acertouTudo:boolean, pontos:number)
   */
  function renderizar(questao, container, aoResponder) {
    const pares = (questao.pares || []).map(p => {
      const [esquerda, direita] = p.split('::');
      return { esquerda: esquerda.trim(), direita: direita.trim() };
    });

    const colunaEsquerda = _embaralhar(pares.map(p => p.esquerda));
    const colunaDireita = _embaralhar(pares.map(p => p.direita));

    container.innerHTML = `
      <p class="lacuna-enunciado">${questao.enunciado}</p>
      <div class="combinacao-area">
        <div class="combinacao-coluna">
          <span class="combinacao-coluna-titulo">Coluna A</span>
          <div id="coluna-esquerda"></div>
        </div>
        <div class="combinacao-coluna">
          <span class="combinacao-coluna-titulo">Coluna B</span>
          <div id="coluna-direita"></div>
        </div>
      </div>
    `;

    const estado = {
      selecionadoEsquerda: null,
      paresCorretos: pares,
      acertos: 0,
      totalPares: pares.length,
      finalizado: false
    };

    const containerEsquerda = container.querySelector('#coluna-esquerda');
    const containerDireita = container.querySelector('#coluna-direita');

    colunaEsquerda.forEach(texto => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'combinacao-item';
      item.textContent = texto;
      item.dataset.valor = texto;
      item.addEventListener('click', () => _selecionarEsquerda(item, estado, container));
      containerEsquerda.appendChild(item);
    });

    colunaDireita.forEach(texto => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'combinacao-item';
      item.textContent = texto;
      item.dataset.valor = texto;
      item.addEventListener('click', () => _selecionarDireita(item, estado, container, questao, aoResponder));
      containerDireita.appendChild(item);
    });
  }

  function _selecionarEsquerda(item, estado, container) {
    if (item.classList.contains('pareado-correto')) return;
    container.querySelectorAll('#coluna-esquerda .combinacao-item').forEach(el => el.classList.remove('selecionado'));
    item.classList.add('selecionado');
    estado.selecionadoEsquerda = item;
  }

  function _selecionarDireita(item, estado, container, questao, aoResponder) {
    if (!estado.selecionadoEsquerda || item.classList.contains('pareado-correto')) return;

    const valorEsquerda = estado.selecionadoEsquerda.dataset.valor;
    const valorDireita = item.dataset.valor;

    const parCorreto = estado.paresCorretos.some(
      p => p.esquerda === valorEsquerda && p.direita === valorDireita
    );

    if (parCorreto) {
      estado.selecionadoEsquerda.classList.remove('selecionado');
      estado.selecionadoEsquerda.classList.add('pareado-correto');
      item.classList.add('pareado-correto');
      estado.selecionadoEsquerda.disabled = true;
      item.disabled = true;
      estado.acertos++;
      estado.selecionadoEsquerda = null;

      if (estado.acertos === estado.totalPares && !estado.finalizado) {
        estado.finalizado = true;
        setTimeout(() => aoResponder(true, questao.pontos), 500);
      }
    } else {
      item.classList.add('pareado-incorreto');
      setTimeout(() => item.classList.remove('pareado-incorreto'), 500);
    }
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
