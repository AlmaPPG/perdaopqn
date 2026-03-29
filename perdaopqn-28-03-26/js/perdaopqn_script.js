/* ===== PERDÃO, POR QUE NÃO? v3.0 ===== */
/* Arquivo: js/perdaopqn_script.js */

/* ===== VARIÁVEIS GLOBAIS ===== */
let fonteTamanho = 120; /* Declaração ÚNICA */

/* ===== MODAL ===== */
function abrirModal(id) {
    document.getElementById(id).style.display = 'flex';
    document.getElementById(id + '-fundo').style.display = 'flex';
}

function fecharModal(id) {
    document.getElementById(id).style.display = 'none';
    document.getElementById(id + '-fundo').style.display = 'none';
}

/* ===== FONTE ===== */
function ajustarFonte(delta) {
    fonteTamanho = Math.max(80, Math.min(200, fonteTamanho + delta));
    document.documentElement.style.setProperty('--fonte-tamanho', fonteTamanho + '%');
    localStorage.setItem('fonte-tamanho', fonteTamanho);
}

/* ===== CURTIDAS ===== */
function carregarCurtidas(capitulo) {
    const salvas = localStorage.getItem(`curtidas-${capitulo}`);
    return salvas ? parseInt(salvas) : 0;
}

function salvarCurtidas(capitulo, valor) {
    localStorage.setItem(`curtidas-${capitulo}`, valor);
}

function atualizarContador(capitulo) {
    const contador = document.querySelector(`.btn-curte-contador[data-capitulo="${capitulo}"]`);
    if (contador) {
        contador.textContent = carregarCurtidas(capitulo);
    }
}

function toggleCurtir(capitulo) {
    const btn = document.querySelector(`.btn-curte[data-capitulo="${capitulo}"]`);
    const curtidas = carregarCurtidas(capitulo);
    
    if (btn.classList.contains('curtiu')) {
        btn.classList.remove('curtiu');
        salvarCurtidas(capitulo, curtidas - 1);
    } else {
        btn.classList.add('curtiu');
        salvarCurtidas(capitulo, curtidas + 1);
    }
    
    atualizarContador(capitulo);
}

/* ===== EVENTOS (Delegação) ===== */
document.querySelector('.main-conteudo')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    
    const acao = btn.dataset.acao;
    const capitulo = btn.dataset.capitulo;
    
    switch(acao) {
        case 'fonte-maior':
            ajustarFonte(10);
            break;
        case 'fonte-menor':
            ajustarFonte(-10);
            break;
        case 'audio':
            const audio = new Audio(`assets/audio/capitulo-${capitulo}.mp3`);
            audio.play();
            break;
        case 'curtir':
            toggleCurtir(capitulo);
            break;
        case 'nao-curtir':
            console.log(`Não curtiu capítulo ${capitulo}`);
            break;
        case 'abrir-modal':
            abrirModal('df-modal');
            break;
    }
});

/* ===== INICIALIZAÇÃO ===== */
window.addEventListener('load', () => {
    // Carregar preferência de fonte
    const salvo = localStorage.getItem('fonte-tamanho');
    if (salvo) {
        fonteTamanho = parseInt(salvo);
        document.documentElement.style.setProperty('--fonte-tamanho', salvo + '%');
    }
    
    // Carregar contadores de curtidas
    document.querySelectorAll('.btn-curte-contador').forEach(contador => {
        const capitulo = contador.dataset.capitulo;
        atualizarContador(capitulo);
    });
});