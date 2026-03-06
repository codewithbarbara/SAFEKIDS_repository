const API_BASE = window.location.origin;
const API_URL_PSICOLOGOS = `${API_BASE}/psicologos`;
const API_URL_HORARIOS = `${API_BASE}/horariosDisponiveis`;

let usuarioLogado = null;

document.addEventListener('DOMContentLoaded', () => {
    verificarLogin();
    initUserHeader();
    carregarDadosPerfil();
    setupAgendaListeners();

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('agendaDateFilter').value = today;
    document.getElementById('inputDataAdd').value = today;

    carregarHorariosDoDia(today);
});

function verificarLogin() {
    const usuarioLogadoJSON = sessionStorage.getItem('usuarioLogado');
    if (!usuarioLogadoJSON) {
        window.location.href = '../../if-login.html';
        return;
    }
    usuarioLogado = JSON.parse(usuarioLogadoJSON);

    if (usuarioLogado.tipo !== 'psicologo') {
        alert('Acesso restrito a psicólogos.');
        window.location.href = '../../index.html';
    }
}

function initUserHeader() {
    const headerUserArea = document.getElementById('header-user-area');
    if (!headerUserArea) return;

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
}

async function carregarDadosPerfil() {
    try {
        const res = await fetch(`${API_URL_PSICOLOGOS}/${usuarioLogado.id}`);
        if (!res.ok) throw new Error('Erro ao carregar perfil.');
        const psicologo = await res.json();

        document.getElementById('inputNome').value = psicologo.nome || '';
        document.getElementById('inputValor').value = psicologo.valorConsulta || '';
        document.getElementById('inputCidade').value = psicologo.cidade || '';
        document.getElementById('inputBio').value = psicologo.bio || '';
        document.getElementById('inputFoto').value = psicologo.foto || '';

    } catch (err) {
        console.error(err);
        alert('Erro ao carregar dados do perfil.');
    }
}

document.getElementById('formPerfil').addEventListener('submit', async (e) => {
    e.preventDefault();

    const updates = {
        nome: document.getElementById('inputNome').value,
        valorConsulta: parseFloat(document.getElementById('inputValor').value),
        cidade: document.getElementById('inputCidade').value,
        bio: document.getElementById('inputBio').value,
        foto: document.getElementById('inputFoto').value
    };

    try {
        const res = await fetch(`${API_URL_PSICOLOGOS}/${usuarioLogado.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });

        if (res.ok) {
            usuarioLogado.nome = updates.nome;
            usuarioLogado.foto = updates.foto;
            sessionStorage.setItem('usuarioLogado', JSON.stringify(usuarioLogado));
            initUserHeader();

            new bootstrap.Modal(document.getElementById('modalSucessoPerfil')).show();
        } else {
            throw new Error('Erro ao salvar.');
        }
    } catch (e) {
        console.error(e);
        alert('Erro ao atualizar perfil.');
    }
});

function setupAgendaListeners() {
    const dateInput = document.getElementById('agendaDateFilter');
    dateInput.addEventListener('change', (e) => {
        carregarHorariosDoDia(e.target.value);
    });

    document.getElementById('formAddHorario').addEventListener('submit', handleAddHorario);
}

let currentScheduleId = null; 
let currentHorarios = []; 

async function carregarHorariosDoDia(data) {
    if (!data) return;

    const [ano, mes, dia] = data.split('-');
    document.getElementById('displayDate').textContent = `${dia}/${mes}/${ano}`;
    const container = document.getElementById('listaHorariosContainer');
    const chipsContainer = document.getElementById('chipsHorarios');
    const msgSemHorarios = document.getElementById('msgSemHorarios');

    container.style.display = 'block';
    document.getElementById('agendaWarning').style.display = 'none';

    try {
        const url = `${API_URL_HORARIOS}?psicologoId=${usuarioLogado.id}&data=${data}`;
        const res = await fetch(url);
        const results = await res.json();

        chipsContainer.innerHTML = '';

        if (results.length > 0) {
            const schedule = results[0];
            currentScheduleId = schedule.id;
            currentHorarios = schedule.horarios;

            if (currentHorarios.length > 0) {
                msgSemHorarios.style.display = 'none';
                currentHorarios.sort().forEach(hora => {
                    const chip = document.createElement('div');
                    chip.className = 'time-slot d-flex align-items-center gap-2';
                    chip.innerHTML = `
                        <span>${hora}</span>
                        <i class="fas fa-times text-danger" style="cursor:pointer" onclick="removerHorario('${hora}')"></i>
                    `;
                    chipsContainer.appendChild(chip);
                });
            } else {
                msgSemHorarios.style.display = 'block';
            }
        } else {
            currentScheduleId = null;
            currentHorarios = [];
            msgSemHorarios.style.display = 'block';
        }

    } catch (e) {
        console.error(e);
        alert('Erro ao carregar horários.');
    }
}

async function handleAddHorario(e) {
    e.preventDefault();
    const data = document.getElementById('inputDataAdd').value;
    const hora = document.getElementById('inputHoraAdd').value;

    if (!data || !hora) return;

    const filterDate = document.getElementById('agendaDateFilter').value;
    if (filterDate !== data) {
        document.getElementById('agendaDateFilter').value = data;
        await carregarHorariosDoDia(data);
    }

    if (currentHorarios.includes(hora)) {
        alert('Este horário já existe.');
        return;
    }

    currentHorarios.push(hora);
    await salvarHorarios(data);

    const modal = bootstrap.Modal.getInstance(document.getElementById('modalNovoHorario'));
    modal.hide();
}

window.removerHorario = async function (hora) {
    if (!confirm(`Remover o horário ${hora}?`)) return;

    currentHorarios = currentHorarios.filter(h => h !== hora);
    const data = document.getElementById('agendaDateFilter').value;
    await salvarHorarios(data);
}

async function salvarHorarios(data) {
    try {
        const payload = {
            psicologoId: usuarioLogado.id,
            data: data,
            horarios: currentHorarios
        };

        let res;
        if (currentScheduleId) {
            res = await fetch(`${API_URL_HORARIOS}/${currentScheduleId}`, {
                method: 'PUT', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload) 
            });
        } else {
            res = await fetch(API_URL_HORARIOS, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
        }

        if (res.ok) {
            await carregarHorariosDoDia(data);
        } else {
            throw new Error('Erro ao salvar agenda.');
        }

    } catch (e) {
        console.error(e);
        alert('Erro ao salvar alterações na agenda.');
    }
}
