// ============================================
// 1. CONFIGURAÇÕES GLOBAIS
// ============================================
const WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbwXqGw9mlS5B0B-u1qnCdKR98BDoYUEteI8agW-GPZ-HnG0sPA-YW7zs3c5FRmBdEJZlg/exec'; // <--- URL REAL AQUI
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

// ============================================
// 3. LÓGICA DE LEITURA (OBSERVER - TEMPO TOTAL)
// ============================================

const paragrafosLidos = new Set();
const timersUI = {};      // Só para o efeito visual (acender em 7s)
const entryTimes = {};    // Para calcular o tempo real

const observerParagrafos = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const p = entry.target;
        const id = p.id;

        // ✅ ENTRADA NA TELA (>50% visível)
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            if (!entryTimes[id]) {
                entryTimes[id] = Date.now(); // Marca hora de entrada
                
                // Timer só para a UI (acender suavemente após 7s)
                if (!paragrafosLidos.has(id) && !timersUI[id]) {
                    timersUI[id] = setTimeout(() => {
                        p.classList.add('lido');
                        paragrafosLidos.add(id);
                    }, 7000);
                }
            }
            
        // ❌ SAÍDA DA TELA
        } else if (entryTimes[id]) {
            const tempoTotal = ((Date.now() - entryTimes[id]) / 1000).toFixed(1);
            
            // Só registra se ficou >= 7s (leitura real)
            if (tempoTotal >= 7) {
                // Garante que a classe visual está ativa (caso o timer não tenha disparado ainda)
                if (!paragrafosLidos.has(id)) {
                    p.classList.add('lido');
                    paragrafosLidos.add(id);
                }
                // Envia o tempo EXATO para o analytics
                registrarEvento('paragrafo_lido', id, tempoTotal);
            }
            
            // Limpa memória para próxima vez
            delete entryTimes[id];
            if (timersUI[id]) {
                clearTimeout(timersUI[id]);
                delete timersUI[id];
            }
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
// CONTROLE DE ORIENTAÇÃO MOBILE
// ============================================
        let warningTimeout;
        let fadeTimeout;

        function verificarOrientacao() {
            const aviso = document.getElementById('orientation-warning');
            const ehLandscape = window.innerWidth > window.innerHeight;
            
            if (ehLandscape) {
                aviso.classList.add('active');
                aviso.classList.remove('fade-out');
                document.body.style.overflow = 'hidden';
                
                clearTimeout(fadeTimeout);
                fadeTimeout = setTimeout(() => {
                    aviso.classList.add('fade-out');
                    
                    clearTimeout(warningTimeout);
                    warningTimeout = setTimeout(() => {
                        aviso.classList.remove('active');
                        document.body.style.overflow = '';
                    }, 500);
                }, 4500);
            } else {
                aviso.classList.remove('active');
                aviso.classList.remove('fade-out');
                document.body.style.overflow = '';
                clearTimeout(warningTimeout);
                clearTimeout(fadeTimeout);
            }
        }

        window.addEventListener('load', verificarOrientacao);
        window.addEventListener('resize', verificarOrientacao);
        window.addEventListener('orientationchange', verificarOrientacao);

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
// MODAL DF- (ABRIR/FECHAR)
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
    formEl: document.querySelector('dfform')
};

function abrirModal() {
    if (!df.modal || !df.overlay) return;
    
    df.modal.classList.add('active');
    df.overlay.classList.add('active');
    df.modal.setAttribute('aria-hidden', 'false');
    df.overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    
    // ✅ SEM FOCO AUTOMÁTICO (teclado não abre no mobile)
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
    
    // ✅ Torna a função global para o HTML chamar
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
    

// ============================================
// FORMULÁRIO → FORMSPREE (DELEGAÇÃO + CAPTURE)
// ============================================
document.addEventListener('submit', async (e) => {
    const form = e.target.closest('#dfForm');
    if (!form) return;

    e.preventDefault();
    e.stopPropagation();

    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

    try {
        const res = await fetch(form.action, {
            method: 'POST',
            body: new FormData(form),
            headers: { 'Accept': 'application/json' }
        });

        if (res.ok) {
            alert('✅ Mensagem enviada!');
            form.reset();
            if (typeof fecharModal === 'function') fecharModal();
        } else {
            const err = await res.json().catch(() => ({}));
            alert('❌ Erro: ' + (err.error || 'Tente novamente.'));
        }
    } catch (err) {
        console.error('Formspree error:', err);
        alert('❌ Falha na conexão.');
    } finally {
        if (btn) btn.disabled = false;
    }
}, { capture: true });
    
    
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
// 4. INICIALIZAÇÃO AO CARREGAR A PÁGINA
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    // Inicia o sistema de leitura
    initLeituraParagrafos();
    initModal();
    
    // SE VOCÊ TIVER OUTRAS FUNÇÕES (MODAL, CURTIDAS, ETC.), CHAME-AS AQUI
    // ex: initModal();
    // ex: initCurtidas();
});