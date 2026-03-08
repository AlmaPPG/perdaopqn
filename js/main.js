// Barra de Progresso de Leitura
window.onscroll = function() {
    let winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    let height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    let scrolled = (winScroll / height) * 100;
    document.getElementById("progressBar").style.width = scrolled + "%";
};

// Player de Áudio Toggle
function toggleAudio(id) {
    // Para todos os outros áudios
    document.querySelectorAll('audio').forEach(audio => {
        if(audio.id !== id) {
            audio.pause();
            audio.classList.remove('active');
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

// Compartilhar com link direto para o capítulo
function compartilhar(plataforma, capituloId) {
    let texto = "Estou lendo 'Perdão, por que não?': ";
    // Pega a URL atual + o ID do capítulo (ex: site.com/#cap7)
    let url = window.location.href.split('#')[0] + '#' + capituloId;
    
    if(plataforma === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(texto + url)}`, '_blank');
    } else if(plataforma === 'instagram') {
        navigator.clipboard.writeText(url);
        alert("Link do capítulo copiado! Abra o Instagram e cole no seu Story ou Direct.");
    } else if(plataforma === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}&url=${encodeURIComponent(url)}`, '_blank');
    }
}