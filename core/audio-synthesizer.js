/**
 * CORE/AUDIO-SYNTHESIZER.JS - Web Audio API & BGM Sound Synthesizer + Singleton Audio Manager
 */

(function () {
  let audioCtx = null;
  let isSoundMuted = false;

  // Tải trạng thái Mute từ Storage khi khởi tạo
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(["kynaSoundMuted"], (res) => {
      if (typeof res.kynaSoundMuted === "boolean") {
        isSoundMuted = res.kynaSoundMuted;
      }
    });
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes.kynaSoundMuted) {
        setSoundMuted(changes.kynaSoundMuted.newValue);
      }
    });
  }

  function setSoundMuted(muted) {
    isSoundMuted = !!muted;
    if (isSoundMuted) {
      stopBgmSound();
    }
  }

  function toggleSoundMuted() {
    setSoundMuted(!isSoundMuted);
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ kynaSoundMuted: isSoundMuted });
    }
    return isSoundMuted;
  }

  function getSoundMuted() {
    return isSoundMuted;
  }

  /**
   * Lấy hoặc tạo Singleton HTML5 Audio Element để tuyệt đối không bị đè đúp âm thanh
   */
  function getOrCreateBgmAudioElement() {
    let el = document.getElementById("kyna-bgm-singleton-player");
    if (!el) {
      el = document.createElement("audio");
      el.id = "kyna-bgm-singleton-player";
      el.setAttribute("data-kyna-audio", "true");
      el.style.display = "none";
      (document.body || document.documentElement).appendChild(el);
    }
    return el;
  }

  /**
   * Phát âm thanh chiến thắng / kết thúc cuộc đua hào hùng (Grand Victory Fanfare)
   */
  function playVictorySound(soundEnabled = true) {
    if (soundEnabled === false || isSoundMuted) return;

    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      const now = audioCtx.currentTime;
      const notes = [
        { f: 523.25, t: 0.0, d: 0.15 }, // C5
        { f: 659.25, t: 0.12, d: 0.15 }, // E5
        { f: 783.99, t: 0.24, d: 0.15 }, // G5
        { f: 1046.50, t: 0.36, d: 0.60 },// C6
        { f: 880.00, t: 0.50, d: 0.15 }, // A5
        { f: 1046.50, t: 0.65, d: 0.80 } // C6
      ];

      notes.forEach(note => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(note.f, now + note.t);

        gain.gain.setValueAtTime(0.4, now + note.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.t + note.d);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start(now + note.t);
        osc.stop(now + note.t + note.d);
      });
    } catch (e) {}
  }

  /**
   * Phát âm thanh thông báo trả lời đúng (Correct Answer Chime)
   */
  function playCorrectSound(soundEnabled = true) {
    if (soundEnabled === false || isSoundMuted) return;

    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now);       // D5
      osc.frequency.setValueAtTime(880.00, now + 0.12); // A5

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch (e) {}
  }

  /**
   * Phát Nhạc Nền BGM Lặp lại (Loop = true) với âm lượng vừa phải (18%)
   */
  function playBgmSound(gameType) {
    if (isSoundMuted || !gameType) {
      stopBgmSound();
      return;
    }

    const bgmEl = getOrCreateBgmAudioElement();
    const currentType = bgmEl.getAttribute("data-game-type");

    if (currentType === gameType && !bgmEl.paused) {
      return; // Đang phát đúng bản nhạc của game hiện tại
    }

    let audioFileName = "";
    if (gameType === "GUESS_THE_WORD") {
      audioFileName = "guess-bgm.mp3";
    } else if (gameType === "SWIMMING_RACE") {
      audioFileName = "swim-bgm.mp3";
    }

    if (!audioFileName) return;

    let soundUrl = "";
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getURL) {
      soundUrl = chrome.runtime.getURL(`assets/sounds/${audioFileName}`);
    } else {
      soundUrl = `assets/sounds/${audioFileName}`;
    }

    try {
      bgmEl.pause();
      bgmEl.currentTime = 0;
      bgmEl.loop = true;
      bgmEl.volume = 0.18; // Âm lượng nhạc nền 18% dịu nhẹ
      bgmEl.src = soundUrl;
      bgmEl.setAttribute("data-game-type", gameType);

      bgmEl.play().catch(() => {});
    } catch (e) {}
  }

  /**
   * Dừng toàn bộ Nhạc Nền BGM ngay lập tức (Xóa triệt để các Audio node phát ngầm)
   */
  function stopBgmSound() {
    // 1. Dừng Singleton Player
    const bgmEl = document.getElementById("kyna-bgm-singleton-player");
    if (bgmEl) {
      try {
        bgmEl.pause();
        bgmEl.currentTime = 0;
        bgmEl.removeAttribute("src");
        bgmEl.removeAttribute("data-game-type");
      } catch (e) {}
    }

    // 2. Quét & ngắt toàn bộ Audio node thừa được gắn trong DOM
    const allAudioEls = document.querySelectorAll('audio[data-kyna-audio="true"], audio#kyna-bgm-singleton-player');
    allAudioEls.forEach(el => {
      try {
        el.pause();
        el.currentTime = 0;
        el.removeAttribute("src");
        if (el.parentNode && el.id !== "kyna-bgm-singleton-player") {
          el.parentNode.removeChild(el);
        }
      } catch (e) {}
    });
  }

  if (typeof window !== "undefined") {
    window.playVictorySound = playVictorySound;
    window.playCorrectSound = playCorrectSound;
    window.playBgmSound = playBgmSound;
    window.stopBgmSound = stopBgmSound;
    window.setSoundMuted = setSoundMuted;
    window.toggleSoundMuted = toggleSoundMuted;
    window.getSoundMuted = getSoundMuted;
  }
})();
