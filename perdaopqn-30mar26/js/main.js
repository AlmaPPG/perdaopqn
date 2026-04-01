// ============================================
// CONFIGURAÇÕES GERAIS
// ============================================
const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzNu0_x-ilJ7cEpjsvo8rgSmTRW2g8-nbnWhpmnewsqvhgfrGhVTu4fb_6P60tbvD2P/exec';
const URL_PRINCIPAL = 'https://almappg.github.io/perdaopqn/index.html';

// ============================================
// AJUSTE DE FONTE (A+/A-)
// ============================================
let fonteEscala = parseFloat(localStorage.getItem('fonte-escala')) || 1;
document.documentElement.style.setProperty('--fonte-escala', fonteEscala);

function ajustarFonte(delta) {
    fonteEscala = Math.max(0.8, Math.min(1.5, fonteEscala + (delta * 0.02)));
    document.documentElement.style.setProperty('--fonte-escala', fonteEscala);
    localStorage.setItem('fonte-escala', fonteEscala);
}

// ============================================
// BARRA DE PROGRESSO
// ============================================
function atualizarProgressBar() {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    const progressBar = document.getElementById('progressBar');
    if (progressBar) progressBar.style.width = scrolled + '%';
}
window.onscroll = function() { atualizarProgressBar(); };

// ============================================
// PLAYER DE ÁUDIO
// ============================================
function toggleAudio(id) {
    document.querySelectorAll('audio').forEach(audio => {
        if (audio.id !== id) {
            audio.pause();
            audio.classList.remove('active');
            const btn = audio.previousElementSibling?.querySelector('.btn-audio');
            if (btn) btn.textContent = '🔊 Ouvir';
        }
    });
    const audio = document.getElementById(id);
    const btn = event.target;
    if (!audio || !btn) return;
    if (audio.paused) {
        audio.play();
        audio.classList.add('active');
        btn.textContent = '⏸️ Pausar';
    } else {
        audio.pause();
        audio.classList.remove('active');
        btn.textContent = '🔊 Ouvir';
    }
}

// ============================================
// SISTEMA DE CURTIDAS
// ============================================
function inicializarCurtidas() {
    document.querySelectorAll('.capitulo').forEach(artigo => {
        const capId = artigo.id;
        const chave = 'curtida_' + capId;
        const btn = document.getElementById('btn-curtida-' + capId);
        const contador = document.getElementById('curtidas-' + capId);
        const icone = btn?.querySelector('.icone-curtida');
        if (!btn || !contador || !icone) return;
        if (localStorage.getItem(chave)) {
            icone.textContent = '❤️';
            btn.classList.add('curtido');
            contador.textContent = 1;
        } else {
            icone.textContent = '🤍';
            btn.classList.remove('curtido');
            contador.textContent = 0;
        }
    });
}

function toggleCurtida(capituloId) {
    const chave = 'curtida_' + capituloId;
    const jaCurtiu = localStorage.getItem(chave);
    const btn = document.getElementById('btn-curtida-' + capituloId);
    const contador = document.getElementById('curtidas-' + capituloId);
    const icone = btn?.querySelector('.icone-curtida');
    if (!btn || !contador || !icone) return;
    let valorAtual = parseInt(contador.textContent) || 0;
    if (jaCurtiu) {
        localStorage.removeItem(chave);
        valorAtual = Math.max(0, valorAtual - 1);
        contador.textContent = valorAtual;
        icone.textContent = '🤍';
        btn.classList.remove('curtido');
    } else {
        localStorage.setItem(chave, 'true');
        valorAtual = valorAtual + 1;
        contador.textContent = valorAtual;
        icone.textContent = '❤️';
        btn.classList.add('curtido');
        registrarEvento('curtida', capituloId);
        enviarCurtidaWebhook(capituloId);
    }
}

// ============================================
// ANALYTICS & WEBHOOK
// ============================================
const capitulosLidos = new Set();
const eventosEnviados = new Set();

function registrarLeitura(capituloId) {
    if (!capitulosLidos.has(capituloId)) {
        capitulosLidos.add(capituloId);
        registrarEvento('leitura_capitulo', capituloId);
    }
}

function registrarEvento(tipo, capituloId) {
    const chaveEvento = tipo + '' + capituloId + '' + new Date().toDateString();
    if (eventosEnviados.has(chaveEvento)) return;
    eventosEnviados.add(chaveEvento);
    if (typeof gtag !== 'undefined') {
        gtag('event', tipo, { 'event_category': 'Engajamento', 'event_label': capituloId, 'value': 1 });
    }
    enviarWebhook(tipo, capituloId);
}

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) registrarLeitura(entry.target.id);
    });
}, { threshold: 0.5 });

function enviarWebhook(tipo, capituloId) {
    if (WEBHOOK_URL.includes('SEU-CODIGO-AQUI')) return;
    const urlParams = new URLSearchParams(window.location.search);
    fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            tipo: tipo,
            capitulo: capituloId,
            timestamp: new Date().toISOString(),
            utm_source: urlParams.get('utm_source') || 'direto',
            utm_campaign: urlParams.get('utm_campaign') || 'nenhuma',
            user_agent: navigator.userAgent
        })
    }).catch(err => console.log('Evento registrado localmente'));
}

function enviarCurtidaWebhook(capituloId) { enviarWebhook('curtida', capituloId); }

