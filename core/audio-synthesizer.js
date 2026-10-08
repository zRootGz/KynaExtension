/**
 * CORE/AUDIO-SYNTHESIZER.JS - Web Audio API Synthesizer cho hiệu ứng âm thanh
 * Không cần tải file MP3 bên ngoài, tạo âm thanh chiến thắng nhẹ nhàng trực tiếp bằng trình duyệt.
 */

(function () {
  let audioCtx = null;

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
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      // Chuỗi nốt nhạc chiến thắng (C5 -> E5 -> G5 -> C6)
      osc.frequency.setValueAtTime(523.25, now);       // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      osc.frequency.setValueAtTime(1046.50, now + 0.3);// C6

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.6);
    } catch (e) {
      // Bỏ qua lỗi audio nếu trình duyệt block autoplay
    }
  }

  let currentBgmAudio = null;
  let currentBgmType = null;

  /**
   * Phát Nhạc Nền BGM Lặp lại liên tục (Loop = true) cho từng Game
   * @param {string} gameType "GUESS_THE_WORD" | "SWIMMING_RACE"
   */
  function playBgmSound(gameType) {
    if (!gameType) return;
    if (currentBgmAudio && currentBgmType === gameType && !currentBgmAudio.paused) {
      return; // Đã và đang phát đúng nhạc nền của game này
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
      bgm.loop = true; // Tự động lặp lại liên tục khi hết bài!
      bgm.volume = 0.35; // Âm lượng nhạc nền 35% vừa phải nhẹ nhàng
      bgm.play().then(() => {
        currentBgmAudio = bgm;
        currentBgmType = gameType;
      }).catch(() => {
        // Bỏ qua log nếu file MP3 chưa được tạo hoặc trình duyệt chưa tương tác
      });
    } catch (e) {}
  }

  /**
   * Dừng Nhạc Nền BGM ngay lập tức khi dừng Game hoặc khi Game kết thúc
   */
  function stopBgmSound() {
    if (currentBgmAudio) {
      try {
        currentBgmAudio.pause();
        currentBgmAudio.currentTime = 0;
      } catch (e) {}
      currentBgmAudio = null;
      currentBgmType = null;
    }
  }

  if (typeof window !== "undefined") {
    window.playVictorySound = playVictorySound;
    window.playBgmSound = playBgmSound;
    window.stopBgmSound = stopBgmSound;
  }
})();
