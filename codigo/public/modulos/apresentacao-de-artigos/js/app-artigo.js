function initUserHeader() {
  const headerUserArea = document.getElementById('header-user-area');
  if (!headerUserArea) return;

  const usuarioLogadoJSON = sessionStorage.getItem('usuarioLogado');
  const usuarioLogado = usuarioLogadoJSON ? JSON.parse(usuarioLogadoJSON) : null;

  if (usuarioLogado) {
    const avatarUrl = usuarioLogado.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(usuarioLogado.nome || 'User')}&background=66cdaa&color=fff`;

    headerUserArea.innerHTML = `
            <div class="user-profile-container">
                <img id="headerUserAvatar" src="${avatarUrl}" alt="User Avatar" class="user-avatar">
                <div id="headerUserDropdown" class="user-dropdown hidden">
                    <div class="dropdown-header">
                        <p class="user-name">${usuarioLogado.nome || 'Usuário'}</p>
                        <p class="user-email">${usuarioLogado.email || ''}</p>
                    </div>
                    <button class="dropdown-item" onclick="location.href='../viewhorarios/index.html'">
                        <i class="far fa-calendar-alt"></i> Minha Agenda
                    </button>
                    ${usuarioLogado.tipo === 'psicologo' ? `
                    <button class="dropdown-item" onclick="location.href='../perfil-psicologo-edicao/index.html'">
                        <i class="fas fa-user-edit"></i> Gerenciar Perfil
                    </button>
                    ` : `
                    <button class="dropdown-item" onclick="location.href='../perfil-usuario-edicao/index.html'">
                        <i class="fas fa-user-edit"></i> Editar Meus Dados
                    </button>
                    `}
                    <div class="dropdown-divider"></div>
                    <button id="headerBtnLogout" class="dropdown-item logout">
                        <i class="fas fa-sign-out-alt"></i> Sair
                    </button>
                </div>
            </div>
        `;

    const avatar = document.getElementById('headerUserAvatar');
    const dropdown = document.getElementById('headerUserDropdown');
    const btnLogout = document.getElementById('headerBtnLogout');

    if (avatar && dropdown) {
      avatar.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
      });

      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && e.target !== avatar) {
          dropdown.classList.add('hidden');
        }
      });
    }

    if (btnLogout) {
      btnLogout.addEventListener('click', () => {
        sessionStorage.removeItem('usuarioLogado');
        window.location.reload(); 
      });
    }

  } else {
    headerUserArea.innerHTML = `
            <a href="../../if-login.html" class="btn-header-login">
                <i class="far fa-user"></i> Entrar
            </a>
        `;
  }
}

function mostrarModalLogin() {
  const modal = document.getElementById('modalLoginRequired');
  if (modal) {
    modal.classList.add('show');
  }
}

function fecharModalLogin() {
  const modal = document.getElementById('modalLoginRequired');
  if (modal) {
    modal.classList.remove('show');
  }
}

function checkLoginAction() {
  const usuarioLogado = sessionStorage.getItem('usuarioLogado');
  if (!usuarioLogado) {
    mostrarModalLogin();
    return false;
  }
  return true;
}

document.addEventListener('DOMContentLoaded', () => {
  initUserHeader();

  const btnFechar = document.getElementById('btnFecharModal');
  if (btnFechar) {
    btnFechar.addEventListener('click', fecharModalLogin);
  }

  const modal = document.getElementById('modalLoginRequired');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        fecharModalLogin();
      }
    });
  }
});

const rawId = new URLSearchParams(location.search).get('id');

let id = null;
if (rawId !== null) {
  id = /^\d+$/.test(rawId) ? Number(rawId) : rawId;
}

const usuarioLogadoString = sessionStorage.getItem('usuarioLogado');
const usuarioCorrente = usuarioLogadoString ? JSON.parse(usuarioLogadoString) : null;

function escapeHtml(unsafe) {
  if (unsafe == null) return '';
  return String(unsafe)
    .replaceAll('&', '&amp;') 
    .replaceAll('<', '&lt;') 
    .replaceAll('>', '&gt;') 
    .replaceAll('"', '&quot;') 
    .replaceAll("'", '&#039;'); 
}

function calculaMedia(avaliacoes = []) {
  if (!avaliacoes || !Array.isArray(avaliacoes) || avaliacoes.length === 0) return '0.0';
  const nums = avaliacoes.map(v => Number(v)).filter(n => !Number.isNaN(n) && isFinite(n));
  if (nums.length === 0) return '0.0';
  const soma = nums.reduce((s, v) => s + v, 0);
  const media = soma / nums.length;
  return (Math.round(media * 10) / 10).toFixed(1);
}

function ativarAvaliacao(artigo) {
  const btnAvaliar = document.getElementById('btn-avaliar');
  const containerInline = document.getElementById('avaliacao-inline-container');
  const mediaEl = document.getElementById('media-avaliacao');

  if (!btnAvaliar || !containerInline) return;

  btnAvaliar.addEventListener('click', () => {
    if (!checkLoginAction()) return;

    window.location.href = `../avaliacao-de-artigos/avaliacao.html?id=${encodeURIComponent(artigo.id)}`;
  });
}

function criarHTMLcomentario(comentario) {
  const nomeAutor = comentario.nomeAutor || `Usuário #${comentario.usuarioId}`;
  const data = new Date(comentario.dataPostagem).toLocaleString('pt-BR');
  const podeApagar = usuarioCorrente && usuarioCorrente.id === comentario.usuarioId;

  return `
    <div class="comentario-item" data-id="${escapeHtml(comentario.id)}">
      <div class="autor">${escapeHtml(nomeAutor)}</div> 
      <div class="data">${escapeHtml(data)}</div>
      <p class="texto-comentario">${escapeHtml(comentario.texto)}</p>
      ${podeApagar ? `
        <div class="acoes-comentario">
          <button class="btn-editar-comentario" data-id="${escapeHtml(comentario.id)}">Editar</button>
          <button class="btn-excluir-comentario" data-id="${escapeHtml(comentario.id)}">Excluir</button>
        </div>` : ''}
    </div>
  `;
}

