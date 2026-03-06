const API_BASE = window.location.origin;

const criteriosDataTemplate = [
    { criterio: "Relevância e Originalidade", peso: 2, nota: null, observacoes: "" },
    { criterio: "Precisão Técnica/Factual", peso: 3, nota: null, observacoes: "" },
    { criterio: "Clareza e Estrutura", peso: 1.5, nota: null, observacoes: "" },
    { criterio: "Linguagem e Gramática", peso: 1, nota: null, observacoes: "" },
    { criterio: "SEO (Search Engine Optimization)", peso: 1.5, nota: null, observacoes: "" }
];

let artigoGlobal = null;
let avaliacaoEmEdicaoId = null;

function mostrarMensagem(msg, tipo = 'success') {
    const mensagemStatus = document.getElementById('mensagem-status');
    if (!mensagemStatus) return;
    
    mensagemStatus.style.display = 'block';
    mensagemStatus.textContent = msg;
    mensagemStatus.className = 'status-msg ' + (tipo === 'success' ? 'success' : 'error');
    mensagemStatus.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => { mensagemStatus.style.display = 'none'; }, 6000);
}

function calcularMediaArtigo(avals) {
    if (!Array.isArray(avals) || avals.length === 0) return null;
    let soma = 0;
    avals.forEach(a => soma += Number(a.nota || 0));
    return (soma / avals.length);
}

function calcularPontuacaoFinal() {
    let totalPontos = 0;
    let totalPesos = 0;
    const pontuacaoFinalDisplay = document.getElementById('pontuacao-final-display');

    document.querySelectorAll('.input-nota').forEach(input => {
        const v = parseFloat(input.value);
        const peso = parseFloat(input.dataset.peso) || 0;
        if (!isNaN(v) && v >= 1 && v <= 5) {
            totalPontos += v * peso;
            totalPesos += peso;
        }
    });

    const finalScore = totalPesos === 0 ? 0 : (totalPontos / totalPesos);
    if (pontuacaoFinalDisplay) pontuacaoFinalDisplay.textContent = finalScore.toFixed(2);
    return finalScore;
}


async function popularAvaliadores() {
    const avaliadorSelect = document.getElementById('avaliador');
    
    avaliadorSelect.innerHTML = `
        <option value="usr_padrao_01" selected>Usuário de Teste</option>
    `;
}

function preencherMetadadosArtigo(artigo) {
    document.getElementById('article-title').textContent = artigo.titulo || 'Sem título';
    document.getElementById('titulo_artigo').value = artigo.titulo || ''; 
    document.getElementById('article-author').textContent = artigo.autor ? `Por: ${artigo.autor}` : 'Autor desconhecido';
    document.getElementById('article-date').textContent = artigo.datapublicacao ? `Publicado em ${artigo.datapublicacao}` : '';
    document.getElementById('article-resumo').textContent = artigo.resumo || 'Sem resumo disponível.';
    
    const imgEl = document.getElementById('article-image');
    if(artigo.imagemcapa || artigo.imagem) {
        imgEl.src = artigo.imagemcapa || artigo.imagem;
    } else {
        imgEl.src = '../apresentacao-de-artigos/imgs/logo.png'; 
    }
    
    document.getElementById('article-content').textContent = artigo.conteudo || '(Conteúdo não carregado)';
    document.getElementById('id_artigo').value = artigo.id;

    // Atualiza média visualmente
    const mediaAtual = calcularMediaArtigo(artigo.avaliacoes || []);
    document.getElementById('article-average').textContent = mediaAtual ? mediaAtual.toFixed(2) : '—';
}

