// ============================================
// CONFIGURAÇÕES GERAIS
// ============================================

// URL do Webhook (Google Apps Script) - SUBSTITUA PELA SUA URL REAL
const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbzNu0_x-ilJ7cEpjsvo8rgSmTRW2g8-nbnWhpmnewsqvhgfrGhVTu4fb_6P60tbvD2P/exec';

// IDs do Giscus - SUBSTITUA PELOS SEUS IDs REAIS
const GISCUS_CONFIG = {
    repo: 'AlmaPPG/perdaopqn',
    repoId: 'R_kgDORhRRvA', // Copie do giscus.app
    category: 'Comentários do livro',
    categoryId: 'DIC_kwDORhRRvM4C39qt' // Copie do giscus.app
};

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
    // Para todos os outros áudios
    document.querySelectorAll('audio').forEach(audio => {
        if (audio.id !== id) {
            audio.pause();
            audio.classList.remove('active');
            // Reseta o botão dos outros áudios
            const btn = audio.previousElementSibling?.querySelector('.btn-audio');
            if (btn) btn.textContent = '🔊 Ouvir';
        }
    });

    // Alterna o atual
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
// COMPARTILHAMENTO COM LINK DO CAPÍTULO
// ============================================
function compartilhar(plataforma, capituloId) {
    const texto = "Estou lendo 'Perdão, por que não?': ";
    // URL completa com âncora do capítulo (ex: site.com/#cap7)
    const url = window.location.href.split('#')[0] + '#' + capituloId;
    
    if (plataforma === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(texto + url)}`, '_blank');
        registrarEvento('compartilhamento_whatsapp', capituloId);
    } else if (plataforma === 'instagram') {
        navigator.clipboard.writeText(url).then(() => {
            alert("Link do capítulo copiado! Abra o Instagram e cole no seu Story ou Direct.");
        }).catch(err => {
            alert("Não foi possível copiar o link. Copie manualmente da barra de endereço.");
        });
        registrarEvento('compartilhamento_instagram', capituloId);
    } else if (plataforma === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`, '_blank');
        registrarEvento('compartilhamento_twitter', capituloId);
    }
}

// ============================================
// SISTEMA DE CURTIDAS (CORRIGIDO)
// ============================================

// Inicializa contadores de curtidas
function inicializarCurtidas() {
    document.querySelectorAll('.capitulo').forEach(artigo => {
        const capId = artigo.id;
        const chave = 'curtida_' + capId;
        const btn = document.getElementById('btn-curtida-' + capId);
        const contador = document.getElementById('curtidas-' + capId);
        const icone = btn?.querySelector('.icone-curtida');
        
        if (!btn || !contador || !icone) return;
        
        // Valor base (em produção, isso viria do backend)
        let valorBase = 0;
        
        // Verifica se usuário já curtiu
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

// Toggle de curtida
function toggleCurtida(capituloId) {
    const chave = 'curtida_' + capituloId;
    const jaCurtiu = localStorage.getItem(chave);
    const btn = document.getElementById('btn-curtida-' + capituloId);
    const contador = document.getElementById('curtidas-' + capituloId);
    const icone = btn?.querySelector('.icone-curtida');
    
    if (!btn || !contador || !icone) return;
    
    // Pega o valor atual do contador
    let valorAtual = parseInt(contador.textContent) || 0;
    
    if (jaCurtiu) {
        // Remove curtida
        localStorage.removeItem(chave);
        valorAtual = Math.max(0, valorAtual - 1); // Evita negativos
        contador.textContent = valorAtual;
        icone.textContent = '🤍';
        btn.classList.remove('curtido');
    } else {
        // Adiciona curtida
        localStorage.setItem(chave, 'true');
        valorAtual = valorAtual + 1;
        contador.textContent = valorAtual;
        icone.textContent = '❤️';
        btn.classList.add('curtido');
        
        // Registra no analytics
        registrarEvento('curtida', capituloId);
        
        // Envia para webhook
        enviarCurtidaWebhook(capituloId);
    }
}

// ============================================
// COMENTÁRIOS (GISCUS)
// ============================================
function toggleComentarios(capituloId) {
    const container = document.getElementById('comentarios-' + capituloId);
    const btn = document.getElementById('btn-comentarios-' + capituloId);
    
    if (!container || !btn) return;
    
    if (container.style.display === 'none' || !container.style.display) {
        container.style.display = 'block';
        btn.textContent = '💬 Fechar Comentários';
        
        // Carrega script do Giscus se ainda não carregou
        if (!container.querySelector('script')) {
            const script = document.createElement('script');
            script.src = 'https://giscus.app/client.js';
            script.setAttribute('data-repo', GISCUS_CONFIG.repo);
            script.setAttribute('data-repo-id', GISCUS_CONFIG.repoId);
            script.setAttribute('data-category', GISCUS_CONFIG.category);
            script.setAttribute('data-category-id', GISCUS_CONFIG.categoryId);
            script.setAttribute('data-mapping', 'specific');
            script.setAttribute('data-term', capituloId);
            script.setAttribute('data-strict', '0');
            script.setAttribute('data-reactions-enabled', '1');
            script.setAttribute('data-emit-metadata', '0');
            script.setAttribute('data-input-position', 'bottom');
            script.setAttribute('data-theme', 'dark');
            script.setAttribute('data-lang', 'pt');
            script.setAttribute('data-origin', window.location.origin);
            script.setAttribute('crossorigin', 'anonymous');
            script.setAttribute('async', '');
            container.appendChild(script);
        }
    } else {
        container.style.display = 'none';
        btn.textContent = '💬 Comentários';
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
    
    // Google Analytics (se configurado)
    if (typeof gtag !== 'undefined') {
        gtag('event', tipo, {
            'event_category': 'Engajamento',
            'event_label': capituloId,
            'value': 1
        });
    }
    
    // Webhook para Google Sheets
    enviarWebhook(tipo, capituloId);
}

// Observer para detectar capítulos visíveis
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
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    // Aplica observer a todos os capítulos
    document.querySelectorAll('.capitulo').forEach(cap => {
        observer.observe(cap);
    });
    
    // Inicializa curtidas
    inicializarCurtidas();
    
    // Atualiza barra de progresso inicialmente
    atualizarProgressBar();
    
    console.log('✅ Site carregado com todas as funcionalidades');
});
// ============================================
// PAINEL FLUTUANTE DE INTERAÇÃO
// ============================================

function togglePainelInteracao() {
    const painel = document.getElementById('painelInteracao');
    const overlay = document.getElementById('overlay');
    
    if (painel.classList.contains('active')) {
        // Fechar
        painel.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    } else {
        // Abrir
        painel.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Toggle de Formulário (dentro do painel)
function toggleFormulario(formId) {
    const form = document.getElementById(formId);
    if (form.style.display === 'none' || !form.style.display) {
        form.style.display = 'block';
    } else {
        form.style.display = 'none';
    }
}