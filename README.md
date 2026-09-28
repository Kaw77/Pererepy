# PERERE.py 🎮📚 — Perguntar e Responder Ponto Py

Aplicação web (SPA) que transforma o aprendizado de lógica de programação em
uma experiência gamificada: leitura de posts com desafios de "preencher
lacunas" e "descubra as combinações corretas", feed de vídeos curtos
(shorts) com perguntas, fórum de dúvidas com comentários, personalização de
perfil e sistema de pontuação com meta de aprovação.

> ⚠️ **Nota importante sobre a arquitetura**: o projeto original foi
> desenhado em Python (`main.py`, `perfil.py`, `conteudo.py`, etc.) com
> arquivos `.json` locais. Como este ambiente permite apenas **sites
> estáticos** (HTML/CSS/JS executados no navegador), toda a lógica foi
> **recriada em JavaScript**, mantendo os mesmos nomes/responsabilidades dos
> módulos originais (ex.: `perfil.py` → `js/perfil.js`) e substituindo os
> arquivos `.json` por tabelas de dados persistentes (RESTful Table API).

## 🎯 Objetivo do jogo

O jogador é aprovado quando atinge simultaneamente:
- **100 pontos** em Conteúdo (respondendo questões de lacunas/combinações)
- **2 respostas** publicadas no Fórum de Dúvidas
- **10 minutos** assistidos na aba de Shorts

Esses dados ficam salvos por jogador (nome do perfil) e podem ser
verificados a qualquer momento na tela **Minha Pontuação**, que exibe
"Aprovado" (com botão Sair) ou "Reprovado" (com botão para continuar as
atividades).

## ✅ Funcionalidades implementadas

### 1. Perfil (`js/perfil.js`)
- Cadastro de nome de jogador
- Upload de foto de perfil (avatar)
- Escolha de cor primária (6 opções)
- Escolha de cor/imagem de fundo do app (4 cores + imagem gerada)
- Escolha de fonte (Inter, Poppins, Fira Code, Comic Neue)
- Edição do perfil a qualquer momento pelo ícone no topo do menu
- Tema aplicado dinamicamente via CSS Custom Properties

### 2. Menu Principal (`js/main.js`)
- Saudação personalizada + pontos atuais
- Cards de navegação para Conteúdo, Shorts, Fórum e Pontuação
- Painel de estatísticas: total de visitantes, curtidas totais, comentários
- Ranking dos **posts mais curtidos** e **shorts mais curtidos**
- Gráfico (Chart.js) de visitas nos últimos 7 dias
- Botão **Sair** (com confirmação)

### 3. Conteúdo — Blog (`js/conteudo.js`)
- Feed de posts em estilo blog com resumo + "Continue lendo"
- Leitura completa do post com botão de curtir
- Relógio digital no topo (`js/relogio.js`), atualizado a cada segundo
- Painel de calendário mensal (`js/calendario.js`)
- Ao final de cada post, uma questão de:
  - **Preencher lacunas** (`js/preencha_lacunas.js`)
  - **Descubra as combinações corretas** (`js/descubra_combinacoes.js`)
- 50 questões cadastradas sobre **Programação**: 20 fáceis (2 pts), 15
  médias (3 pts), 15 difíceis (4 pts)

### 4. Shorts (`js/shorts.js`)
- Feed vertical de vídeos curtos com rolagem (scroll-snap) e autoplay
- Perguntas de programação relacionadas a cada vídeo
- Botão de curtir por vídeo
- Cronômetro de tempo assistido na sessão, somado à meta de 10 minutos
- Mudo/som e play/pause ao tocar no vídeo

### 5. Tutoriais & Dúvidas — Fórum (`js/forum.js`)
- Publicação de novos tópicos de dúvida
- Respostas de outros membros do grupo, exibindo o **nome do perfil**
- Cada resposta enviada conta para a meta de 2 respostas necessárias

### 6. Pontuação (`js/pontuacao.js`)
- Barra de progresso para cada meta (conteúdo, fórum, shorts)
- Contagem de curtidas dadas (atividade extra)
- Botão "Verificar Aprovação" → exibe **Aprovado** ou **Reprovado**
- Se aprovado: botão para sair do jogo
- Se reprovado: botão para continuar as atividades e tentar novamente

### 7. Estatísticas (`js/estatistica_visita.js`)
- Registro de cada visita/navegação por página
- Cálculo de visitantes únicos, curtidas totais e comentários
- Rankings de posts/shorts mais curtidos exibidos no menu principal
- **100% baseadas em dados reais de uso**: todos os posts e shorts foram
  cadastrados com `curtidas: 0` e a tabela `comentarios` começa vazia. Não
  existe nenhum valor fictício/mockado — os números só sobem quando um
  jogador de fato acessa uma página, curte um post/short ou publica uma
  resposta no fórum. Isso garante que o painel do menu principal funcione
  como uma medição confiável de uso real do app.

## 🗂️ Estrutura de arquivos

