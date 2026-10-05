/**
 * GAMES/GUESS-THE-WORD/GAME-LOGIC.JS - Logic vận hành Game Nhìn Hình Đoán Chữ trên BBB
 * Nhận trạng thái từ popup.js, hiển thị Overlay nổi, đếm ngược thời gian và chấm điểm tự động.
 */

(function () {
  if (typeof window !== "undefined" && window.kynaGuessTheWordLoaded) return;
  if (typeof window !== "undefined") window.kynaGuessTheWordLoaded = true;

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
    isFirstWinner: true
  };

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
   * Tải trạng thái ban đầu và lắng nghe sự thay đổi chrome.storage
   */
  function loadStateAndSync() {
    chrome.storage.local.get(["kynaGameState"], (res) => {
      if (res.kynaGameState) {
        updateLocalState(res.kynaGameState);
      }
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes.kynaGameState) {
        updateLocalState(changes.kynaGameState.newValue);
      }
    });
  }

  /**
   * Lắng nghe tin nhắn trực tiếp từ popup.js
   */
  function setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message) => {
      if (message.action === "SYNC_GAME_STATE") {
        if (message.tabId) window.kynaMyTabId = message.tabId;
        updateLocalState(message.payload);
      }
    });
  }

  /**
   * Cập nhật trạng thái cục bộ & Quản lý vòng đời Overlay
   */
  function updateLocalState(newState) {
    if (!newState) return;

    if (newState.targetTabId && window.kynaMyTabId && newState.targetTabId !== window.kynaMyTabId) {
      stopCurrentRound();
      removeOverlay();
      return;
    }

    const oldGameState = gameState.gameState;
    const oldWordIndex = gameState.currentWordIndex;

    gameState = { ...gameState, ...newState };

    if (gameState.gameState === "RUNNING") {
      if (oldGameState !== "RUNNING" || oldWordIndex !== gameState.currentWordIndex || !overlayEl) {
        startNewRound();
      }
    } else {
      stopCurrentRound();
      removeOverlay();
    }
  }

  /**
   * Bắt đầu một vòng chơi từ mới
   */
  async function startNewRound() {
    clearInterval(currentRound.timerId);

    if (!gameState.quizWords || gameState.quizWords.length === 0) {
      if (typeof window.getWordsByCategory === "function") {
        gameState.quizWords = window.getWordsByCategory("Animals");
      }
    }

    const currentWordObj = (gameState.quizWords && gameState.quizWords[gameState.currentWordIndex]) || (window.MASTER_WORD_DATABASE && window.MASTER_WORD_DATABASE[0]);
    if (!currentWordObj) {
      removeOverlay();
      return;
    }

    const normWord = window.normalizeAnswerString(currentWordObj.word);

    currentRound = {
      roundId: "R_" + Date.now() + "_" + Math.floor(Math.random() * 10000),
      wordObj: currentWordObj,
      normalizedWord: normWord,
      guessedStudentsSet: new Set(),
      revealedLetters: new Array(normWord.length).fill(false),
      timerId: null,
      timeLeft: gameState.settings.timerSeconds || 60,
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
        onRoundTimeOut();
      }
    }, 1000);
  }

  /**
   * Khi hết thời gian đếm ngược
   */
  function onRoundTimeOut() {
    currentRound.revealedLetters.fill(true);
    renderWordSlotsUI();
    showToastNotification("⏰ Hết giờ!", `Đáp án đúng là: ${currentRound.wordObj.word}`);
  }

  /**
   * Tạo hoặc cập nhật Khung Overlay nổi
   */
  function createOrUpdateOverlay() {
    if (!overlayEl) {
      overlayEl = document.createElement("div");
      overlayEl.id = "kyna-game-overlay";
      overlayEl.innerHTML = `
        <div class="kyna-overlay-header" id="kyna-header-drag">
          <div class="kyna-header-title">
            <span>🎨 Guess The Word</span>
            <span style="font-size:12px; opacity:0.8;" id="kyna-overlay-category">(${currentRound.wordObj.category})</span>
          </div>
          <div class="kyna-header-actions">
            <button class="kyna-icon-btn" id="kyna-btn-toggle-min" title="Thu nhỏ/Mở rộng">➖</button>
          </div>
        </div>

        <div class="kyna-overlay-body">
          <div class="kyna-image-frame">
            <div class="kyna-image-loading" id="kyna-img-loader" style="display: none;">⏳ Đang tải ảnh vẽ tay...</div>
            <img id="kyna-doodle-img" src="" alt="Doodle sketch" style="opacity: 1;">
          </div>

          <div class="kyna-word-slots" id="kyna-slots-container"></div>

          <div class="kyna-hint-box">
            💡 Gợi ý: <span id="kyna-hint-text">${currentRound.wordObj.hint}</span>
          </div>

          <div class="kyna-timer-container">
            <span class="kyna-timer-text" id="kyna-timer-val">${currentRound.timeLeft}s</span>
            <div class="kyna-progress-bar-bg">
              <div class="kyna-progress-bar-fill" id="kyna-progress-fill"></div>
            </div>
          </div>

          <div class="kyna-winner-box hidden" id="kyna-winner-box" style="margin-top: 10px; padding: 10px; background: rgba(16, 185, 129, 0.2); border: 1px solid #10B981; border-radius: 8px; text-align: center; color: #10B981; font-weight: bold; font-size: 16px;"></div>

          <div class="kyna-controls-row">
            <button class="kyna-action-btn kyna-btn-hint" id="kyna-action-hint">💡 Mở 1 chữ cái</button>
            <button class="kyna-action-btn kyna-btn-next" id="kyna-action-next">⏭️ Từ tiếp theo</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlayEl);

      if (typeof window.makeElementDraggable === "function") {
        window.makeElementDraggable(overlayEl, document.getElementById("kyna-header-drag"));
      }

      document.getElementById("kyna-btn-toggle-min").addEventListener("click", () => {
        overlayEl.classList.toggle("minimized");
      });

      document.getElementById("kyna-action-hint").addEventListener("click", () => {
        revealRandomLetter();
      });

      document.getElementById("kyna-action-next").addEventListener("click", () => {
        if (gameState.currentWordIndex + 1 < gameState.quizWords.length) {
          gameState.currentWordIndex++;
          saveStateToStorage();
          startNewRound();
        } else {
          showToastNotification("🏁 Hoàn thành!", "Đã hết danh sách từ vựng!");
        }
      });
    }

    document.getElementById("kyna-overlay-category").textContent = `(${currentRound.wordObj.category})`;
    document.getElementById("kyna-hint-text").textContent = currentRound.wordObj.hint;
    
    const winnerBox = document.getElementById("kyna-winner-box");
    if (winnerBox) {
      winnerBox.innerHTML = "";
      winnerBox.style.display = "none";
    }

    renderWordSlotsUI();
    updateOverlayTimerUI();
    loadDoodleImageAsync(currentRound.wordObj);
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
   * Render các ô chữ ẩn
   */
  function renderWordSlotsUI() {
    const container = document.getElementById("kyna-slots-container");
    if (!container) return;

    const norm = currentRound.normalizedWord;
    container.innerHTML = norm.split("").map((char, i) => {
      const isRevealed = currentRound.revealedLetters[i];
      return `
        <div class="kyna-letter-box ${isRevealed ? "revealed" : ""}">
          ${isRevealed ? char : "_"}
        </div>`;
    }).join("");
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
      currentRound.isSolved = true;
      if (msgEl && msgEl.dataset) {
        msgEl.dataset.kynaRound = currentRound.roundId;
      }
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
        winnerBox.innerHTML = `🎉 <strong>${escapeHtml(senderName)}</strong> đã đoán đúng!`;
        winnerBox.style.display = "block";
      }

      if (typeof window.playVictorySound === "function") {
        window.playVictorySound(gameState.settings.soundEnabled);
      }

      showToastNotification(
        "🎉 CHÚC MỪNG!",
        `<strong>${escapeHtml(senderName)}</strong> đã đoán đúng từ <strong>${currentRound.wordObj.word}</strong>! (+${points} điểm)`
      );

      saveStateToStorage();

      setTimeout(() => {
        if (gameState.gameState === "RUNNING") {
          if (gameState.currentWordIndex + 1 < gameState.quizWords.length) {
            gameState.currentWordIndex++;
            saveStateToStorage();
            startNewRound();
          } else {
            showToastNotification("🏁 HOÀN THÀNH!", "Đã hết toàn bộ danh sách từ vựng!");
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
})();