function renderCriterios() {
    const criteriosContainer = document.getElementById('criterios-container');
    criteriosContainer.innerHTML = criteriosDataTemplate.map((item, idx) => `
        <div class="criterio-block" data-idx="${idx}">
            <h4>${item.criterio} <span class="small" style="font-weight:normal">(peso: ${item.peso})</span></h4>
            <div class="nota-obs-grid">
                <div>
                    <label for="nota_${idx}">Nota (1-5)</label>
                    <input type="number" 
                           id="nota_${idx}" 
                           min="1" 
                           max="5" 
                           step="0.5" 
                           data-peso="${item.peso}" 
                           class="input-nota" 
                           placeholder="0.0" />
                </div>
                <div>
                    <label for="obs_${idx}">Observações</label>
                    <textarea id="obs_${idx}" rows="2" placeholder="Justificativa..." class="input-obs"></textarea>
                </div>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.input-nota').forEach(inp => inp.addEventListener('input', calcularPontuacaoFinal));
}

async function carregarAvaliacoesExistentes() {
    const avaliacoesExistentes = document.getElementById('avaliacoes-existentes');
    if (!avaliacoesExistentes || !artigoGlobal) return;

    avaliacoesExistentes.innerHTML = '<div class="small">Carregando...</div>';

    try {
        const res = await fetch(`${API_BASE}/avaliacoes?id_artigo=${artigoGlobal.id}`);
        if (res.ok) {
            const avaliacoes = await res.json();
            
            if (avaliacoes.length > 0) {
                avaliacoesExistentes.innerHTML = avaliacoes.map(a => `
                    <div class="eval-item" id="eval-${a.id}">
                        <div class="eval-header">
                            <div>
                                <strong>${a.avaliador === 'anon' ? 'Anônimo' : ('Avaliador ID: ' + a.avaliador)}</strong> 
                                <span class="small">(${a.data_avaliacao})</span>
                            </div>
                            <div class="nota-badge">${Number(a.pontuacao_final || 0).toFixed(2)}</div>
                        </div>
                        <div class="small" style="color:#555;">${(a.comentarios_gerais || 'Sem comentários.').slice(0, 150)}</div>
                        
                        <div class="eval-actions">
                            <button type="button" class="btn-small btn-edit" onclick="prepararEdicao('${a.id}')">Editar</button>
                            <button type="button" class="btn-small btn-delete" onclick="excluirAvaliacao('${a.id}')">Excluir</button>
                        </div>
                    </div>
                `).join('');
                return;
            }
        }
    } catch (e) { console.error("Erro histórico:", e); }

    avaliacoesExistentes.innerHTML = `<div class="small" style="padding:10px; text-align:center; font-style:italic;">Este artigo ainda não possui avaliações detalhadas.</div>`;
}

async function sincronizarMediaArtigo(artigoId) {
    try {
        const resAvals = await fetch(`${API_BASE}/avaliacoes?id_artigo=${artigoId}`);
        const todasAvaliacoes = await resAvals.json();

        const avaliacoesSimplificadas = todasAvaliacoes.map(a => ({
            usuarioId: a.avaliador,
            nota: a.pontuacao_final
        }));

        const resPatch = await fetch(`${API_BASE}/artigos/${artigoId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ avaliacoes: avaliacoesSimplificadas })
        });

        if (resPatch.ok) {
            artigoGlobal.avaliacoes = avaliacoesSimplificadas;
            const novaMedia = calcularMediaArtigo(avaliacoesSimplificadas);
            document.getElementById('article-average').textContent = novaMedia ? novaMedia.toFixed(2) : '—';
        }

    } catch (e) {
        console.error("Erro ao sincronizar média:", e);
    }
}


