/* ==========================================================================
   dados.js
   Camada de acesso à RESTful Table API (substitui os arquivos .json do
   projeto original: usuario.json e estatística.json).
   Todos os demais módulos usam as funções daqui para ler/gravar dados.
   ========================================================================== */

const Dados = (() => {

  async function listar(tabela, params = {}) {
    const query = new URLSearchParams(params).toString();
    const resp = await fetch(`tables/${tabela}${query ? '?' + query : ''}`);
    if (!resp.ok) throw new Error(`Erro ao listar ${tabela}`);
    return resp.json();
  }

  async function obter(tabela, id) {
    const resp = await fetch(`tables/${tabela}/${id}`);
    if (!resp.ok) throw new Error(`Erro ao obter registro de ${tabela}`);
    return resp.json();
  }

  async function criar(tabela, dados) {
    const resp = await fetch(`tables/${tabela}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (!resp.ok) throw new Error(`Erro ao criar registro em ${tabela}`);
    return resp.json();
  }

  async function atualizar(tabela, id, dados) {
    const resp = await fetch(`tables/${tabela}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (!resp.ok) throw new Error(`Erro ao atualizar registro em ${tabela}`);
    return resp.json();
  }

  async function remover(tabela, id) {
    const resp = await fetch(`tables/${tabela}/${id}`, { method: 'DELETE' });
    if (!resp.ok && resp.status !== 204) throw new Error(`Erro ao remover registro em ${tabela}`);
    return true;
  }

  // Busca TODAS as páginas de uma tabela (a API pagina por padrão)
  async function listarTudo(tabela, limitPorPagina = 100) {
    let pagina = 1;
    let todos = [];
    while (true) {
      const resultado = await listar(tabela, { page: pagina, limit: limitPorPagina });
      todos = todos.concat(resultado.data || []);
      if (!resultado.data || resultado.data.length < limitPorPagina) break;
      pagina++;
      if (pagina > 50) break; // segurança
    }
    return todos;
  }

  return { listar, obter, criar, atualizar, remover, listarTudo };
})();
