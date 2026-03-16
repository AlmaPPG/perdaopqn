// ============================================
// CONFIGURAÇÕES GERAIS
// ============================================
const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzNu0_x-ilJ7cEpjsvo8rgSmTRW2g8-nbnWhpmnewsqvhgfrGhVTu4fb_6P60tbvD2P/exec';

const GISCUS_CONFIG = {
    repo: 'AlmaPPG/perdaopqn',
    repoId: 'R_kgDORhRRvA',
    category: 'Comentários do livro',
    categoryId: 'DIC_kwDORhRRvM4C39qt'
};

// ✅ URL PRINCIPAL DO SITE (para compartilhamento correto)
const URL_PRINCIPAL = 'https://almappg.github.io/perdaopqn/index.html';

// ============================================
// BARRA DE PROGRESSO DE LEITURA
// ============================================
function atualizarProgressBar() {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = scrolled + '%';
    }
}
window.onscroll = function() {
    atualizarProgressBar();
};

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
// COMPARTILHAMENTO (CAPÍTULOS)
// ============================================
function compartilhar(plataforma, capituloId) {
    const texto = "Estou lendo 'Perdão, por que não?': ";
    const url = window.location.href.split('#')[0] + '#' + capituloId;
    
    if (plataforma === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(texto + url)}`, '_blank');
        registrarEvento('compartilhamento_whatsapp', capituloId);
    } else if (plataforma === 'instagram') {
        navigator.clipboard.writeText(url).then(() => {
            alert("Link do capítulo copiado! Abra o Instagram e cole no seu Story ou Direct.");
        });
        registrarEvento('compartilhamento_instagram', capituloId);
    } else if (plataforma === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`, '_blank');
        registrarEvento('compartilhamento_twitter', capituloId);
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
        
        let valorBase = 0;
        
        if (localStorage.getItem(chave)) {
            icone.textContent = '❤️';
            btn.classList.add('curtido');
            contador.textContent = valorBase + 1;
        } else {
            icone.textContent = '🤍';
            btn.classList.remove('curtido');
            contador.textContent = valorBase;
        }
    });
}

function toggleCurtida(capituloId) {
    const chave = 'curtida_' + capituloId;
    const jaCurtiu = localStorage.getItem(chave);
    const btn = document.getElementById('btn-curtida-' + capId);
    const contador = document.getElementById('curtidas-' + capId);
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
// ANALYTICS DE LEITURA
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
    const chaveEvento = tipo + '_' + capituloId + '_' + new Date().toDateString();
    if (eventosEnviados.has(chaveEvento)) return;
    eventosEnviados.add(chaveEvento);
    
    if (typeof gtag !== 'undefined') {
        gtag('event', tipo, {
            'event_category': 'Engajamento',
            'event_label': capituloId,
            'value': 1
        });
    }
    
    enviarWebhook(tipo, capituloId);
}

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            registrarLeitura(entry.target.id);
        }
    });
}, { threshold: 0.5 });

// ============================================
// WEBHOOK PARA GOOGLE SHEETS
// ============================================
function enviarWebhook(tipo, capituloId) {
    if (WEBHOOK_URL.includes('SEU-CODIGO-AQUI')) {
        console.log('Webhook não configurado. Configure a URL no main.js');
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
            tipo: tipo,
            capitulo: capituloId,
            timestamp: new Date().toISOString(),
            utm_source: utmSource,
            utm_campaign: utmCampaign,
            user_agent: navigator.userAgent
        })
    }).catch(err => console.log('Evento registrado localmente'));
}

function enviarCurtidaWebhook(capituloId) {
    enviarWebhook('curtida', capituloId);
}

// ============================================
// PAINEL FLUTUANTE - ABERTURA/FECHAMENTO
// ============================================
function togglePainelInteracao() {
    const painel = document.getElementById('painelInteracao');
    const overlay = document.getElementById('overlay');
    
    if (!painel || !overlay) return;
    
    if (painel.classList.contains('active')) {
        fecharPainel();
    } else {
        abrirPainel();
    }
}

function abrirPainel() {
    const painel = document.getElementById('painelInteracao');
    const overlay = document.getElementById('overlay');
    
    if (!painel || !overlay) return;
    
    painel.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function fecharPainel() {
    const painel = document.getElementById('painelInteracao');
    const overlay = document.getElementById('overlay');
    
    if (!painel || !overlay) return;
    
    painel.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// ============================================
// PAINEL FLUTUANTE - TOGGLES
// ============================================
function toggleFormulario() {
    const form = document.getElementById('conteudo-formulario');
    const git = document.getElementById('conteudo-github');
    
    if (!form || !git) return;
    
    if (form.classList.contains('ativo')) {
        form.classList.remove('ativo');
    } else {
        form.classList.add('ativo');
        git.classList.remove('ativo');
    }
}

function toggleGithub() {
    const form = document.getElementById('conteudo-formulario');
    const git = document.getElementById('conteudo-github');
    
    if (!form || !git) return;
    
    if (git.classList.contains('ativo')) {
        git.classList.remove('ativo');
    } else {
        git.classList.add('ativo');
        form.classList.remove('ativo');
    }
}

// ============================================
// COMPARTILHAMENTO (PAINEL) - URL CORRIGIDA
// ============================================
function compartilharWhatsApp() {
    const url = encodeURIComponent(URL_PRINCIPAL);
    const texto = encodeURIComponent('📖 Estou lendo "Perdão, por que não?"\nUm guia prático para descomplicar o perdão.\nConfira: ');
    window.open(`https://wa.me/?text=${texto}${url}`, '_blank');
    registrarEvento('compartilhamento_whatsapp', 'painel');
}

function compartilharInstagram() {
    const texto = '📖 "Perdão, por que não?" - Um guia prático para descomplicar o perdão.\n\n' + URL_PRINCIPAL;
    navigator.clipboard.writeText(texto).then(() => {
        alert('Link + texto copiados! Cole no Instagram Story ou Direct.');
    });
    registrarEvento('compartilhamento_instagram', 'painel');
}

function compartilharFacebook() {
    const url = encodeURIComponent(URL_PRINCIPAL);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
    registrarEvento('compartilhamento_facebook', 'painel');
}

function copiarLink() {
    const texto = '📖 "Perdão, por que não?"\nUm guia prático para descomplicar o perdão.\n\n' + URL_PRINCIPAL;
    navigator.clipboard.writeText(texto).then(() => {
        alert('Link + texto copiados! Agora é só colar onde quiser.');
    });
    registrarEvento('copiar_link', 'painel');
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.capitulo').forEach(cap => {
        observer.observe(cap);
    });
    
    inicializarCurtidas();
    atualizarProgressBar();
    
    console.log('✅ Site carregado com todas as funcionalidades');
});