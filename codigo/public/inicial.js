const API_URL_AVALIACOES = '/avaliacoes';
const API_BASE_PSICOLOGOS = '/psicologos';

function renderEstrelas(nota) {
  const full = Math.floor(Number(nota) || 0);
  const hasHalf = (nota - full) >= 0.5; 
  let out = '';

  for (let i = 0; i < 5; i++) {
    if (i < full) {
      out += '<i class="fa-solid fa-star"></i>';
    } else {
      out += '<i class="fa-regular fa-star"></i>';
    }
  }
  return out;
}

function calculaMediaAvaliacoes(avaliacoes = []) {
  if (!Array.isArray(avaliacoes) || avaliacoes.length === 0) return null;

  const nums = avaliacoes
    .map(a => Number(a.nota))
    .filter(n => !Number.isNaN(n) && isFinite(n) && n > 0);

  if (nums.length === 0) return null;

  const soma = nums.reduce((s, v) => s + v, 0);
  const media = soma / nums.length;
  return media;
}

async function fetchAvaliacoesDoPsicologo(psicologoId) {
  try {
    const res = await fetch(`${API_URL_AVALIACOES}?psicologoId=${encodeURIComponent(psicologoId)}`);
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

async function carregarPsicologos() {
  const container = document.getElementById('lista-psicologos');
  if (!container) return;
  container.innerHTML = '<p class="carregando">Carregando psicólogos...</p>';

  try {
    const res = await fetch(`${API_BASE_PSICOLOGOS}?_limit=8`);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const psicologos = await res.json();

    if (!Array.isArray(psicologos) || psicologos.length === 0) {
      container.innerHTML = '<p class="vazio">Nenhum psicólogo encontrado.</p>';
      return;
    }

    const promises = psicologos.map(async p => {
      let mediaFinal = 0;

      if (typeof p.avaliacao === 'number') {
        mediaFinal = p.avaliacao;
      } else {
        const avals = await fetchAvaliacoesDoPsicologo(p.id);
        const calc = calculaMediaAvaliacoes(avals);
        mediaFinal = calc !== null ? calc : 0;
      }

      return { ...p, mediaCalculada: mediaFinal };
    });

    const psicologosProcessados = await Promise.all(promises);

    psicologosProcessados.sort((a, b) => b.mediaCalculada - a.mediaCalculada);

    container.innerHTML = psicologosProcessados.map(p => {
      const foto = p.foto || './assets/images/avatar-placeholder.png';
      const mediaExibicao = p.mediaCalculada > 0 ? p.mediaCalculada.toFixed(1) : '—';

      return `
        <article class="card-psicologo">
          <div class="card-foto">
            <img src="${foto}" alt="${(p.nome || 'Perfil')}">
          </div>
          <h3 class="nome-psicologo">${p.nome || 'Nome Indisponível'}</h3>
          <p class="abordagem">${p.abordagem || ''}</p>
          <div class="card-rodape">
            <div class="estrelas">
              ${renderEstrelas(p.mediaCalculada)} 
              <span class="nota">${mediaExibicao}</span>
            </div>
            <button class="btn-vermais" onclick="location.href='./modulos/viewpsi/psicologo.html?id=${p.id}'">
              Ver Mais
            </button>
          </div>
        </article>
      `;
    }).join('');

  } catch (err) {
    console.error(err);
    container.innerHTML = '<p class="erro">Erro ao carregar dados.</p>';
  }
}

async function carregarArtigos() {
  const container = document.getElementById('lista-artigos');
  if (!container) return;
  container.innerHTML = '<p class="carregando">Buscando artigos...</p>';

  try {
    const res = await fetch('/artigos?_limit=6');
    if (!res.ok) throw new Error('Erro ao buscar artigos');
    const data = await res.json();

    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = '<p class="vazio">Nenhum artigo disponível no momento.</p>';
      return;
    }

    container.innerHTML = data.map(a => {
      const capa = a.imagemcapa || a.imagem || './assets/images/artigo-placeholder.jpg';

      let mediaNum = 0;
      let mediaStr = '—';

      if (Array.isArray(a.avaliacoes) && a.avaliacoes.length > 0) {
        const calc = calculaMediaAvaliacoes(a.avaliacoes);
        if (calc !== null) {
          mediaNum = calc;
          mediaStr = calc.toFixed(1);
        }
      } else if (typeof a.avaliacao === 'number') {
        mediaNum = a.avaliacao;
        mediaStr = a.avaliacao.toFixed(1);
      }

      return `
        <article class="card-artigo">
          <div class="thumb">
            <img src="${capa}" alt="${a.titulo}" loading="lazy">
          </div>
          
          <div class="artigo-info">
            <h4 class="artigo-titulo">${a.titulo}</h4>
            <p class="artigo-resumo">${a.resumo || 'Sem descrição disponível.'}</p>
            
            <div class="artigo-meta-row">
              <div class="artigo-avaliacao" title="Média de qualidade">
                ${renderEstrelas(mediaNum)}
                <span class="nota">${mediaStr}</span>
              </div>
            </div>

            <a class="btn-vermais-artigo" href="./modulos/apresentacao-de-artigos/artigo.html?id=${a.id}">
              Ler Completo
            </a>
          </div>
        </article>
      `;
    }).join('');

  } catch (err) {
    console.error('Erro artigos:', err);
    container.innerHTML = '<p class="erro">Não foi possível carregar os artigos.</p>';
  }
}

function initUserHeader() {
  const headerUserArea = document.getElementById('header-user-area');
  if (!headerUserArea) return;

  const usuarioLogadoJSON = sessionStorage.getItem('usuarioLogado');
  const usuarioLogado = usuarioLogadoJSON ? JSON.parse(usuarioLogadoJSON) : null;

  if (usuarioLogado) {
    const avatarUrl = usuarioLogado.foto
      || `https://ui-avatars.com/api/?name=${encodeURIComponent(usuarioLogado.nome || 'User')}&background=66cdaa&color=fff`;

    headerUserArea.innerHTML = `
      <div class="user-profile-container">
        <img id="headerUserAvatar" src="${avatarUrl}" alt="User Avatar" class="user-avatar">
        <div id="headerUserDropdown" class="user-dropdown hidden">
          <div class="dropdown-header">
            <p class="user-name">${usuarioLogado.nome || 'Usuário'}</p>
            <p class="user-email">${usuarioLogado.email || ''}</p>
          </div>
          <button class="dropdown-item" onclick="location.href='./modulos/viewhorarios/index.html'">
            <i class="far fa-calendar-alt"></i> Minha Agenda
          </button>
          ${
            usuarioLogado.tipo === 'psicologo'
              ? `
              <button class="dropdown-item" onclick="location.href='./modulos/perfil-psicologo-edicao/index.html'">
                <i class="fas fa-user-edit"></i> Gerenciar Perfil
              </button>
            `
              : `
              <button class="dropdown-item" onclick="location.href='./modulos/perfil-usuario-edicao/index.html'">
                <i class="fas fa-user-edit"></i> Editar Meus Dados
              </button>
            `
          }
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
        window.location.reload();
      });
    }

  } else {
    headerUserArea.innerHTML = `
      <button class="btn-header-login" onclick="location.href='if-login.html'">
        <i class="fa-regular fa-user"></i> Entrar
      </button>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  carregarPsicologos();
  carregarArtigos();
  initUserHeader();

  window.addEventListener('focus', () => {
    setTimeout(() => {
      carregarArtigos();
      carregarPsicologos();
      initUserHeader();
    }, 500);
  });

  const btnLogin = document.getElementById('btn-login-cta');
  if (btnLogin) {
    btnLogin.addEventListener('click', () => location.href = 'if-login.html');
  }
});