function renderizarComentarios(artigo) {
  const listaDiv = document.getElementById('lista-comentarios');
  if (!listaDiv) return;

  const html = (artigo.comentarios && artigo.comentarios.length > 0) ?
    artigo.comentarios.map(criarHTMLcomentario).join('') :
    '<p id="msg-sem-comentarios">Seja o primeiro a comentar!</p>';

  listaDiv.innerHTML = html;

  
  const botoesExcluir = listaDiv.querySelectorAll('.btn-excluir-comentario');
  botoesExcluir.forEach(btn => {
    btn.addEventListener('click', async () => {
      try {
        const comentarioId = btn.dataset.id;
        const confirmado = confirm('Quer mesmo excluir este comentário?');
        if (!confirmado) return;

        btn.disabled = true;
        btn.textContent = 'Excluindo...';

        const novoArray = (artigo.comentarios || []).filter(c => String(c.id) !== String(comentarioId));

        const resposta = await fetch(`/artigos/${encodeURIComponent(String(artigo.id))}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            comentarios: novoArray
          })
        });

        if (!resposta.ok) throw new Error('HTTP ' + resposta.status);

        const corpo = await resposta.text();
        let artigoAtualizado;
        try {
          artigoAtualizado = JSON.parse(corpo);
        } catch (e) {
          artigoAtualizado = null;
        }

        artigo.comentarios = (artigoAtualizado && artigoAtualizado.comentarios) ? artigoAtualizado.comentarios : novoArray;
        renderizarComentarios(artigo);
      } catch (err) {
        console.error('Erro ao excluir comentário:', err);
        alert('Não foi possível excluir o comentário.');
        btn.disabled = false;
        btn.textContent = 'Excluir';
      }
    });
  });

  const botoesEditar = listaDiv.querySelectorAll('.btn-editar-comentario');
  botoesEditar.forEach(btn => {
    btn.addEventListener('click', () => {
      const comentarioId = btn.dataset.id;
      const item = btn.closest('.comentario-item');
      if (!item) return;

      const pTexto = item.querySelector('.texto-comentario');
      const textoAtual = pTexto ? pTexto.textContent : '';

      const wrapper = document.createElement('div');
      wrapper.className = 'editor-inline';
      wrapper.innerHTML = `
        <textarea class="editor-textarea" rows="4">${textoAtual}</textarea>
        <div class="editor-acoes">
          <button class="btn-salvar-edicao">Salvar</button>
          <button class="btn-cancelar-edicao">Cancelar</button>
        </div>
      `;

      if (pTexto) pTexto.style.display = 'none';
      const acoes = item.querySelector('.acoes-comentario');
      if (acoes) acoes.style.display = 'none';

      item.appendChild(wrapper);

      const btnSalvar = wrapper.querySelector('.btn-salvar-edicao');
      const btnCancelar = wrapper.querySelector('.btn-cancelar-edicao');
      const textarea = wrapper.querySelector('.editor-textarea');

      btnCancelar.addEventListener('click', () => {
        wrapper.remove();
        if (pTexto) pTexto.style.display = '';
        if (acoes) acoes.style.display = '';
      });

      btnSalvar.addEventListener('click', async () => {
        const novoTexto = textarea.value.trim();
        if (novoTexto === '') {
          alert('Comentário não pode ficar vazio.');
          return;
        }

        btnSalvar.disabled = true;
        btnSalvar.textContent = 'Salvando...';

        try {
          const novoArray = (artigo.comentarios || []).map(c => {
            if (String(c.id) === String(comentarioId)) {
              return {
                ...c,
                texto: novoTexto,
                dataPostagem: c.dataPostagem
              };
            }
            return c;
          });

          const resposta = await fetch(`/artigos/${encodeURIComponent(String(artigo.id))}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              comentarios: novoArray
            })
          });

          if (!resposta.ok) throw new Error('HTTP ' + resposta.status);

          const corpo = await resposta.text();
          let artigoAtualizado;
          try {
            artigoAtualizado = JSON.parse(corpo);
          } catch (e) {
            artigoAtualizado = null;
          }

          artigo.comentarios = (artigoAtualizado && artigoAtualizado.comentarios) ? artigoAtualizado.comentarios : novoArray;
          renderizarComentarios(artigo);
        } catch (err) {
          console.error('Erro ao salvar edição:', err);
          alert('Não foi possível salvar a edição. Tente novamente.');
          btnSalvar.disabled = false;
          btnSalvar.textContent = 'Salvar';
        }
      });
    });
  });
}

