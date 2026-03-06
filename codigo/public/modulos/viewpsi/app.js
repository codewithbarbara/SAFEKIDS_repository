const API_BASE = window.location.origin;
const API_URL_HORARIOS = `${API_BASE}/horariosDisponiveis`;
const API_URL_AVALIACOES = `${API_BASE}/avaliacoes`;
const API_BASE_PSICOLOGOS = `${API_BASE}/psicologos`;
const API_URL_AGENDAMENTOS = `${API_BASE}/agendamentos`;

let psicologaData = {};

const btnVerHorarios = document.getElementById('btnVerHorarios');

const horariosContainer = document.getElementById('horarios-container');
const loadingSpinner = document.getElementById('loading-spinner');
const formAvaliacao = document.getElementById('formAvaliacao');


function formatarMoeda(valor) {
    return 'R$' + valor.toFixed(2).replace('.', ',');
}

function gerarEstrelasHTML(nota) {
    let html = '';
    const notaArredondada = Math.round(nota);
    for (let i = 1; i <= 5; i++) {
        if (i <= notaArredondada) {
            html += '<i class="fas fa-star text-warning"></i>';
        } else {
            html += '<i class="far fa-star text-warning opacity-50"></i>';
        }
    }
    return html;
}


function formatarData(dataISO) {
    if (!dataISO) {
        return 'Data indisponível';
    }
    try {

        const [ano, mes, dia] = dataISO.split('-');
        if (!dia || !mes) {
            return dataISO;
        }
        return `${dia}/${mes}`;
    } catch (e) {
        console.error("Erro ao formatar data:", e);
        return 'Erro de formato';
    }
}
function obterNomeDiaSemana(dataISO) {
    if (!dataISO) return 'Dia';

    // Cria a data sem problemas de fuso horário (UTC vs Local)
    const [ano, mes, dia] = dataISO.split('-').map(Number);
    const data = new Date(ano, mes - 1, dia);

    // Lista de nomes
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

    return dias[data.getDay()];
}

let agendamentoPendente = null;

function agendar(data, horario) {
    agendamentoPendente = { data, horario };

    // Fechar modal de horários (Agenda)
    const modalHorarios = document.getElementById('modalHorarios');
    if (modalHorarios && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const modalInstance = bootstrap.Modal.getInstance(modalHorarios);
        if (modalInstance) {
            modalInstance.hide();
        }
    }

    const modalElement = document.getElementById('modalConfirmacaoAgendamento');
    const dataElement = document.getElementById('confirmData');
    const horarioElement = document.getElementById('confirmHorario');

    if (dataElement) dataElement.textContent = formatarData(data);
    if (horarioElement) horarioElement.textContent = horario;

    if (modalElement && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.show();
    }
}

async function confirmarAgendamento() {
    if (!agendamentoPendente) return;

    const usuarioLogado = JSON.parse(sessionStorage.getItem('usuarioLogado'));
    if (!usuarioLogado) {
        alert('Erro: Usuário não identificado. Por favor, faça login novamente.');
        return;
    }

    const novoAgendamento = {
        usuarioId: usuarioLogado.id,
        psicologoId: psicologaData.id,
        nomePsicologo: psicologaData.nome,
        data: agendamentoPendente.data,
        horario: agendamentoPendente.horario,
        status: 'agendado', // status inicial
        criadoEm: new Date().toISOString()
    };

    try {
        const response = await fetch(API_URL_AGENDAMENTOS, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(novoAgendamento)
        });

        if (!response.ok) throw new Error('Falha ao salvar agendamento');

        // Fechar modal de confirmação
        const modalConfirmacao = document.getElementById('modalConfirmacaoAgendamento');
        if (modalConfirmacao && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = bootstrap.Modal.getInstance(modalConfirmacao) || new bootstrap.Modal(modalConfirmacao);
            modal.hide();
        }

        // Mostrar modal de sucesso
        const modalSucesso = document.getElementById('modalAgendamentoSucesso');
        const dataElement = document.getElementById('modalAgendamentoData');
        const horarioElement = document.getElementById('modalAgendamentoHorario');

        if (dataElement) dataElement.textContent = formatarData(agendamentoPendente.data);
        if (horarioElement) horarioElement.textContent = agendamentoPendente.horario;

        if (modalSucesso && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = bootstrap.Modal.getInstance(modalSucesso) || new bootstrap.Modal(modalSucesso);
            modal.show();
        }

    } catch (error) {
        console.error('Erro ao agendar:', error);
        alert('Ocorreu um erro ao confirmar seu agendamento. Tente novamente.');
    } finally {
        agendamentoPendente = null;
    }
}

