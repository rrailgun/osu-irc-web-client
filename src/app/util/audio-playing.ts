export function playThankYouForPlaying() {
    playAudioFile('thankyouforplaying');
}

export function playNotification() {
    playAudioFile('notification');
}

function playAudioFile(filename: string) {
    const audio = new Audio();
    audio.src = `assets/sounds/${filename}.ogg`;
    audio.volume = 0.10;
    audio.load();
    audio.play().catch(err => {
        console.error('Playback failed:', err);
    });
}