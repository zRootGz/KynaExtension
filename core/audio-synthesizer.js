/**
 * CORE/AUDIO-SYNTHESIZER.JS - Web Audio API & BGM Sound Synthesizer
 */

(function () {
  let audioCtx = null;
  let currentBgmAudio = null;
  let currentBgmType = null;

  /**
   * Phát âm thanh chiến thắng / kết thúc cuộc đua hào hùng (Grand Victory Fanfare)
   */
  function playVictorySound(soundEnabled = true) {
    if (soundEnabled === false) return;

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
        { f: 1046.50, t: 0.36, d: 0.60 },// C6 (kéo dài)
        { f: 880.00, t: 0.50, d: 0.15 }, // A5
        { f: 1046.50, t: 0.65, d: 0.80 } // C6 (kết thúc hoành tráng)
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
    if (soundEnabled === false) return;

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
    if (!gameType) return;
    if (currentBgmAudio && currentBgmType === gameType && !currentBgmAudio.paused) {
      return;
    }

    stopBgmSound();

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
      const bgm = new Audio(soundUrl);
      bgm.loop = true;
      bgm.volume = 0.18; // Giảm âm lượng nhạc nền xuống 18% để âm thanh trả lời đúng nổi bật

      // Gán handle ngay lập tức đồng bộ để stopBgmSound luôn ngắt được kể cả khi đang nạp
      currentBgmAudio = bgm;
      currentBgmType = gameType;

      bgm.play().catch(() => {});
    } catch (e) {}
  }

  /**
   * Dừng Nhạc Nền BGM ngay lập tức
   */
  function stopBgmSound() {
    if (currentBgmAudio) {
      const targetAudio = currentBgmAudio;
      currentBgmAudio = null;
      currentBgmType = null;

      try {
        targetAudio.pause();
        targetAudio.currentTime = 0;
        targetAudio.src = "";
      } catch (e) {}
    }
  }

  if (typeof window !== "undefined") {
    window.playVictorySound = playVictorySound;
    window.playCorrectSound = playCorrectSound;
    window.playBgmSound = playBgmSound;
    window.stopBgmSound = stopBgmSound;
  }
})();