function fecharModalAvaliacao() {

    const modalElement = document.getElementById('modalAvaliacao');
    if (modalElement && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.hide();
    }
}


function mostrarModalAvaliacao() {

    const modalElement = document.getElementById('modalAvaliacao');
    if (modalElement && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.show();
    }
}

function obterIdPsicologoDaURL() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// --- Access Control Logic ---
function isAdmin() {
    const usuarioLogadoJSON = sessionStorage.getItem('usuarioLogado');
    const usuarioLogado = usuarioLogadoJSON ? JSON.parse(usuarioLogadoJSON) : null;
    return usuarioLogado && usuarioLogado.login === 'admin';
}

function isLoggedIn() {
    return !!sessionStorage.getItem('usuarioLogado');
}

function checkAdminAction() {
    if (!isAdmin()) {
        alert('Você precisa estar logado como administrador para realizar esta ação.');
        return false;
    }
    return true;
}

function mostrarModalLogin() {
    const modalElement = document.getElementById('modalLoginRequired');
    if (modalElement && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.show();
    }
}

function checkLoginAction() {
    if (!isLoggedIn()) {
        mostrarModalLogin();
        return false;
    }
    return true;
}

async function carregarPerfil() {
    const idPsicologo = obterIdPsicologoDaURL();
    const nomePsicologaElement = document.getElementById('nome-psicologa');

    if (!idPsicologo) {
        nomePsicologaElement.textContent = 'Erro: ID do psicólogo não encontrado na URL. Use ?id=X.';
        console.error('ID do psicólogo é nulo.');
        return;
    }

    const API_URL_DINAMICA = `${API_BASE_PSICOLOGOS}/${idPsicologo}?_embed=avaliacoes`;

    try {
        const response = await fetch(API_URL_DINAMICA);

        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`Perfil do psicólogo (ID ${idPsicologo}) não encontrado.`);
            }
            throw new Error(`Erro ao carregar perfil: Status ${response.status}`);
        }

        psicologaData = await response.json();
        psicologaData.id = idPsicologo;

        renderizarPerfil(psicologaData);

    } catch (error) {
        console.error("Erro ao buscar dados do perfil:", error);
        nomePsicologaElement.textContent = `Erro ao carregar dados do perfil: ${error.message}`;
    }
}


