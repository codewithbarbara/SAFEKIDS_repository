const API_BASE = window.location.origin;
const API_URL_USUARIOS = `${API_BASE}/usuarios`;

let usuarioLogado = null;

document.addEventListener('DOMContentLoaded', () => {
    verificarLogin();
    initUserHeader();
    carregarDadosUsuario();
});

function verificarLogin() {
    const usuarioLogadoJSON = sessionStorage.getItem('usuarioLogado');
    if (!usuarioLogadoJSON) {
        window.location.href = '../../if-login.html';
        return;
    }
    usuarioLogado = JSON.parse(usuarioLogadoJSON);
}

function initUserHeader() {
    const headerUserArea = document.getElementById('header-user-area');
    if (!headerUserArea) return;

    const avatarUrl = usuarioLogado.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(usuarioLogado.nome || 'User')}&background=66cdaa&color=fff`;

    headerUserArea.innerHTML = `
        <div class="user-profile-container">
            <img id="headerUserAvatar" src="${avatarUrl}" alt="User Avatar" class="user-avatar">
            <div id="headerUserDropdown" class="user-dropdown">
                <div class="dropdown-header p-3 border-bottom">
                    <p class="user-name fw-bold mb-0">${usuarioLogado.nome || 'Usuário'}</p>
                    <p class="user-email small text-muted mb-0">${usuarioLogado.email || ''}</p>
                </div>
                <div class="p-2">
                    <a href="../viewhorarios/index.html" class="d-block text-decoration-none text-dark p-2 rounded hover-bg-light">
                        <i class="far fa-calendar-alt me-2 text-primary"></i> Minha Agenda
                    </a>
                    
                    ${usuarioLogado.tipo === 'psicologo' ? `
                    <a href="../perfil-psicologo-edicao/index.html" class="d-block text-decoration-none text-dark p-2 rounded hover-bg-light">
                        <i class="fas fa-user-edit me-2 text-primary"></i> Gerenciar Perfil
                    </a>
                    ` : `
                    <a href="../perfil-usuario-edicao/index.html" class="d-block text-decoration-none text-dark p-2 rounded hover-bg-light bg-light fw-bold">
                        <i class="fas fa-user-edit me-2 text-primary"></i> Editar Meus Dados
                    </a>
                    `}

                    <hr class="dropdown-divider my-2">
                    
                    <a href="#" id="headerBtnLogout" class="d-block text-decoration-none text-danger p-2 rounded hover-bg-light">
                        <i class="fas fa-sign-out-alt me-2"></i> Sair
                    </a>
                </div>
            </div>
        </div>
    `;

    const avatar = document.getElementById('headerUserAvatar');
    const dropdown = document.getElementById('headerUserDropdown');
    const btnLogout = document.getElementById('headerBtnLogout');

    if (avatar && dropdown) {
        avatar.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && e.target !== avatar) {
                dropdown.classList.remove('show');
            }
        });
    }

    if (btnLogout) {
        btnLogout.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('usuarioLogado');
            window.location.href = '../../if-login.html';
        });
    }
}

async function carregarDadosUsuario() {
    try {
        const res = await fetch(`${API_URL_USUARIOS}/${usuarioLogado.id}`);
        if (!res.ok) throw new Error('Erro ao buscar dados do usuário');

        const dados = await res.json();

        document.getElementById('inputNome').value = dados.nome || '';
        document.getElementById('inputLogin').value = dados.login || '';
        document.getElementById('inputEmail').value = dados.email || '';
        document.getElementById('inputFoto').value = dados.foto || '';

    } catch (e) {
        console.error(e);
        alert('Falha ao carregar informações do perfil.');
    }
}

document.getElementById('formPerfilUsuario').addEventListener('submit', async (e) => {
    e.preventDefault();

    const updates = {
        nome: document.getElementById('inputNome').value,
        email: document.getElementById('inputEmail').value,
        foto: document.getElementById('inputFoto').value
    };

    try {
        const res = await fetch(`${API_URL_USUARIOS}/${usuarioLogado.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        if (res.ok) {
            usuarioLogado.nome = updates.nome;
            usuarioLogado.email = updates.email;
            usuarioLogado.foto = updates.foto;
            sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));

            initUserHeader();

            new bootstrap.Modal(document.getElementById('modalSucessoUsuario')).show();
        } else {
            throw new Error('Erro ao salvar');
        }
    } catch (err) {
        console.error(err);
        alert('Erro ao atualizar perfil.');
    }
});
