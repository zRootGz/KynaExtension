/**
 * POPUP.JS - Logic điều khiển Bảng điều khiển dành riêng cho Giáo viên Kyna English
 * Quản lý 50+ từ vựng, cài đặt game, xuất file Excel CSV và đồng bộ real-time với trang BBB.
 */

document.addEventListener("DOMContentLoaded", async () => {
  // Trạng thái cục bộ của Popup
  let state = {
    category: "Animals",
    quizWords: [],
    gameState: "IDLE", // "IDLE" | "RUNNING"
    currentWordIndex: 0,
    scores: {}, // { studentName: { correctCount: 0, totalScore: 0, words: [] } }
    settings: {
      timerSeconds: 60,
      scoreFirst: 10,
      scoreNext: 5,
      soundEnabled: true
    }
  };

  // Ánh xạ các phần tử DOM
  const elements = {
    // Nav Tabs
    tabBtns: document.querySelectorAll(".tab-btn"),
    tabPanels: document.querySelectorAll(".tab-panel"),
    
    // Header Status
    statusBadge: document.getElementById("game-status-badge"),
    statusText: document.getElementById("status-text"),
    tabScoreCount: document.getElementById("tab-score-count"),

    // Action Controls
    btnStartGame: document.getElementById("btn-start-game"),
    btnNextWord: document.getElementById("btn-next-word"),
    btnStopGame: document.getElementById("btn-stop-game"),
    activeWordDisplay: document.getElementById("active-word-display"),
    currentWordText: document.getElementById("current-word-text"),
    currentTimerText: document.getElementById("current-timer-text"),

    // Topic Selection & Word List
    selectCategory: document.getElementById("select-category"),
    btnLoadTopic: document.getElementById("btn-load-topic"),
    topicWordCount: document.getElementById("topic-word-count"),
    quizWordList: document.getElementById("quiz-word-list"),
    quizListCount: document.getElementById("quiz-list-count"),
    btnShuffleQuizList: document.getElementById("btn-shuffle-quiz-list"),
    btnClearQuizList: document.getElementById("btn-clear-quiz-list"),

    // Search & Add Word Tool
    inputSearchWord: document.getElementById("input-search-word"),
    searchResultsList: document.getElementById("search-results-list"),
    btnToggleCustom: document.getElementById("btn-toggle-custom"),
    customWordForm: document.getElementById("custom-word-form"),
    customWordInput: document.getElementById("custom-word-input"),
    customHintInput: document.getElementById("custom-hint-input"),
    customQueryInput: document.getElementById("custom-query-input"),
    btnSaveCustom: document.getElementById("btn-save-custom"),

    // Leaderboard & Export CSV
    scoresTableBody: document.getElementById("scores-table-body"),
    btnExportCsv: document.getElementById("btn-export-csv"),
    btnResetScores: document.getElementById("btn-reset-scores"),

    // Settings
    settingTimer: document.getElementById("setting-timer"),
    settingScoreFirst: document.getElementById("setting-score-first"),
    settingSound: document.getElementById("setting-sound"),
    btnSaveSettings: document.getElementById("btn-save-settings"),

    // Swimming Race Controls
    btnToggleSwimOverlay: document.getElementById("btn-toggle-swim-overlay"),
    btnStartSwimRace: document.getElementById("btn-start-swim-race"),
    btnStopSwimRace: document.getElementById("btn-stop-swim-race"),
    selectSwimMode: document.getElementById("select-swim-mode"),
    inputSwimStudents: document.getElementById("input-swim-students"),
    swimStudentCount: document.getElementById("swim-student-count"),
    btnFetchBbbStudents: document.getElementById("btn-fetch-bbb-students"),
    btnLoadSampleStudents: document.getElementById("btn-load-sample-students"),
    btnSaveSwimStudents: document.getElementById("btn-save-swim-students")
  };

  // Trạng thái cục bộ của Game Đua Bơi
  let swimState = {
    activeGame: "NONE",
    gameState: "IDLE",
    raceMode: "BBB_CHAT",
    students: ["Bảo Nam", "Hoàng Minh", "Tuệ Nhi", "Gia Bảo", "Khánh An"],
    startedStudents: [],
    positions: {},
    rankings: []
  };

  // Khởi tạo tải state từ storage
  await loadStateFromStorage();

  // Đăng ký các sự kiện tương tác
  initTabNavigation();
  initTopicAndSearchEvents();
  initControlEvents();
  initSwimmingRaceEvents();
  initScoreboardAndExportEvents();
  initSettingsEvents();

  // Lắng nghe sự thay đổi Message từ Content Script
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "GAME_STATE_UPDATED") {
      updateStateFromPayload(message.payload);
    } else if (message.action === "SWIM_RACE_STATE_UPDATED") {
      updateSwimStateFromPayload(message.payload);
    }
  });

  /**
   * Tải trạng thái lưu trữ từ chrome.storage.local
   */
  async function loadStateFromStorage() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["kynaGameState", "kynaSwimRaceState"], (res) => {
        if (res.kynaGameState) {
          state = { ...state, ...res.kynaGameState };
        } else {
          // Lần đầu mở extension: nạp chủ đề Động vật (Animals) có sẵn
          state.quizWords = window.getWordsByCategory("Animals");
          saveStateToStorage();
        }

        if (res.kynaSwimRaceState) {
          swimState = { ...swimState, ...res.kynaSwimRaceState };
        } else {
          saveSwimStateToStorage();
        }

        renderUI();
        resolve();
      });
    });
  }

  function ensureContentScriptInjected(tabId, callback) {
    if (!chrome.scripting) {
      if (typeof callback === "function") callback();
      return;
    }
    chrome.scripting.executeScript({
      target: { tabId: tabId, allFrames: true },
      files: [
        "core/bbb-chat-observer.js",
        "core/audio-synthesizer.js",
        "games/guess-the-word/words.js",
        "games/guess-the-word/game-logic.js",
        "games/swimming-race/race-logic.js"
      ]
    }).then(() => {
      chrome.scripting.insertCSS({
        target: { tabId: tabId, allFrames: true },
        files: [
          "games/guess-the-word/game-style.css",
          "games/swimming-race/race-style.css"
        ]
      }).catch(() => {});
      if (typeof callback === "function") callback();
    }).catch(() => {
      if (typeof callback === "function") callback();
    });
  }

  /**
   * Lưu trạng thái vào chrome.storage.local & gửi tin nhắn trực tiếp CHỈ CHO TAB ĐANG MỞ
   */
  function saveStateToStorage() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs && tabs[0];
      if (activeTab && activeTab.id) {
        state.targetTabId = activeTab.id;
      }
      chrome.storage.local.set({ kynaGameState: state }, () => {
        if (activeTab && activeTab.id) {
          ensureContentScriptInjected(activeTab.id, () => {
            chrome.tabs.sendMessage(activeTab.id, {
              action: "SYNC_GAME_STATE",
              tabId: activeTab.id,
              payload: state
            }, () => {
              const err = chrome.runtime.lastError; // Bỏ qua thông báo thừa khi tab không lắng nghe
            });
          });
        }
      });
    });
  }

  /**
   * Cập nhật toàn bộ giao diện Popup
   */
  function renderUI() {
    // 1. Trạng thái Game Badge
    if (state.gameState === "RUNNING") {
      elements.statusBadge.className = "status-badge status-running";
      elements.statusText.textContent = "Đang diễn ra (Đoán chữ)";
      elements.btnStartGame.disabled = true;
      elements.btnNextWord.disabled = false;
      elements.btnStopGame.disabled = false;
      elements.activeWordDisplay.classList.remove("hidden");
      
      const currentWordObj = state.quizWords[state.currentWordIndex];
      elements.currentWordText.textContent = currentWordObj ? currentWordObj.word : "N/A";
    } else if (swimState.gameState === "RACING" && swimState.activeGame === "SWIMMING_RACE") {
      elements.statusBadge.className = "status-badge status-running";
      elements.statusText.textContent = "Đang diễn ra (Đua bơi)";
      elements.btnStartGame.disabled = state.quizWords.length === 0;
      elements.btnNextWord.disabled = true;
      elements.btnStopGame.disabled = true;
      elements.activeWordDisplay.classList.add("hidden");
    } else {
      elements.statusBadge.className = "status-badge status-idle";
      elements.statusText.textContent = "Chưa bắt đầu";
      elements.btnStartGame.disabled = state.quizWords.length === 0;
      elements.btnNextWord.disabled = true;
      elements.btnStopGame.disabled = true;
      elements.activeWordDisplay.classList.add("hidden");
    }

    // 2. Trạng thái Đua bơi
    if (elements.inputSwimStudents && document.activeElement !== elements.inputSwimStudents) {
      elements.inputSwimStudents.value = (swimState.students || []).join(", ");
    }
    if (elements.swimStudentCount) {
      elements.swimStudentCount.textContent = (swimState.students || []).length;
    }
    if (elements.selectSwimMode) {
      elements.selectSwimMode.value = swimState.raceMode || "BBB_CHAT";
    }

    if (elements.btnToggleSwimOverlay) {
      if (swimState.activeGame === "SWIMMING_RACE") {
        elements.btnToggleSwimOverlay.innerHTML = `<span class="icon">🎮</span> Tắt Overlay Phòng Chờ`;
        elements.btnToggleSwimOverlay.className = "btn btn-secondary btn-lg";
      } else {
        elements.btnToggleSwimOverlay.innerHTML = `<span class="icon">🎮</span> Bật Overlay Phòng Chờ`;
        elements.btnToggleSwimOverlay.className = "btn btn-primary btn-lg";
      }
    }

    if (swimState.gameState === "RACING" && swimState.activeGame === "SWIMMING_RACE") {
      elements.btnStartSwimRace.disabled = true;
      elements.btnStopSwimRace.disabled = false;
    } else {
      elements.btnStartSwimRace.disabled = false;
      elements.btnStopSwimRace.disabled = swimState.activeGame === "NONE";
    }

    // 2. Số lượng từ & Danh sách từ vựng Quiz
    elements.quizListCount.textContent = state.quizWords.length;
    renderQuizWordList();

    // 3. Render Bảng điểm
    renderScoreboard();

    // 4. Các trường Cài đặt
    elements.settingTimer.value = state.settings.timerSeconds || 60;
    elements.settingScoreFirst.value = state.settings.scoreFirst || 10;
    elements.settingSound.checked = state.settings.soundEnabled !== false;
  }

  /**
   * Chuyển tab giao diện
   */
  function initTabNavigation() {
    elements.tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const tabId = btn.getAttribute("data-tab");
        elements.tabBtns.forEach(b => b.classList.remove("active"));
        elements.tabPanels.forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(tabId).classList.add("active");

        if (tabId === "tab-swimming") {
          if (swimState.activeGame === "NONE") {
            swimState.activeGame = "SWIMMING_RACE";
            swimState.gameState = "IDLE";
            saveSwimStateToStorage();
          }
        }
      });
    });
  }

  /**
   * Đăng ký sự kiện chọn chủ đề & tìm kiếm
   */
  function initTopicAndSearchEvents() {
    // Thay đổi chủ đề trên dropdown
    elements.selectCategory.addEventListener("change", (e) => {
      const cat = e.target.value;
      const words = window.getWordsByCategory(cat);
      elements.topicWordCount.textContent = `${words.length} từ`;
    });

    // Nút "Tải bộ từ này"
    elements.btnLoadTopic.addEventListener("click", () => {
      const cat = elements.selectCategory.value;
      state.quizWords = window.getWordsByCategory(cat);
      state.currentWordIndex = 0;
      saveStateToStorage();
      renderUI();
    });

    // Tìm kiếm ô Input
    elements.inputSearchWord.addEventListener("input", (e) => {
      const keyword = e.target.value.trim();
      if (!keyword) {
        elements.searchResultsList.classList.add("hidden");
        return;
      }
      const results = window.searchWordsInDatabase(keyword);
      renderSearchResults(results);
    });

    // Toggle Form tạo từ custom
    elements.btnToggleCustom.addEventListener("click", () => {
      elements.customWordForm.classList.toggle("hidden");
    });

    // Nút Lưu từ tùy chỉnh do Giáo viên tự thêm
    elements.btnSaveCustom.addEventListener("click", () => {
      const word = elements.customWordInput.value.trim().toUpperCase();
      const hint = elements.customHintInput.value.trim();
      const query = elements.customQueryInput.value.trim() || `${word.toLowerCase()} doodle sketch`;

      if (!word || !hint) {
        alert("Vui lòng nhập Từ Tiếng Anh và Gợi ý!");
        return;
      }

      // Tạo object từ tùy chỉnh kèm ảnh vẽ tay fallback SVG
      const newWordObj = { 
        word, 
        hint, 
        category: "Custom", 
        query,
        imageUrl: window.generateFallbackDoodleSvg(word, hint)
      };

      state.quizWords.push(newWordObj);
      saveStateToStorage();
      renderUI();

      // Reset form
      elements.customWordInput.value = "";
      elements.customHintInput.value = "";
      elements.customQueryInput.value = "";
      elements.customWordForm.classList.add("hidden");
    });

    // Nút Trộn thứ tự từ vựng trong danh sách
    elements.btnShuffleQuizList.addEventListener("click", () => {
      if (state.quizWords.length <= 1) {
        alert("Cần có ít nhất 2 từ vựng để thực hiện trộn thứ tự!");
        return;
      }
      // Thuật toán xáo trộn Fisher-Yates
      for (let i = state.quizWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [state.quizWords[i], state.quizWords[j]] = [state.quizWords[j], state.quizWords[i]];
      }
      state.currentWordIndex = 0;
      saveStateToStorage();
      renderUI();
    });

    // Nút Xóa toàn bộ từ trong danh sách
    elements.btnClearQuizList.addEventListener("click", () => {
      if (confirm("Bạn có chắc muốn xóa hết danh sách từ hiện tại?")) {
        state.quizWords = [];
        state.currentWordIndex = 0;
        saveStateToStorage();
        renderUI();
      }
    });
  }

  /**
   * Hiển thị danh sách gợi ý khi giáo viên tìm kiếm từ
   */
  function renderSearchResults(results) {
    if (results.length === 0) {
      elements.searchResultsList.innerHTML = `<div class="empty-state">Không tìm thấy từ trong kho mẫu. Bạn có thể bấm "+ Tạo từ mới" ở trên.</div>`;
    } else {
      elements.searchResultsList.innerHTML = results.slice(0, 5).map(item => `
        <div class="result-item">
          <div>
            <span class="result-word">${item.word}</span>
            <span class="result-hint"> (${item.hint})</span>
          </div>
          <button class="btn btn-sm btn-outline btn-add-search-word" data-word="${item.word}">+ Thêm</button>
        </div>
      `).join("");

      // Nút Thêm từng từ tìm được
      document.querySelectorAll(".btn-add-search-word").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const targetWord = e.target.getAttribute("data-word");
          const found = window.MASTER_WORD_DATABASE.find(w => w.word === targetWord);
          if (found) {
            if (!state.quizWords.some(w => w.word === found.word)) {
              state.quizWords.push(found);
              saveStateToStorage();
              renderUI();
            }
          }
        });
      });
    }
    elements.searchResultsList.classList.remove("hidden");
  }

  /**
   * Render danh sách các từ trong lượt đố
   */
  function renderQuizWordList() {
    if (state.quizWords.length === 0) {
      elements.quizWordList.innerHTML = `<div class="empty-state">Chưa có từ nào. Hãy chọn chủ đề hoặc tìm kiếm thêm từ!</div>`;
      return;
    }

    elements.quizWordList.innerHTML = state.quizWords.map((item, idx) => `
      <div class="word-chip ${idx === state.currentWordIndex && state.gameState === "RUNNING" ? "active-chip" : ""}">
        <div>
          <span class="chip-title">${idx + 1}. ${item.word}</span>
          <span class="chip-hint">- Gợi ý: ${item.hint}</span>
        </div>
        <button class="btn btn-ghost btn-sm btn-remove-word" data-index="${idx}">❌</button>
      </div>
    `).join("");

    // Sự kiện nút Xóa từng từ
    document.querySelectorAll(".btn-remove-word").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.getAttribute("data-index"), 10);
        state.quizWords.splice(idx, 1);
        if (state.currentWordIndex >= state.quizWords.length) {
          state.currentWordIndex = Math.max(0, state.quizWords.length - 1);
        }
        saveStateToStorage();
        renderUI();
      });
    });
  }

  /**
   * Đăng ký nút Bắt đầu, Từ tiếp theo, Dừng Game
   */
  function initControlEvents() {
    // Bắt đầu Game
    elements.btnStartGame.addEventListener("click", () => {
      if (state.quizWords.length === 0) {
        alert("Vui lòng thêm ít nhất 1 từ vựng trước khi bắt đầu!");
        return;
      }
      state.gameState = "RUNNING";
      state.currentWordIndex = 0;
      saveStateToStorage();
      renderUI();
    });

    // Từ tiếp theo
    elements.btnNextWord.addEventListener("click", () => {
      if (state.currentWordIndex + 1 < state.quizWords.length) {
        state.currentWordIndex++;
        saveStateToStorage();
        renderUI();
      } else {
        alert("Đã đến từ cuối cùng trong danh sách!");
      }
    });

    // Dừng Game
    elements.btnStopGame.addEventListener("click", () => {
      if (confirm("Bạn có chắc muốn dừng game hiện tại?")) {
        state.gameState = "IDLE";
        saveStateToStorage();
        renderUI();
      }
    });
  }

  /**
   * Đăng ký nút Bảng Điểm & Xuất file CSV / Reset
   */
  function initScoreboardAndExportEvents() {
    // Xuất file Excel CSV
    elements.btnExportCsv.addEventListener("click", exportScoresToCSV);

    // Reset Điểm
    elements.btnResetScores.addEventListener("click", () => {
      if (confirm("Bạn có chắc chắn muốn xóa toàn bộ điểm số học sinh?")) {
        state.scores = {};
        saveStateToStorage();
        renderUI();
      }
    });
  }

  /**
   * Render Bảng xếp hạng học sinh
   */
  function renderScoreboard() {
    const scoreEntries = Object.entries(state.scores || {})
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalScore - a.totalScore);

    elements.tabScoreCount.textContent = scoreEntries.length;

    if (scoreEntries.length === 0) {
      elements.scoresTableBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-muted">Chưa có học sinh nào ghi điểm.</td>
        </tr>`;
      return;
    }

    elements.scoresTableBody.innerHTML = scoreEntries.map((item, idx) => {
      let rankBadge = `<span class="rank-pill rank-other">${idx + 1}</span>`;
      if (idx === 0) rankBadge = `<span class="rank-pill rank-1">1</span>`;
      if (idx === 1) rankBadge = `<span class="rank-pill rank-2">2</span>`;
      if (idx === 2) rankBadge = `<span class="rank-pill rank-3">3</span>`;

      return `
        <tr>
          <td>${rankBadge}</td>
          <td><strong>${escapeHtml(item.name)}</strong></td>
          <td>${item.correctCount || 0} câu</td>
          <td><strong style="color:#34d399;">+${item.totalScore || 0}</strong></td>
        </tr>`;
    }).join("");
  }

  /**
   * Xuất danh sách điểm ra file CSV UTF-8 BOM mở đẹp trên Excel
   */
  function exportScoresToCSV() {
    const scoreEntries = Object.entries(state.scores || {})
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalScore - a.totalScore);

    if (scoreEntries.length === 0) {
      alert("Chưa có dữ liệu điểm số học sinh để xuất file!");
      return;
    }

    // Định dạng CSVUTF-8 BOM
    let csvContent = "\uFEFFHọ và Tên Học Sinh,Số Câu Đúng,Tổng Điểm,Danh Sách Từ Đúng\n";

    scoreEntries.forEach((item) => {
      const name = `"${item.name.replace(/"/g, '""')}"`;
      const correctCount = item.correctCount || 0;
      const totalScore = item.totalScore || 0;
      const words = `"${(item.words || []).join("; ").replace(/"/g, '""')}"`;

      csvContent += `${name},${correctCount},${totalScore},${words}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().slice(0, 10);
    link.setAttribute("href", url);
    link.setAttribute("download", `Diem_Game_BBB_Kyna_${timestamp}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Lưu Cài đặt Game
   */
  function initSettingsEvents() {
    elements.btnSaveSettings.addEventListener("click", () => {
      state.settings = {
        timerSeconds: parseInt(elements.settingTimer.value, 10) || 60,
        scoreFirst: parseInt(elements.settingScoreFirst.value, 10) || 10,
        soundEnabled: elements.settingSound.checked
      };
      saveStateToStorage();
      alert("Đã lưu cài đặt thành công!");
    });
  }

  function updateStateFromPayload(payload) {
    if (!payload) return;
    state = { ...state, ...payload };
    renderUI();
  }

  /**
   * Đăng ký các sự kiện tương tác cho Game Đua Bơi
   */
  function initSwimmingRaceEvents() {
    // Bật / Tắt Overlay Phòng Chờ Đua Bơi
    if (elements.btnToggleSwimOverlay) {
      elements.btnToggleSwimOverlay.addEventListener("click", () => {
        if (swimState.activeGame === "SWIMMING_RACE") {
          swimState.activeGame = "NONE";
          swimState.gameState = "IDLE";
        } else {
          swimState.activeGame = "SWIMMING_RACE";
          swimState.gameState = "IDLE";
        }
        saveSwimStateToStorage();
        renderUI();
      });
    }

    // Tự động lấy danh sách học sinh từ giao diện lớp học BBB
    if (elements.btnFetchBbbStudents) {
      elements.btnFetchBbbStudents.addEventListener("click", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTab = tabs && tabs[0];
          if (!activeTab || !activeTab.id) {
            alert("Không tìm thấy tab lớp học BBB đang hoạt động!");
            return;
          }
          ensureContentScriptInjected(activeTab.id, () => {
            chrome.tabs.sendMessage(activeTab.id, { action: "FETCH_BBB_STUDENTS" }, (res) => {
              if (chrome.runtime.lastError || !res || !res.students || res.students.length === 0) {
                alert("Chưa quét thấy tên học sinh trong danh sách thành viên BBB. Hãy kiểm tra xem cột 'Thành viên' đã được mở chưa!");
                return;
              }
              const fetchedList = res.students.join(", ");
              elements.inputSwimStudents.value = fetchedList;
              updateSwimStudentsList(fetchedList);
              alert(`🎉 Đã tự động quét thành công ${res.students.length} học sinh từ lớp BBB!`);
            });
          });
        });
      });
    }

    // Nhập mẫu danh sách học sinh bơi
    elements.btnLoadSampleStudents.addEventListener("click", () => {
      const sampleText = "Bảo Nam, Hoàng Minh, Tuệ Nhi, Gia Bảo, Khánh An, Linh Chi";
      elements.inputSwimStudents.value = sampleText;
      updateSwimStudentsList(sampleText);
    });

    // Lưu danh sách vận động viên bơi
    elements.btnSaveSwimStudents.addEventListener("click", () => {
      updateSwimStudentsList(elements.inputSwimStudents.value);
      alert("Đã cập nhật danh sách vận động viên đua bơi!");
    });

    // Bắt đầu Đua Bơi
    elements.btnStartSwimRace.addEventListener("click", () => {
      if (!swimState.students || swimState.students.length < 1) {
        alert("Cần ít nhất 1 học sinh để bắt đầu cuộc đua bơi!");
        return;
      }

      // Tắt game Guess The Word nếu đang chạy
      if (state.gameState === "RUNNING") {
        state.gameState = "IDLE";
        saveStateToStorage();
      }

      swimState.activeGame = "SWIMMING_RACE";
      swimState.gameState = "RACING";
      swimState.raceMode = elements.selectSwimMode.value || "BBB_CHAT";
      swimState.positions = {};
      swimState.rankings = [];
      swimState.startedStudents = swimState.students ? [...swimState.students] : [];
      swimState.students.forEach(name => swimState.positions[name] = 0);

      saveSwimStateToStorage();
      renderUI();
    });

    // Dừng Đua Bơi
    elements.btnStopSwimRace.addEventListener("click", () => {
      if (confirm("Bạn có chắc muốn dừng cuộc đua bơi?")) {
        swimState.gameState = "IDLE";
        swimState.activeGame = "NONE";
        saveSwimStateToStorage();
        renderUI();
      }
    });

    elements.selectSwimMode.addEventListener("change", (e) => {
      swimState.raceMode = e.target.value;
      saveSwimStateToStorage();
    });
  }

  function updateSwimStudentsList(text) {
    const list = (text || "")
      .split(",")
      .map(s => s.trim())
      .filter(s => s.length > 0);

    if (list.length > 0) {
      swimState.students = list;
      elements.swimStudentCount.textContent = list.length;
      saveSwimStateToStorage();
    }
  }

  function saveSwimStateToStorage() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs && tabs[0];
      if (activeTab && activeTab.id) {
        swimState.targetTabId = activeTab.id;
      }
      chrome.storage.local.set({ kynaSwimRaceState: swimState }, () => {
        if (activeTab && activeTab.id) {
          ensureContentScriptInjected(activeTab.id, () => {
            chrome.tabs.sendMessage(activeTab.id, {
              action: "SYNC_SWIM_RACE_STATE",
              tabId: activeTab.id,
              payload: swimState
            }, () => {
              const err = chrome.runtime.lastError; // Bỏ qua thông báo thừa
            });
          });
        }
      });
    });
  }

  function updateSwimStateFromPayload(payload) {
    if (!payload) return;
    swimState = { ...swimState, ...payload };
    renderUI();
  }

  function escapeHtml(str) {
    return (str || "").replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }
});
