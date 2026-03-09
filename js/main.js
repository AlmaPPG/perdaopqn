// ============================================
// BARRA DE PROGRESSO DE LEITURA
// ============================================
window.onscroll = function() {
    let winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    let height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    let scrolled = (winScroll / height) * 100;
    document.getElementById("progressBar").style.width = scrolled + "%";
};

// ============================================
// PLAYER DE ÁUDIO
// ============================================
function toggleAudio(id) {
    // Para todos os outros áudios
    document.querySelectorAll('audio').forEach(audio => {
        if(audio.id !== id) {
            audio.pause();
            audio.classList.remove('active');
            // Reseta o botão dos outros áudios
            let btn = audio.previousElementSibling.querySelector('.btn-audio');
            if(btn) btn.textContent = '🔊 Ouvir';
        }
    });

    // Alterna o atual
    let audio = document.getElementById(id);
    let btn = event.target;
    
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
    let texto = "Estou lendo 'Perdão, por que não?': ";
    // URL completa com âncora do capítulo (ex: site.com/#cap7)
    let url = window.location.href.split('#')[0] + '#' + capituloId;
    
    if(plataforma === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(texto + url)}`, '_blank');
        registrarEvento('compartilhamento_whatsapp', capituloId);
    } else if(plataforma === 'instagram') {
        navigator.clipboard.writeText(url);
        alert("Link do capítulo copiado! Abra o Instagram e cole no seu Story ou Direct.");
        registrarEvento('compartilhamento_instagram', capituloId);
    } else if(plataforma === 'twitter') {
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
        let capId = artigo.id;
        let chave = 'curtida_' + capId;
        let btn = document.getElementById('btn-curtida-' + capId);
        let contador = document.getElementById('curtidas-' + capId);
        let icone = btn.querySelector('.icone-curtida');
        
        if(!btn || !contador || !icone) return;
        
        // Verifica se usuário já curtiu
        if(localStorage.getItem(chave)) {
            icone.textContent = '❤️';
            btn.classList.add('curtido');
        } else {
            icone.textContent = '🤍';
            btn.classList.remove('curtido');
        }
    });
}

// Toggle de curtida
function toggleCurtida(capituloId) {
    let chave = 'curtida_' + capituloId;
    let jaCurtiu = localStorage.getItem(chave);
    let btn = document.getElementById('btn-curtida-' + capituloId);
    let contador = document.getElementById('curtidas-' + capituloId);
    let icone = btn.querySelector('.icone-curtida');
    
    if(!btn || !contador || !icone) return;
    
    // Pega o valor atual do contador
    let valorAtual = parseInt(contador.textContent) || 0;
    
    if(jaCurtiu) {
        // Remove curtida
        localStorage.removeItem(chave);
        contador.textContent = valorAtual - 1;
        icone.textContent = '🤍';
        btn.classList.remove('curtido');
    } else {
        // Adiciona curtida
        localStorage.setItem(chave, 'true');
        contador.textContent = valorAtual + 1;
        icone.textContent = '❤️';
        btn.classList.add('curtido');
        
        // Registra no analytics
        registrarEvento('curtida', capituloId);
        
        // Envia para webhook (opcional)
        enviarCurtidaWebhook(capituloId);
    }
}

// ============================================
// COMENTÁRIOS (GISCUS)
// ============================================
function toggleComentarios(capituloId) {
    let container = document.getElementById('comentarios-' + capituloId);
    let btn = document.getElementById('btn-comentarios-' + capituloId);
    let contador = document.getElementById('contador-comentarios-' + capituloId);
    
    if(container.style.display === 'none' || !container.style.display) {
        container.style.display = 'block';
        btn.textContent = '💬 Fechar Comentários';
        
        // Carrega script do Giscus se ainda não carregou
        if(!container.querySelector('script')) {
            let script = document.createElement('script');
            script.src = 'https://giscus.app/client.js';
            script.setAttribute('data-repo', 'AlmaPPG/perdaopqn');
            script.setAttribute('data-repo-id', 'R_kgDORhRRvA');
            script.setAttribute('data-category', 'Announcements');
            script.setAttribute('data-category-id', 'DIC_kwDORhRRvM4C39qt');
            script.setAttribute('data-mapping', 'pathname');
            script.setAttribute('data-term', capituloId);
            script.setAttribute('data-strict', '0');
            script.setAttribute('data-reactions-enabled', '1');
            script.setAttribute('data-emit-metadata', '0');
            script.setAttribute('data-input-position', 'bottom');
            script.setAttribute('data-theme', 'dark');
            script.setAttribute('data-lang', 'pt');
            script.setAttribute('crossorigin', 'anonymous');
            script.setAttribute('async', '');
            container.appendChild(script);
        }
    } else {
        container.style.display = 'none';
        btn.textContent = '💬 Comentários (' + (contador ? contador.textContent : '0') + ')';
    }
}
// Define valor inicial do contador baseado no localStorage
function inicializarContadores() {
    document.querySelectorAll('.capitulo').forEach(artigo => {
        let capId = artigo.id;
        let chave = 'curtida_' + capId;
        let contador = document.getElementById('curtidas-' + capId);
        
        if(!contador) return;
        
        // Simula um valor base (em produção viria do backend)
        let valorBase = 0;
        
        // Se usuário curtiu, adiciona 1 ao valor base
        if(localStorage.getItem(chave)) {
            contador.textContent = valorBase + 1;
        } else {
            contador.textContent = valorBase;
        }
    });
}
// ============================================
// ANALYTICS DE LEITURA
// ============================================
let capitulosLidos = new Set();
let eventosEnviados = new Set();

function registrarLeitura(capituloId) {
    if(!capitulosLidos.has(capituloId)) {
        capitulosLidos.add(capituloId);
        registrarEvento('leitura_capitulo', capituloId);
    }
}

function registrarEvento(tipo, capituloId) {
    let chaveEvento = tipo + '_' + capituloId + '_' + new Date().toDateString();
    
    if(eventosEnviados.has(chaveEvento)) return;
    eventosEnviados.add(chaveEvento);
    
    // Google Analytics (se configurado)
    if(typeof gtag !== 'undefined') {
        gtag('event', tipo, {
            'event_category': 'Engajamento',
            'event_label': capituloId,
            'value': 1
        });
    }
    
    // Webhook para Google Sheets (opcional)
    enviarWebhook(tipo, capituloId);
}

// Observer para detectar capítulos visíveis
let observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if(entry.isIntersecting && entry.intersectionRatio > 0.5) {
            registrarLeitura(entry.target.id);
        }
    });
}, { threshold: 0.5 });

// Aplica observer a todos os capítulos
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.capitulo').forEach(cap => {
        observer.observe(cap);
    });
    inicializarCurtidas();
});

// ============================================
// WEBHOOK PARA GOOGLE SHEETS
// ============================================
function enviarWebhook(tipo, capituloId) {
    // Substitua pela URL do seu Google Apps Script
    let webhookURL = 'https://script.google.com/macros/s/SEU-SCRIPT/exec';
    
    let urlParams = new URLSearchParams(window.location.search);
    let utmSource = urlParams.get('utm_source') || 'direto';
    let utmCampaign = urlParams.get('utm_campaign') || 'nenhuma';
    
    fetch(webhookURL, {
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
    }).catch(err => console.log('Webhook enviado (no-cors)'));
}

function enviarCurtidaWebhook(capituloId) {
    enviarWebhook('curtida', capituloId);
}

// Aplica observer a todos os capítulos
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.capitulo').forEach(cap => {
        observer.observe(cap);
    });
    inicializarCurtidas();
    inicializarContadores(); // ← Adicione esta linha
});