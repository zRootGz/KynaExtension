/**
 * GAMES/SWIMMING-RACE/RACE-LOGIC.JS - Logic Game Đua Bơi Kỳ Phùng Địch Thủ
 * Tạo Overlay hồ bơi sống động trên BBB, điều khiển tốc độ bơi ngẫu nhiên hoặc theo câu trả lời chat của học sinh.
 * Luồng Đua Bơi Tiếp Sức:
 * 1. Phòng chờ (IDLE): Học sinh gõ 'ready' (hoặc r, 1, join, sẵn sàng) -> Tên được thêm vào danh sách.
 * 2. Xuất phát: Tất cả người chơi gõ 'start' (hoặc giáo viên bấm 'Bắt đầu') -> Cuộc đua tự động khởi chạy.
 * 3. Tiếp sức (RACING): Người chơi gõ 'go' (hoặc g, swim, bơi) -> Nhân vật bơi quạt tay tiến lên 16% mỗi lượt.
 */

(function () {
  if (typeof window !== "undefined" && window.kynaSwimmingRaceLoaded) return;
  if (typeof window !== "undefined") window.kynaSwimmingRaceLoaded = true;

  console.log("Kyna BBB Swimming Race Game Module Loaded.");

  // Trạng thái cục bộ của Game Đua Bơi
  let raceState = {
    activeGame: "NONE",        // "GUESS_WORD" | "SWIMMING_RACE" | "NONE"
    gameState: "IDLE",          // "IDLE" | "RACING" | "FINISHED"
    raceMode: "BBB_CHAT",       // "AUTO_SPEED" | "BBB_CHAT"
    students: [],              // Danh sách tên vận động viên
    startedStudents: [],       // Danh sách người chơi đã gõ 'start'
    positions: {},              // { "Bảo Nam": 0, ... } percent 0 -> 100
    rankings: []                // ["Bảo Nam", "Hoàng Minh", ...]
  };

  let overlayEl = null;
  let raceTimerId = null;
  const avatars = ["🏊‍♂️", "🏊‍♀️", "🐬", "🦈", "🏊", "🏊‍♀️", "🚴‍♂️"];

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
      startedStudents: newState.startedStudents || raceState.startedStudents || [],
      positions: newState.positions || raceState.positions || {},
      rankings: newState.rankings || raceState.rankings || []
    };

    // Hiển thị Overlay Đua Bơi khi activeGame === "SWIMMING_RACE"
    if (raceState.activeGame === "SWIMMING_RACE") {
      createOrUpdateOverlay();

      if (raceState.gameState === "RACING") {
        if (oldGameState !== "RACING" && raceState.raceMode === "AUTO_SPEED") {
          startRaceAnimation();
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
   * Vòng lặp hoạt ảnh đua bơi ngẫu nhiên (dành cho chế độ AUTO_SPEED)
   */
  function startRaceAnimation() {
    stopRaceAnimation();
    if (raceState.raceMode !== "AUTO_SPEED") return;

    raceTimerId = setInterval(() => {
      if (raceState.gameState !== "RACING") return;

      let allFinished = true;
      const totalStudents = raceState.students.length;

      raceState.students.forEach((name) => {
        let currentPos = raceState.positions[name] || 0;

        if (currentPos < 100) {
          allFinished = false;
          // Tốc độ bơi ngẫu nhiên kịch tính
          const speedDelta = Math.random() * 3.5 + 0.5;
          currentPos = Math.min(100, currentPos + speedDelta);
          raceState.positions[name] = currentPos;

          // Kiểm tra cán đích
          if (currentPos >= 100 && !raceState.rankings.includes(name)) {
            raceState.rankings.push(name);
          }
        }
      });

      renderSwimmerPositionsUI();

      if (allFinished || raceState.rankings.length >= totalStudents) {
        finishRaceNow();
      }
    }, 300);
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
    return (str || "").toLowerCase().trim();
  }

  function isKeywordMatch(text, keywords) {
    const norm = normStr(text);
    const words = norm.split(/[\s,;.!?]+/);
    return keywords.some(k => words.includes(k) || norm === k);
  }

  /**
   * Xử lý tin nhắn từ khung chat BBB
   * Quyền ưu tiên luồng:
   * 1. Giai đoạn LOBBY / IDLE: Chat 'ready' -> Đăng ký tên. Chat 'start' -> Đánh dấu sẵn sàng xuất phát.
   * 2. Giai đoạn RACING: Chat 'go' -> Nhân vật bơi tiến lên 16%.
   */
  function onBBBMessageReceived(senderName, rawMessage) {
    if (raceState.activeGame !== "SWIMMING_RACE") return;
    if (!senderName || !senderName.trim()) return;

    const cleanSender = senderName.trim();
    const normSender = normStr(cleanSender);
    const messageText = rawMessage || "";

    const findStudentIndex = () => (raceState.students || []).findIndex(s => normStr(s) === normSender);

    // GIAI ĐOẠN 1 & 2: PHÒNG CHỜ (IDLE hoặc FINISHED)
    if (raceState.gameState === "IDLE" || raceState.gameState === "FINISHED") {
      const isReady = isKeywordMatch(messageText, ["ready", "r", "sanssang", "join", "boi", "1", "ok"]);
      const isStart = isKeywordMatch(messageText, ["start", "s", "batdau"]);

      let stateChanged = false;

      // 1. Nhập READY hoặc START -> Thêm tên học sinh vào danh sách cuộc đua
      let idx = findStudentIndex();
      if (isReady || isStart || raceState.raceMode === "BBB_CHAT") {
        if (idx === -1) {
          raceState.students.push(cleanSender);
          raceState.positions[cleanSender] = 0;
          idx = raceState.students.length - 1;
          stateChanged = true;
        }
      }

      // 2. Nhập START -> Đánh dấu người chơi sẵn sàng xuất phát
      if (isStart) {
        if (!raceState.startedStudents) raceState.startedStudents = [];
        const alreadyStarted = raceState.startedStudents.some(s => normStr(s) === normSender);
        if (!alreadyStarted) {
          raceState.startedStudents.push(cleanSender);
          stateChanged = true;
        }

        // Kiểm tra xem tất cả người chơi trong danh sách đã gõ 'start' chưa
        if (raceState.students.length > 0 && raceState.startedStudents.length >= raceState.students.length) {
          startRaceNow();
          return;
        }
      }

      if (stateChanged) {
        createOrUpdateOverlay();
        saveStateToStorage();
      }
      return;
    }

    // GIAI ĐOẠN 3: ĐUA BƠI TIẾP SỨC (RACING)
    if (raceState.gameState === "RACING") {
      const isGo = isKeywordMatch(messageText, ["go", "g", "swim", "boi", "tiepsuc", "fast", "speed", "run"]);

      let idx = findStudentIndex();

      if (idx === -1 && raceState.raceMode === "BBB_CHAT") {
        raceState.students.push(cleanSender);
        raceState.positions[cleanSender] = 0;
        idx = raceState.students.length - 1;
        createOrUpdateOverlay();
      }

      if (idx !== -1 && (isGo || raceState.raceMode === "BBB_CHAT")) {
        const matchedName = raceState.students[idx];
        let currentPos = raceState.positions[matchedName] || 0;

        if (currentPos < 100) {
          // Bơi tiếp sức: Mỗi lần gõ 'go' -> Tiến 16%
          const step = 16;
          currentPos = Math.min(100, currentPos + step);
          raceState.positions[matchedName] = currentPos;

          if (currentPos >= 100 && !raceState.rankings.includes(matchedName)) {
            raceState.rankings.push(matchedName);
          }

          renderSwimmerPositionsUI();

          if (raceState.rankings.length >= raceState.students.length) {
            finishRaceNow();
          } else {
            saveStateToStorage();
          }
        }
      }
    }
  }

  function startRaceNow() {
    stopRaceAnimation();
    raceState.gameState = "RACING";
    raceState.rankings = [];
    raceState.startedStudents = raceState.startedStudents || [];

    // Reset vị trí bơi về 0%
    (raceState.students || []).forEach(name => {
      raceState.positions[name] = 0;
    });

    createOrUpdateOverlay();
    saveStateToStorage();

    if (raceState.raceMode === "AUTO_SPEED") {
      startRaceAnimation();
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
            <span>🏊 KÝ PHÙNG ĐỊCH THỦ - ĐUA BƠI TIẾP SỨC</span>
          </div>
          <div style="display:flex; gap:4px;">
            <button class="kyna-icon-btn" id="kyna-swim-min-btn" title="Thu nhỏ">➖</button>
          </div>
        </div>

        <div class="kyna-swim-body">
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

    renderLanesUI();
    renderSwimmerPositionsUI();
    renderPodiumUI();

    const statusTextEl = document.getElementById("kyna-swim-status-text");
    if (statusTextEl) statusTextEl.textContent = getRaceStatusText();
  }

  function getRaceStatusText() {
    if (raceState.gameState === "RACING") {
      return "🏊 ⚡ BƠI TIẾP SỨC: Học sinh nhắn 'go' (hoặc 'g') trong chat để bơi tiến lên!";
    }
    if (raceState.gameState === "FINISHED") {
      return "🏁 Cuộc đua kết thúc! Chúc mừng các nhà vô địch!";
    }

    const total = (raceState.students || []).length;
    const startedCount = (raceState.startedStudents || []).length;

    if (total === 0) {
      return "🚩 PHÒNG CHỜ: Học sinh nhắn 'ready' trong chat BBB để ghi tên vào đường bơi!";
    }

    return `🚩 PHÒNG CHỜ (${total} người): Đã sẵn sàng ${startedCount}/${total}. Tất cả gõ 'start' để xuất phát!`;
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
          📥 Chưa có học sinh. Nhắn <strong style="color:#38bdf8;">'ready'</strong> trong chat BBB hoặc bấm <strong style="color:#38bdf8;">'📥 Lấy từ lớp BBB'</strong> trên Extension.
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="kyna-finish-line" title="Vạch cán đích"></div>
      ${raceState.students.map((name, idx) => {
        const avatar = avatars[idx % avatars.length];
        const isStarted = (raceState.startedStudents || []).some(s => normStr(s) === normStr(name));
        
        let readyBadge = "";
        if (raceState.gameState === "IDLE") {
          readyBadge = isStarted 
            ? `<span class="kyna-ready-tag tag-started">✅ START</span>`
            : `<span class="kyna-ready-tag tag-ready">⏳ READY</span>`;
        }

        return `
          <div class="kyna-swim-lane">
            <div class="kyna-lane-number">${idx + 1}</div>
            <div class="kyna-swimmer" id="swimmer-lane-${idx}">
              <span class="kyna-swimmer-avatar">${avatar}</span>
              <span class="kyna-swimmer-name">${escapeHtml(name)} ${readyBadge}</span>
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

      // Cập nhật huy chương thứ hạng khi cán đích
      const rankIdx = raceState.rankings.indexOf(name);
      if (rankSlotEl) {
        if (rankIdx === 0) rankSlotEl.innerHTML = `<span class="kyna-rank-badge kyna-rank-1">🥇 Hạng 1</span>`;
        else if (rankIdx === 1) rankSlotEl.innerHTML = `<span class="kyna-rank-badge kyna-rank-2">🥈 Hạng 2</span>`;
        else if (rankIdx === 2) rankSlotEl.innerHTML = `<span class="kyna-rank-badge kyna-rank-3">🥉 Hạng 3</span>`;
        else if (rankIdx > 2) rankSlotEl.innerHTML = `<span class="kyna-rank-badge" style="background:rgba(255,255,255,0.1);">#${rankIdx + 1}</span>`;
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

