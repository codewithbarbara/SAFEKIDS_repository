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
      <a href="../../if-login.html" class="btn-header-login">
        <i class="far fa-user"></i> Entrar
      </a>
    `;
  }
}


const API_BASE = window.location.origin;

fetch(`${API_BASE}/artigos`)
  .then(res => {
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  })
  .then(artigos => {
    const container = document.getElementById('lista-artigos');
    const pesquisa = document.getElementById('pesquisa');
    const filtroAutor = document.getElementById('autor');
    const filtroOrdenar = document.getElementById('ordenar');

    if (filtroAutor) {
      const autores = [...new Set(artigos.map(a => a.autor).filter(Boolean))];
      autores.forEach(autor => {
        const option = document.createElement('option');
        option.value = autor;
        option.textContent = autor;
        filtroAutor.appendChild(option);
      });
    }

    function render() {
      const termo = pesquisa ? pesquisa.value.toLowerCase() : '';
      const autorSelecionado = filtroAutor ? filtroAutor.value : '';
      const ordenacao = filtroOrdenar ? filtroOrdenar.value : 'data-desc';

      let filtrados = artigos.filter(a => {
        const matchTitulo = (a.titulo || '').toLowerCase().includes(termo);
        const matchAutor = autorSelecionado ? a.autor === autorSelecionado : true;
        return matchTitulo && matchAutor;
      });

      filtrados.sort((a, b) => {
        const dataA = new Date(a.datapublicacao || a.data || 0);
        const dataB = new Date(b.datapublicacao || b.data || 0);

        if (ordenacao === 'titulo-asc') return a.titulo.localeCompare(b.titulo);
        if (ordenacao === 'titulo-desc') return b.titulo.localeCompare(a.titulo);
        if (ordenacao === 'data-asc') return dataA - dataB;
        if (ordenacao === 'data-desc') return dataB - dataA;
        return 0;
      });

      container.innerHTML = filtrados
        .map(a => {
          const href = `artigo.html?id=${encodeURIComponent(String(a.id))}`;
          const imagem = a.imagemcapa || '../../assets/images/default-article.jpg';

          return `
            <div class="col-12 col-md-6 col-lg-4">
              <div class="article-card">
                <img src="${imagem}" alt="${a.titulo}" onerror="this.src='https://placehold.co/600x400?text=Artigo'">
                <h2>${a.titulo}</h2>
                <p>${a.resumo || 'Clique para ler mais sobre este tópico interessante.'}</p>
                <button type="button" onclick="location.href='${href}'">Ler artigo</button>
              </div>
            </div>
          `;
        })
        .join('');

      if (filtrados.length === 0) {
        container.innerHTML = `
          <div class="col-12 text-center text-muted">
            <p>Nenhum artigo encontrado.</p>
          </div>`;
      }
    }

    if (pesquisa) pesquisa.addEventListener('input', render);
    if (filtroAutor) filtroAutor.addEventListener('change', render);
    if (filtroOrdenar) filtroOrdenar.addEventListener('change', render);

    render();
  })
  .catch(erro => {
    console.error('Erro ao carregar artigos:', erro);
    const container = document.getElementById('lista-artigos');
    if (container) {
      container.innerHTML = `
        <div class="col-12 text-center text-danger">
          <p>Erro ao carregar artigos. Verifique a API.</p>
        </div>`;
    }
  });

document.addEventListener('DOMContentLoaded', () => {
  initUserHeader();
});