function criarHTMLListaComentarios(comentarios = []) {
  if (!comentarios || comentarios.length === 0) {
    return '<p id="msg-sem-comentarios">Seja o primeiro a comentar!</p>';
  }
  return comentarios.map(criarHTMLcomentario).join('');
}

function adicionarNovoComentario(artigo) {
  if (!checkLoginAction()) return; 

  const textoComentarioInput = document.getElementById("texto-comentario");
  const texto = textoComentarioInput.value;

  if (texto.trim() === "") {
    alert("Por favor, escreva algo.");
    return;
  }

  const novoComentario = {
    id: Math.floor(Math.random() * 10000),
    usuarioId: usuarioCorrente.id,
    nomeAutor: usuarioCorrente.nome,
    texto: texto,
    dataPostagem: new Date().toISOString()
  };

  const comentariosAtuais = artigo.comentarios || [];
  comentariosAtuais.push(novoComentario);

  fetch(`/artigos/${encodeURIComponent(String(artigo.id))}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      comentarios: comentariosAtuais
    })
  })
    .then(res => {
      if (!res.ok) throw new Error('Falha ao salvar o comentário');
      return res.json();
    })
    .then(artigoAtualizadoDoServidor => {
      artigo.comentarios = artigoAtualizadoDoServidor.comentarios || [];
      renderizarComentarios(artigo);
      textoComentarioInput.value = "";
    })
    .catch(err => {
      console.error("Erro ao salvar comentário:", err);
      alert("Não foi possível salvar seu comentário!!!");
    });
}

function normalizarArtigo(a) {
  if (!a) return null;

  const avaliacoesArray = Array.isArray(a.avaliacoes) ?
    a.avaliacoes.map(v => {
      if (typeof v === 'number') return v;
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }).filter(x => x !== null) : [];

  const imagenstexto = Array.isArray(a.imagenstexto) ? a.imagenstexto :
    Array.isArray(a.imagenstexto) ? a.imagenstexto : [];

  const capa = a.imagemcapa || a.imagem || '/imgs/default-capa.jpg';

  return {
    id: String(a.id ?? ''),
    titulo: a.titulo ?? a.title ?? '',
    resumo: a.resumo ?? '',
    conteudo: a.conteudo ?? '',
    autor: a.autor ?? a.autor ?? '—',
    categoria: a.categoria ?? a.categorie ?? 'Parentalidade',
    imagem: a.imagem ?? '',
    imagemcapa: capa,
    imagenstexto: imagenstexto,
    datapublicacao: a.datapublicacao ?? a.dataPublicacao ?? '',
    avaliacoes: avaliacoesArray,
    comentarios: Array.isArray(a.comentarios) ? a.comentarios : [],
    status: a.status ?? 'rascunho'
  };
}

function formatarConteudoParaHtml(texto) {
  if (!texto) return '';
  const partes = String(texto).split(/\n\s*\n/).map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`);
  return partes.join('');
}

