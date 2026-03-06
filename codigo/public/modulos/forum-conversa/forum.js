const API_BASE = window.location.origin;
const URL_POSTS = `${API_BASE}/posts`;
const URL_COMENTARIOS = `${API_BASE}/comentarios`;

async function carregarFeed() {
  try {
    const response = await fetch(URL_POSTS + '?_embed=comentarios&_sort=id&_order=desc');
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const posts = await response.json();
    renderizar(posts);
  } catch (erro) {
    console.error(erro);
    document.getElementById('feed-posts').innerHTML =
      "<div class='erro'>Erro ao conectar no json-server.</div>";
  }
}

function renderizar(posts) {
  const feed = document.getElementById('feed-posts');
  feed.innerHTML = '';

  if (!posts || posts.length === 0) {
    feed.innerHTML = "<div class='vazio'>Nenhuma conversa ainda.</div>";
    return;
  }

  posts.forEach(post => {
    let htmlComentarios = '';
    if (post.comentarios && post.comentarios.length > 0) {
      post.comentarios.forEach(com => {
        htmlComentarios += `<div class="comentario-unico"><strong>Anônimo:</strong> ${com.body}</div>`;
      });
    } else {
      htmlComentarios = '<div style="color:var(--muted); font-size:0.85rem;">Seja o primeiro a apoiar.</div>';
    }

    const card = document.createElement('div');
    card.className = 'post-card';
    card.innerHTML = `
      <div class="post-header">
        <div class="avatar-anonimo">?</div>
        <div class="post-info">
          <h3>${post.title}</h3>
          <span>Anônimo • SafeKids</span>
        </div>
      </div>
      
      <div class="post-conteudo">${post.body}</div>

      <div class="comentarios-area">
        <div id="lista-comentarios-${post.id}">
          ${htmlComentarios}
        </div>
        
        <div class="form-responder">
          <input type="text" id="input-com-${post.id}" placeholder="Escreva uma mensagem de apoio..." autocomplete="off">
          <button class="btn-responder-mini" onclick="responderPost('${post.id}')">Enviar</button>
        </div>
      </div>
    `;
    feed.appendChild(card);
  });
}

function mostrarModalLogin() {
  const modalElement = document.getElementById('modalLoginRequired');
  if (modalElement && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
    const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    modal.show();
  }
}

async function criarPost() {
  const usuarioLogado = sessionStorage.getItem('usuarioLogado');
  if (!usuarioLogado) {
    mostrarModalLogin();
    return;
  }

  const titulo = document.getElementById('titulo').value;
  const texto = document.getElementById('texto').value;

  if (!titulo || !texto) {
    alert("Preencha todos os campos!");
    return;
  }

  await fetch(URL_POSTS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: titulo, body: texto })
  });

  document.getElementById('titulo').value = '';
  document.getElementById('texto').value = '';

  const modalElement = document.getElementById('modalNovoTopico');
  if (modalElement) {
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) modal.hide();
  }

  carregarFeed();
}

async function responderPost(idDoPost) {
  const usuarioLogado = sessionStorage.getItem('usuarioLogado');
  if (!usuarioLogado) {
    mostrarModalLogin();
    return;
  }

  const idString = String(idDoPost);
  const input = document.getElementById(`input-com-${idString}`);

  if (!input || !input.value) return;

  await fetch(URL_COMENTARIOS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body: input.value, postId: idString })
  });

  carregarFeed();
}

document.addEventListener('DOMContentLoaded', function () {
  initUserHeader();
  carregarFeed();
});

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
      <button class="btn-header-login" onclick="location.href='../../if-login.html'">
        <i class="far fa-user"></i> Entrar
      </button>
    `;
  }
}
