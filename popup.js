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
    scores: {}, // Điểm lượt chơi hiện tại (reset khi start game)
    highScores: {}, // Điểm all-time (tích lũy mãi mãi)
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

    // Excel Bulk Import & Export
    btnToggleImportExcel: document.getElementById("btn-toggle-import-excel"),
    importExcelForm: document.getElementById("import-excel-form"),
    btnDownloadExcelTemplate: document.getElementById("btn-download-excel-template"),
    inputImportExcelFile: document.getElementById("input-import-excel-file"),
    importExcelStatus: document.getElementById("import-excel-status"),
    btnExportQuizExcel: document.getElementById("btn-export-quiz-excel"),

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
    selectSwimDuration: document.getElementById("select-swim-duration"),
    selectSwimDistance: document.getElementById("select-swim-distance"),
    selectSwimWordCategory: document.getElementById("select-swim-word-category"),
    swimAutoDistanceGroup: document.getElementById("swim-auto-distance-group"),
    swimAutoTimerGroup: document.getElementById("swim-auto-timer-group"),
    swimWordCatGroup: document.getElementById("swim-word-cat-group"),
    inputSwimStudents: document.getElementById("input-swim-students"),
    swimStudentCount: document.getElementById("swim-student-count"),
    btnClearSwimStudents: document.getElementById("btn-clear-swim-students"),
    btnFetchBbbStudents: document.getElementById("btn-fetch-bbb-students"),
    btnLoadSampleStudents: document.getElementById("btn-load-sample-students"),
    btnSaveSwimStudents: document.getElementById("btn-save-swim-students")
  };

  // Trạng thái cục bộ của Game Đua Bơi
  let swimState = {
    activeGame: "NONE",
    gameState: "IDLE",
    raceMode: "WORD_RELAY",
    raceDurationSeconds: 90,
    raceDistanceMeters: 500,
    wordCategory: "ALL",
    students: [],
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
      chrome.storage.local.get(["kynaGameState", "kynaSwimRaceState", "kynaHighScores"], (res) => {
        if (res.kynaGameState) {
          state = { ...state, ...res.kynaGameState };
        } else {
          // Lần đầu mở extension: nạp chủ đề Động vật (Animals) có sẵn
          state.quizWords = window.getWordsByCategory("Animals");
          saveStateToStorage();
        }
        // Load all-time high scores from separate storage key
        if (res.kynaHighScores) {
          state.highScores = res.kynaHighScores;
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
      }).catch(() => { });
      if (typeof callback === "function") callback();
    }).catch(() => {
      if (typeof callback === "function") callback();
    });
  }

  /**
   * Save state to storage and send message ONLY to the active tab in the focused window.
   */
  function saveStateToStorage() {
    if (typeof chrome !== "undefined" && chrome.tabs) {
      // Use lastFocusedWindow:true so we only get the ONE active tab the teacher is looking at
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        const activeTab = tabs && tabs[0];
        const tabId = activeTab ? activeTab.id : null;

        // Embed the tabId into state so content scripts can filter
        const stateWithTab = { ...state, activeTabId: tabId };

        try {
          localStorage.setItem("kynaGameState", JSON.stringify(stateWithTab));
        } catch (e) {}

        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ kynaGameState: stateWithTab });
        }

        if (tabId) {
          ensureContentScriptInjected(tabId, () => {
            chrome.tabs.sendMessage(tabId, {
              action: "SYNC_GAME_STATE",
              tabId: tabId,
              payload: stateWithTab
            }, () => { chrome.runtime.lastError; });
          });
        }
      });
    } else {
      // Fallback (non-extension context)
      try { localStorage.setItem("kynaGameState", JSON.stringify(state)); } catch (e) {}
    }
  }

  /**
   * Cập nhật toàn bộ giao diện Popup
   */
  function renderUI() {
    // 1. Trạng thái Game Badge
    if (state.gameState === "RUNNING") {
      elements.statusBadge.className = "status-badge status-running";
      elements.statusText.textContent = "In Progress (Guess Word)";
      elements.btnStartGame.disabled = true;
      elements.btnNextWord.disabled = false;
      elements.btnStopGame.disabled = false;
      elements.activeWordDisplay.classList.remove("hidden");

      const currentWordObj = state.quizWords[state.currentWordIndex];
      elements.currentWordText.textContent = currentWordObj ? currentWordObj.word : "N/A";
    } else if (swimState.gameState === "RACING" && swimState.activeGame === "SWIMMING_RACE") {
      elements.statusBadge.className = "status-badge status-running";
      elements.statusText.textContent = "In Progress (Swimming Race)";
      elements.btnStartGame.disabled = state.quizWords.length === 0;
      elements.btnNextWord.disabled = true;
      elements.btnStopGame.disabled = true;
      elements.activeWordDisplay.classList.add("hidden");
    } else {
      elements.statusBadge.className = "status-badge status-idle";
      elements.statusText.textContent = "Not Started";
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
      elements.selectSwimMode.value = swimState.raceMode || "WORD_RELAY";
    }
    if (elements.selectSwimDuration) {
      elements.selectSwimDuration.value = swimState.raceDurationSeconds || 90;
    }
    if (elements.selectSwimDistance) {
      elements.selectSwimDistance.value = swimState.raceDistanceMeters || 500;
    }
    if (elements.selectSwimWordCategory) {
      elements.selectSwimWordCategory.value = swimState.wordCategory || "ALL";
    }

    if (swimState.raceMode === "AUTO_SPEED") {
      if (elements.swimAutoDistanceGroup) elements.swimAutoDistanceGroup.classList.remove("hidden");
      if (elements.swimAutoTimerGroup) elements.swimAutoTimerGroup.classList.add("hidden");
      if (elements.swimWordCatGroup) elements.swimWordCatGroup.classList.add("hidden");
    } else {
      if (elements.swimAutoDistanceGroup) elements.swimAutoDistanceGroup.classList.add("hidden");
      if (elements.swimAutoTimerGroup) elements.swimAutoTimerGroup.classList.remove("hidden");
      if (elements.swimWordCatGroup) elements.swimWordCatGroup.classList.remove("hidden");
    }

    if (elements.btnToggleSwimOverlay) {
      if (swimState.activeGame === "SWIMMING_RACE") {
        elements.btnToggleSwimOverlay.innerHTML = `<i class="fa-solid fa-gamepad icon"></i> Turn Off Lobby Overlay`;
        elements.btnToggleSwimOverlay.className = "btn btn-secondary btn-lg";
      } else {
        elements.btnToggleSwimOverlay.innerHTML = `<i class="fa-solid fa-gamepad icon"></i> Turn On Lobby Overlay`;
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
  function switchTab(tabId) {
    if (!tabId) return;
    elements.tabBtns.forEach(b => {
      if (b.getAttribute("data-tab") === tabId) {
        b.classList.add("active");
      } else {
        b.classList.remove("active");
      }
    });
    elements.tabPanels.forEach(p => {
      if (p.id === tabId) {
        p.classList.add("active");
      } else {
        p.classList.remove("active");
      }
    });
  }

  function initTabNavigation() {
    elements.tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const tabId = btn.getAttribute("data-tab");
        switchTab(tabId);
      });
    });

    // Check URL parameters for target tab
    const urlParams = new URLSearchParams(window.location.search);
    const initialTab = urlParams.get("tab");
    if (initialTab) {
      switchTab(initialTab);
    }
  }

  /**
   * Đăng ký sự kiện chọn chủ đề & tìm kiếm
   */
  function initTopicAndSearchEvents() {
    // Thay đổi chủ đề trên dropdown
    elements.selectCategory.addEventListener("change", (e) => {
      const cat = e.target.value;
      const words = window.getWordsByCategory(cat);
      elements.topicWordCount.textContent = `${words.length} words`;
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

    // Toggle Form tạo 1 từ custom
    elements.btnToggleCustom.addEventListener("click", () => {
      elements.customWordForm.classList.toggle("hidden");
      if (elements.importExcelForm) elements.importExcelForm.classList.add("hidden");
    });

    // Toggle Form nhập Excel hàng loạt
    if (elements.btnToggleImportExcel) {
      elements.btnToggleImportExcel.addEventListener("click", () => {
        elements.importExcelForm.classList.toggle("hidden");
        if (elements.customWordForm) elements.customWordForm.classList.add("hidden");
      });
    }

    // Tải File mẫu Excel XLS định dạng cột đẹp rộng rãi
    if (elements.btnDownloadExcelTemplate) {
      elements.btnDownloadExcelTemplate.addEventListener("click", () => {
        const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="HeaderStyle">
   <Font ss:FontName="Segoe UI" ss:Size="11" ss:Color="#FFFFFF" ss:Bold="1"/>
   <Interior ss:Color="#0284C7" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="2" ss:Color="#0369A1"/>
   </Borders>
  </Style>
  <Style ss:ID="DataStyle">
   <Font ss:FontName="Segoe UI" ss:Size="10" ss:Color="#1E293B"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Kyna_Word_List">
  <Table ss:DefaultRowHeight="22">
   <Column ss:Width="180"/>
   <Column ss:Width="360"/>
   <Column ss:Width="400"/>
   <Row ss:Height="28">
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Word (English)</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">English Hint</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Image URL (Optional)</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">BUTTERFLY</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">A beautiful insect with colorful wings</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String"></Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">ELEPHANT</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">A very large gray mammal with a long trunk</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String"></Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">GUITAR</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">A musical instrument with six strings</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String"></Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">SUNFLOWER</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">A tall yellow flower that turns towards the sun</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String"></Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">PIANO</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String">A large musical instrument with black and white keys</Data></Cell>
    <Cell ss:StyleID="DataStyle"><Data ss:Type="String"></Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>`;

        const blob = new Blob([xmlContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", "Kyna_TuVung_Mau_Excel.xls");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }

    // Tải File Excel CSV lên và tự động đọc từ vựng
    if (elements.inputImportExcelFile) {
      elements.inputImportExcelFile.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
          const text = evt.target.result;
          const parsedWords = parseCSVWordList(text);

          if (parsedWords.length === 0) {
            alert("No valid words found in Excel file! Make sure column 1 is English Word and column 2 is English Hint.");
            return;
          }

          let addedCount = 0;
          parsedWords.forEach(item => {
            if (!state.quizWords.some(w => window.normalizeAnswerString(w.word) === window.normalizeAnswerString(item.word))) {
              state.quizWords.push(item);
              addedCount++;
            }
          });

          saveStateToStorage();
          renderUI();

          if (elements.importExcelStatus) {
            elements.importExcelStatus.textContent = `🎉 Successfully imported ${addedCount} new words! (Total: ${state.quizWords.length} words)`;
            elements.importExcelStatus.classList.remove("hidden");
          }

          alert(`🎉 Successfully imported ${addedCount} words from Excel file into current quiz list!`);
          e.target.value = "";
        };

        reader.readAsText(file, "UTF-8");
      });
    }

    // Xuất bộ từ vựng hiện tại ra File Excel CSV
    if (elements.btnExportQuizExcel) {
      elements.btnExportQuizExcel.addEventListener("click", () => {
        if (!state.quizWords || state.quizWords.length === 0) {
          alert("Current word list is empty!");
          return;
        }

        let csvContent = "\uFEFF\"Word (English)\",\"English Hint\",\"Image URL\"\n";
        state.quizWords.forEach(item => {
          const word = `"${(item.word || "").replace(/"/g, '""')}"`;
          const hint = `"${(item.hint || "").replace(/"/g, '""')}"`;
          const img = `"${(item.imageUrl || "").replace(/"/g, '""')}"`;
          csvContent += `${word},${hint},${img}\n`;
        });

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const timestamp = new Date().toISOString().slice(0, 10);
        link.setAttribute("href", url);
        link.setAttribute("download", `Kyna_Word_List_${timestamp}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }

    // Nút Lưu từ tùy chỉnh do Giáo viên tự thêm 1 từ
    elements.btnSaveCustom.addEventListener("click", () => {
      const word = elements.customWordInput.value.trim().toUpperCase();
      const hint = elements.customHintInput.value.trim();
      const query = elements.customQueryInput.value.trim() || `${word.toLowerCase()} doodle sketch`;

      if (!word || !hint) {
        alert("Please enter English Word and Hint!");
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
        alert("At least 2 words are required to shuffle!");
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
      if (confirm("Are you sure you want to clear the current word list?")) {
        state.quizWords = [];
        state.currentWordIndex = 0;
        saveStateToStorage();
        renderUI();
      }
    });
  }

  /**
   * Trình phân tích File Excel (.xls XML / .csv / .tsv) UTF-8
   */
  function parseCSVWordList(fileText) {
    if (!fileText) return [];

    const results = [];

    // 1. Phân tích File Excel XML SpreadsheetML (.xls)
    if (fileText.includes("<Workbook") || fileText.includes("<Table")) {
      const rowMatches = fileText.match(/<Row[\s\S]*?<\/Row>/gi) || [];
      for (let i = 0; i < rowMatches.length; i++) {
        const rowStr = rowMatches[i];
        const cellMatches = rowStr.match(/<Data[^>]*>([\s\S]*?)<\/Data>/gi) || [];
        if (cellMatches.length < 2) continue;

        const rawWord = cellMatches[0].replace(/<[^>]+>/g, "").trim();
        const rawHint = cellMatches[1].replace(/<[^>]+>/g, "").trim();
        const rawImg = cellMatches[2] ? cellMatches[2].replace(/<[^>]+>/g, "").trim() : "";

        // Bỏ qua dòng tiêu đề
        if (rawWord.toLowerCase().includes("word") || rawWord.toLowerCase().includes("tiếng anh") || rawWord.toLowerCase().includes("từ")) {
          continue;
        }

        if (rawWord && rawHint) {
          results.push({
            word: rawWord.toUpperCase(),
            hint: rawHint,
            category: "Excel_Import",
            imageUrl: (rawImg && rawImg.startsWith("http")) ? rawImg : window.generateFallbackDoodleSvg(rawWord, rawHint)
          });
        }
      }
      return results;
    }

    // 2. Phân tích File CSV / TSV thông thường
    let cleanText = fileText.replace(/^\uFEFF/, "").trim();
    const lines = cleanText.split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      let parts = [];
      if (line.includes("\t")) {
        parts = line.split("\t");
      } else {
        parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(",");
      }

      if (!parts || parts.length < 2) continue;

      const rawWord = parts[0].replace(/^"|"$/g, "").trim();
      const rawHint = parts[1].replace(/^"|"$/g, "").trim();
      const rawImg = parts[2] ? parts[2].replace(/^"|"$/g, "").trim() : "";

      if (rawWord.toLowerCase().includes("word") || rawWord.toLowerCase().includes("tiếng anh") || rawWord.toLowerCase().includes("từ")) {
        continue;
      }

      if (rawWord && rawHint) {
        results.push({
          word: rawWord.toUpperCase(),
          hint: rawHint,
          category: "Excel_Import",
          imageUrl: (rawImg && rawImg.startsWith("http")) ? rawImg : window.generateFallbackDoodleSvg(rawWord, rawHint)
        });
      }
    }

    return results;
  }

  /**
   * Hiển thị danh sách gợi ý khi giáo viên tìm kiếm từ
   */
  function renderSearchResults(results) {
    if (results.length === 0) {
      elements.searchResultsList.innerHTML = `<div class="empty-state">No matching words found in database. You can click "+ Create Custom Word" above.</div>`;
    } else {
      elements.searchResultsList.innerHTML = results.slice(0, 5).map(item => `
        <div class="result-item">
          <div>
            <span class="result-word">${item.word}</span>
            <span class="result-hint"> (${item.hint})</span>
          </div>
          <button class="btn btn-sm btn-outline btn-add-search-word" data-word="${item.word}"><i class="fa-solid fa-plus"></i> Add</button>
        </div>
      `).join("");

      // Nút Thêm từng từ tìm được
      document.querySelectorAll(".btn-add-search-word").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const targetWord = e.target.getAttribute("data-word") || e.target.closest(".btn-add-search-word").getAttribute("data-word");
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
      elements.quizWordList.innerHTML = `<div class="empty-state">No words loaded yet. Select a topic or search for words!</div>`;
      return;
    }

    elements.quizWordList.innerHTML = state.quizWords.map((item, idx) => `
      <div class="word-chip ${idx === state.currentWordIndex && state.gameState === "RUNNING" ? "active-chip" : ""}">
        <div>
          <span class="chip-title">${idx + 1}. ${item.word}</span>
          <span class="chip-hint">- Hint: ${item.hint}</span>
        </div>
        <button class="btn btn-ghost btn-sm btn-remove-word" data-index="${idx}"><i class="fa-solid fa-xmark"></i></button>
      </div>
    `).join("");

    // Sự kiện nút Xóa từng từ
    document.querySelectorAll(".btn-remove-word").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.getAttribute("data-index") || e.target.closest(".btn-remove-word").getAttribute("data-index"), 10);
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
        alert("Please add at least 1 word before starting!");
        return;
      }
      state.gameState = "RUNNING";
      state.currentWordIndex = 0;
      state.scores = {}; // Reset điểm lượt chơi hiện tại khi bắt đầu game mới
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
        alert("Reached the end of the word list!");
      }
    });

    // Dừng Game
    elements.btnStopGame.addEventListener("click", () => {
      if (confirm("Are you sure you want to stop the current game?")) {
        state.gameState = "IDLE";
        saveStateToStorage();
        renderUI();
      }
    });
  }

  /**
   * Đăng ký nút Bảng Điểm & Xuất file CSV / Reset (Null-safe)
   */
  function initScoreboardAndExportEvents() {
    if (elements.btnExportCsv) {
      elements.btnExportCsv.addEventListener("click", exportScoresToCSV);
    }
    if (elements.btnResetScores) {
      elements.btnResetScores.addEventListener("click", () => {
        if (confirm("Are you sure you want to reset all student scores?")) {
          state.scores = {};
          saveStateToStorage();
          renderUI();
        }
      });
    }
  }

  /**
   * Render Bảng xếp hạng học sinh (Null-safe)
   */
  function renderScoreboard() {
    if (!elements.scoresTableBody) return;

    const scoreEntries = Object.entries(state.scores || {})
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.totalScore - a.totalScore);

    if (elements.tabScoreCount) {
      elements.tabScoreCount.textContent = scoreEntries.length;
    }

    if (scoreEntries.length === 0) {
      elements.scoresTableBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center text-muted">No student scores recorded yet.</td>
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
          <td>${item.correctCount || 0} pts</td>
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
      alert("No student score data available to export!");
      return;
    }

    // Định dạng CSV UTF-8 BOM
    let csvContent = "\uFEFFStudent Name,Correct Answers,Total Score,Correct Word List\n";

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
    link.setAttribute("download", `Kyna_BBB_Scores_${timestamp}.csv`);
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
      chrome.storage.local.set({ kynaSoundMuted: !elements.settingSound.checked });
      saveStateToStorage();
      alert("Settings saved successfully!");
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
            alert("Active BBB classroom tab not found!");
            return;
          }
          ensureContentScriptInjected(activeTab.id, () => {
            chrome.tabs.sendMessage(activeTab.id, { action: "FETCH_BBB_STUDENTS" }, (res) => {
              if (chrome.runtime.lastError || !res || !res.students || res.students.length === 0) {
                alert("No students detected in BBB member list. Make sure the 'Users' panel is open in BBB!");
                return;
              }
              const fetchedList = res.students.join(", ");
              elements.inputSwimStudents.value = fetchedList;
              updateSwimStudentsList(fetchedList);
              alert(`🎉 Successfully scanned ${res.students.length} students from BBB classroom!`);
            });
          });
        });
      });
    }

    // Xóa sạch danh sách vận động viên bơi
    if (elements.btnClearSwimStudents) {
      elements.btnClearSwimStudents.addEventListener("click", () => {
        if (confirm("Are you sure you want to clear all student swimmers?")) {
          swimState.students = [];
          swimState.positions = {};
          swimState.rankings = [];
          swimState.finishedStudents = {};
          elements.inputSwimStudents.value = "";
          elements.swimStudentCount.textContent = "0";
          saveSwimStateToStorage();
          renderUI();
        }
      });
    }

    // Nhập mẫu danh sách học sinh bơi
    elements.btnLoadSampleStudents.addEventListener("click", () => {
      const sampleText = "Bao Nam, Hoang Minh, Tue Nhi, Gia Bao, Khanh An, Linh Chi";
      elements.inputSwimStudents.value = sampleText;
      updateSwimStudentsList(sampleText);
    });

    // Lưu danh sách vận động viên bơi
    elements.btnSaveSwimStudents.addEventListener("click", () => {
      updateSwimStudentsList(elements.inputSwimStudents.value);
      alert("Swimmer list updated successfully!");
    });

    // Bắt đầu Đua Bơi
    elements.btnStartSwimRace.addEventListener("click", () => {
      if (!swimState.students || swimState.students.length < 1) {
        alert("At least 1 student is required to start the swimming race! Students can type 'join' in BBB chat to register automatically.");
        return;
      }

      // Tắt game Guess The Word nếu đang chạy
      if (state.gameState === "RUNNING") {
        state.gameState = "IDLE";
        saveStateToStorage();
      }

      swimState.activeGame = "SWIMMING_RACE";
      swimState.gameState = "RACING";
      swimState.raceMode = elements.selectSwimMode ? elements.selectSwimMode.value : "WORD_RELAY";
      swimState.raceDurationSeconds = elements.selectSwimDuration ? (parseInt(elements.selectSwimDuration.value, 10) || 90) : 90;
      swimState.raceDistanceMeters = elements.selectSwimDistance ? (parseInt(elements.selectSwimDistance.value, 10) || 500) : 500;
      swimState.wordCategory = elements.selectSwimWordCategory ? elements.selectSwimWordCategory.value : "ALL";
      swimState.positions = {};
      swimState.rankings = [];
      swimState.finishedStudents = {};
      swimState.raceStartTime = Date.now();

      swimState.students.forEach(name => {
        swimState.positions[name] = 0;
      });

      saveSwimStateToStorage();
      renderUI();
    });

    // Dừng Đua Bơi
    elements.btnStopSwimRace.addEventListener("click", () => {
      if (confirm("Are you sure you want to stop the swimming race?")) {
        swimState.gameState = "IDLE";
        swimState.activeGame = "NONE";
        saveSwimStateToStorage();
        renderUI();
      }
    });

    if (elements.selectSwimMode) {
      elements.selectSwimMode.addEventListener("change", (e) => {
        swimState.raceMode = e.target.value;
        saveSwimStateToStorage();
        renderUI();
      });
    }

    if (elements.selectSwimDuration) {
      elements.selectSwimDuration.addEventListener("change", (e) => {
        swimState.raceDurationSeconds = parseInt(e.target.value, 10) || 90;
        saveSwimStateToStorage();
      });
    }

    if (elements.selectSwimDistance) {
      elements.selectSwimDistance.addEventListener("change", (e) => {
        swimState.raceDistanceMeters = parseInt(e.target.value, 10) || 500;
        saveSwimStateToStorage();
      });
    }

    if (elements.selectSwimWordCategory) {
      elements.selectSwimWordCategory.addEventListener("change", (e) => {
        swimState.wordCategory = e.target.value || "ALL";
        saveSwimStateToStorage();
      });
    }
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
    if (typeof chrome !== "undefined" && chrome.tabs) {
      // Use lastFocusedWindow:true to only target the teacher's current tab
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        const activeTab = tabs && tabs[0];
        const tabId = activeTab ? activeTab.id : null;

        const swimStateWithTab = { ...swimState, activeTabId: tabId };

        try {
          localStorage.setItem("kynaSwimRaceState", JSON.stringify(swimStateWithTab));
        } catch (e) {}

        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ kynaSwimRaceState: swimStateWithTab });
        }

        if (tabId) {
          ensureContentScriptInjected(tabId, () => {
            chrome.tabs.sendMessage(tabId, {
              action: "SYNC_SWIM_RACE_STATE",
              tabId: tabId,
              payload: swimStateWithTab
            }, () => { chrome.runtime.lastError; });
          });
        }
      });
    } else {
      try { localStorage.setItem("kynaSwimRaceState", JSON.stringify(swimState)); } catch (e) {}
    }
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

  // ==========================================
  // SCHEDULE ASSISTANT MODULE (LỊCH DẠY)
  // ==========================================
  function initScheduleAssistant() {
    let scheduleTemplates = [];
    let scheduleSettings = {
      syncDelayMs: 400,
      autoSkipConflicts: true
    };

    const scheduleElements = {
      templateCount: document.getElementById("schedule-template-count"),
      btnToggleCreate: document.getElementById("btn-toggle-create-template"),
      createForm: document.getElementById("create-template-form"),
      inputName: document.getElementById("input-template-name"),
      selectStartTime: document.getElementById("select-tpl-start-time"),
      selectEndTime: document.getElementById("select-tpl-end-time"),
      btnCancelCreate: document.getElementById("btn-cancel-create-template"),
      btnSaveTemplate: document.getElementById("btn-save-template"),
      templatesContainer: document.getElementById("saved-templates-container"),
      btnExportJson: document.getElementById("btn-export-templates-json"),
      inputImportJson: document.getElementById("input-import-templates-json"),
      settingDelay: document.getElementById("setting-schedule-delay"),
      settingAutoskip: document.getElementById("setting-schedule-autoskip")
    };

    if (!scheduleElements.templatesContainer) return;

    // Load templates & settings from chrome.storage.local
    function loadTemplatesFromStorage() {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(["kynaScheduleTemplates", "kynaScheduleSettings"], (res) => {
          if (res.kynaScheduleTemplates && Array.isArray(res.kynaScheduleTemplates)) {
            scheduleTemplates = res.kynaScheduleTemplates;
          } else {
            // Pre-populate sensible defaults
            scheduleTemplates = getDefaultSampleTemplates();
            chrome.storage.local.set({ kynaScheduleTemplates: scheduleTemplates });
          }

          if (res.kynaScheduleSettings) {
            scheduleSettings = { ...scheduleSettings, ...res.kynaScheduleSettings };
          }

          if (scheduleElements.settingDelay) {
            scheduleElements.settingDelay.value = String(scheduleSettings.syncDelayMs || 400);
          }
          if (scheduleElements.settingAutoskip) {
            scheduleElements.settingAutoskip.checked = scheduleSettings.autoSkipConflicts !== false;
          }

          renderTemplates();
        });
      } else {
        scheduleTemplates = getDefaultSampleTemplates();
        renderTemplates();
      }
    }

    // Initial load of templates & settings
    loadTemplatesFromStorage();

    // Toggle Create Form
    if (scheduleElements.btnToggleCreate) {
      scheduleElements.btnToggleCreate.addEventListener("click", () => {
        scheduleElements.createForm.classList.toggle("hidden");
        if (!scheduleElements.createForm.classList.contains("hidden")) {
          scheduleElements.inputName.focus();
        }
      });
    }

    if (scheduleElements.btnCancelCreate) {
      scheduleElements.btnCancelCreate.addEventListener("click", () => {
        scheduleElements.createForm.classList.add("hidden");
      });
    }

    // Save New Template
    if (scheduleElements.btnSaveTemplate) {
      scheduleElements.btnSaveTemplate.addEventListener("click", () => {
        const name = (scheduleElements.inputName.value || "").trim();
        if (!name) {
          alert("Vui lòng nhập tên gợi nhớ cho mẫu lịch!");
          return;
        }
        if (name.length > 60) {
          alert("Tên mẫu lịch không được vượt quá 60 ký tự!");
          return;
        }

        const checkedDays = Array.from(
          scheduleElements.createForm.querySelectorAll("input[name='tpl-day']:checked")
        ).map(el => parseInt(el.value, 10));

        if (checkedDays.length === 0) {
          alert("Vui lòng chọn ít nhất một ngày trong tuần!");
          return;
        }

        const start = scheduleElements.selectStartTime.value;
        const end = scheduleElements.selectEndTime.value;

        const startMinutes = timeToMins(start);
        const endMinutes = timeToMins(end);

        if (endMinutes <= startMinutes) {
          alert("Giờ kết thúc phải lớn hơn giờ bắt đầu!");
          return;
        }

        // Generate 30-min slots
        const slots = [];
        checkedDays.forEach(day => {
          let curr = startMinutes;
          while (curr < endMinutes) {
            const slotStart = minsToTime(curr);
            const slotEnd = minsToTime(curr + 30);
            slots.push({
              dayOfWeek: day,
              timeStart: slotStart,
              timeEnd: slotEnd
            });
            curr += 30;
          }
        });

        const newTemplate = {
          id: "tpl_" + Date.now(),
          name: name,
          description: `Áp dụng ${checkedDays.length} ngày (${start} - ${end})`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          slots: slots,
          totalSlots: slots.length,
          totalHours: slots.length * 0.5
        };

        scheduleTemplates.unshift(newTemplate);
        saveTemplatesToStorage();
        renderTemplates();

        // Reset form
        scheduleElements.inputName.value = "";
        scheduleElements.createForm.classList.add("hidden");
      });
    }

    // Export JSON
    if (scheduleElements.btnExportJson) {
      scheduleElements.btnExportJson.addEventListener("click", () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(scheduleTemplates, null, 2));
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `kyna_schedule_templates_${Date.now()}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      });
    }

    // Import JSON
    if (scheduleElements.inputImportJson) {
      scheduleElements.inputImportJson.addEventListener("change", (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const imported = JSON.parse(event.target.result);
            if (Array.isArray(imported)) {
              let addedCount = 0;
              imported.forEach(item => {
                if (item.name && Array.isArray(item.slots)) {
                  item.id = "tpl_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
                  scheduleTemplates.push(item);
                  addedCount++;
                }
              });
              saveTemplatesToStorage();
              renderTemplates();
              alert(`Nhập thành công ${addedCount} mẫu lịch!`);
            } else {
              alert("File JSON không hợp lệ!");
            }
          } catch (err) {
            alert("Lỗi khi đọc file JSON: " + err.message);
          }
          scheduleElements.inputImportJson.value = "";
        };
        reader.readAsText(file);
      });
    }

    // Settings changes
    if (scheduleElements.settingDelay) {
      scheduleElements.settingDelay.addEventListener("change", (e) => {
        scheduleSettings.syncDelayMs = parseInt(e.target.value, 10);
        saveSettingsToStorage();
      });
    }
    if (scheduleElements.settingAutoskip) {
      scheduleElements.settingAutoskip.addEventListener("change", (e) => {
        scheduleSettings.autoSkipConflicts = !!e.target.checked;
        saveSettingsToStorage();
      });
    }

    function saveTemplatesToStorage() {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ kynaScheduleTemplates: scheduleTemplates });
      }
    }

    function saveSettingsToStorage() {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ kynaScheduleSettings: scheduleSettings });
      }
    }

    function renderTemplates() {
      if (scheduleElements.templateCount) {
        scheduleElements.templateCount.textContent = scheduleTemplates.length;
      }
      const container = scheduleElements.templatesContainer;
      container.innerHTML = "";

      if (scheduleTemplates.length === 0) {
        container.innerHTML = `<div class="empty-state">Chưa có mẫu lịch nào. Bấm <b>+ Mẫu mới</b> để tạo mẫu đầu tiên!</div>`;
        return;
      }

      scheduleTemplates.forEach((tpl) => {
        const card = document.createElement("div");
        card.className = "template-card";

        card.innerHTML = `
          <div class="template-card-header">
            <span class="template-card-title"><i class="fa-solid fa-calendar-check" style="color:#0284c7;"></i> ${escapeHtml(tpl.name)}</span>
            <span class="template-card-badge">${tpl.totalSlots} ca (${tpl.totalHours}h)</span>
          </div>
          <div class="template-card-desc">${escapeHtml(tpl.description || "")}</div>
          <div class="template-card-actions">
            <button class="btn btn-sm btn-outline btn-delete-tpl" style="color:#ef4444; border-color:#fca5a5; font-size:11px; padding:3px 8px;" data-id="${tpl.id}" title="Xóa mẫu">
              <i class="fa-solid fa-trash-can"></i> Xóa
            </button>
            <button class="btn btn-sm btn-outline btn-apply-tpl" style="color:#0284c7; border-color:#38bdf8; font-size:11px; padding:3px 8px;" data-id="${tpl.id}" title="Chỉ chọn nháp trên bảng lịch để xem lại hoặc điều chỉnh">
              <i class="fa-solid fa-wand-magic-sparkles"></i> Áp dụng
            </button>
            <button class="btn btn-sm btn-primary btn-apply-sync-tpl" style="font-size:11px; padding:3px 10px; font-weight:700;" data-id="${tpl.id}" title="Áp dụng mẫu và đăng ký trực tiếp lên Kyna chỉ với 1 click">
              <i class="fa-solid fa-paper-plane"></i> Áp dụng & Đăng ký
            </button>
          </div>
        `;

        // Apply Template to Active Tab (Draft only)
        card.querySelector(".btn-apply-tpl").addEventListener("click", () => {
          applyTemplateToActiveTab(tpl, { autoSync: false });
        });

        // 1-Click Apply & Register directly onto Kyna (UX1)
        card.querySelector(".btn-apply-sync-tpl").addEventListener("click", () => {
          applyTemplateToActiveTab(tpl, { autoSync: true });
        });

        // Delete Template
        card.querySelector(".btn-delete-tpl").addEventListener("click", () => {
          if (confirm(`Bạn có chắc chắn muốn xóa mẫu "${tpl.name}"?`)) {
            scheduleTemplates = scheduleTemplates.filter(t => t.id !== tpl.id);
            saveTemplatesToStorage();
            renderTemplates();
          }
        });

        container.appendChild(card);
      });
    }

    // Cross-window active Kyna tab resolver (FR-012, T058)
    function isKynaTab(tab) {
      if (!tab || !tab.url) return false;
      const url = tab.url.toLowerCase();
      return (
        url.includes("kynaenglish.com") ||
        url.includes("kynalearning.com") ||
        url.includes("kyna.vn") ||
        url.includes("localhost") ||
        url.includes("127.0.0.1") ||
        (url.startsWith("file:") && (url.includes("kyna") || url.includes("simulator") || url.includes("teacher")))
      );
    }

    function getActiveKynaTab(callback) {
      if (typeof chrome === "undefined" || !chrome.tabs || !chrome.tabs.query) {
        if (callback) callback(null);
        return;
      }

      // 1. Try active tab in lastFocusedWindow (teacher's focused browser window)
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        const activeTab = tabs && tabs[0];
        if (activeTab && isKynaTab(activeTab)) {
          callback(activeTab);
          return;
        }

        // 2. Try active tab in currentWindow
        chrome.tabs.query({ active: true, currentWindow: true }, (currTabs) => {
          const currTab = currTabs && currTabs[0];
          if (currTab && isKynaTab(currTab)) {
            callback(currTab);
            return;
          }

          // 3. Fallback: Search all open tabs across all windows for any matching Kyna tab
          chrome.tabs.query({}, (allTabs) => {
            if (!allTabs || allTabs.length === 0) {
              callback(null);
              return;
            }
            const activeKyna = allTabs.find(t => t.active && isKynaTab(t));
            if (activeKyna) {
              callback(activeKyna);
              return;
            }
            const anyKyna = allTabs.find(t => isKynaTab(t));
            callback(anyKyna || null);
          });
        });
      });
    }

    function checkTabScheduleStatus() {
      if (typeof chrome === "undefined" || !chrome.tabs || !chrome.tabs.query) return;

      const dot = document.getElementById("schedule-tab-status-dot");
      const text = document.getElementById("schedule-tab-status-text");
      const countEl = document.getElementById("popup-selected-count");
      const hoursEl = document.getElementById("popup-selected-hours");
      const cancelInfo = document.getElementById("schedule-cancel-info");
      const cancelCountEl = document.getElementById("popup-cancel-count");
      const cancelHoursEl = document.getElementById("popup-cancel-hours");
      const unregisterBtn = document.getElementById("btn-popup-batch-unregister");
      const syncBtn = document.getElementById("btn-popup-batch-sync");
      const weekSelect = document.getElementById("popup-target-week-select");

      getActiveKynaTab((tab) => {
        if (!tab) {
          if (dot) dot.style.background = "#94a3b8";
          if (text) text.textContent = "Không tìm thấy tab Kyna Teacher";
          if (countEl) countEl.textContent = "0 ca";
          if (hoursEl) hoursEl.textContent = "0.0h";
          if (cancelInfo) cancelInfo.style.display = "none";
          if (syncBtn) syncBtn.disabled = true;
          return;
        }
        const tabId = tab.id;

        chrome.tabs.sendMessage(tabId, { action: "GET_SCHEDULE_STATUS" }, (response) => {
          if (chrome.runtime.lastError || !response) {
            if (dot) dot.style.background = "#94a3b8";
            if (text) text.textContent = "Không thể kết nối lịch (F5 lại tab Kyna)";
            if (countEl) countEl.textContent = "0 ca";
            if (hoursEl) hoursEl.textContent = "0.0h";
            if (cancelInfo) cancelInfo.style.display = "none";
            if (syncBtn) syncBtn.disabled = true;
            return;
          }

          if (response.isModalOpen && response.hasGrid) {
            if (dot) dot.style.background = "#10b981";
            if (text) text.textContent = "Đã kết nối bảng lịch Kyna";
          } else if (response.isModalOpen && !response.hasGrid) {
            if (dot) dot.style.background = "#f59e0b";
            if (text) text.textContent = "Bảng lịch Kyna đang tải dữ liệu...";
          } else {
            if (dot) dot.style.background = "#94a3b8";
            if (text) text.textContent = "Chưa mở bảng lịch (Bấm 📅 Mở Lịch)";
          }

          const count = response.selectedCount || 0;
          const hours = response.totalHours || 0;
          if (countEl) countEl.textContent = `${count} ca`;
          if (hoursEl) hoursEl.textContent = `${hours.toFixed(1)}h`;
          if (syncBtn) syncBtn.disabled = (count === 0);

          // Update Cancellation Targets (T047 / User Story 4)
          const cancelCount = response.cancelCount || 0;
          const cancelHours = response.cancelHours || 0;
          if (cancelInfo) {
            if (cancelCount > 0) {
              cancelInfo.style.display = "flex";
              if (cancelCountEl) cancelCountEl.textContent = `${cancelCount} ca`;
              if (cancelHoursEl) cancelHoursEl.textContent = `${cancelHours.toFixed(1)}h`;
              if (unregisterBtn) unregisterBtn.disabled = false;
            } else {
              cancelInfo.style.display = "none";
            }
          }

          // Update week select options if columns available
          if (weekSelect && response.dateColumns && response.dateColumns.length >= 21) {
            const cols = response.dateColumns;
            weekSelect.innerHTML = `
              <option value="1" selected>📅 Tuần 1 (${cols[0].dateLabel} - ${cols[6].dateLabel})</option>
              <option value="2">📅 Tuần 2 (${cols[7].dateLabel} - ${cols[13].dateLabel})</option>
              <option value="3">📅 Tuần 3 (${cols[14].dateLabel} - ${cols[20].dateLabel})</option>
              <option value="ALL">🌟 Cả 3 Tuần (${cols[0].dateLabel} - ${cols[20].dateLabel})</option>
            `;
          }
        });
      });
    }

    // Refresh status button
    const btnRefreshStatus = document.getElementById("btn-refresh-tab-status");
    if (btnRefreshStatus) {
      btnRefreshStatus.addEventListener("click", () => {
        checkTabScheduleStatus();
      });
    }

    // Clear selection button
    const btnClearSelection = document.getElementById("btn-popup-clear-selection");
    if (btnClearSelection) {
      btnClearSelection.addEventListener("click", () => {
        getActiveKynaTab((tab) => {
          if (!tab) return;
          chrome.tabs.sendMessage(tab.id, { action: "CLEAR_ALL_SELECTION" }, () => {
            checkTabScheduleStatus();
          });
        });
      });
    }

    // Common helper to trigger Batch Registration confirmation & execution (UX1)
    function triggerBatchSync(tabId, contextTitle = "") {
      const progressSection = document.getElementById("popup-sync-progress-section");
      const btnBatchSync = document.getElementById("btn-popup-batch-sync");

      chrome.tabs.sendMessage(tabId, { action: "GET_DRY_RUN_SUMMARY" }, (res) => {
        if (chrome.runtime.lastError || !res || !res.success) {
          alert("Không thể lấy tóm tắt ca dạy từ tab Kyna!");
          return;
        }

        const summary = res.summary;
        if (!summary || summary.totalSelected === 0) {
          alert("Không tìm thấy ca nào đang chọn để đăng ký!");
          return;
        }

        const headerMsg = contextTitle ? `XÁC NHẬN: ${contextTitle}\n\n` : `XÁC NHẬN ĐĂNG KÝ HÀNG LOẠT LÊN KYNA:\n\n`;
        const conflictNote = summary.conflicts && summary.conflicts.length > 0
          ? `• Tự động bỏ qua an toàn: ${summary.conflicts.length} ca (đã có học sinh hoặc bị khóa)\n`
          : "";

        const confirmMsg =
          headerMsg +
          `• Tổng số ca đăng ký: ${summary.totalSelected} ca (${summary.totalHours.toFixed(1)} giờ)\n` +
          conflictNote +
          `\nBấm OK để tiến hành đăng ký tuần tự an toàn lên Kyna!`;

        if (confirm(confirmMsg)) {
          if (progressSection) progressSection.style.display = "block";
          if (btnBatchSync) btnBatchSync.disabled = true;

          chrome.tabs.sendMessage(tabId, { action: "EXECUTE_BATCH_SYNC" });
        }
      });
    }

    function applyTemplateToActiveTab(template, options = {}) {
      if (typeof chrome === "undefined" || !chrome.tabs || !chrome.tabs.query) return;

      const weekSelect = document.getElementById("popup-target-week-select");
      const targetWeek = weekSelect ? weekSelect.value : "1";

      getActiveKynaTab((tab) => {
        if (!tab) {
          alert("Không tìm thấy tab Kyna Teacher đang mở! Vui lòng mở trang Kyna Teacher trên trình duyệt.");
          return;
        }
        const tabId = tab.id;

        chrome.tabs.sendMessage(tabId, {
          action: "APPLY_TEMPLATE_TO_GRID",
          template: template,
          targetWeek: targetWeek
        }, (response) => {
          if (chrome.runtime.lastError) {
            alert("Không thể kết nối đến trang lịch Kyna trên tab hiện tại!\nNếu bạn vừa cài đặt hoặc cập nhật tiện ích, vui lòng F5 (tải lại trang) trên tab Kyna Teacher rồi bấm Áp dụng lại.");
            return;
          }
          if (response && response.success) {
            const weekStr = targetWeek === "ALL" ? "Cả 3 tuần" : `Tuần ${targetWeek}`;
            checkTabScheduleStatus();

            if (options.autoSync) {
              // 1-Click: Prompt confirmation & register immediately!
              triggerBatchSync(tabId, `Áp dụng mẫu "${template.name}" cho ${weekStr}`);
            } else {
              alert(`Áp dụng mẫu "${template.name}" cho ${weekStr} thành công!\n- ${response.matchedCount} ca đã được chọn.\n- ${response.conflictsSkipped || 0} ca đã có lịch/bị khóa được tự động bỏ qua an toàn.`);
            }
          } else if (response && !response.success) {
            alert(response.message || "Không thể áp dụng mẫu lịch!");
          }
        });
      });
    }

    // Batch sync trigger
    const btnBatchSync = document.getElementById("btn-popup-batch-sync");
    const progressSection = document.getElementById("popup-sync-progress-section");
    const progressText = document.getElementById("popup-sync-status-text");
    const progressPercent = document.getElementById("popup-sync-percent");
    const progressFill = document.getElementById("popup-sync-progress-fill");
    const btnAbortSync = document.getElementById("btn-popup-abort-sync");

    if (btnBatchSync) {
      btnBatchSync.addEventListener("click", () => {
        getActiveKynaTab((tab) => {
          if (!tab) {
            alert("Không tìm thấy tab Kyna Teacher đang mở!");
            return;
          }
          triggerBatchSync(tab.id);
        });
      });
    }

    // Batch Unregister trigger (T048 / User Story 4)
    const btnBatchUnregister = document.getElementById("btn-popup-batch-unregister");
    if (btnBatchUnregister) {
      btnBatchUnregister.addEventListener("click", () => {
        getActiveKynaTab((tab) => {
          if (!tab) {
            alert("Không tìm thấy tab Kyna Teacher đang mở!");
            return;
          }
          const tabId = tab.id;

          chrome.tabs.sendMessage(tabId, { action: "GET_UNREGISTER_SUMMARY" }, (res) => {
            if (chrome.runtime.lastError || !res || !res.success) {
              alert("Không thể lấy thông tin ca cần hủy!");
              return;
            }

            const summary = res.summary;
            const confirmMsg =
              `⚠️ CẢNH BÁO HỦY ĐĂNG KÝ HÀNG LOẠT:\n` +
              `• Tổng số ca sẽ HỦY: ${summary.totalSelected} ca (${summary.totalHours.toFixed(1)} giờ)\n` +
              `\nCác ca này sẽ bị xóa khỏi lịch dạy chính thức của bạn trên Kyna.\nBạn có chắc chắn muốn tiến hành hủy không?`;

            if (confirm(confirmMsg)) {
              if (progressSection) progressSection.style.display = "block";
              if (btnBatchSync) btnBatchSync.disabled = true;
              if (btnBatchUnregister) btnBatchUnregister.disabled = true;

              chrome.tabs.sendMessage(tabId, { action: "EXECUTE_BATCH_UNREGISTER" });
            }
          });
        });
      });
    }

    if (btnAbortSync) {
      btnAbortSync.addEventListener("click", () => {
        getActiveKynaTab((tab) => {
          if (!tab) return;
          chrome.tabs.sendMessage(tab.id, { action: "ABORT_BATCH_SYNC" });
        });
      });
    }

    // Ensure schedule content scripts & styles are injected on target tab
    function ensureScheduleContentScriptInjected(tabId, callback) {
      if (!chrome.scripting) {
        if (typeof callback === "function") callback();
        return;
      }
      chrome.scripting.executeScript({
        target: { tabId: tabId, allFrames: false },
        files: [
          "schedule/schedule-grid-selector.js",
          "schedule/schedule-sync-engine.js",
          "schedule/schedule-toolbar.js"
        ]
      }).then(() => {
        chrome.scripting.insertCSS({
          target: { tabId: tabId, allFrames: false },
          files: [
            "schedule/schedule-selection.css",
            "schedule/schedule-toolbar.css"
          ]
        }).catch(() => {});
        if (typeof callback === "function") callback();
      }).catch((err) => {
        console.warn("Scripting inject fallback:", err);
        if (typeof callback === "function") callback();
      });
    }

    // In-Page Assistant Window Launcher (Game Overlay Style)
    const btnToggleScheduleOverlay = document.getElementById("btn-toggle-schedule-overlay");
    if (btnToggleScheduleOverlay) {
      btnToggleScheduleOverlay.addEventListener("click", () => {
        getActiveKynaTab((tab) => {
          if (!tab) {
            alert("Không tìm thấy tab Kyna Teacher đang mở! Vui lòng mở trang Kyna Teacher trên trình duyệt.");
            return;
          }
          ensureScheduleContentScriptInjected(tab.id, () => {
            chrome.tabs.sendMessage(tab.id, { action: "SHOW_SCHEDULE_OVERLAY" }, (response) => {
              if (chrome.runtime.lastError) {
                alert("Không thể kết nối đến trang Kyna trên tab này!\nVui lòng F5 (tải lại trang) trên tab Kyna Teacher rồi bấm lại.");
                return;
              }
              // Auto close transient popup so teacher interacts with in-page floating assistant directly
              window.close();
            });
          });
        });
      });
    }

    // Auto-open Kyna Schedule Modal (FR-013, T059)
    const btnOpenKynaModal = document.getElementById("btn-open-kyna-modal");
    if (btnOpenKynaModal) {
      btnOpenKynaModal.addEventListener("click", () => {
        getActiveKynaTab((tab) => {
          if (!tab) {
            alert("Không tìm thấy tab Kyna Teacher đang mở! Vui lòng mở trang Kyna Teacher trên trình duyệt.");
            return;
          }
          chrome.tabs.sendMessage(tab.id, { action: "OPEN_KYNA_SCHEDULE_MODAL" }, (response) => {
            if (chrome.runtime.lastError) {
              alert("Không thể gửi lệnh đến tab Kyna!\nNếu bạn vừa cài đặt hoặc cập nhật tiện ích, vui lòng F5 (tải lại trang) trên tab Kyna rồi thử lại.");
              return;
            }
            if (response && response.success) {
              setTimeout(() => checkTabScheduleStatus(), 600);
            } else {
              alert(response ? response.message : "Không thể mở bảng lịch Kyna!");
            }
          });
        });
      });
    }

    // Listen for sync progress updates from content script
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((message) => {
        if (!message) return;

        if (message.action === "SYNC_PROGRESS" && message.data) {
          const p = message.data;
          if (progressText) progressText.textContent = `Đang xử lý ca ${p.currentIndex}/${p.totalCount}...`;
          if (progressPercent) progressPercent.textContent = `${p.progressPercent}%`;
          if (progressFill) progressFill.style.width = `${p.progressPercent}%`;
        }

        if (message.action === "SYNC_COMPLETE" && message.data) {
          if (progressSection) progressSection.style.display = "none";
          if (btnBatchSync) btnBatchSync.disabled = false;
          if (btnBatchUnregister) btnBatchUnregister.disabled = false;
          alert(`Đăng ký thành công ${message.data.successCount} ca lên Kyna!`);
          checkTabScheduleStatus();
        }

        if (message.action === "UNREGISTER_COMPLETE" && message.data) {
          if (progressSection) progressSection.style.display = "none";
          if (btnBatchSync) btnBatchSync.disabled = false;
          if (btnBatchUnregister) btnBatchUnregister.disabled = false;
          alert(`Đã hủy đăng ký thành công ${message.data.successCount} ca trên Kyna!`);
          checkTabScheduleStatus();
        }

        if (message.action === "SYNC_ABORTED" && message.data) {
          if (progressSection) progressSection.style.display = "none";
          if (btnBatchSync) btnBatchSync.disabled = false;
          if (btnBatchUnregister) btnBatchUnregister.disabled = false;
          alert(`Đã dừng an toàn tại ca ${message.data.processedCount}/${message.data.totalCount}.`);
          checkTabScheduleStatus();
        }

        if (message.action === "SYNC_ERROR") {
          if (progressSection) progressSection.style.display = "none";
          if (btnBatchSync) btnBatchSync.disabled = false;
          if (btnBatchUnregister) btnBatchUnregister.disabled = false;
          alert("Lỗi khi xử lý: " + message.error);
          checkTabScheduleStatus();
        }
      });
    }

    // Save current selection from active tab as new template (T029)
    const btnSaveCurrentFromTab = document.getElementById("btn-save-current-from-tab");
    if (btnSaveCurrentFromTab) {
      btnSaveCurrentFromTab.addEventListener("click", () => {
        if (typeof chrome === "undefined" || !chrome.tabs || !chrome.tabs.query) return;

        getActiveKynaTab((tab) => {
          if (!tab) {
            alert("Không tìm thấy tab Kyna Teacher đang mở! Vui lòng mở trang Kyna Teacher trên trình duyệt.");
            return;
          }
          const tabId = tab.id;

          const tplName = prompt("Nhập tên gợi nhớ cho mẫu lịch mới lưu từ tab hiện tại:", "Lịch Dạy Chuẩn");
          if (tplName === null) return;

          chrome.tabs.sendMessage(tabId, {
            action: "SAVE_CURRENT_SELECTION_AS_TEMPLATE",
            name: tplName
          }, (response) => {
            if (chrome.runtime.lastError) {
              alert("Không thể kết nối đến trang lịch Kyna trên tab hiện tại!\nNếu bạn vừa cài đặt hoặc cập nhật tiện ích, vui lòng F5 (tải lại trang) trên tab Kyna rồi thử lại.");
              return;
            }
            if (response && response.success) {
              alert(response.message);
              loadTemplatesFromStorage();
              checkTabScheduleStatus();
            } else {
              alert(response ? response.message : "Không thể lưu mẫu lịch!");
            }
          });
        });
      });
    }

    // Check status on load
    checkTabScheduleStatus();

    function timeToMins(t) {
      const parts = t.split(":");
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }

    function minsToTime(m) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    }

    function getDefaultSampleTemplates() {
      // Sample 1: Weekday Evenings 18:00 - 21:00 (T2-T6)
      const slots1 = [];
      [1, 2, 3, 4, 5].forEach(day => {
        ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30"].forEach((start, idx) => {
          const ends = ["18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];
          slots1.push({ dayOfWeek: day, timeStart: start, timeEnd: ends[idx] });
        });
      });

      // Sample 2: Weekend Daytime (T7 & CN)
      const slots2 = [];
      [6, 7].forEach(day => {
        ["08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"].forEach((start, idx) => {
          const ends = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"];
          slots2.push({ dayOfWeek: day, timeStart: start, timeEnd: ends[idx] });
        });
      });

      return [
        {
          id: "tpl_sample_evening",
          name: "Lịch Tối Cố Định (T2 - T6)",
          description: "Ca 18:00 - 21:00 các ngày trong tuần",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          slots: slots1,
          totalSlots: slots1.length,
          totalHours: slots1.length * 0.5
        },
        {
          id: "tpl_sample_weekend",
          name: "Lịch Cuối Tuần Sáng & Chiều (T7 & CN)",
          description: "Ca sáng 08:30-11:30 & chiều 14:00-17:00",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          slots: slots2,
          totalSlots: slots2.length,
          totalHours: slots2.length * 0.5
        }
      ];
    }
  }

  // Initialize schedule assistant
  initScheduleAssistant();
});
