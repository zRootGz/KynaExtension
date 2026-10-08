/**
 * GAMES/GUESS-THE-WORD/GAME-LOGIC.JS - Logic vận hành Game Nhìn Hình Đoán Chữ trên BBB
 * Nhận trạng thái từ popup.js, hiển thị Overlay nổi, đếm ngược thời gian và chấm điểm tự động.
 */

(function () {
  console.log("Kyna BBB Guess The Word Game Module Loaded.");

  // Trạng thái cục bộ của Game
  let gameState = {
    category: "Animals",
    quizWords: [],
    gameState: "IDLE", // "IDLE" | "RUNNING"
    currentWordIndex: 0,
    scores: {},
    settings: {
      timerSeconds: 60,
      scoreFirst: 10,
      scoreNext: 5,
      soundEnabled: true
    }
  };

  // Quản lý lượt chơi hiện tại
  let currentRound = {
    wordObj: null,
    normalizedWord: "",
    guessedStudentsSet: new Set(),
    revealedLetters: [],
    timerId: null,
    timeLeft: 60,
    isFirstWinner: true,
    isSolved: false
  };

  let autoNextTimeoutId = null;

  // Phần tử DOM Overlay
  let overlayEl = null;

  // Khởi chạy Module
  init();

  function init() {
    loadStateAndSync();
    setupMessageListeners();
    const oldLaunchers = document.querySelectorAll("#kyna-floating-launcher, [id*='kyna-floating'], .kyna-floating-btn");
    oldLaunchers.forEach(el => el.remove());

    if (typeof window.initBBBMessageObserver === "function") {
      window.initBBBMessageObserver(onBBBMessageReceived);
    }
  }

  /**
   * Tải trạng thái ban đầu và lắng nghe sự thay đổi chrome.storage / localStorage
   */
  function loadStateAndSync() {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      if (!window.kynaGuessStorageListenerSet) {
        window.kynaGuessStorageListenerSet = true;
        try {
          chrome.storage.local.get(["kynaGameState"], (res) => {
            if (res && res.kynaGameState) {
              updateLocalState(res.kynaGameState);
            }
          });

          chrome.storage.onChanged.addListener((changes, area) => {
            if (area === "local" && changes.kynaGameState) {
              updateLocalState(changes.kynaGameState.newValue);
            }
          });
        } catch (e) {}
      }
    }

    if (!window.kynaGuessLocalStorageListenerSet) {
      window.kynaGuessLocalStorageListenerSet = true;
      try {
        const saved = localStorage.getItem("kynaGameState");
        if (saved) {
          updateLocalState(JSON.parse(saved));
        }
      } catch (e) {}

      window.addEventListener("storage", (e) => {
        if (e.key === "kynaGameState" && e.newValue) {
          try {
            updateLocalState(JSON.parse(e.newValue));
          } catch (err) {}
        }
      });

      window.addEventListener("message", (e) => {
        if (e.data && e.data.action === "SYNC_GAME_STATE") {
          updateLocalState(e.data.payload);
        }
      });
    }
  }

  /**
   * Lắng nghe tin nhắn trực tiếp từ popup.js
   */
  function setupMessageListeners() {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
      if (!window.kynaGuessMsgListenerSet) {
        window.kynaGuessMsgListenerSet = true;
        try {
          chrome.runtime.onMessage.addListener((message) => {
            if (message && message.action === "SYNC_GAME_STATE") {
              if (message.tabId) window.kynaMyTabId = message.tabId;
              updateLocalState(message.payload);
            }
          });
        } catch (e) {}
      }
    }
  }

  /**
   * Cập nhật trạng thái cục bộ & Quản lý vòng đời Overlay
   */
  function updateLocalState(newState) {
    if (!newState) return;

    const oldGameState = gameState.gameState;
    const oldWordIndex = gameState.currentWordIndex;

    gameState = { ...gameState, ...newState };

    if (gameState.gameState === "RUNNING") {
      if (typeof window.playBgmSound === "function") {
        window.playBgmSound("GUESS_THE_WORD");
      }
      if (oldGameState !== "RUNNING" || oldWordIndex !== gameState.currentWordIndex || !overlayEl || !document.getElementById("kyna-game-overlay")) {
        startNewRound();
      } else {
        createOrUpdateOverlay();
      }
    } else {
      if (typeof window.stopBgmSound === "function") {
        window.stopBgmSound();
      }
      stopCurrentRound();
      removeOverlay();
    }
  }

  /**
   * Bắt đầu một vòng chơi từ mới
   */
  async function startNewRound() {
    stopCurrentRound();

    if (!gameState.quizWords || gameState.quizWords.length === 0) {
      if (typeof window.getWordsByCategory === "function") {
        gameState.quizWords = window.getWordsByCategory("Animals");
      }
    }

    const currentWordObj = (gameState.quizWords && gameState.quizWords[gameState.currentWordIndex]) 
      || (window.MASTER_WORD_DATABASE && window.MASTER_WORD_DATABASE[0])
      || { word: "APPLE", hint: "A red or green fruit", category: "Animals", imageUrl: "" };

    if (!currentWordObj) {
      removeOverlay();
      return;
    }

    const safeNormalize = (str) => {
      if (typeof window.normalizeAnswerString === "function") {
        return window.normalizeAnswerString(str || "");
      }
      return (str || "").toString().toUpperCase().trim().replace(/[^A-Z0-9]/g, "");
    };

    const normWord = safeNormalize(currentWordObj.word);

    currentRound = {
      roundId: "R_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
      wordObj: currentWordObj,
      normalizedWord: normWord,
      guessedStudentsSet: new Set(),
      revealedLetters: new Array(normWord.length || 1).fill(false),
      timerId: null,
      timeLeft: gameState.settings ? (gameState.settings.timerSeconds || 60) : 60,
      isFirstWinner: true,
      isSolved: false
    };

    createOrUpdateOverlay();
    runRoundTimer();

    // Đánh dấu các tin nhắn cũ trong chat để chỉ nhận tin nhắn mới gõ sau khi lượt bắt đầu
    if (typeof window.markExistingChatMessagesAsOld === "function") {
      window.markExistingChatMessagesAsOld();
    }
  }

  /**
   * Dừng vòng chơi hiện tại
   */
  function stopCurrentRound() {
    if (currentRound.timerId) {
      clearInterval(currentRound.timerId);
      currentRound.timerId = null;
    }
    if (autoNextTimeoutId) {
      clearTimeout(autoNextTimeoutId);
      autoNextTimeoutId = null;
    }
  }

  /**
   * Chạy đếm ngược thời gian vòng chơi
   */
  function runRoundTimer() {
    currentRound.timerId = setInterval(() => {
      currentRound.timeLeft--;
      updateOverlayTimerUI();

      if (currentRound.timeLeft <= 0) {
        clearInterval(currentRound.timerId);
        currentRound.timerId = null;
        onRoundTimeOut();
      }
    }, 1000);
  }

  /**
   * Khi hết thời gian đếm ngược (60s)
   */
  function onRoundTimeOut() {
    if (currentRound.isSolved) return;
    currentRound.isSolved = true;

    if (currentRound.timerId) {
      clearInterval(currentRound.timerId);
      currentRound.timerId = null;
    }

    currentRound.revealedLetters.fill(true);
    renderWordSlotsUI();

    const winnerBox = document.getElementById("kyna-winner-box");
    if (winnerBox) {
      winnerBox.innerHTML = `⏰ <strong>Time's up!</strong> Correct answer is: <strong>${escapeHtml(currentRound.wordObj.word)}</strong>`;
      winnerBox.style.display = "block";
      winnerBox.style.background = "rgba(239, 68, 68, 0.25)";
      winnerBox.style.borderColor = "#EF4444";
      winnerBox.style.color = "#F87171";
    }

    showToastNotification("⏰ TIME'S UP!", `Correct answer is: <strong>${escapeHtml(currentRound.wordObj.word)}</strong>`);

    if (autoNextTimeoutId) clearTimeout(autoNextTimeoutId);

    autoNextTimeoutId = setTimeout(() => {
      autoNextTimeoutId = null;
      if (gameState.gameState === "RUNNING") {
        if (gameState.currentWordIndex + 1 < gameState.quizWords.length) {
          gameState.currentWordIndex++;
          saveStateToStorage();
          startNewRound();
        } else {
          showToastNotification("🏁 FINISHED!", "Completed all words in list!");
          showGuessWordSummaryModal();
        }
      }
    }, 3500);
  }

  /**
   * Tạo hoặc cập nhật Khung Overlay nổi
   */
  function createOrUpdateOverlay() {
    let existing = document.getElementById("kyna-game-overlay");
    if (!existing) {
      overlayEl = document.createElement("div");
      overlayEl.id = "kyna-game-overlay";
      overlayEl.innerHTML = `
        <div class="kyna-overlay-header" id="kyna-header-drag">
          <div class="kyna-header-title">
            <span>🧩 Guess The Word</span>
            <span style="font-size:12px; opacity:0.8;" id="kyna-overlay-category">(${currentRound && currentRound.wordObj ? currentRound.wordObj.category : ""})</span>
          </div>
          <div class="kyna-header-actions">
            <button class="kyna-icon-btn" id="kyna-btn-toggle-sound" title="Toggle BGM & Sound">🔊</button>
            <button class="kyna-icon-btn" id="kyna-btn-toggle-min" title="Minimize/Expand">➖</button>
            <button class="kyna-icon-btn kyna-close-btn" id="kyna-btn-close-game" title="Close Game">✖</button>
          </div>
        </div>

        <div class="kyna-overlay-body">
          <div class="kyna-image-frame">
            <div class="kyna-image-loading" id="kyna-img-loader" style="display: none;">⏳ Loading image...</div>
            <img id="kyna-doodle-img" src="" alt="Doodle sketch" style="opacity: 1;">
          </div>

          <div class="kyna-word-slots" id="kyna-slots-container"></div>

          <div class="kyna-hint-box">
            💡 <strong style="color:#2563EB;">Hint:</strong> <span id="kyna-hint-text">${currentRound && currentRound.wordObj ? currentRound.wordObj.hint : ""}</span>
          </div>

          <div class="kyna-timer-container">
            <span class="kyna-timer-text" id="kyna-timer-val">${currentRound ? currentRound.timeLeft : 60}s</span>
            <div class="kyna-progress-bar-bg">
              <div class="kyna-progress-bar-fill" id="kyna-progress-fill"></div>
            </div>
          </div>

          <div class="kyna-winner-box hidden" id="kyna-winner-box" style="margin-top: 10px; padding: 12px; background: rgba(16, 185, 129, 0.25); border: 1.5px solid #10B981; border-radius: 12px; text-align: center; color: #34D399; font-weight: bold; font-size: 16px;"></div>

          <div class="kyna-controls-row">
            <button class="kyna-action-btn kyna-btn-hint" id="kyna-action-hint">💡 Hint</button>
            <button class="kyna-action-btn kyna-btn-next" id="kyna-action-next">⏩ Next Word</button>
            <button class="kyna-action-btn kyna-btn-restart-quiz" id="kyna-action-restart">🔄 Restart</button>
            <button class="kyna-action-btn kyna-btn-summary" id="kyna-action-summary">🏆 Summary</button>
          </div>
        </div>
      `;

      (document.body || document.documentElement).appendChild(overlayEl);

      if (typeof window.makeElementDraggable === "function") {
        window.makeElementDraggable(overlayEl, document.getElementById("kyna-header-drag"));
      }

      document.getElementById("kyna-btn-toggle-min").addEventListener("click", () => {
        overlayEl.classList.toggle("minimized");
      });

      const closeBtn = document.getElementById("kyna-btn-close-game");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          if (typeof window.stopBgmSound === "function") {
            window.stopBgmSound();
          }
          if (currentRound.timerId) clearInterval(currentRound.timerId);
          if (autoNextTimeoutId) clearTimeout(autoNextTimeoutId);
          gameState.activeGame = "NONE";
          gameState.gameState = "IDLE";
          saveStateToStorage();
          removeOverlay();
        });
      }

      const soundBtn = document.getElementById("kyna-btn-toggle-sound");
      if (soundBtn) {
        soundBtn.addEventListener("click", () => {
          const isMuted = typeof window.toggleSoundMuted === "function" ? window.toggleSoundMuted() : false;
          soundBtn.innerHTML = isMuted ? '🔇' : '🔊';
          if (!isMuted && gameState.gameState === "RUNNING") {
            if (typeof window.playBgmSound === "function") window.playBgmSound("GUESS_THE_WORD");
          }
        });
      }

      document.getElementById("kyna-action-hint").addEventListener("click", () => {
        revealRandomLetter();
      });

      document.getElementById("kyna-action-next").addEventListener("click", () => {
        if (autoNextTimeoutId) {
          clearTimeout(autoNextTimeoutId);
          autoNextTimeoutId = null;
        }
        if (gameState.currentWordIndex + 1 < gameState.quizWords.length) {
          gameState.currentWordIndex++;
          saveStateToStorage();
          startNewRound();
        } else {
          showToastNotification("🏁 Finished!", "Completed all words in list!");
          showGuessWordSummaryModal();
        }
      });

      document.getElementById("kyna-action-restart").addEventListener("click", () => {
        if (confirm("Do you want to restart the quiz from the first word?")) {
          gameState.currentWordIndex = 0;
          gameState.scores = {};
          saveStateToStorage();
          startNewRound();
        }
      });

      document.getElementById("kyna-action-summary").addEventListener("click", () => {
        showGuessWordSummaryModal();
      });
    } else {
      overlayEl = existing;
    }

    overlayEl.style.display = "block";

    const soundBtn = document.getElementById("kyna-btn-toggle-sound");
    if (soundBtn) {
      const isMuted = typeof window.getSoundMuted === "function" ? window.getSoundMuted() : false;
      soundBtn.innerHTML = isMuted ? '🔇' : '🔊';
    }

    if (currentRound && currentRound.wordObj) {
      const catEl = document.getElementById("kyna-overlay-category");
      if (catEl) catEl.textContent = `(${currentRound.wordObj.category || "General"})`;

      const hintEl = document.getElementById("kyna-hint-text");
      if (hintEl) hintEl.textContent = currentRound.wordObj.hint || "";
    }
    
    const winnerBox = document.getElementById("kyna-winner-box");
    if (winnerBox) {
      winnerBox.innerHTML = "";
      winnerBox.style.display = "none";
    }

    renderWordSlotsUI();
    updateOverlayTimerUI();
    if (currentRound && currentRound.wordObj) {
      loadDoodleImageAsync(currentRound.wordObj);
    }
  }

  /**
   * Tải ảnh vẽ tay Async (Xử lý trực tiếp Data URI SVG để không bị treo loading)
   */
  function loadDoodleImageAsync(wordObj) {
    const imgEl = document.getElementById("kyna-doodle-img");
    const loaderEl = document.getElementById("kyna-img-loader");
    if (!imgEl || !loaderEl) return;

    if (!wordObj) {
      loaderEl.style.display = "none";
      imgEl.style.opacity = "1";
      return;
    }

    const word = wordObj.word || "PUZZLE";
    const hint = wordObj.hint || "";

    const fallbackSvg = (typeof window.generateFallbackDoodleSvg === "function") 
      ? window.generateFallbackDoodleSvg(word, hint)
      : "";
    const targetImgUrl = wordObj.imageUrl || fallbackSvg;

    if (!targetImgUrl) {
      loaderEl.style.display = "none";
      imgEl.style.opacity = "1";
      return;
    }

    // Nếu là Data URI (SVG String), gán trực tiếp không qua Image onload để tránh bị treo trong Content Script
    if (targetImgUrl.startsWith("data:")) {
      imgEl.src = targetImgUrl;
      imgEl.style.opacity = "1";
      loaderEl.style.display = "none";
      return;
    }

    // Với URL ảnh HTTP/HTTPS bên ngoài, dùng fallback đếm giờ 1.2s tránh treo
    loaderEl.style.display = "flex";
    imgEl.style.opacity = "0";

    const img = new Image();
    const timer = setTimeout(() => {
      imgEl.src = targetImgUrl;
      imgEl.style.opacity = "1";
      loaderEl.style.display = "none";
    }, 1200);

    img.onload = () => {
      clearTimeout(timer);
      imgEl.src = targetImgUrl;
      imgEl.style.opacity = "1";
      loaderEl.style.display = "none";
    };

    img.onerror = () => {
      clearTimeout(timer);
      imgEl.src = fallbackSvg || targetImgUrl;
      imgEl.style.opacity = "1";
      loaderEl.style.display = "none";
    };

    img.src = targetImgUrl;
  }

  /**
   * Render các ô chữ ẩn theo nhóm từ (Word Groups) & tự động điều chỉnh cỡ ô chữ cho từ/cụm từ dài
   */
  function renderWordSlotsUI() {
    const container = document.getElementById("kyna-slots-container");
    if (!container) return;

    const rawWordStr = (currentRound.wordObj && currentRound.wordObj.word) ? currentRound.wordObj.word.trim() : "";
    if (!rawWordStr) {
      container.innerHTML = "";
      return;
    }

    // Tách các từ trong câu/cụm từ theo khoảng trắng
    const words = rawWordStr.split(/\s+/);

    // Tính tổng số ký tự để scaling cỡ ô chữ
    let totalChars = 0;
    words.forEach(w => {
      totalChars += window.normalizeAnswerString(w).length;
    });

    let sizeClass = "";
    if (totalChars > 10) {
      sizeClass = "box-small";
    } else if (totalChars > 7) {
      sizeClass = "box-medium";
    }

    let globalNormIdx = 0;

    const groupsHtml = words.map(w => {
      const normChars = window.normalizeAnswerString(w).split("");
      const boxesHtml = normChars.map(char => {
        const charIdx = globalNormIdx++;
        const isRevealed = currentRound.revealedLetters[charIdx];
        return `<div class="kyna-letter-box ${sizeClass} ${isRevealed ? "revealed" : ""}">
          ${isRevealed ? char : "_"}
        </div>`;
      }).join("");

      return `<div class="kyna-word-group">${boxesHtml}</div>`;
    }).join("");

    container.innerHTML = groupsHtml;
  }

  /**
   * Cập nhật thời gian trên Overlay
   */
  function updateOverlayTimerUI() {
    const timerValEl = document.getElementById("kyna-timer-val");
    const fillEl = document.getElementById("kyna-progress-fill");
    if (!timerValEl || !fillEl) return;

    timerValEl.textContent = `${currentRound.timeLeft}s`;
    const total = gameState.settings.timerSeconds || 60;
    const pct = Math.max(0, (currentRound.timeLeft / total) * 100);
    fillEl.style.width = `${pct}%`;
  }

  /**
   * Mở ngẫu nhiên 1 chữ cái ẩn làm gợi ý
   */
  function revealRandomLetter() {
    const unrevealedIndices = [];
    currentRound.revealedLetters.forEach((rev, idx) => {
      if (!rev) unrevealedIndices.push(idx);
    });

    if (unrevealedIndices.length > 0) {
      const randIdx = unrevealedIndices[Math.floor(Math.random() * unrevealedIndices.length)];
      currentRound.revealedLetters[randIdx] = true;
      renderWordSlotsUI();
    }
  }

  /**
   * Xóa Overlay khỏi DOM
   */
  function removeOverlay() {
    stopCurrentRound();
    if (overlayEl && overlayEl.parentNode) {
      overlayEl.parentNode.removeChild(overlayEl);
      overlayEl = null;
    }
  }

  /**
   * Callback nhận tin nhắn chat BBB từ Core Module Observer
   */
  function onBBBMessageReceived(senderName, rawMessage, msgEl) {
    if (!senderName || !rawMessage) return;
    if (gameState.gameState !== "RUNNING" || currentRound.timeLeft <= 0 || currentRound.isSolved) return;

    // Bỏ qua nếu tin nhắn này đã xuất hiện trước khi lượt chơi bắt đầu
    if (msgEl && msgEl.dataset && msgEl.dataset.kynaOldMsg === "true") {
      return;
    }

    // Bỏ qua nếu tin nhắn này đã được chấm điểm trong lượt chơi hiện tại
    if (msgEl && msgEl.dataset && msgEl.dataset.kynaRound === currentRound.roundId) {
      return;
    }

    const normalizedGuess = window.normalizeAnswerString(rawMessage);
    const targetWord = currentRound.normalizedWord;

    if (!normalizedGuess || !targetWord) return;

    // Tách từ để hỗ trợ học sinh gõ "apple", "apple!", "it is apple", "apple."
    const tokens = rawMessage.toString().trim().toUpperCase().split(/[^A-Z0-9]+/);
    const isMatched = (normalizedGuess === targetWord) || tokens.includes(targetWord);

    if (isMatched) {
      if (currentRound.isSolved) return;
      currentRound.isSolved = true;

      if (msgEl && msgEl.dataset) {
        msgEl.dataset.kynaRound = currentRound.roundId;
      }
      if (currentRound.timerId) {
        clearInterval(currentRound.timerId);
      const points = gameState.settings.scoreFirst || 10;

      if (!gameState.scores[senderName]) {
        gameState.scores[senderName] = { correctCount: 0, totalScore: 0, words: [] };
      }
      gameState.scores[senderName].correctCount += 1;
      gameState.scores[senderName].totalScore += points;
      gameState.scores[senderName].words.push(currentRound.wordObj.word);

      currentRound.revealedLetters.fill(true);
      renderWordSlotsUI();

      const winnerBox = document.getElementById("kyna-winner-box");
      if (winnerBox) {
        winnerBox.innerHTML = `🎉 <strong>${escapeHtml(senderName)}</strong> guessed correctly! (+${points} pts)`;
        winnerBox.style.display = "block";
        winnerBox.style.background = "rgba(16, 185, 129, 0.25)";
        winnerBox.style.borderColor = "#10B981";
        winnerBox.style.color = "#34D399";
      }

      if (typeof window.playVictorySound === "function") {
        window.playVictorySound(gameState.settings.soundEnabled);
      }

      showToastNotification(
        "🎉 CONGRATULATIONS!",
        `<strong>${escapeHtml(senderName)}</strong> guessed the word <strong>${escapeHtml(currentRound.wordObj.word)}</strong>! (+${points} pts)`
      );

      saveStateToStorage();

      if (autoNextTimeoutId) clearTimeout(autoNextTimeoutId);

      autoNextTimeoutId = setTimeout(() => {
        autoNextTimeoutId = null;
        if (gameState.gameState === "RUNNING") {
          if (gameState.currentWordIndex + 1 < gameState.quizWords.length) {
            gameState.currentWordIndex++;
            saveStateToStorage();
            startNewRound();
          } else {
            showToastNotification("🏁 FINISHED!", "Completed all words in list!");
            showGuessWordSummaryModal();
          }
        }
      }, 3500);
    }
  }

  /**
   * Lưu trạng thái và phát sự kiện tới Popup
   */
  function saveStateToStorage() {
    chrome.storage.local.set({ kynaGameState: gameState }, () => {
      chrome.runtime.sendMessage({
        action: "GAME_STATE_UPDATED",
        payload: gameState
      }).catch(() => {});
    });
  }

  /**
   * Hiển thị Toast thông báo
   */
  function showToastNotification(title, htmlContent) {
    let container = document.getElementById("kyna-toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "kyna-toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "kyna-toast";
    toast.innerHTML = `
      <span>🏆</span>
      <div>
        <div style="font-size:12px; text-transform:uppercase; opacity:0.9;">${title}</div>
        <div>${htmlContent}</div>
      </div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = "kynaFadeOut 0.4s forwards";
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 400);
    }, 4000);
  }

  function escapeHtml(str) {
    return (str || "").replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }

  /**
   * Hiển thị Màn hình Tổng kết & Xếp hạng Podiums như Đua bơi
   */
  function showGuessWordSummaryModal() {
    stopCurrentRound();

    if (typeof window.stopBgmSound === "function") {
      window.stopBgmSound();
    }
    if (typeof window.playVictorySound === "function") {
      window.playVictorySound(gameState.settings.soundEnabled);
    }

    let summaryEl = document.getElementById("kyna-guess-summary-modal");
    if (!summaryEl) {
      summaryEl = document.createElement("div");
      summaryEl.id = "kyna-guess-summary-modal";
      summaryEl.className = "kyna-guess-summary-overlay";
      document.body.appendChild(summaryEl);
    }

    // Sắp xếp điểm số học sinh
    const sortedScores = Object.entries(gameState.scores || {})
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0) || (b.correctCount || 0) - (a.correctCount || 0));

    const totalWordsCount = gameState.quizWords ? gameState.quizWords.length : 0;
    const r1 = sortedScores[0] || null;
    const r2 = sortedScores[1] || null;
    const r3 = sortedScores[2] || null;

    const avatars = ["👨‍🎓", "👩‍🎓", "⭐", "🌟", "🏆", "🥇", "🥈", "🥉"];

    summaryEl.innerHTML = `
      <div class="kyna-summary-card">
        <div class="kyna-summary-header">
          <div class="kyna-summary-title">👑 GUESS THE WORD HALL OF FAME</div>
          <div class="kyna-summary-subtitle">Completed ${gameState.currentWordIndex + 1}/${totalWordsCount} words • Category: ${escapeHtml(gameState.category || "General")}</div>
        </div>

        ${sortedScores.length === 0 ? `
          <div class="kyna-empty-summary">
            📥 No student scores recorded in this game round yet!
          </div>
        ` : `
          <!-- BỤC TRAO GIẢI PODIUM 3D TOP 3 -->
          <div class="kyna-summary-podium-stage">
            <!-- TOP 2 -->
            ${r2 ? `
            <div class="kyna-podium-col col-rank-2">
              <div class="kyna-podium-student-badge">
                <span class="kyna-podium-avatar-icon">${avatars[1 % avatars.length]}</span>
                <span class="kyna-podium-student-name">${escapeHtml(r2.name)}</span>
                <span class="kyna-podium-score-tag"><b>${r2.correctCount || 0}</b> correct (${r2.totalScore || 0} pts)</span>
              </div>
              <div class="kyna-podium-pedestal pedestal-2">
                <span class="kyna-podium-medal-icon">🥈</span>
                <span class="kyna-podium-step-num">2</span>
              </div>
            </div>` : ""}

            <!-- TOP 1 (QUÁN QUÂN CAO NHẤT BÁN NGUYỆT) -->
            ${r1 ? `
            <div class="kyna-podium-col col-rank-1">
              <div class="kyna-podium-top1-crown">👑 CHAMPION</div>
              <div class="kyna-podium-student-badge is-gold-winner">
                <span class="kyna-podium-avatar-icon">${avatars[0]}</span>
                <span class="kyna-podium-student-name">${escapeHtml(r1.name)}</span>
                <span class="kyna-podium-score-tag"><b>${r1.correctCount || 0}</b> correct (${r1.totalScore || 0} pts)</span>
              </div>
              <div class="kyna-podium-pedestal pedestal-1">
                <span class="kyna-podium-medal-icon">🥇</span>
                <span class="kyna-podium-step-num">1</span>
              </div>
            </div>` : ""}

            <!-- TOP 3 -->
            ${r3 ? `
            <div class="kyna-podium-col col-rank-3">
              <div class="kyna-podium-student-badge">
                <span class="kyna-podium-avatar-icon">${avatars[2 % avatars.length]}</span>
                <span class="kyna-podium-student-name">${escapeHtml(r3.name)}</span>
                <span class="kyna-podium-score-tag"><b>${r3.correctCount || 0}</b> correct (${r3.totalScore || 0} pts)</span>
              </div>
              <div class="kyna-podium-pedestal pedestal-3">
                <span class="kyna-podium-medal-icon">🥉</span>
                <span class="kyna-podium-step-num">3</span>
              </div>
            </div>` : ""}
          </div>

          <!-- BẢNG CHI TIẾT TOÀN BỘ HỌC SINH -->
          <div class="kyna-summary-table-box">
            <table class="kyna-summary-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student Name</th>
                  <th>Correct Guesses</th>
                  <th>Total Score</th>
                </tr>
              </thead>
              <tbody>
                ${sortedScores.map((item, idx) => {
                  let badge = `<span class="kyna-rank-badge rank-other">${idx + 1}</span>`;
                  if (idx === 0) badge = `<span class="kyna-rank-badge rank-1">🥇 1</span>`;
                  if (idx === 1) badge = `<span class="kyna-rank-badge rank-2">🥈 2</span>`;
                  if (idx === 2) badge = `<span class="kyna-rank-badge rank-3">🥉 3</span>`;
                  return `
                    <tr>
                      <td>${badge}</td>
                      <td><strong>${escapeHtml(item.name)}</strong></td>
                      <td><span class="kyna-correct-count-pill">${item.correctCount || 0} correct</span></td>
                      <td><strong style="color: #34D399; font-size: 16px;">+${item.totalScore || 0} pts</strong></td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        `}

        <div class="kyna-summary-actions">
          <button class="kyna-summary-btn btn-restart" id="kyna-btn-summary-restart">🔄 Restart Quiz</button>
          <button class="kyna-summary-btn btn-close" id="kyna-btn-summary-close">✖ Close Summary</button>
        </div>
      </div>
    `;

    document.getElementById("kyna-btn-summary-restart").addEventListener("click", () => {
      summaryEl.remove();
      gameState.currentWordIndex = 0;
      gameState.scores = {};
      saveStateToStorage();
      startNewRound();
    });

    document.getElementById("kyna-btn-summary-close").addEventListener("click", () => {
      summaryEl.remove();
    });
  }
})();
})();

