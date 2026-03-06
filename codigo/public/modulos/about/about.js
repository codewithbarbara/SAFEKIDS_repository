document.addEventListener('DOMContentLoaded', function () {

  const elAno = document.getElementById('anoAtual');
  if (elAno) elAno.textContent = new Date().getFullYear();

  initUserHeader();
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
