const API_BASE = window.location.origin;
const API_URL = `${API_BASE}/psicologos`;


document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('formLogin');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('email');
        const senhaInput = document.getElementById('senha');
        const btnLogin = form.querySelector('.btn-login');

        const email = emailInput.value.trim();
        const senha = senhaInput.value.trim();

        if (!email || !senha) {
            alert('Por favor, preencha todos os campos.');
            return;
        }

        const originalBtnText = btnLogin.textContent;
        btnLogin.textContent = 'Entrando...';
        btnLogin.disabled = true;

        try {
            const response = await fetch(`${API_URL}?email=${encodeURIComponent(email)}`);
            if (!response.ok) throw new Error('Erro ao conectar com servidor');

            const usuarios = await response.json();
            const usuario = usuarios.find(u => u.senha === senha);

            if (usuario) {
                const dadosUsuario = {
                    id: usuario.id,
                    nome: usuario.nome,
                    email: usuario.email,
                    login: usuario.email, 
                    foto: usuario.foto,
                    tipo: 'psicologo'
                };

                sessionStorage.setItem('usuarioLogado', JSON.stringify(dadosUsuario));

                window.location.href = '../../index.html';
            } else {
                alert('E-mail ou senha incorretos.');
                btnLogin.textContent = originalBtnText;
                btnLogin.disabled = false;
            }

        } catch (error) {
            console.error(error);
            alert('Erro ao tentar fazer login. Verifique sua conexão.');
            btnLogin.textContent = originalBtnText;
            btnLogin.disabled = false;
        }
    });
});
