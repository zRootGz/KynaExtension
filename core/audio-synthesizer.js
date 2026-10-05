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

  if (typeof window !== "undefined") {
    window.playVictorySound = playVictorySound;
  }
})();