function renderizarPerfil(psicologo) {
    const avatarDiv = document.querySelector('.avatar-lg');
    if (psicologo.foto) {
        avatarDiv.innerHTML = `<img src="${psicologo.foto}" alt="Foto da psicóloga" class="rounded-circle w-100 h-100 object-fit-cover">`;
        avatarDiv.style.width = '120px';
        avatarDiv.style.height = '120px';
        avatarDiv.style.overflow = 'hidden';
    } else {
        avatarDiv.innerHTML = '<i class="fas fa-user"></i>';
    }

    document.getElementById('nome-psicologa').textContent =
        'PSICÓLOGA ' + (psicologo.nome || 'Nome Indisponível');

    // --- Avaliações ---
    const avaliacoes = Array.isArray(psicologo.avaliacoes) ? psicologo.avaliacoes : [];
    const totalAvaliacoes = avaliacoes.length;
    const somaNotas = avaliacoes.reduce((acc, avaliacao) => acc + (avaliacao.nota || 0), 0);
    const notaMedia = totalAvaliacoes > 0 ? somaNotas / totalAvaliacoes : 0;

    document.getElementById('nota-media').textContent = notaMedia.toFixed(1) || '0.0';
    document.getElementById('total-avaliacoes').textContent = totalAvaliacoes || '0';
    document.getElementById('estrelas-avaliacao').innerHTML = gerarEstrelasHTML(notaMedia);

    // --- Valores / Tipo / Convênio: aceitar campos antigos e novos ---
    const valorConsulta =
        psicologo.valorConsulta ?? psicologo.valor ?? 0;
    const tipoAtendimento =
        psicologo.tipoAtendimento ?? psicologo.tipo ?? 'Online';
    const aceitaConvenios =
        psicologo.aceitaConvenios ?? psicologo.convenios ?? false;

    document.getElementById('valor-consulta').textContent = formatarMoeda(Number(valorConsulta) || 0);
    document.getElementById('tipo-atendimento').textContent = tipoAtendimento;

    const conveniosBadge = document.getElementById('aceita-convenios');
    if (aceitaConvenios) {
        conveniosBadge.textContent = 'Aceito Convênios';
        conveniosBadge.className = 'badge bg-success-subtle text-success p-2';
    } else {
        conveniosBadge.textContent = 'Não Aceito Convênios';
        conveniosBadge.className = 'badge bg-danger-subtle text-danger p-2';
    }

    document.getElementById('descricao-psicologa').textContent =
        psicologo.bio || 'Biografia não fornecida.';

    // --- Formação: aceita string OU array ---
    const listaFormacao = document.getElementById('lista-formacao');
    listaFormacao.innerHTML = '';

    let formacaoArray = [];
    if (Array.isArray(psicologo.formacao)) {
        formacaoArray = psicologo.formacao;
    } else if (typeof psicologo.formacao === 'string' && psicologo.formacao.trim() !== '') {
        // separa por vírgula ou ponto-e-vírgula
        formacaoArray = psicologo.formacao
            .split(/[,;]+/)
            .map(t => t.trim())
            .filter(Boolean);
    }

    formacaoArray.forEach(item => {
        const li = document.createElement('li');
        li.className = 'mb-2';
        li.innerHTML = `<i class="fas fa-check-circle text-primary me-2"></i> ${item}`;
        listaFormacao.appendChild(li);
    });

    // --- Especialidades: aceita string, array de strings ou array de objetos ---
    const listaEspecialidades = document.getElementById('lista-especialidades');
    listaEspecialidades.innerHTML = '';

    let especialidadesArr = [];
    if (Array.isArray(psicologo.especialidades)) {
        especialidadesArr = psicologo.especialidades.map(e => {
            if (typeof e === 'string') {
                return { nome: e, icone: 'fas fa-tag' };
            }
            return {
                nome: e.nome || '',
                icone: e.icone || 'fas fa-tag'
            };
        }).filter(e => e.nome);
    } else if (typeof psicologo.especialidades === 'string' && psicologo.especialidades.trim() !== '') {
        especialidadesArr = psicologo.especialidades
            .split(/[,;]+/)
            .map(t => t.trim())
            .filter(Boolean)
            .map(nome => ({ nome, icone: 'fas fa-tag' }));
    }

    especialidadesArr.forEach(especialidade => {
        const span = document.createElement('span');
        span.classList.add('tag-especialidade');
        span.innerHTML =
            `<i class="${especialidade.icone || 'fas fa-tag'} me-2"></i> ${especialidade.nome}`;
        listaEspecialidades.appendChild(span);
    });

    // --- Lista de avaliações (mesmo que antes, só garantindo array) ---
    const listaAvaliacoes = document.getElementById('lista-avaliacoes');
    if (avaliacoes.length > 0) {
        listaAvaliacoes.innerHTML = '';

        avaliacoes.forEach(avaliacao => {
            const pontosHtml = (avaliacao.pontosPositivos || [])
                .map(ponto => `<span class="badge bg-success-subtle text-success me-1">${ponto}</span>`)
                .join('');

            const divAvaliacao = document.createElement('div');
            divAvaliacao.className = 'card card-body mb-3 shadow-sm';

            divAvaliacao.innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <span class="fw-bold">${avaliacao.nome || 'Anônimo'}</span>
                    <small class="text-muted">${formatarData(avaliacao.data)}</small>
                </div>
                <div class="mb-2">
                    ${gerarEstrelasHTML(avaliacao.nota)} 
                </div>
                ${pontosHtml.length > 0 ? `<p class="small mb-2"><strong>Pontos Fortes:</strong> ${pontosHtml}</p>` : ''}
                <p class="mb-0">${avaliacao.comentarios || 'O usuário não deixou comentários.'}</p>
                
                ${isAdmin() ? `
                <div class="mt-3 pt-2 border-top text-end">
                    <button class="btn btn-sm btn-outline-info me-2" onclick="iniciarEdicaoAvaliacao('${avaliacao.id}')">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="handleExcluirAvaliacao('${avaliacao.id}')">
                        <i class="fas fa-trash-alt"></i> Excluir
                    </button>
                </div>
                ` : ''}
            `;

            listaAvaliacoes.appendChild(divAvaliacao);
        });
    } else {
        listaAvaliacoes.innerHTML = '<p class="text-muted small">Nenhuma avaliação encontrada.</p>';
    }
}


async function handleExcluirAvaliacao(id) {
    if (!checkAdminAction()) return;

    if (!confirm('Tem certeza que deseja excluir esta avaliação? Esta ação é irreversível.')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL_AVALIACOES}/${id}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error(`Erro ao excluir avaliação: ${response.status}`);
        }

        alert('Avaliação excluída com sucesso!');
        carregarPerfil();
    } catch (error) {
        console.error("Erro ao excluir avaliação:", error);
        alert('Falha ao excluir a avaliação. Erro: ' + error.message);
    }
}



async function iniciarEdicaoAvaliacao(id) {
    if (!checkAdminAction()) return;

    try {
        const response = await fetch(`${API_URL_AVALIACOES}/${id}`);
        if (!response.ok) throw new Error('Avaliação não encontrada.');
        const avaliacao = await response.json();


        formAvaliacao.reset();
        formAvaliacao.setAttribute('data-avaliacao-id', id);


        const dataInput = document.getElementById('dataAvaliacaoInput');
        if (dataInput) {
            dataInput.value = avaliacao.data || '';
        }


        const notaInput = document.querySelector(`input[name="avaliacaoGeral"][value="${avaliacao.nota}"]`);
        if (notaInput) notaInput.checked = true;


        document.querySelectorAll('input[name="pontoPositivo"]').forEach(checkbox => {
            checkbox.checked = avaliacao.pontosPositivos && avaliacao.pontosPositivos.includes(checkbox.value);
        });


        document.getElementById('comentariosAvaliacao').value = avaliacao.comentarios || '';


        document.getElementById('exibirNome').checked = avaliacao.nome !== 'Anônimo';

        mostrarModalAvaliacao();

    } catch (error) {
        console.error("Erro ao carregar avaliação para edição:", error);
        alert('Falha ao carregar a avaliação para edição. Erro: ' + error.message);
    }
}


function iniciarNovaAvaliacao() {
    formAvaliacao.reset();
    formAvaliacao.removeAttribute('data-avaliacao-id');

    document.querySelectorAll('input[name="avaliacaoGeral"]').forEach(radio => {
        radio.checked = false;
    });
    document.querySelectorAll('input[name="pontoPositivo"]').forEach(checkbox => {
        checkbox.checked = false;
    });


    const exibirNome = document.getElementById('exibirNome');
    if (exibirNome) exibirNome.checked = false;

    const dataInput = document.getElementById('dataAvaliacaoInput');
    if (dataInput) {
        dataInput.value = '';
    }

    mostrarModalAvaliacao();
}


async function handleSalvarAvaliacao(event) {
    event.preventDefault();

    const notaElement = document.querySelector('input[name="avaliacaoGeral"]:checked');

    if (!notaElement) {
        alert('Por favor, selecione uma nota de 1 a 5.');
        return;
    }

    const nota = parseInt(notaElement.value);
    const pontosPositivos = Array.from(document.querySelectorAll('input[name="pontoPositivo"]:checked'))
        .map(checkbox => checkbox.value);
    const comentarios = document.getElementById('comentariosAvaliacao').value.trim();
    const exibirNome = document.getElementById('exibirNome').checked;

    const idPsicologo = psicologaData.id;

    if (!idPsicologo) {
        alert('Erro: Não foi possível identificar o ID do psicólogo para salvar a avaliação.');
        return;
    }

    const avaliacaoId = formAvaliacao.getAttribute('data-avaliacao-id');
    const isEditing = !!avaliacaoId;

    const payloadAvaliacao = {
        psicologoId: idPsicologo,
        nota: nota,
        pontosPositivos: pontosPositivos,
        comentarios: comentarios,
        nome: exibirNome ? 'Usuário Avaliador' : 'Anônimo',
    };


    let url = API_URL_AVALIACOES;
    let method = 'POST';

    if (isEditing) {
        url = `${API_URL_AVALIACOES}/${avaliacaoId}`;
        method = 'PUT';


        const dataInput = document.getElementById('dataAvaliacaoInput');
        if (dataInput) {
            payloadAvaliacao.data = dataInput.value;
        }

    } else {

        payloadAvaliacao.data = new Date().toISOString().split('T')[0];
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payloadAvaliacao),
        });

        if (!response.ok) {
            throw new Error(`Erro ao salvar avaliação: ${response.status}`);
        }

        // Fechar modal de avaliação
        fecharModalAvaliacao();

        // Mostrar modal de sucesso
        const modalSucesso = document.getElementById('modalAvaliacaoSucesso');
        if (modalSucesso && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
            const modal = bootstrap.Modal.getInstance(modalSucesso) || new bootstrap.Modal(modalSucesso);
            modal.show();
        }
        formAvaliacao.removeAttribute('data-avaliacao-id');
        carregarPerfil();

    } catch (error) {
        console.error("Erro ao salvar avaliação:", error);
        alert('Falha ao salvar a avaliação. Erro: ' + error.message);
    }
}


async function toggleAgenda() {
    if (!checkLoginAction()) return;

    // Show Modal
    const modalElement = document.getElementById('modalHorarios');
    if (modalElement && typeof bootstrap !== 'undefined' && bootstrap.Modal) {
        const modal = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
        modal.show();
    }

    const horariosContainer = document.getElementById('horarios-container');
    const loadingSpinner = document.getElementById('loading-spinner');

    if (horariosContainer) horariosContainer.innerHTML = '';
    if (loadingSpinner) loadingSpinner.style.display = 'inline-block';

    try {
        const response = await fetch(`${API_URL_HORARIOS}?psicologoId=${psicologaData.id}`);

        if (!response.ok) {
            throw new Error(`Erro de rede: ${response.status}`);
        }

        const dados = await response.json();

        // Sort by date (ascending)
        dados.sort((a, b) => new Date(a.data) - new Date(b.data));

        exibirHorarios(dados);

    } catch (error) {
        console.error("Erro ao buscar horários:", error);
        if (horariosContainer) {
            horariosContainer.innerHTML = `
                <div class="alert alert-danger" role="alert">
                    Não foi possível carregar a agenda. Verifique se o JSON Server está rodando e acessível em ${API_URL_HORARIOS}.
                </div>
            `;
        }

    } finally {
        if (loadingSpinner) loadingSpinner.style.display = 'none';
    }
}

function exibirHorarios(dias) {
    const horariosContainer = document.getElementById('horarios-container');

    if (dias.length === 0) {
        horariosContainer.innerHTML = '<p class="text-muted">Nenhum horário disponível encontrado para os próximos dias.</p>';
        return;
    }

    let htmlContent = '';

    dias.forEach(dia => {
        // CORREÇÃO AQUI: Usamos a função para descobrir o nome do dia
        const nomeDoDia = obterNomeDiaSemana(dia.data);

        htmlContent += `
            <div class="col-12 col-sm-6 col-lg-4 mb-4"> 
                <div class="card shadow-sm h-100">
                    <div class="card-body">
                        <h5 class="card-title text-primary text-capitalize">${nomeDoDia}</h5>
                        
                        <h6 class="card-subtitle mb-2 text-muted">${formatarData(dia.data)}</h6>
                        <div class="d-flex flex-wrap gap-2 mt-3">
        `;

        if (dia.horarios.length === 0) {
            htmlContent += `<span class="badge bg-secondary">Lotado neste dia</span>`;
        } else {
            dia.horarios.forEach(horario => {
                htmlContent += `
                    <button 
                        class="btn btn-outline-success btn-sm rounded-pill fw-bold" 
                        onclick="agendar('${dia.data}', '${horario}')">
                        ${horario}
                    </button>
                `;
            });
        }

        htmlContent += `
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    horariosContainer.innerHTML = htmlContent;
}


// --- User Profile / Login Logic ---
function initUserHeader() {
    const headerUserArea = document.getElementById('header-user-area');
    if (!headerUserArea) return;

    const usuarioLogadoJSON = sessionStorage.getItem('usuarioLogado');
    const usuarioLogado = usuarioLogadoJSON ? JSON.parse(usuarioLogadoJSON) : null;

    if (usuarioLogado) {
        // Render Profile Dropdown
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

        // Event Listeners
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
                window.location.reload(); // Reload to update header
            });
        }

    } else {
        // Render Login Button
        headerUserArea.innerHTML = `
            <button class="btn-header-login" onclick="location.href='../../if-login.html'">
                <i class="far fa-user"></i> Entrar
            </button>
        `;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    carregarPerfil();
    initUserHeader();

    // Setup Avaliar Button Listener
    const btnAvaliar = document.getElementById('btnAvaliar');
    if (btnAvaliar) {
        btnAvaliar.addEventListener('click', () => {
            if (checkLoginAction()) {
                mostrarModalAvaliacao();
            }
        });
    }
});

if (btnVerHorarios) {
    btnVerHorarios.addEventListener('click', (e) => {
        e.preventDefault();
        // Note: checkLoginAction is called inside toggleAgenda to prevent double alert if already visible
        toggleAgenda();
    });
}

if (formAvaliacao) {
    formAvaliacao.addEventListener('submit', handleSalvarAvaliacao);
}