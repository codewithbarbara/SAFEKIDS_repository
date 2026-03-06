const API_BASE = window.location.origin;
const API_URL_AGENDAMENTOS = `${API_BASE}/agendamentos`;
const API_URL_USUARIOS = `${API_BASE}/usuarios`;

document.addEventListener('DOMContentLoaded', () => {
    initUserHeader();
    carregarAgendamentos();
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
                    <button class="dropdown-item" onclick="location.href='./index.html'">
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
                window.location.href = '../../if-login.html';
            });
        }

    } else {
        window.location.href = '../../if-login.html';
    }
}

async function carregarAgendamentos() {
    const container = document.getElementById('agendamentos-container');
    const spinner = document.getElementById('loading-spinner');
    const emptyState = document.getElementById('empty-state');

    const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado'));

    if (!usuarioLogado) return; 

    try {
        let url = '';
        const isPsicologo = usuarioLogado.tipo === 'psicologo';

        if (isPsicologo) {
            url = `${API_URL_AGENDAMENTOS}?psicologoId=${usuarioLogado.id}`;
        } else {
            url = `${API_URL_AGENDAMENTOS}?usuarioId=${usuarioLogado.id}`;
        }

        const res = await fetch(url);
        if (!res.ok) throw new Error('Erro ao buscar agendamentos');

        let agendamentos = await res.json();

        agendamentos.sort((a, b) => new Date(b.data) - new Date(a.data));

        if (agendamentos.length === 0) {
            spinner.style.display = 'none';
            emptyState.style.display = 'block';
            return;
        }

        if (isPsicologo) {
            
            const promises = agendamentos.map(async (agenda) => {
                try {
                    const userRes = await fetch(`${API_URL_USUARIOS}/${agenda.usuarioId}`);
                    if (userRes.ok) {
                        const user = await userRes.json();
                        agenda.nomePaciente = user.nome;
                    } else {
                        agenda.nomePaciente = 'Paciente (Desconhecido)';
                    }
                } catch (e) {
                    agenda.nomePaciente = 'Erro ao carregar nome';
                }
                return agenda;
            });
            agendamentos = await Promise.all(promises);
        }

        container.innerHTML = agendamentos.map(agendamento => renderCard(agendamento, isPsicologo)).join('');

        spinner.style.display = 'none';
        container.style.display = 'flex';

    } catch (err) {
        console.error(err);
        spinner.style.display = 'none';
        container.innerHTML = `<div class="alert alert-danger">Erro ao carregar seus agendamentos.</div>`;
        container.style.display = 'block';
    }
}

function renderCard(agendamento, isPsicologo) {
    const dataFormatada = new Date(agendamento.data).toLocaleDateString('pt-BR');

    const statusColors = {
        'agendado': 'success',
        'cancelado': 'danger',
        'concluido': 'secondary'
    };
    const statusColor = statusColors[agendamento.status] || 'primary';

    const titulo = isPsicologo ? (agendamento.nomePaciente || 'Paciente') : agendamento.nomePsicologo;
    const subtitulo = isPsicologo ? 'Paciente' : 'Psicólogo(a)';
    const icone = isPsicologo ? 'fa-user' : 'fa-user-md';

    let footerContent = '';

    if (isPsicologo) {
        footerContent = `
            <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                 <button onclick="cancelarAgendamento('${agendamento.id}')" class="btn btn-sm btn-outline-danger">
                    <i class="fas fa-times-circle"></i> Cancelar
                 </button>
            </div>`;
    } else {
        footerContent = `
            <div class="d-flex justify-content-end gap-2 mt-4 pt-3 border-top">
                <button onclick="cancelarAgendamento('${agendamento.id}')" class="btn btn-sm btn-outline-danger">
                    <i class="fas fa-times-circle"></i> Cancelar
                </button>
                <a href="../viewpsi/psicologo.html?id=${agendamento.psicologoId}" class="btn btn-sm btn-outline-primary">Ver Perfil</a>
            </div>`;
    }

    return `
        <div class="col-12 col-md-6 col-lg-4">
            <div class="card card-agendamento shadow-sm h-100">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <small class="text-muted text-uppercase fw-bold" style="font-size: 0.7rem;">${subtitulo}</small>
                            <h5 class="card-title fw-bold text-dark mb-0 mt-1">
                                ${titulo}
                            </h5>
                        </div>
                        <span class="badge bg-${statusColor}-subtle text-${statusColor} text-uppercase" style="font-size: 0.75rem;">
                            ${agendamento.status}
                        </span>
                    </div>
                    
                    <div class="info-row mb-2">
                        <i class="far fa-calendar text-primary"></i>
                        <span>${dataFormatada}</span>
                    </div>
                    
                    <div class="info-row mb-3">
                        <i class="far fa-clock text-primary"></i>
                        <span>${agendamento.horario}</span>
                    </div>

                    ${footerContent}
                </div>
            </div>
        </div>
    `;
}


let idParaCancelar = null;

function cancelarAgendamento(id) {
    idParaCancelar = id;
    const modalElement = document.getElementById('modalCancelamento');
    if (modalElement && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.show();
    }
}

document.addEventListener('DOMContentLoaded', () => {

    const btnConfirmar = document.getElementById('btnConfirmarCancelamento');
    if (btnConfirmar) {
        btnConfirmar.addEventListener('click', async () => {
            if (!idParaCancelar) return;

            const originalText = btnConfirmar.innerHTML;
            btnConfirmar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cancelando...';
            btnConfirmar.disabled = true;

            try {
                const response = await fetch(`${API_URL_AGENDAMENTOS}/${idParaCancelar}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    const modalElement = document.getElementById('modalCancelamento');
                    const modal = bootstrap.Modal.getInstance(modalElement);
                    modal.hide();

                    idParaCancelar = null;
                    carregarAgendamentos();
                } else {
                    alert('Erro ao cancelar agendamento.');
                }
            } catch (error) {
                console.error('Erro:', error);
                alert('Erro de conexão ao tentar cancelar.');
            } finally {
                btnConfirmar.innerHTML = originalText;
                btnConfirmar.disabled = false;
            }
        });
    }
});
