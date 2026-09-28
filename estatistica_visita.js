/* ==========================================================================
   estatistica_visita.js — equivalente a estatistica_visita.py
   Registra visitas e monta as estatísticas exibidas no menu principal:
   total de visitantes, curtidas totais, comentários, e rankings de
   posts/shorts mais curtidos. Também alimenta um gráfico de visitas por dia.
   ========================================================================== */

const EstatisticaVisita = (() => {

  async function registrarVisita(pagina) {
    try {
      const usuario = Perfil.getUsuarioAtual();
      await Dados.criar('visitas', {
        usuario_nome: usuario ? usuario.nome : 'Anônimo',
        data_hora: Date.now(),
        pagina
      });
    } catch (e) {
      console.warn('Não foi possível registrar visita:', e);
    }
  }

  async function carregarPainel() {
    try {
      const [visitas, posts, shorts, comentarios] = await Promise.all([
        Dados.listarTudo('visitas'),
        Dados.listarTudo('posts'),
        Dados.listarTudo('shorts'),
        Dados.listarTudo('comentarios')
      ]);

      // Total de visitantes únicos (por nome) + total de acessos
      const nomesUnicos = new Set(visitas.map(v => v.usuario_nome));
      document.getElementById('stat-visitantes').textContent = nomesUnicos.size || visitas.length;

      // Curtidas totais (posts + shorts)
      const curtidasPosts = posts.reduce((soma, p) => soma + (p.curtidas || 0), 0);
      const curtidasShorts = shorts.reduce((soma, s) => soma + (s.curtidas || 0), 0);
      document.getElementById('stat-total-curtidas').textContent = curtidasPosts + curtidasShorts;

      // Comentários no fórum
      document.getElementById('stat-comentarios').textContent = comentarios.length;

      // Ranking de posts mais curtidos (top 5)
      const rankingPosts = [...posts].sort((a, b) => (b.curtidas || 0) - (a.curtidas || 0)).slice(0, 5);
      const listaPosts = document.getElementById('ranking-posts');
      listaPosts.innerHTML = rankingPosts.length
        ? rankingPosts.map(p => `<li><strong>${_escapar(p.titulo)}</strong> — ${p.curtidas || 0} curtidas</li>`).join('')
        : '<li>Nenhum post ainda</li>';

      // Ranking de shorts mais curtidos (top 5)
      const rankingShorts = [...shorts].sort((a, b) => (b.curtidas || 0) - (a.curtidas || 0)).slice(0, 5);
      const listaShorts = document.getElementById('ranking-shorts');
      listaShorts.innerHTML = rankingShorts.length
        ? rankingShorts.map(s => `<li><strong>${_escapar(s.titulo)}</strong> — ${s.curtidas || 0} curtidas</li>`).join('')
        : '<li>Nenhum short ainda</li>';

      _renderGrafico(visitas);
    } catch (e) {
      console.error('Erro ao carregar estatísticas:', e);
    }
  }

  let graficoInstancia = null;
  function _renderGrafico(visitas) {
    const canvas = document.getElementById('grafico-visitas');
    if (!canvas || typeof Chart === 'undefined') return;

    // Agrupa visitas pelos últimos 7 dias
    const hoje = new Date();
    const dias = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoje);
      d.setDate(hoje.getDate() - i);
      dias.push(d);
    }
    const rotulos = dias.map(d => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`);
    const contagens = dias.map(d => {
      return visitas.filter(v => {
        const vd = new Date(v.data_hora);
        return vd.getFullYear() === d.getFullYear() && vd.getMonth() === d.getMonth() && vd.getDate() === d.getDate();
      }).length;
    });

    if (graficoInstancia) graficoInstancia.destroy();
    graficoInstancia = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels: rotulos,
        datasets: [{
          label: 'Visitas por dia',
          data: contagens,
          borderColor: '#7c3aed',
          backgroundColor: 'rgba(124,58,237,0.25)',
          fill: true,
          tension: 0.35,
          pointRadius: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94a3b8' } } },
        scales: {
          x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } },
          y: { ticks: { color: '#94a3b8', precision: 0 }, grid: { color: 'rgba(148,163,184,0.1)' }, beginAtZero: true }
        }
      }
    });
  }

  function _escapar(texto) {
    const div = document.createElement('div');
    div.textContent = texto || '';
    return div.innerHTML;
  }

  return { registrarVisita, carregarPainel };
})();
