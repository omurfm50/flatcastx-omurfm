const player = document.querySelector('#player');
const frame = document.querySelector('#radioFrame');
const status = document.querySelector('#playerStatus');
const casterPlayer = document.querySelector('#casterPlayer');
const playToggle = document.querySelector('#playToggle');

const updateButtonState = (isPlaying) => {
  if (!playToggle) return;
  playToggle.textContent = isPlaying ? 'SES KAPAT' : 'SES AÇ';
  playToggle.classList.toggle('is-on', isPlaying);
};

document.querySelector('#year').textContent = new Date().getFullYear();

frame?.addEventListener('load', () => {
  status.textContent = 'Caster.fm player açık';
});

const findCasterAudio = () => document.querySelector('#casterPlayer audio');

const tryCasterAutoplay = () => {
  const audio = findCasterAudio();
  if (!audio) return false;
  if (!audio.paused) {
    status.textContent = 'Canlı yayın çalıyor';
    casterPlayer.classList.add('is-audio-active');
    updateButtonState(true);
    return true;
  }

  audio.play().then(() => {
    status.textContent = 'Canlı yayın çalıyor';
    casterPlayer.classList.add('is-audio-active');
    updateButtonState(true);
  }).catch(() => {
    status.textContent = 'Sesi başlatmak için sayfaya dokunun';
  });
  return false;
};

const syncCasterPlayerVisibility = () => {
  const audio = findCasterAudio();
  const pauseButton = Array.from(casterPlayer.querySelectorAll('button'))
    .some((button) => /pause|duraklat/i.test(button.textContent || ''));
  const isPlaying = Boolean((audio && !audio.paused) || pauseButton);

  casterPlayer.classList.toggle('is-audio-active', isPlaying);
  updateButtonState(isPlaying);
  status.textContent = isPlaying ? 'Canlı yayın çalıyor' : 'Sesi açmak için SES AÇ düğmesine basın';
};

const casterObserver = new MutationObserver(() => {
  syncCasterPlayerVisibility();
  if (findCasterAudio()) {
    tryCasterAutoplay();
  }
});

casterObserver.observe(casterPlayer, {
  childList: true,
  subtree: true,
});

const unlockCasterAudio = () => {
  if (tryCasterAutoplay()) {
    ['pointerdown', 'touchstart', 'keydown'].forEach((eventName) => {
      document.removeEventListener(eventName, unlockCasterAudio, true);
    });
  }
};

['pointerdown', 'touchstart', 'keydown'].forEach((eventName) => {
  document.addEventListener(eventName, unlockCasterAudio, true);
});

playToggle?.addEventListener('click', () => {
  const audio = findCasterAudio();
  if (!audio) {
    status.textContent = 'Ses kaynağı bulunamadı, lütfen sayfayı tekrar yükleyin.';
    return;
  }

  if (audio.paused) {
    audio.play().then(() => {
      syncCasterPlayerVisibility();
    }).catch(() => {
      status.textContent = 'Ses çalınamadı; tarayıcınız kullanıcı etkileşimi bekliyor olabilir.';
    });
  } else {
    audio.pause();
    syncCasterPlayerVisibility();
  }
});

casterPlayer.addEventListener('click', () => {
  window.setTimeout(syncCasterPlayerVisibility, 350);
});
