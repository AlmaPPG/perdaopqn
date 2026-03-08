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

// Compartilhar
function compartilhar(plataforma) {
    let texto = "Estou lendo 'Perdão, por que não?': ";
    let url = window.location.href;
    
    if(plataforma === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(texto + url)}`, '_blank');
    } else if(plataforma === 'instagram') {
        // Instagram não permite share direto com texto via web, então copiamos o link
        navigator.clipboard.writeText(url);
        alert("Link copiado! Abra o Instagram e cole no seu Story ou Direct.");
    }
}