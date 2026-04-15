// ============================================
// 1. CONFIGURAÇÕES GLOBAIS
// ============================================
const WEBHOOK_URL = 'https://script.google.com/macros/s/SEU-CODIGO-AQUI/exec'; // <--- COLOQUE SUA URL REAL AQUI
const URL_PRINCIPAL = 'https://perdaopqn.com.br';

// ============================================
// 2. FUNÇÕES DE ANALYTICS (DEFINIDAS PRIMEIRO)
// ============================================

// Gera ou recupera o ID anônimo do leitor
function getReaderId() {
    let id = localStorage.getItem('reader_id');
    if (!id) {
        id = 'reader-' + Math.random().toString(36).substr(2, 8);
        localStorage.setItem('reader_id', id);
    }
    return id;
}

// Envia dados para o Google Sheets
function enviarWebhook(payload) {
    if (!WEBHOOK_URL || WEBHOOK_URL.includes('SEU-CODIGO-AQUI')) {
        console.warn('⚠️ Webhook não configurado.');
        return;
    }

    fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .catch(err => console.error('❌ Erro webhook:', err));
}

// Registra eventos de forma padronizada
function registrarEvento(tipo, elementoId, tempo = null) {
    const readerId = getReaderId();
    let capituloId = 'desconhecido';
    let paragrafoId = '';

    if (elementoId) {
        const el = document.getElementById(elementoId);
        if (el) {
            const capituloEl = el.closest('.capitulo');
            if (capituloEl) capituloId = capituloEl.id;
            if (elementoId.startsWith('p-')) paragrafoId = elementoId;
        }
    }

    const payload = {
        reader_id: readerId,
        capitulo: capituloId,
        paragrafo: paragrafoId,
        evento: tipo,
        timestamp: new Date().toISOString(),
        tempo_no_elemento: tempo,
        utm_source: new URLSearchParams(window.location.search).get('utm_source') || 'direto'
    };

    enviarWebhook(payload);
}

// ============================================
// 3. LÓGICA DE LEITURA (OBSERVER)
// ============================================

const paragrafosLidos = new Set();
const timersParagrafos = {};

// Observer para detectar parágrafos na tela
const observerParagrafos = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const paragrafo = entry.target;
        const paragrafoId = paragrafo.id;

        // Entrada na tela (>50% visível)
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            if (!paragrafosLidos.has(paragrafoId) && !timersParagrafos[paragrafoId]) {
                
                timersParagrafos[paragrafoId] = setTimeout(() => {
                    // Marca visualmente (adiciona classe CSS)
                    paragrafo.classList.add('lido');
                    paragrafosLidos.add(paragrafoId);
                    
                    // Registra no analytics
                    registrarEvento('paragrafo_lido', paragrafoId, 7);
                    
                    delete timersParagrafos[paragrafoId];
                }, 7000); // 7 segundos
            }
        
        // Saída da tela (cancela timer se não completou)
        } else if (!entry.isIntersecting && timersParagrafos[paragrafoId]) {
            clearTimeout(timersParagrafos[paragrafoId]);
            delete timersParagrafos[paragrafoId];
        }
    });
}, { threshold: 0.5 });

// Inicializa a leitura
function initLeituraParagrafos() {
    // 1. Gerar IDs automáticos se não existirem
    document.querySelectorAll('.capitulo p').forEach((p, index) => {
        if (!p.id) {
            p.id = `p-${index}`;
        }
    });

    // 2. Observar todos os parágrafos
    document.querySelectorAll('.capitulo p').forEach(p => {
        observerParagrafos.observe(p);
    });

    console.log('✅ Leitura de parágrafos inicializada (timer: 7s)');
}
// ============================================
// 4. ESPAÇO RESERVADO PARA OUTROS CÓDIGOS
// ============================================
// 
// 
// 
// 
// 
// ============================================
// 5. INICIALIZAÇÃO AO CARREGAR A PÁGINA
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Inicia o sistema de leitura
    initLeituraParagrafos();
    
    // SE VOCÊ TIVER OUTRAS FUNÇÕES (MODAL, CURTIDAS, ETC.), CHAME-AS AQUI
    // ex: initModal();
    // ex: initCurtidas();
});