window.excluirAvaliacao = async function(id) {
    if (!confirm("Tem certeza que deseja excluir esta avaliação permanentemente?")) return;

    try {
        const res = await fetch(`${API_BASE}/avaliacoes/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Erro ao excluir.');

        mostrarMensagem('Avaliação excluída com sucesso.', 'success');
        
        await carregarAvaliacoesExistentes();
        await sincronizarMediaArtigo(artigoGlobal.id);

    } catch (e) {
        alert(e.message);
    }
};

window.prepararEdicao = async function(id) {
    try {
        const res = await fetch(`${API_BASE}/avaliacoes/${id}`);
        if(!res.ok) throw new Error("Avaliação não encontrada");
        const dados = await res.json();

        document.getElementById('avaliador').value = dados.avaliador;
        document.getElementById('data_avaliacao').value = dados.data_avaliacao;
        document.getElementById('status_avaliacao').value = dados.status;
        document.getElementById('comentarios_gerais').value = dados.comentarios_gerais;

        document.querySelectorAll('.input-nota').forEach(i => i.value = '');
        document.querySelectorAll('.input-obs').forEach(i => i.value = '');

        if (Array.isArray(dados.criterios_avaliacao)) {
            dados.criterios_avaliacao.forEach(cSalvo => {
                const idxTemplate = criteriosDataTemplate.findIndex(ct => ct.criterio === cSalvo.criterio);
                
                if (idxTemplate !== -1) {
                    const notaEl = document.getElementById(`nota_${idxTemplate}`);
                    const obsEl = document.getElementById(`obs_${idxTemplate}`);
                    if (notaEl) notaEl.value = cSalvo.nota;
                    if (obsEl) obsEl.value = cSalvo.observacoes;
                }
            });
        }
        
        calcularPontuacaoFinal();

        avaliacaoEmEdicaoId = id;
        document.getElementById('form-titulo').textContent = "Editando Avaliação";
        document.getElementById('form-titulo').style.color = "#e67e22";
        
        const btnEnviar = document.getElementById('btn-finalizar-enviar');
        btnEnviar.textContent = "Atualizar Avaliação";
        btnEnviar.classList.remove('btn-publish');
        btnEnviar.classList.add('btn-edit');

        document.getElementById('btn-cancelar-edicao').style.display = 'inline-block';
        document.getElementById('form-avaliacao').scrollIntoView({ behavior: 'smooth' });

    } catch (e) {
        console.error(e);
        alert("Erro ao carregar dados para edição.");
    }
};

function cancelarEdicao() {
    avaliacaoEmEdicaoId = null;
    document.getElementById('form-avaliacao').reset();
    document.getElementById('data_avaliacao').valueAsDate = new Date();
    calcularPontuacaoFinal();

    // Restaura UI
    document.getElementById('form-titulo').textContent = "Nova Avaliação de Qualidade";
    document.getElementById('form-titulo').style.color = "#222";

    const btnEnviar = document.getElementById('btn-finalizar-enviar');
    btnEnviar.textContent = "Finalizar & Enviar";
    btnEnviar.classList.remove('btn-edit');
    btnEnviar.classList.add('btn-publish');

    document.getElementById('btn-cancelar-edicao').style.display = 'none';
}

function coletarDadosFormulario() {
    const currentCriterios = criteriosDataTemplate.map((c, i) => {
        const notaEl = document.getElementById(`nota_${i}`);
        const obsEl = document.getElementById(`obs_${i}`);
        return {
            criterio: c.criterio,
            peso: c.peso,
            nota: notaEl.value ? parseFloat(notaEl.value) : null,
            observacoes: obsEl.value || ""
        };
    });

    const finalScore = calcularPontuacaoFinal();

    return {
        id_artigo: artigoGlobal.id,
        titulo_artigo: artigoGlobal.titulo,
        data_avaliacao: document.getElementById('data_avaliacao').value,
        avaliador: document.getElementById('avaliador').value,
        pontuacao_final: parseFloat(finalScore.toFixed(2)),
        comentarios_gerais: document.getElementById('comentarios_gerais').value,
        status: document.getElementById('status_avaliacao').value,
        criterios_avaliacao: currentCriterios
    };
}

function validarFormulario() {
    const avaliador = document.getElementById('avaliador').value;
    const data = document.getElementById('data_avaliacao').value;

    if (!avaliador) { mostrarMensagem('Selecione um "Avaliador" válido.', 'error'); return false; }
    if (!data) { mostrarMensagem('Preencha a data.', 'error'); return false; }

    const inputsNota = document.querySelectorAll('.input-nota');
    let temCampoVazio = false;
    let temNotaInvalida = false;

    for (const input of inputsNota) {
        const valor = input.value;
        const nota = parseFloat(valor);

        if (valor === "" || isNaN(nota)) {
            temCampoVazio = true;
            break; 
        }
        if (nota < 1 || nota > 5) {
            temNotaInvalida = true;
        }
    }
    
    if (temCampoVazio) {
        mostrarMensagem('Por favor, preencha todas as notas dos critérios.', 'error');
        return false;
    }

    if (temNotaInvalida) {
        mostrarMensagem('As notas devem ser obrigatoriamente entre 1 e 5.', 'error');
        return false;
    }

    return true;
}

function salvarRascunhoLocal(dados) {
    const key = `avaliacao_rascunho_artigo_${artigoGlobal.id}`;
    localStorage.setItem(key, JSON.stringify(dados));
}

function carregarRascunhoLocal() {
    if(!artigoGlobal) return null;
    const key = `avaliacao_rascunho_artigo_${artigoGlobal.id}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
}


async function enviarAvaliacao(dados) {
    if (!artigoGlobal) return;
    
    const btnEnviar = document.getElementById('btn-finalizar-enviar');
    const textoOriginal = btnEnviar.textContent;
    btnEnviar.disabled = true;
    btnEnviar.textContent = "Processando...";

    try {
        let metodo, url, msgSucesso;

        if (avaliacaoEmEdicaoId) {
            metodo = 'PUT';
            url = `${API_BASE}/avaliacoes/${avaliacaoEmEdicaoId}`;
            msgSucesso = 'Avaliação atualizada com sucesso!';
            dados.id = avaliacaoEmEdicaoId; 
        } else {
            metodo = 'POST';
            url = `${API_BASE}/avaliacoes`;
            msgSucesso = 'Avaliação criada com sucesso!';
            dados.id = crypto.randomUUID();
        }

        const res = await fetch(url, {
            method: metodo,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (!res.ok) throw new Error(`Falha ao salvar (${metodo})`);

        await sincronizarMediaArtigo(artigoGlobal.id);
        
        mostrarMensagem(msgSucesso, 'success');
        
        if (!avaliacaoEmEdicaoId) {
            localStorage.removeItem(`avaliacao_rascunho_artigo_${artigoGlobal.id}`);
        }
        cancelarEdicao(); 
        await carregarAvaliacoesExistentes(); 

    } catch (err) {
        console.error(err);
        mostrarMensagem('Erro: ' + err.message, 'error');
    } finally {
        btnEnviar.disabled = false;
        btnEnviar.textContent = textoOriginal;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const artigoId = params.get('id');

    if (!artigoId) {
        alert('ID do artigo ausente na URL. Exemplo: ?id=1');
        return;
    }

    await popularAvaliadores();
    document.getElementById('data_avaliacao').valueAsDate = new Date();
    renderCriterios();

    try {
        const res = await fetch(`${API_BASE}/artigos/${artigoId}`);
        if (!res.ok) throw new Error('Artigo não encontrado (404)');
        artigoGlobal = await res.json();
        
        preencherMetadadosArtigo(artigoGlobal);
        await carregarAvaliacoesExistentes();

        const rascunho = carregarRascunhoLocal();
        if (rascunho && !avaliacaoEmEdicaoId) {
            document.getElementById('avaliador').value = rascunho.avaliador || "";
            document.getElementById('comentarios_gerais').value = rascunho.comentarios_gerais || "";
            if(rascunho.criterios_avaliacao) {
                rascunho.criterios_avaliacao.forEach((c, i) => {
                    const n = document.getElementById(`nota_${i}`);
                    if(n) n.value = c.nota;
                });
                calcularPontuacaoFinal();
            }
        }

    } catch (err) {
        console.error(err);
        document.querySelector('main.card').innerHTML = `<h3>Erro ao carregar artigo</h3><p>${err.message}</p>`;
        return;
    }   
    document.getElementById('btn-salvar-avaliacao').addEventListener('click', () => {
        const dados = coletarDadosFormulario();
        dados.status = 'rascunho';
        salvarRascunhoLocal(dados);
        mostrarMensagem('Rascunho salvo localmente.', 'success');
    });

    document.getElementById('btn-finalizar-enviar').addEventListener('click', async () => {
        if (!validarFormulario()) return;
        const dados = coletarDadosFormulario();
        dados.status = 'finalizado';
        await enviarAvaliacao(dados);
    });

    const btnCancel = document.getElementById('btn-cancelar-edicao');
    if(btnCancel) btnCancel.addEventListener('click', cancelarEdicao);
});