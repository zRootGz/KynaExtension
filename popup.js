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
      }).catch(() => { });
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
  function initTabNavigation() {
    elements.tabBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const tabId = btn.getAttribute("data-tab");
        elements.tabBtns.forEach(b => b.classList.remove("active"));
        elements.tabPanels.forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        document.getElementById(tabId).classList.add("active");
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