```
index.html                     → estrutura de todas as telas (SPA)
css/style.css                  → estilos + sistema de temas personalizáveis
js/
  dados.js                     → camada de acesso à RESTful Table API
  main.js                      → orquestração geral (equivalente a main.py)
  perfil.js                    → cadastro/edição de perfil
  conteudo.js                  → blog, leitura de posts, quizzes
  shorts.js                    → feed vertical de vídeos curtos
  forum.js                     → tópicos e respostas (tutorias_duvidas.py)
  pontuacao.js                 → regras de pontuação e aprovação
  preencha_lacunas.js          → mecânica de questão "lacuna"
  descubra_combinacoes.js      → mecânica de questão "combinação"
  relogio.js                   → relógio digital no topo do conteúdo
  calendario.js                → calendário mensal
  estatistica_visita.js        → estatísticas e rankings
images/
  logo.png, fundo.png, avatar-padrao.png   → imagens geradas (placeholders)
videos/
  short1.mp4 ... short5.mp4    → vídeos de exemplo para o feed de shorts
sounds/
  menu.ogg                     → som de interface (clique/navegação)
```

## 🔗 Navegação (rotas internas da SPA)

Não há URLs reais de página — a navegação ocorre via JavaScript trocando a
classe `.tela-ativa` entre `<section>`. Os "destinos" lógicos são:

| Destino (`Main.irPara(destino)`) | Tela exibida |
|---|---|
| `menu` | Menu principal |
| `conteudo` | Feed de posts (blog) |
| `shorts` | Feed vertical de vídeos curtos |
| `forum` | Fórum de dúvidas |
| `pontuacao` | Painel de pontuação e aprovação |

## 🗄️ Modelo de dados (RESTful Table API)

Substituem os arquivos `usuario.json` e `estatística.json` do projeto
original:

- **usuarios**: nome, avatar, cor_primaria, cor_fundo, fonte, pontos_conteudo,
  curtidas_dadas, respostas_forum, tempo_shorts_seg, aprovado, ultima_sessao
- **posts**: titulo, resumo, conteudo_completo, categoria, curtidas, autor, imagem
- **shorts**: titulo, url_video, descricao, pergunta, opcoes[], resposta_correta, curtidas, ordem
- **questoes**: tipo (lacuna/combinacao), dificuldade (facil/media/dificil), enunciado, opcoes[], pares[], resposta_correta, pontos
- **comentarios**: post_id, topico, autor_nome, autor_avatar, texto, tipo (pergunta/resposta), respondendo_a
- **visitas**: usuario_nome, data_hora, pagina

O **perfil do jogador em uso** (sessão atual) é mantido em `localStorage`
do navegador (chave `perere_usuario`) e sincronizado com a tabela
`usuarios` para fins estatísticos e de auditoria. Cada jogador gera **um
único registro real** na tabela `usuarios` (criado no primeiro cadastro e
apenas atualizado nas edições seguintes), evitando duplicatas que
distorceriam a contagem de visitantes.

> 🔄 **Reset de dados de exemplo (atualização atual)**: todos os registros
> de demonstração foram removidos das tabelas `posts`, `shorts`,
> `comentarios`, `visitas` e `usuarios`. Os posts e shorts foram
> recriados com `curtidas: 0` para servir apenas de conteúdo pedagógico —
> a partir de agora, **todo número exibido nas estatísticas do menu
> principal (visitantes, curtidas, comentários, rankings e gráfico de
> visitas) reflete exclusivamente interações reais dos jogadores**.

## 🚧 Funcionalidades não implementadas / limitações

- **Login/autenticação real**: não há senha nem validação de identidade —
  qualquer nome pode ser usado (o ambiente não suporta backend de auth).
- **Upload de vídeos próprios para shorts**: atualmente os vídeos são fixos
  (exemplos), pois não há processamento de arquivos no servidor.
- **Multiplayer em tempo real** (ex.: chat ao vivo no fórum): as respostas
  aparecem após recarregar a lista, não há WebSocket.
- **Envio de notificações push**.
- Áudio de fundo (`menu.ogg`) é reproduzido apenas como efeito curto ao
  navegar, não como trilha contínua (para não incomodar o usuário).

## 🔮 Próximos passos recomendados

1. Adicionar mais posts, shorts e questões para ampliar o conteúdo pedagógico.
2. Permitir que o usuário marque tópicos do fórum como "resolvido".
3. Criar um painel administrativo simples (nova tela) para o professor
   cadastrar posts/questões diretamente pela interface, sem precisar mexer
   nas tabelas manualmente.
4. Adicionar sistema de "níveis"/badges conforme o jogador avança.
5. Melhorar acessibilidade (leitura de tela) nas mecânicas de quiz.

## 🌐 Publicação

Este é um site estático. Para publicá-lo e obter uma URL pública, utilize a
aba **Publish** da plataforma — o processo de deploy é automático.

## 🎨 Créditos de assets

- Logo, imagem de fundo e avatar padrão: gerados por IA (nano-banana) especificamente para este projeto.
- Vídeos de exemplo do feed de Shorts: vídeos livres de demonstração (MDN Web Docs / W3Schools).
- Som de interface: efeito sonoro livre (Google Actions Sound Library).