// ============================================
// MODAL DF- (LÓGICA LIMPA E ISOLADA)
// ============================================
const df = {
    overlay: document.getElementById('dfOverlay'),
    modal: document.getElementById('dfModal'),
    toggleForm: document.getElementById('dfToggleForm'),
    toggleGit: document.getElementById('dfToggleGit'),
    form: document.getElementById('dfForm'),
    githubView: document.getElementById('dfGithubView'),
    closeBtn: document.getElementById('dfCloseModal'),
    shareWhatsApp: document.getElementById('dfShareWhatsApp'),
    shareInstagram: document.getElementById('dfShareInstagram'),
    shareFacebook: document.getElementById('dfShareFacebook'),
    shareCopy: document.getElementById('dfShareCopy'),
    authorWhats: document.getElementById('dfAuthorWhats'),
    formEl: document.querySelector('.df-form')
};

function abrirModal() {
    if (!df.modal || !df.overlay) return;
    
    // Verifica orientação antes de abrir
    const warning = document.getElementById('dfOrientationWarning');
    const isMobile = window.innerWidth <= 768;
    const isLandscape = window.matchMedia('(orientation: landscape)').matches;
    
    if (isMobile && isLandscape && warning?.classList.contains('active')) {
        return; // Não abre o modal se o aviso estiver visível
    }
    
    df.modal.classList.add('active');
    df.overlay.classList.add('active');
    df.modal.setAttribute('aria-hidden', 'false');
    df.overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    if (df.form?.classList.contains('active')) {
    df.form.querySelector('.df-form__input')?.focus();
    }
}

function fecharModal() {
    if (!df.modal || !df.overlay) return;
    df.modal.classList.remove('active');
    df.overlay.classList.remove('active');
    df.modal.setAttribute('aria-hidden', 'true');
    df.overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = 'auto';
}

function ativarFormulario() {
    df.form?.classList.add('active');
    df.githubView?.classList.remove('active');
    df.toggleForm?.classList.add('df-toggle-btn--active');
    df.toggleGit?.classList.remove('df-toggle-btn--active');
    df.toggleForm?.setAttribute('aria-expanded', 'true');
    df.toggleGit?.setAttribute('aria-expanded', 'false');
//  df.form?.querySelector('.df-form__input')?.focus();
}

function ativarGithub() {
    df.form?.classList.remove('active');
    df.githubView?.classList.add('active');
    df.toggleGit?.classList.add('df-toggle-btn--active');
    df.toggleForm?.classList.remove('df-toggle-btn--active');
    df.toggleGit?.setAttribute('aria-expanded', 'true');
    df.toggleForm?.setAttribute('aria-expanded', 'false');
}

function initModal() {
    if (!df.modal) return;
    
    // Tornar função global para o HTML chamar
    window.abrirModalDF = abrirModal;
    
    // Fechar: overlay, botão fechar ou ESC
    df.overlay?.addEventListener('click', fecharModal);
    df.closeBtn?.addEventListener('click', fecharModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && df.modal?.classList.contains('active')) {
            fecharModal();
        }
    });
    
    // Toggle Formulário/GitHub
    df.toggleForm?.addEventListener('click', ativarFormulario);
    df.toggleGit?.addEventListener('click', ativarGithub);
    
    // Submit do formulário
    df.formEl?.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('✅ Mensagem enviada! (simulação)');
        df.formEl.reset();
        fecharModal();
    });
    
    // Compartilhamento
    df.shareWhatsApp?.addEventListener('click', () => {
        window.open(`https://wa.me/?text=${encodeURIComponent('📖 Estou lendo "Perdão, por que não?"\n' + URL_PRINCIPAL)}`, '_blank');
        registrarEvento('compartilhamento_whatsapp', 'modal');
    });
    
    df.shareInstagram?.addEventListener('click', async () => {
        await navigator.clipboard.writeText('📖 "Perdão, por que não?"\n' + URL_PRINCIPAL);
        alert('Link + texto copiados!');
        registrarEvento('compartilhamento_instagram', 'modal');
    });
    
    df.shareFacebook?.addEventListener('click', () => {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(URL_PRINCIPAL)}`, '_blank');
        registrarEvento('compartilhamento_facebook', 'modal');
    });
    
    df.shareCopy?.addEventListener('click', async () => {
        await navigator.clipboard.writeText('📖 "Perdão, por que não?"\n' + URL_PRINCIPAL);
        alert('Link + texto copiados!');
        registrarEvento('copiar_link', 'modal');
    });
    
    // Fale com o autor
    df.authorWhats?.addEventListener('click', () => {
        window.open(`https://wa.me/5511997979597?text=${encodeURIComponent('Olá! Vim pelo site "Perdão, por que não?"')}`, '_blank');
        registrarEvento('fale_com_autor', 'modal');
    });
    
    // Prevenir fechamento ao clicar dentro do modal
    df.modal?.addEventListener('click', (e) => e.stopPropagation());
    
    console.log('✅ Modal DF- inicializado');
}

// ============================================
// DETECÇÃO DE ORIENTAÇÃO (MOBILE)
// ============================================
function initOrientationWarning() {
    const warning = document.getElementById('dfOrientationWarning');
    if (!warning) return;
    
    function checkOrientation() {
        const isMobile = window.innerWidth <= 768;
        const isLandscape = window.matchMedia('(orientation: landscape)').matches;
        
        if (isMobile && isLandscape) {
            warning.classList.add('active');
            document.body.classList.add('df-locked');
        } else {
            warning.classList.remove('active');
            document.body.classList.remove('df-locked');
        }
    }
    
    checkOrientation();
    window.addEventListener('orientationchange', checkOrientation);
    window.addEventListener('resize', checkOrientation);
    
    console.log('✅ Aviso de orientação inicializado');
}

// ============================================
// INICIALIZAÇÃO ÚNICA
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.capitulo').forEach(cap => observer.observe(cap));
    inicializarCurtidas();
    atualizarProgressBar();
    initModal();
    initOrientationWarning();
    console.log('✅ Site carregado com todas as funcionalidades');
});