fetch(`/artigos/${encodeURIComponent(id)}`)
  .then(r => {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  })
  .then(raw => {
    if (!raw || !raw.id) throw new Error('Artigo não encontrado');

    const a = normalizarArtigo(raw);
    const main = document.getElementById('conteudo-artigo');
    if (!main) return;

    const htmlArtigo = ` 
      <img src="${escapeHtml(a.imagemcapa)}" class="capa" alt="${escapeHtml(a.titulo)}">
      <h1>${escapeHtml(a.titulo)}</h1>
      <p class="meta">Por ${escapeHtml(a.autor)} | ${escapeHtml(a.datapublicacao)}</p>
      <div class="conteudo-artigo">${formatarConteudoParaHtml(a.conteudo)}</div>
      <div class="galeria">
        ${(a.imagenstexto || []).map(src => `<img src="${escapeHtml(src)}" alt="">`).join('')}
      </div>
    `;

    const htmlFormularioComentario = `
        <h2>Avaliações</h2>
        <div class="comentario-form">
          <textarea id="texto-comentario" placeholder="Escreva aqui seu comentário..."></textarea>
          <button id="btn-comentar">Enviar Comentário</button>
        </div>
      `;

    const htmlAvaliacao = `
      <div class="avaliacao-bar" id="avaliacao-bar">
        <div class="media-avaliacao" id="media-avaliacao">Avaliação: ${calculaMedia(a.avaliacoes)} (${(a.avaliacoes || []).length})</div>
        <button class="btn-avaliar" id="btn-avaliar">Avaliar artigo</button>
        <div id="avaliacao-inline-container" style="display:none;"></div>
      </div>
    `;

    const htmlComentarios = `
      <div class="comentarios-container">
        ${htmlFormularioComentario}
        ${htmlAvaliacao}
        <h3 id="total-comentarios">Comentários (${(a.comentarios || []).length})</h3>
        <div id="lista-comentarios" aria-live="polite">
          ${criarHTMLListaComentarios(a.comentarios)}
        </div>
      </div>
    `;

    main.innerHTML = htmlArtigo + htmlComentarios;

    const btnComentar = document.getElementById("btn-comentar");
    if (btnComentar) {
      btnComentar.addEventListener("click", () => adicionarNovoComentario(a));
    }

    renderizarComentarios(a);
    ativarAvaliacao(a);
  })
  .catch(err => {
    console.error('Falha ao carregar /artigos/' + id, err);
    const target = document.getElementById('conteudo-artigo');
    if (target) target.innerHTML = '<p>Artigo não encontrado.</p>';
  });
