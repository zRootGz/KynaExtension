/**
 * GAMES/SWIMMING-RACE/RACE-LOGIC.JS - Logic Game Đua Bơi Kỳ Phùng Địch Thủ
 * Thể thức 1: Đua Bơi Tiếp Sức Từ Vựng (Học sinh gõ đúng từ hiển thị để bơi tiến 1 bước & đổi từ ngẫu nhiên lập tức).
 * Thể thức 2: Đua Bơi Tự Động kiểu Game Vịt trên Web (Bơi tự động theo thời lượng cài đặt 15s - 120s kịch tính).
 * Ghi danh: Học sinh gõ "join" (hoặc "ready", "r", "1") trong chat BBB để tự động vào làn bơi.
 * Bắt đầu: Giáo viên ấn nút "🚀 Bắt đầu Đua Bơi" trên bảng điều khiển.
 */

(function () {
  if (typeof window !== "undefined" && window.kynaSwimmingRaceLoaded) return;
  if (typeof window !== "undefined") window.kynaSwimmingRaceLoaded = true;

  console.log("Kyna BBB Swimming Race Game Module Loaded.");

  // Trạng thái cục bộ của Game Đua Bơi
  let raceState = {
    activeGame: "NONE",            // "NONE" | "SWIMMING_RACE"
    gameState: "IDLE",              // "IDLE" | "RACING" | "FINISHED"
    raceMode: "WORD_RELAY",         // "WORD_RELAY" | "AUTO_SPEED"
    raceDurationSeconds: 30,       // Thời lượng đua tự động (15s - 120s)
    wordCategory: "ALL",           // Chủ đề từ vựng bơi tiếp sức
    currentWordObj: null,          // Từ vựng mục tiêu hiện tại { word, hint, emoji }
    students: [],                  // Danh sách vận động viên bơi
    positions: {},                  // { "Bảo Nam": 0, ... } percent 0 -> 100
    rankings: [],                   // Thứ tự cán đích ["Bảo Nam", "Hoàng Minh", ...]
    finishedStudents: {},          // { "Bảo Nam": { rank: 1 } }
    raceStartTime: null
  };

  let overlayEl = null;
  let raceTimerId = null;
  let usedWordsList = [];
  const avatars = ["🏊‍♂️", "🏊‍♀️", "🐬", "🦈", "🏊", "🏼‍♀️", "🚴‍♂️"];

  init();

  function init() {
    loadStateAndSync();
    setupMessageListeners();
    if (typeof window.initBBBMessageObserver === "function") {
      window.initBBBMessageObserver(onBBBMessageReceived);
    }
  }

  /**
   * Đồng bộ state từ Storage
   */
  function loadStateAndSync() {
    chrome.storage.local.get(["kynaSwimRaceState"], (res) => {
      if (res.kynaSwimRaceState) {
        updateLocalState(res.kynaSwimRaceState);
      }
    });

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === "local" && changes.kynaSwimRaceState) {
        updateLocalState(changes.kynaSwimRaceState.newValue);
      }
    });
  }

  function setupMessageListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "SYNC_SWIM_RACE_STATE") {
        if (message.tabId) window.kynaMyTabId = message.tabId;
        updateLocalState(message.payload);
      } else if (message.action === "FETCH_BBB_STUDENTS") {
        const students = fetchBBBStudentsFromDOM();
        sendResponse({ students: students });
      }
    });
  }

  function fetchBBBStudentsFromDOM() {
    const list = [];
    const nodes = document.querySelectorAll('[data-test="userName"], [class*="userName"], [data-test="userListItem"], [data-test="userListItemCurrent"]');
    nodes.forEach(n => {
      let txt = (n.textContent || "").trim();
      txt = txt.replace(/\(Bạn\)/gi, "")
               .replace(/\(Presenter\)/gi, "")
               .replace(/\(Giáo viên\)/gi, "")
               .replace(/\(Học sinh\)/gi, "")
               .replace(/\(Ngoại tuyến\)/gi, "")
               .trim();
      if (txt && txt.length >= 2 && txt.length <= 40 && !list.includes(txt)) {
        list.push(txt);
      }
    });
    return list;
  }

  /**
   * Chọn từ vựng bơi tiếp sức ngẫu nhiên tiếp theo
   */
  function pickNextRelayWord() {
    let pool = [];
    if (typeof window.getWordsByCategory === "function") {
      pool = window.getWordsByCategory(raceState.wordCategory || "ALL");
    } else if (window.MASTER_WORD_DATABASE) {
      pool = window.MASTER_WORD_DATABASE;
    }

    if (!pool || pool.length === 0) {
      pool = [
        { word: "SWIM", hint: "Move through water", emoji: "🏊" },
        { word: "FISH", hint: "Creature in water", emoji: "🐟" },
        { word: "WATER", hint: "Liquid for drinking & swimming", emoji: "💧" },
        { word: "STAR", hint: "Shines in night sky", emoji: "⭐" },
        { word: "DUCK", hint: "Water bird that quacks", emoji: "🦆" },
        { word: "FAST", hint: "Moving with great speed", emoji: "⚡" }
      ];
    }

    let available = pool.filter(w => !usedWordsList.includes(w.word));
    if (available.length === 0) {
      usedWordsList = [];
      available = pool;
    }

    const randomIndex = Math.floor(Math.random() * available.length);
    const chosen = available[randomIndex];
    usedWordsList.push(chosen.word);
    return chosen;
  }

  /**
   * Cập nhật trạng thái cuộc đua
   */
  function updateLocalState(newState) {
    if (!newState) return;

    if (newState.targetTabId && window.kynaMyTabId && newState.targetTabId !== window.kynaMyTabId) {
      stopRaceAnimation();
      removeOverlay();
      return;
    }

    const oldGameState = raceState.gameState;

    raceState = { 
      ...raceState, 
      ...newState,
      students: newState.students || raceState.students || [],
      positions: newState.positions || raceState.positions || {},
      rankings: newState.rankings || raceState.rankings || [],
      finishedStudents: newState.finishedStudents || raceState.finishedStudents || {}
    };

    if (raceState.activeGame === "SWIMMING_RACE") {
      if (raceState.gameState === "RACING" && oldGameState !== "RACING") {
        usedWordsList = [];
        if (raceState.raceMode === "WORD_RELAY" && (!raceState.currentWordObj || !raceState.currentWordObj.word)) {
          raceState.currentWordObj = pickNextRelayWord();
        }
      }

      createOrUpdateOverlay();

      if (raceState.gameState === "RACING") {
        if (raceState.raceMode === "AUTO_SPEED") {
          if (oldGameState !== "RACING") {
            startRaceAnimation();
          }
        } else {
          stopRaceAnimation();
        }
      } else {
        stopRaceAnimation();
      }
    } else {
      stopRaceAnimation();
      removeOverlay();
    }
  }

  /**
   * Vòng lặp hoạt ảnh đua bơi ngẫu nhiên kiểu Game Vịt (AUTO_SPEED)
   */
  function startRaceAnimation() {
    stopRaceAnimation();
    if (raceState.raceMode !== "AUTO_SPEED") return;

    const durationSec = raceState.raceDurationSeconds || 30;
    const intervalMs = 280;
    const totalSteps = (durationSec * 1000) / intervalMs;
    const baseIncrement = 100 / totalSteps;

    raceState.raceStartTime = Date.now();

    raceTimerId = setInterval(() => {
      if (raceState.gameState !== "RACING") return;

      let allFinished = true;
      const totalStudents = raceState.students.length;

      raceState.students.forEach((name) => {
        let currentPos = raceState.positions[name] || 0;

        if (currentPos < 100) {
          allFinished = false;
          // Tốc độ bơi kịch tính kiểu game vịt (ngẫu nhiên bứt phá & bám đuổi)
          const randomFactor = Math.random() * 2.2 + 0.2;
          const speedDelta = baseIncrement * randomFactor;
          currentPos = Math.min(100, currentPos + speedDelta);
          raceState.positions[name] = currentPos;

          if (currentPos >= 100 && !raceState.rankings.includes(name)) {
            raceState.rankings.push(name);
            raceState.finishedStudents[name] = { rank: raceState.rankings.length };
          }
        }
      });

      renderSwimmerPositionsUI();

      if (allFinished || raceState.rankings.length >= totalStudents) {
        finishRaceNow();
      }
    }, intervalMs);
  }

  function stopRaceAnimation() {
    if (raceTimerId) {
      clearInterval(raceTimerId);
      raceTimerId = null;
    }
  }

  function normStr(str) {
    if (typeof window.normalizeAnswerString === "function") {
      return window.normalizeAnswerString(str || "");
    }
    return (str || "").toUpperCase().trim().replace(/[^A-Z0-9]/g, "");
  }

  function isJoinKeyword(text) {
    const norm = normStr(text);
    return ["JOIN", "READY", "R", "SANSSANG", "BOI", "1", "OK", "JOINED"].includes(norm);
  }

  /**
   * Xử lý tin nhắn từ khung chat BBB
   */
  function onBBBMessageReceived(senderName, rawMessage) {
    if (raceState.activeGame !== "SWIMMING_RACE") return;
    if (!senderName || !senderName.trim()) return;

    const cleanSender = senderName.trim();
    const normSender = normStr(cleanSender);
    const messageText = rawMessage || "";

    const findStudentIndex = () => (raceState.students || []).findIndex(s => normStr(s) === normSender);

    // GIAI ĐOẠN 1: PHÒNG CHỜ (IDLE hoặc FINISHED)
    if (raceState.gameState === "IDLE" || raceState.gameState === "FINISHED") {
      if (isJoinKeyword(messageText) || raceState.raceMode === "WORD_RELAY") {
        let idx = findStudentIndex();
        if (idx === -1) {
          raceState.students.push(cleanSender);
          raceState.positions[cleanSender] = 0;
          createOrUpdateOverlay();
          saveStateToStorage();
        }
      }
      return;
    }

    // GIAI ĐOẠN 2: ĐUA BƠI TIẾP SỨC TỪ VỰNG (RACING - WORD_RELAY)
    if (raceState.gameState === "RACING" && raceState.raceMode === "WORD_RELAY") {
      let idx = findStudentIndex();

      // Nếu học sinh mới nhắn trong lúc đua -> Tự động thêm vào đường đua
      if (idx === -1) {
        raceState.students.push(cleanSender);
        raceState.positions[cleanSender] = 0;
        idx = raceState.students.length - 1;
        createOrUpdateOverlay();
      }

      const matchedName = raceState.students[idx];
      const currentPos = raceState.positions[matchedName] || 0;

      // Nếu người chơi ĐÃ VỀ ĐÍCH -> Không nhận đáp án nữa, chờ các bạn khác
      if (currentPos >= 100) return;

      const normUserMsg = normStr(messageText);
      const targetWordObj = raceState.currentWordObj;

      if (targetWordObj && targetWordObj.word) {
        const normTarget = normStr(targetWordObj.word);

        // HỌC SINH GÕ ĐÚNG TỪ VỰNG MỤC TIÊU!
        if (normUserMsg === normTarget) {
          // Tiến lên 1 bước (+16%)
          const newPos = Math.min(100, currentPos + 16);
          raceState.positions[matchedName] = newPos;

          // Âm thanh báo gõ đúng từ
          if (typeof window.playCorrectSound === "function") {
            window.playCorrectSound();
          }

          // CÁN ĐÍCH!
          if (newPos >= 100 && !raceState.rankings.includes(matchedName)) {
            raceState.rankings.push(matchedName);
            raceState.finishedStudents[matchedName] = { rank: raceState.rankings.length };
            
            if (typeof window.playVictorySound === "function") {
              window.playVictorySound(false);
            }
          }

          // ĐỔI TỪ VỰNG MỚI LẬP TỨC CHO LẦN BƠI TIẾP THEO!
          raceState.currentWordObj = pickNextRelayWord();

          renderSwimmerPositionsUI();
          createOrUpdateOverlay();

          // Kiểm tra xem tất cả học sinh đã về đích chưa
          const allDone = raceState.students.every(s => (raceState.positions[s] || 0) >= 100);
          if (allDone || raceState.rankings.length >= raceState.students.length) {
            finishRaceNow();
          } else {
            saveStateToStorage();
          }
        }
      }
    }
  }

  function finishRaceNow() {
    stopRaceAnimation();
    raceState.gameState = "FINISHED";
    if (typeof window.playVictorySound === "function") {
      window.playVictorySound(true);
    }
    renderPodiumUI();
    createOrUpdateOverlay();
    saveStateToStorage();
  }

  /**
   * Tạo hoặc cập nhật Khung Overlay Đua Bơi
   */
  function createOrUpdateOverlay() {
    if (!overlayEl) {
      overlayEl = document.createElement("div");
      overlayEl.id = "kyna-swimming-overlay";
      overlayEl.innerHTML = `
        <div class="kyna-swim-header" id="kyna-swim-drag">
          <div class="kyna-swim-title">
            <span id="kyna-swim-mode-title">🏊 ĐUA BƠI KÝ PHÙNG ĐỊCH THỦ</span>
          </div>
          <div style="display:flex; gap:4px;">
            <button class="kyna-icon-btn" id="kyna-swim-min-btn" title="Thu nhỏ">➖</button>
          </div>
        </div>

        <div class="kyna-swim-body">
          <div id="kyna-relay-word-prompt-container"></div>

          <div class="kyna-swim-pool" id="kyna-swim-lanes-container"></div>
          
          <div id="kyna-podium-container"></div>

          <div class="kyna-swim-controls">
            <span class="kyna-swim-status" id="kyna-swim-status-text">
              ${getRaceStatusText()}
            </span>
          </div>
        </div>
      `;

      document.body.appendChild(overlayEl);

      if (typeof window.makeElementDraggable === "function") {
        window.makeElementDraggable(overlayEl, document.getElementById("kyna-swim-drag"));
      }

      document.getElementById("kyna-swim-min-btn").addEventListener("click", () => {
        overlayEl.classList.toggle("minimized");
      });
    }

    // Cập nhật thẻ hiển thị Từ vựng mục tiêu (Word Relay Mode)
    renderRelayWordPromptUI();
    renderLanesUI();
    renderSwimmerPositionsUI();
    renderPodiumUI();

    const titleEl = document.getElementById("kyna-swim-mode-title");
    if (titleEl) {
      titleEl.textContent = raceState.raceMode === "WORD_RELAY" 
        ? "🔤 ĐUA BƠI TIẾP SỨC TỪ VỰNG" 
        : `🦆 ĐUA BƠI TỰ ĐỘNG GAME VỊT (${raceState.raceDurationSeconds || 30}s)`;
    }

    const statusTextEl = document.getElementById("kyna-swim-status-text");
    if (statusTextEl) statusTextEl.textContent = getRaceStatusText();
  }

  /**
   * Hiển thị Từ vựng mục tiêu bơi tiếp sức
   */
  function renderRelayWordPromptUI() {
    const container = document.getElementById("kyna-relay-word-prompt-container");
    if (!container) return;

    if (raceState.raceMode !== "WORD_RELAY" || raceState.gameState !== "RACING") {
      container.innerHTML = "";
      return;
    }

    const w = raceState.currentWordObj || { word: "READY", hint: "Gõ từ vựng xuất hiện để bơi!", emoji: "🎯" };

    container.innerHTML = `
      <div class="kyna-swim-word-card">
        <div class="kyna-word-prompt-label">🎯 GÕ TỪ ĐÚNG VÀO CHAT BBB ĐỂ BƠI TIẾN LÊN:</div>
        <div class="kyna-word-target-display">
          <span class="kyna-target-emoji">${w.emoji || "✨"}</span>
          <span class="kyna-target-text">${escapeHtml(w.word)}</span>
        </div>
        <div class="kyna-target-hint">💡 Gợi ý: ${escapeHtml(w.hint || "")}</div>
      </div>
    `;
  }

  function getRaceStatusText() {
    if (raceState.gameState === "RACING") {
      if (raceState.raceMode === "WORD_RELAY") {
        return `🔤 Hãy nhắn "${raceState.currentWordObj ? raceState.currentWordObj.word : "TỪ KHÓA"}" vào chat để tiến lên!`;
      }
      return `⚡ Đang đua bơi tự động kiểu Game Vịt! (${raceState.raceDurationSeconds || 30}s)`;
    }
    if (raceState.gameState === "FINISHED") {
      return "🏁 Cuộc đua kết thúc! Chúc mừng các nhà vô địch!";
    }

    const total = (raceState.students || []).length;
    if (total === 0) {
      return "🚩 PHÒNG CHỜ: Học sinh nhắn 'join' trong chat BBB để ghi tên! (GV bấm Bắt đầu)";
    }

    return `🚩 PHÒNG CHỜ (${total} người bơi): Học sinh nhắn 'join' để ghi tên. GV nhấn 'Bắt đầu' để đua!`;
  }

  /**
   * Khởi tạo đường bơi cho từng học sinh
   */
  function renderLanesUI() {
    const container = document.getElementById("kyna-swim-lanes-container");
    if (!container) return;

    if (!raceState.students || raceState.students.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:24px; color:#94a3b8; font-size:13px; font-weight:600;">
          📥 Chưa có học sinh. Nhắn <strong style="color:#38bdf8;">'join'</strong> trong chat BBB hoặc bấm <strong style="color:#38bdf8;">'📥 Lấy từ lớp BBB'</strong> trên Extension.
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="kyna-finish-line" title="Vạch cán đích"></div>
      ${raceState.students.map((name, idx) => {
        const avatar = avatars[idx % avatars.length];
        
        let statusTag = "";
        if (raceState.gameState === "IDLE") {
          statusTag = `<span class="kyna-ready-tag tag-ready">⏳ PHÒNG CHỜ</span>`;
        }

        return `
          <div class="kyna-swim-lane">
            <div class="kyna-lane-number">${idx + 1}</div>
            <div class="kyna-swimmer" id="swimmer-lane-${idx}">
              <span class="kyna-swimmer-avatar">${avatar}</span>
              <span class="kyna-swimmer-name">${escapeHtml(name)} ${statusTag}</span>
              <span class="kyna-rank-slot" id="rank-slot-${idx}"></span>
            </div>
          </div>`;
      }).join("")}
    `;
  }

  /**
   * Cập nhật vị trí di chuyển của các vận động viên bơi
   */
  function renderSwimmerPositionsUI() {
    if (!raceState.students) return;

    const startPx = 55;
    const maxDistancePx = 425;

    raceState.students.forEach((name, idx) => {
      const swimmerEl = document.getElementById(`swimmer-lane-${idx}`);
      const rankSlotEl = document.getElementById(`rank-slot-${idx}`);
      if (!swimmerEl) return;

      const pct = raceState.positions[name] || 0;
      const currentPx = startPx + (pct / 100) * maxDistancePx;
      swimmerEl.style.left = `${currentPx}px`;

      const rankIdx = raceState.rankings.indexOf(name);
      if (rankSlotEl) {
        if (rankIdx === 0) rankSlotEl.innerHTML = `<span class="kyna-rank-badge kyna-rank-1">🥇 Hạng 1</span>`;
        else if (rankIdx === 1) rankSlotEl.innerHTML = `<span class="kyna-rank-badge kyna-rank-2">🥈 Hạng 2</span>`;
        else if (rankIdx === 2) rankSlotEl.innerHTML = `<span class="kyna-rank-badge kyna-rank-3">🥉 Hạng 3</span>`;
        else if (rankIdx > 2) rankSlotEl.innerHTML = `<span class="kyna-rank-badge" style="background:rgba(255,255,255,0.1);">#${rankIdx + 1}</span>`;
        else if (pct >= 100) rankSlotEl.innerHTML = `<span class="kyna-finished-tag">🏁 Đã về đích (Chờ các bạn khác...)</span>`;
        else rankSlotEl.innerHTML = "";
      }
    });
  }

  /**
   * Bảng vinh danh top 3 nhà vô địch đua bơi
   */
  function renderPodiumUI() {
    const container = document.getElementById("kyna-podium-container");
    if (!container) return;

    if (raceState.gameState !== "FINISHED" || raceState.rankings.length === 0) {
      container.innerHTML = "";
      return;
    }

    const r1 = raceState.rankings[0] || "N/A";
    const r2 = raceState.rankings[1] || "N/A";
    const r3 = raceState.rankings[2] || "N/A";

    container.innerHTML = `
      <div class="kyna-podium-box">
        <div class="kyna-podium-title">🏆 VINH DANH NHÀ VÔ ĐỊCH ĐUA BƠI 🏆</div>
        <div class="kyna-podium-ranks">
          <div>🥇 <strong>${escapeHtml(r1)}</strong></div>
          ${raceState.rankings.length > 1 ? `<div>🥈 <strong>${escapeHtml(r2)}</strong></div>` : ""}
          ${raceState.rankings.length > 2 ? `<div>🥉 <strong>${escapeHtml(r3)}</strong></div>` : ""}
        </div>
      </div>
    `;
  }

  function removeOverlay() {
    if (overlayEl && overlayEl.parentNode) {
      overlayEl.parentNode.removeChild(overlayEl);
      overlayEl = null;
    }
  }

  function saveStateToStorage() {
    chrome.storage.local.set({ kynaSwimRaceState: raceState }, () => {
      chrome.runtime.sendMessage({
        action: "SWIM_RACE_STATE_UPDATED",
        payload: raceState
      }).catch(() => {});
    });
  }

  function escapeHtml(str) {
    return (str || "").replace(/[&<>'"]/g, 
      tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
  }
})();


