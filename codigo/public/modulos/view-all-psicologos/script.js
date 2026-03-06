document.getElementById('year').textContent = new Date().getFullYear();
const grid = document.getElementById('psychGrid');
const searchInput = document.getElementById('searchInput');
const API_BASE = window.location.origin;

const API_BASE_PSICOLOGOS = '/psicologos';

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


async function carregarPsicologos() {
  try {
    const response = await fetch(`${API_BASE}/psicologos`);

    if (!response.ok) throw new Error('Erro ao conectar com o servidor');

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    grid.innerHTML = `
      <div class="col-12 text-center">
        <p class="text-danger">Erro ao carregar psicólogos. Verifique se o servidor está rodando.</p>
      </div>`;
    return [];
  }
}

function renderCards(psychologists) {
  grid.innerHTML = '';

  if (psychologists.length === 0) {
    grid.innerHTML = `
      <div class="col-12 text-center">
        <p class="text-muted lead">Nenhum psicólogo encontrado 😕</p>
      </div>`;
    return;
  }

  psychologists.forEach(p => {
    const listaEspecialidades = p.especialidades ? p.especialidades.map(e => e.nome).join(', ') : 'Geral';

    const cardCol = document.createElement('div');
    cardCol.className = 'col-md-6 col-lg-4';

    cardCol.innerHTML = `
      <div class="card h-100 border-0 shadow-sm hover-card">
        <div class="card-body text-center p-4">
          <div class="mb-3">
            <img
              src="${p.foto}"
              alt="Foto de ${escapeHtml(p.nome)}"
              class="rounded-circle object-fit-cover border border-3 border-white shadow-sm"
              style="width: 120px; height: 120px;"
              onerror="this.src='https://via.placeholder.com/150'">
          </div>
          <h3 class="h5 fw-bold text-dark mb-1">${escapeHtml(p.nome)}</h3>
          <p class="text-primary fw-semibold small mb-3">${escapeHtml(listaEspecialidades)}</p>
          
          <p class="text-muted small mb-4" style="-webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; display: -webkit-box; height: 60px;">
            ${escapeHtml(p.bio)}
          </p>
          
          <div class="d-flex justify-content-center gap-2 mb-4">
            <span class="badge bg-light text-dark border">R$ ${p.valorConsulta}</span>
            <span class="badge bg-light text-dark border">${p.tipoAtendimento}</span>
          </div>

          <a href="/modulos/viewpsi/psicologo.html?id=${p.id}" class="btn btn-primary rounded-pill px-4 fw-bold w-100">
            Ver Perfil
          </a>
        </div>
      </div>`;
    grid.appendChild(cardCol);
  });
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function filtrarPsicologos(lista, termo) {
  termo = termo.toLowerCase();

  return lista.filter(p => {
    const matchNome = p.nome.toLowerCase().includes(termo);
    const matchEspecialidade = p.especialidades && p.especialidades.some(esp =>
      esp.nome.toLowerCase().includes(termo)
    );
    return matchNome || matchEspecialidade;
  });
}

let psicologos = [];

document.addEventListener('DOMContentLoaded', () => {
  initUserHeader();
  carregarPsicologos().then(data => {
    psicologos = data;
    renderCards(psicologos);
  });
});

function atualizarLista() {
  const termo = searchInput.value;
  const filtrados = filtrarPsicologos(psicologos, termo);
  renderCards(filtrados);
}

searchInput.addEventListener('input', atualizarLista);
