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
    document.documentElement.style.setProperty('--fonte-tamanho', fonteTamanho); /* ← Sem o '%' */
    localStorage.setItem('fonte-tamanho', fonteTamanho);
    console.log('Fonte:', fonteTamanho);
}

/* ===== CURTIDAS ===== */

// Carregar valor do localStorage
function carregarCurtidas(capitulo) {
    const salvas = localStorage.getItem(`curtidas-${capitulo}`);
    return salvas ? parseInt(salvas) : 0;
}

// Salvar no localStorage
function salvarCurtidas(capitulo, valor) {
    localStorage.setItem(`curtidas-${capitulo}`, valor);
}

// Atualizar o texto do contador
function atualizarContador(capitulo) {
    const contador = document.querySelector(`.btn-curte-contador[data-capitulo="${capitulo}"]`);
    if (contador) {
        contador.textContent = carregarCurtidas(capitulo);
    }
}

// Toggle curtir (COM CORREÇÕES)
function toggleCurtir(capitulo) {
    const btn = document.querySelector(`.btn-curte[data-capitulo="${capitulo}"]`);
    const icone = btn?.querySelector('.btn-curte-icono');
    const contador = btn?.querySelector('.btn-curte-contador');
    
    if (!btn || !icone || !contador) return;
    
    const chave = 'curtida_' + capitulo;
    let valor = parseInt(contador.textContent) || 0;
    
    if (btn.classList.contains('curtiu')) {
        // === REMOVER CURTIDA ===
        btn.classList.remove('curtiu');
        localStorage.removeItem(chave);
        valor = Math.max(0, valor - 1);
        icone.textContent = '🤍';  // ← Emoji branco (não depende de CSS)
    } else {
        // === ADICIONAR CURTIDA ===
        btn.classList.add('curtiu');
        localStorage.setItem(chave, 'true');
        valor = valor + 1;
        icone.textContent = '❤';  // ← Emoji vermelho (visível sem CSS)
        enviarCurtidaWebhook(capitulo);  // ← Webhook só no "curtir"
    }
    
    contador.textContent = valor;
}

// === NOVO: Inicializar visual das curtidas ao carregar ===
function inicializarCurtidas() {
    document.querySelectorAll('.btn-curte').forEach(btn => {
        const capitulo = btn.getAttribute('data-capitulo');
        const chave = 'curtida_' + capitulo;
        const icone = btn.querySelector('.btn-curte-icono');
        
        if (!icone) return;
        
        if (localStorage.getItem(chave)) {
            btn.classList.add('curtiu');
            icone.textContent = '❤';  // ← Restaura emoji vermelho
        } else {
            btn.classList.remove('curtiu');
            icone.textContent = '🤍';  // ← Restaura emoji branco
        }
    });
}





/* ===== EVENTOS (Delegação) ===== */
document.querySelector('.main-conteudo')?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    
    const acao = btn.dataset.acao;
    const capitulo = btn.dataset.capitulo;
    
    switch(acao) {
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
    // 1. Fonte: aplicar valor padrão ou salvo
    if (!localStorage.getItem('fonte-tamanho')) {
        document.documentElement.style.setProperty('--fonte-tamanho', '120');
    }
    const salvo = localStorage.getItem('fonte-tamanho');
    if (salvo) {
        fonteTamanho = parseInt(salvo);
        document.documentElement.style.setProperty('--fonte-tamanho', salvo);
    }
    document.querySelectorAll('.main-conteudo p').forEach(p => {
        p.style.fontSize = `calc(16px * var(--fonte-tamanho) / 100)`;
    });
    
    // 2. Curtidas: atualizar contadores E restaurar visual
    document.querySelectorAll('.btn-curte-contador').forEach(contador => {
        const capitulo = contador.dataset.capitulo;
        atualizarContador(capitulo);
    });
    inicializarCurtidas();  // ← NOVO: restaura emoji + classe
    
    // 3. Barra de progresso
    atualizarProgressBar();
});

/* ===== BARRA DE PROGRESSO ===== */
function atualizarProgressBar() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = scrolled + '%';
    }
}

// Listener de scroll na WINDOW (não no .main)
window.addEventListener('scroll', atualizarProgressBar);

// Atualizar ao carregar e ao redimensionar
window.addEventListener('load', atualizarProgressBar);
window.addEventListener('resize', atualizarProgressBar);

/* ===== ÁUDIO TOGGLE ===== */
let audioAtual = null;
let botaoAtual = null;

function toggleAudio(capituloId) {
    const audio = document.getElementById('audio-' + capituloId);
    const botao = document.getElementById('btn-audio-' + capituloId);
    
    if (!audio || !botao) return;
    
    // Se já tem um áudio tocando e é outro capítulo
    if (audioAtual && audioAtual !== audio) {
        audioAtual.pause();
        audioAtual.currentTime = 0;
        if (botaoAtual) {
            botaoAtual.textContent = '🔊 Ouvir';
            botaoAtual.classList.remove('tocando');
        }
    }
    
    // Toggle play/pause
    if (audio.paused) {
        audio.play();
        audioAtual = audio;
        botaoAtual = botao;
        botao.textContent = '⏸️ Pausar';
        botao.classList.add('tocando');
    } else {
        audio.pause();
        botao.textContent = '🔊 Ouvir';
        botao.classList.remove('tocando');
    }
    
    // Quando o áudio terminar
    audio.addEventListener('ended', () => {
        botao.textContent = '🔊 Ouvir';
        botao.classList.remove('tocando');
        audioAtual = null;
        botaoAtual = null;
    });
}

/* ===== WEBHOOK DE CURTIDAS ===== */
const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzNu0_x-ilJ7cEpjsvo8rgSmTRW2g8-nbnWhpmnewsqvhgfrGhVTu4fb_6P60tbvD2P/exec';

function enviarCurtidaWebhook(capituloId) {
    if (!WEBHOOK_URL || WEBHOOK_URL.includes('SEU-CODIGO-AQUI')) {
        console.log('Webhook não configurado');
        return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source') || 'direto';
    const utmCampaign = urlParams.get('utm_campaign') || 'nenhuma';
    
    fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            tipo: 'curtida',
            capitulo: capituloId,
            timestamp: new Date().toISOString(),
            utm_source: utmSource,
            utm_campaign: utmCampaign
        })
    }).catch(err => console.log('Curtida registrada apenas localmente'));
}