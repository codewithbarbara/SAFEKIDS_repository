const API_BASE = window.location.origin;
const API_URL = `${API_BASE}/psicologos`;

function init() {
    checkAdminAccess();
    initUserHeader();
    setupForm();
}

function checkAdminAccess() {
    const usuarioLogadoJSON = sessionStorage.getItem('usuarioLogado');
    const usuarioLogado = usuarioLogadoJSON ? JSON.parse(usuarioLogadoJSON) : null;
    const adminListContainer = document.getElementById('adminListContainer');

    if (usuarioLogado && usuarioLogado.login === 'admin') {
        if (adminListContainer) {
            adminListContainer.style.display = 'block';
            carregarUsuarios();
        }
    } else {
        if (adminListContainer) {
            adminListContainer.style.display = 'none';
        }
    }
}

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
                        <i class="fa-solid fa-right-from-bracket"></i> Sair
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
                window.location.href = 'login.html';
            });
        }
    } else {
        headerUserArea.innerHTML = `
            <button class="btn-header-login" onclick="location.href='login.html'">
                <i class="fa-regular fa-user"></i> Entrar
            </button>
        `;
    }
}

function setupForm() {
    const form = document.getElementById('formCadastro');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const id = document.getElementById('id').value;
        const nome = document.getElementById('nome').value;
        const crp = document.getElementById('crp').value;
        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;
        const cidade = document.getElementById('cidade').value;
        const valor = document.getElementById('valorConsulta').value;
        const tipo = document.getElementById('tipoAtendimento').value;
        const convenios = document.getElementById('aceitaConvenios').checked;
        const formacao = document.getElementById('formacao').value;
        const especialidades = document.getElementById('especialidades').value;
        const bio = document.getElementById('bio').value;
        const foto = document.getElementById('foto').value;

        const psicologo = {
            nome, crp, email, senha, cidade,
            valor: parseFloat(valor),
            tipo, convenios, formacao, especialidades, bio, foto
        };

        try {
            let res;
            if (id) {
                res = await fetch(`${API_URL}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(psicologo)
                });
            } else {
                res = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(psicologo)
                });
            }

            if (res.ok) {
                alert('Psicólogo salvo com sucesso!');
                form.reset();
                document.getElementById('id').value = '';
                checkAdminAccess(); 
                alert('Erro ao salvar psicólogo.');
            }
        } catch (err) {
            console.error(err);
            alert('Erro de conexão.');
        }
    });
}

async function carregarUsuarios() {
    const container = document.getElementById('listaUsuarios');
    if (!container) return;

    try {
        const res = await fetch(API_URL);
        const usuarios = await res.json();

        if (usuarios.length === 0) {
            container.innerHTML = '<p>Nenhum usuário cadastrado.</p>';
            return;
        }

        container.innerHTML = usuarios.map(u => `
            <div class="usuario-card">
                <img src="${u.foto || '../../assets/images/avatar-placeholder.png'}" alt="${u.nome}">
                <div class="info">
                    <h3>${u.nome}</h3>
                    <p>${u.email}</p>
                    <p>CRP: ${u.crp}</p>
                </div>
                <div class="actions">
                    <button onclick="editarUsuario('${u.id}')" class="btn-edit"><i class="fa-solid fa-pen"></i></button>
                    <button onclick="deletarUsuario('${u.id}')" class="btn-delete"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p>Erro ao carregar usuários.</p>';
    }
}

window.editarUsuario = async (id) => {
    try {
        const res = await fetch(`${API_URL}/${id}`);
        const u = await res.json();

        document.getElementById('id').value = u.id;
        document.getElementById('nome').value = u.nome;
        document.getElementById('crp').value = u.crp;
        document.getElementById('email').value = u.email;
        document.getElementById('senha').value = u.senha;
        document.getElementById('cidade').value = u.cidade;
        document.getElementById('valorConsulta').value = u.valor;
        document.getElementById('tipoAtendimento').value = u.tipo;
        document.getElementById('aceitaConvenios').checked = u.convenios;
        document.getElementById('formacao').value = u.formacao;
        document.getElementById('especialidades').value = u.especialidades;
        document.getElementById('bio').value = u.bio;
        document.getElementById('foto').value = u.foto;

        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
        console.error(err);
    }
};

window.deletarUsuario = async (id) => {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        try {
            await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
            checkAdminAccess();
        } catch (err) {
            console.error(err);
        }
    }
};

document.addEventListener('DOMContentLoaded', init);
