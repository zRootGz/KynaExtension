/**
 * GAMES/SWIMMING-RACE/RACE-LOGIC.JS - Logic Game Đua Bơi Kỳ Phùng Địch Thủ
 * Thể thức 1: Đua Bơi Tiếp Sức Từ Vựng (Học sinh gõ đúng từ hiển thị để bơi tiến 1 bước & đổi từ ngẫu nhiên lập tức).
 * Thể thức 2: Đua Bơi Tự Động kiểu Game Vịt trên Web (Bơi tự động theo thời lượng cài đặt 15s - 120s kịch tính).
 * Ghi danh: Học sinh gõ "join" (hoặc "ready", "r", "1") trong chat BBB để tự động vào làn bơi.
 * Bắt đầu: Giáo viên ấn nút "🚀 Bắt đầu Đua Bơi" trên bảng điều khiển.
 */

(function () {
  console.log("Kyna BBB Swimming Race Game Module Loaded.");

  // Trạng thái cục bộ của Game Đua Bơi
  let raceState = {
    activeGame: "NONE",            // "NONE" | "SWIMMING_RACE"
    gameState: "IDLE",              // "IDLE" | "RACING" | "FINISHED"
    raceMode: "WORD_RELAY",         // "WORD_RELAY" | "AUTO_SPEED"
    raceDurationSeconds: 90,       // Thời lượng đua tối đa cho Word Relay
    raceDistanceMeters: 500,       // Độ dài đường đua mét cho Auto Speed (100m - 2000m)
    timeLeftSeconds: 90,           // Đếm ngược thời gian cho Word Relay
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
  let countdownTimerId = null;
  let usedWordsList = [];
  const avatars = ["🏊‍♂️", "🏊‍♀️", "🐬", "🦈", "🧜‍♀️", "🦆", "⛵", "🚴‍♂️"];

  init();

  function init() {
    loadStateAndSync();
    setupMessageListeners();
    if (typeof window.initBBBMessageObserver === "function") {
      window.initBBBMessageObserver(onBBBMessageReceived);
    }
  }

  /**
   * Sync state from storage — initial load only, no storage.onChanged (would fire on all tabs).
   */
  function loadStateAndSync() {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      if (!window.kynaSwimStorageListenerSet) {
        window.kynaSwimStorageListenerSet = true;
        try {
          chrome.storage.local.get(["kynaSwimRaceState"], (res) => {
            if (res && res.kynaSwimRaceState) {
              const saved = res.kynaSwimRaceState;
              // Only restore an active race on the specific tab it was started on.
              if (saved.activeGame === "SWIMMING_RACE" && saved.activeTabId) {
                chrome.runtime.sendMessage({ action: "GET_MY_TAB_ID" }, (resp) => {
                  const myId = (resp && resp.tabId) || null;
                  if (!myId || myId === saved.activeTabId) {
                    updateLocalState(saved);
                  }
                });
              } else if (!saved.activeTabId) {
                // Legacy state without tabId — show normally
                updateLocalState(saved);
              }
              // If activeTabId is set and doesn't match: ignore (other tab's race)
            }
          });
          // NOTE: We intentionally do NOT add chrome.storage.onChanged here.
          // It fires on ALL tabs simultaneously. Use chrome.runtime.onMessage instead.
        } catch (e) {}
      }
    }

    if (!window.kynaSwimLocalStorageListenerSet) {
      window.kynaSwimLocalStorageListenerSet = true;

      window.addEventListener("message", (e) => {
        if (e.data && e.data.action === "SYNC_SWIM_RACE_STATE") {
          updateLocalState(e.data.payload);
        }
      });
    }
  }

  function setupMessageListeners() {
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
      if (!window.kynaSwimMsgListenerSet) {
        window.kynaSwimMsgListenerSet = true;
        try {
          chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message && message.action === "SYNC_SWIM_RACE_STATE") {
              if (message.tabId) window.kynaMyTabId = message.tabId;
              updateLocalState(message.payload);
            } else if (message && message.action === "FETCH_BBB_STUDENTS") {
              const students = fetchBBBStudentsFromDOM();
              if (typeof sendResponse === "function") sendResponse({ students: students });
            }
          });
        } catch (e) {}
      }
    }
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

    const oldGameState = raceState.gameState;
    const existingWordObj = raceState.currentWordObj;

    raceState = { 
      ...raceState, 
      ...newState,
      students: newState.students || raceState.students || [],
      positions: newState.positions || raceState.positions || {},
      rankings: newState.rankings || raceState.rankings || [],
      finishedStudents: newState.finishedStudents || raceState.finishedStudents || {},
      currentWordObj: newState.currentWordObj || existingWordObj
    };

    if (raceState.activeGame === "SWIMMING_RACE") {
      if (raceState.gameState === "RACING") {
        if (!raceState.timeLeftSeconds || raceState.timeLeftSeconds <= 0 || oldGameState !== "RACING") {
          if (!raceState.timeLeftSeconds || raceState.timeLeftSeconds <= 0) {
            raceState.timeLeftSeconds = raceState.raceDurationSeconds || 60;
          }
          startRaceCountdownTimer();
        }

        if (raceState.raceMode === "WORD_RELAY") {
          if (!raceState.currentWordObj || !raceState.currentWordObj.word) {
            raceState.currentWordObj = pickNextRelayWord();
            saveStateToStorage();
          }
        }
      }

      createOrUpdateOverlay();

      if (raceState.gameState === "RACING") {
        if (typeof window.playBgmSound === "function") {
          window.playBgmSound("SWIMMING_RACE");
        }
        if (raceState.raceMode === "AUTO_SPEED") {
          startRaceAnimation();
        } else {
          stopRaceAnimation();
        }
      } else {
        if (typeof window.stopBgmSound === "function") {
          window.stopBgmSound();
        }
        stopRaceAnimation();
        stopRaceCountdownTimer();
      }
    } else {
      if (typeof window.stopBgmSound === "function") {
        window.stopBgmSound();
      }
      stopRaceAnimation();
      stopRaceCountdownTimer();
      removeOverlay();
    }
  }

  /**
   * Bộ đếm ngược tổng thời gian cuộc đua (cho cả Word Relay & Auto Speed)
   */
  function startRaceCountdownTimer() {
    stopRaceCountdownTimer();
    if (raceState.gameState !== "RACING") return;

    if (!raceState.timeLeftSeconds || raceState.timeLeftSeconds <= 0) {
      raceState.timeLeftSeconds = raceState.raceDurationSeconds || 60;
    }

    updateOverlayTimerUI();

    countdownTimerId = setInterval(() => {
      if (raceState.gameState !== "RACING") return;

      raceState.timeLeftSeconds--;
      updateOverlayTimerUI();

      if (raceState.timeLeftSeconds <= 0) {
        stopRaceCountdownTimer();
        finishRaceNow();
      }
    }, 1000);
  }

  function stopRaceCountdownTimer() {
    if (countdownTimerId) {
      clearInterval(countdownTimerId);
      countdownTimerId = null;
    }
  }

  let distanceMeters = {}; // { "Bảo Nam": 120.5 } Quãng đường bơi tuyệt đối (Mét)
  let currentSpeeds = {}; // Tốc độ hiện tại (Lerp mượt)
  let targetSpeeds = {};  // Tốc độ mục tiêu
  let phaseTicksLeft = {}; // Đếm ngược phase tốc độ
  let swimmerEffects = {}; // { "Bảo Nam": { state: "NORMAL"|"BOOST"|"SLOW" } }
  let swimmerSkills = {}; // { "Bảo Nam": 0.6..1.5 } Hệ số thể lực/kỹ năng ngẫu nhiên
  let currentCameraStartMeters = 0; // Góc quay Camera smooth lerp

  function updateOverlayTimerUI() {
    const timerValEl = document.getElementById("kyna-swim-timer-val");
    const fillEl = document.getElementById("kyna-swim-progress-fill");
    if (!timerValEl || !fillEl) return;

    if (raceState.raceMode === "AUTO_SPEED") {
      const totalMeters = raceState.raceDistanceMeters || 500;
      let maxMeters = 0;
      (raceState.students || []).forEach(name => {
        const d = distanceMeters[name] || 0;
        if (d > maxMeters) maxMeters = d;
      });
      timerValEl.textContent = `🚩 Leader: ${Math.floor(maxMeters)}m / ${totalMeters}m`;
      const pct = Math.min(100, Math.max(0, (maxMeters / totalMeters) * 100));
      fillEl.style.width = `${pct}%`;
    } else {
      const current = Math.max(0, raceState.timeLeftSeconds || 0);
      const total = raceState.raceDurationSeconds || 90;
      timerValEl.textContent = `⏳ ${current}s`;
      const pct = Math.max(0, (current / total) * 100);
      fillEl.style.width = `${pct}%`;
    }
  }

  /**
   * Vòng lặp hoạt ảnh đua bơi mượt mà kiểu Game Vịt (online-stopwatch.com/duck-race)
   * Tần số 60ms (16.6 FPS) với vật lý quán tính Velocity Lerp & Camera Lerp siêu mượt
   */
  function startRaceAnimation() {
    stopRaceAnimation();
    if (raceState.raceMode !== "AUTO_SPEED") return;

    const totalMeters = raceState.raceDistanceMeters || 500;
    const intervalMs = 60; // Tần số 60ms cho chuyển động siêu mượt không giật lag

    // Tính toán tốc độ bơi thực tế tùy theo độ dài đường đua (2000m diễn ra trong ~3.5 phút kịch tính)
    let targetRaceTicks = 950;
    if (totalMeters <= 100) targetRaceTicks = 280;        // ~17s
    else if (totalMeters <= 200) targetRaceTicks = 480;   // ~28s
    else if (totalMeters <= 500) targetRaceTicks = 950;   // ~57s
    else if (totalMeters <= 1000) targetRaceTicks = 1800; // ~108s (1.8m)
    else targetRaceTicks = 3400;                         // ~204s (3.4m)

    const baseStepMeters = totalMeters / targetRaceTicks;

    raceState.raceStartTime = Date.now();
    raceState.finishTimeoutId = null;
    swimmerEffects = {};
    swimmerSkills = {};
    distanceMeters = {};
    currentSpeeds = {};
    targetSpeeds = {};
    phaseTicksLeft = {};
    currentCameraStartMeters = 0;

    raceState.students.forEach(name => {
      swimmerEffects[name] = { state: "NORMAL" };
      // Hệ số kỹ năng/thể lực hài hòa từ 0.65x đến 1.45x tạo khoảng cách tự nhiên
      swimmerSkills[name] = Math.random() * 0.8 + 0.65;
      distanceMeters[name] = 0;
      currentSpeeds[name] = 1.0;
      targetSpeeds[name] = 1.0;
      phaseTicksLeft[name] = 0;
      raceState.positions[name] = 0;
    });

    const poolEl = document.getElementById("kyna-swim-lanes-container");
    if (poolEl) poolEl.classList.add("is-racing");

    raceTimerId = setInterval(() => {
      if (raceState.gameState !== "RACING") return;

      let allFinished = true;
      const totalStudents = raceState.students.length;

      // Tìm vị trí mét của người dẫn đầu
      let maxMeters = 0;
      raceState.students.forEach(name => {
        const d = distanceMeters[name] || 0;
        if (d > maxMeters) maxMeters = d;
      });

      raceState.students.forEach((name) => {
        let currentMeters = distanceMeters[name] || 0;

        if (currentMeters < totalMeters) {
          allFinished = false;

          const skill = swimmerSkills[name] || 1.0;
          let ticks = phaseTicksLeft[name] || 0;

          if (ticks > 0) {
            phaseTicksLeft[name] = ticks - 1;
          } else {
            // Thay đổi trạng thái bứt tốc / nghỉ ngơi mượt mà
            const distFromLeader = maxMeters - currentMeters;
            const boostChance = 0.15 + (distFromLeader > 30 ? 0.15 : 0);
            const slowChance = 0.20;

            const roll = Math.random();
            let effectState = "NORMAL";
            let targetSpd = (Math.random() * 0.4 + 0.85) * skill;
            let durationTicks = Math.floor(Math.random() * 20) + 15;

            if (roll < boostChance) {
              effectState = "BOOST";
              targetSpd = (Math.random() * 0.5 + 1.4) * skill; // Bứt tốc mượt 1.4x - 1.9x * skill
              durationTicks = Math.floor(Math.random() * 25) + 20; // 1.2s - 2.7s
            } else if (roll < boostChance + slowChance) {
              effectState = "SLOW";
              targetSpd = (Math.random() * 0.25 + 0.35) * skill; // Đuối sức mượt 0.35x - 0.6x * skill
              durationTicks = Math.floor(Math.random() * 30) + 20;
            }

            swimmerEffects[name] = { state: effectState };
            targetSpeeds[name] = targetSpd;
            phaseTicksLeft[name] = durationTicks;
          }

          // Nội suy tốc độ (Inertia Velocity Lerp) tạo chuyển động gia tốc siêu mượt
          const curSpd = currentSpeeds[name] || 1.0;
          const tgtSpd = targetSpeeds[name] || 1.0;
          const nextSpd = curSpd + (tgtSpd - curSpd) * 0.08;
          currentSpeeds[name] = nextSpd;

          const deltaMeters = baseStepMeters * nextSpd;
          // Cho phép bơi tiếp tục qua vạch đích (tối đa totalMeters + 12) để cán qua đích mượt mà trước khi biến mất!
          currentMeters = Math.min(totalMeters + 12, currentMeters + deltaMeters);
          distanceMeters[name] = currentMeters;

          const pct = Math.min(100, (currentMeters / totalMeters) * 100);
          raceState.positions[name] = pct;

          if (currentMeters >= totalMeters && !raceState.rankings.includes(name)) {
            raceState.rankings.push(name);
            raceState.finishedStudents[name] = { rank: raceState.rankings.length };
          }
        }
      });

      renderSwimmerPositionsUI();
      updateOverlayTimerUI();

      // Dừng cuộc đua ngay lập tức khi đã xác định đủ Top 3 nhà vô địch (🥇 🥈 🥉)!
      const targetWinnersCount = Math.min(3, totalStudents);
      if (allFinished || raceState.rankings.length >= targetWinnersCount) {
        if (!raceState.finishTimeoutId) {
          raceState.finishTimeoutId = setTimeout(() => {
            raceState.finishTimeoutId = null;
            finishRaceNow();
          }, 1200);
        }
      }
    }, intervalMs);
  }

  function stopRaceAnimation() {
    if (raceTimerId) {
      clearInterval(raceTimerId);
      raceTimerId = null;
    }
    const poolEl = document.getElementById("kyna-swim-lanes-container");
    if (poolEl) poolEl.classList.remove("is-racing");
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
      // Chỉ thêm người chơi khi gõ đúng từ khóa gia nhập (join, ready, r, 1...)
      if (isJoinKeyword(messageText)) {
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

      // Nếu người chơi chưa có tên nhưng nhắn từ khóa join -> Cho gia nhập cuộc đua
      if (idx === -1 && isJoinKeyword(messageText)) {
        raceState.students.push(cleanSender);
        raceState.positions[cleanSender] = 0;
        idx = raceState.students.length - 1;
        createOrUpdateOverlay();
        saveStateToStorage();
        return;
      }

      // Nếu người chơi không thuộc danh sách cuộc đua -> Bỏ qua
      if (idx === -1) return;

      const matchedName = raceState.students[idx];
      const currentPos = raceState.positions[matchedName] || 0;

      // Nếu người chơi ĐÃ VỀ ĐÍCH -> Không nhận đáp án nữa, chờ các bạn khác
      if (currentPos >= 100) return;

      const normUserMsg = normStr(messageText);
      const targetWordObj = raceState.currentWordObj;

      if (targetWordObj && targetWordObj.word) {
        const normTarget = normStr(targetWordObj.word);
        const tokens = messageText.toString().trim().toUpperCase().split(/[^A-Z0-9]+/);

        // HỌC SINH GÕ ĐÚNG TỪ VỰNG MỤC TIÊU!
        if (normUserMsg === normTarget || tokens.includes(normTarget)) {
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
          saveStateToStorage();

          // Kiểm tra xem tất cả học sinh đã về đích chưa
          const allDone = raceState.students.every(s => (raceState.positions[s] || 0) >= 100);
          if (allDone || raceState.rankings.length >= raceState.students.length) {
            finishRaceNow();
          }
        }
      }
    }
  }

  function finishRaceNow() {
    stopRaceAnimation();
    stopRaceCountdownTimer();
    if (typeof window.stopBgmSound === "function") {
      window.stopBgmSound();
    }
    raceState.gameState = "FINISHED";

    // Xếp hạng các vận động viên chưa về đích theo phần trăm quãng đường đã bơi xa nhất!
    const unranked = raceState.students.filter(name => !raceState.rankings.includes(name));
    unranked.sort((a, b) => (raceState.positions[b] || 0) - (raceState.positions[a] || 0));

    unranked.forEach(name => {
      raceState.rankings.push(name);
      raceState.finishedStudents[name] = { rank: raceState.rankings.length };
    });

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
    let existing = document.getElementById("kyna-swimming-overlay");
    if (!existing) {
      overlayEl = document.createElement("div");
      overlayEl.id = "kyna-swimming-overlay";
      overlayEl.innerHTML = `
        <div class="kyna-swim-header" id="kyna-swim-drag">
          <div class="kyna-swim-title">
            <span id="kyna-swim-mode-title">🏊 SWIMMING RACE</span>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="kyna-icon-btn" id="kyna-swim-sound-btn" title="Toggle BGM & Sound">🔊</button>
            <button class="kyna-icon-btn" id="kyna-swim-min-btn" title="Minimize/Expand">➖</button>
            <button class="kyna-icon-btn kyna-close-btn" id="kyna-swim-close-btn" title="Close Game">✖</button>
          </div>
        </div>

        <div class="kyna-swim-body">
          <div id="kyna-relay-word-prompt-container"></div>

          <div class="kyna-swim-timer-bar">
            <span class="kyna-swim-timer-text" id="kyna-swim-timer-val">⏱ ${raceState.timeLeftSeconds || 90}s</span>
            <div class="kyna-swim-progress-bg">
              <div class="kyna-swim-progress-fill" id="kyna-swim-progress-fill"></div>
            </div>
          </div>

          <div class="kyna-swim-pool" id="kyna-swim-lanes-container"></div>
          
          <div id="kyna-podium-container"></div>

          <div class="kyna-swim-controls">
            <span class="kyna-swim-status" id="kyna-swim-status-text">
              ${getRaceStatusText()}
            </span>
          </div>
        </div>
      `;

      (document.body || document.documentElement).appendChild(overlayEl);

      if (typeof window.makeElementDraggable === "function") {
        window.makeElementDraggable(overlayEl, document.getElementById("kyna-swim-drag"));
      }

      document.getElementById("kyna-swim-min-btn").addEventListener("click", () => {
        overlayEl.classList.toggle("minimized");
      });

      const closeBtn = document.getElementById("kyna-swim-close-btn");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          stopRaceAnimation();
          stopRaceCountdownTimer();
          if (typeof window.stopBgmSound === "function") {
            window.stopBgmSound();
          }
          raceState.activeGame = "NONE";
          raceState.gameState = "IDLE";
          saveStateToStorage();
          removeOverlay();
        });
      }

      const swimSoundBtn = document.getElementById("kyna-swim-sound-btn");
      if (swimSoundBtn) {
        swimSoundBtn.addEventListener("click", () => {
          const isMuted = typeof window.toggleSoundMuted === "function" ? window.toggleSoundMuted() : false;
          swimSoundBtn.innerHTML = isMuted ? '🔇' : '🔊';
          if (!isMuted && raceState.gameState === "RACING") {
            if (typeof window.playBgmSound === "function") window.playBgmSound("SWIMMING_RACE");
          }
        });
      }
    } else {
      overlayEl = existing;
    }

    overlayEl.style.display = "block";

    const swimSoundBtn = document.getElementById("kyna-swim-sound-btn");
    if (swimSoundBtn) {
      const isMuted = typeof window.getSoundMuted === "function" ? window.getSoundMuted() : false;
      swimSoundBtn.innerHTML = isMuted ? '🔇' : '🔊';
    }

    // Cập nhật thẻ hiển thị Từ vựng mục tiêu (Word Relay Mode)
    renderRelayWordPromptUI();
    renderLanesUI();
    renderSwimmerPositionsUI();
    renderPodiumUI();
    updateOverlayTimerUI();

    const titleEl = document.getElementById("kyna-swim-mode-title");
    if (titleEl) {
      titleEl.textContent = raceState.raceMode === "WORD_RELAY" 
        ? "🔤 WORD RELAY RACE" 
        : `🦆 DUCK AUTO RACE (${raceState.raceDistanceMeters || 500}m)`;
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

    if (raceState.raceMode !== "WORD_RELAY") {
      container.innerHTML = "";
      return;
    }

    // Tự động chọn từ nếu đang đua mà chưa có từ
    if (raceState.gameState === "RACING" && (!raceState.currentWordObj || !raceState.currentWordObj.word)) {
      raceState.currentWordObj = pickNextRelayWord();
    }

    const w = raceState.currentWordObj;
    if (!w || !w.word || raceState.gameState !== "RACING") {
      if (raceState.gameState === "IDLE") {
        container.innerHTML = `
          <div class="kyna-swim-word-card" style="border-color:#f59e0b;">
            <div class="kyna-word-prompt-label">🏁 MODE: WORD RELAY RACE</div>
            <div class="kyna-target-hint">Students type 'join' in BBB chat to register. Teacher clicks 'Start' to race!</div>
          </div>`;
      } else {
        container.innerHTML = "";
      }
      return;
    }

    container.innerHTML = `
      <div class="kyna-swim-word-card">
        <div class="kyna-word-prompt-label">🎯 TYPE THIS WORD IN BBB CHAT TO SWIM FORWARD:</div>
        <div class="kyna-word-target-display">
          <span class="kyna-target-emoji">${w.emoji || "🏊"}</span>
          <span class="kyna-target-text">${escapeHtml(w.word)}</span>
        </div>
        <div class="kyna-target-hint">💡 Hint: ${escapeHtml(w.hint || "")}</div>
      </div>
    `;
  }

  function getRaceStatusText() {
    if (raceState.gameState === "RACING") {
      if (raceState.raceMode === "WORD_RELAY") {
        const wordStr = raceState.currentWordObj ? raceState.currentWordObj.word : "WORD";
        return `🔤 Type "${wordStr}" in BBB chat to move forward!`;
      }

      const totalMeters = raceState.raceDistanceMeters || 500;
      let maxMeters = 0;
      (raceState.students || []).forEach(name => {
        const d = distanceMeters[name] || 0;
        if (d > maxMeters) maxMeters = d;
      });

      if (maxMeters >= totalMeters * 0.75) {
        return `🏁 FINISH LINE APPEARED! Swimmers are sprinting to the finish line! ⚡`;
      }
      return `⚡ Auto Duck Race in progress! (${Math.floor(maxMeters)}m / ${totalMeters}m)`;
    }
    if (raceState.gameState === "FINISHED") {
      return "🏁 Race Finished! Congratulations to the champions!";
    }

    const total = (raceState.students || []).length;
    if (total === 0) {
      return "🚩 LOBBY: Students type 'join' in BBB chat to register! (Teacher clicks Start)";
    }

    return `🚩 LOBBY (${total} swimmers): Students type 'join' in chat to register. Teacher clicks 'Start' to race!`;
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
          📥 No swimmers registered. Type <strong style="color:#38bdf8;">'join'</strong> in BBB chat or click <strong style="color:#38bdf8;">'📥 Fetch from BBB'</strong> in Popup.
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="kyna-finish-line" title="Finish Line"></div>
      ${raceState.students.map((name, idx) => {
        const avatar = avatars[idx % avatars.length];
        
        let statusTag = "";
        if (raceState.gameState === "IDLE") {
          statusTag = `<span class="kyna-ready-tag tag-ready">⏳ LOBBY</span>`;
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
   * Hỗ trợ hệ thống Camera tracking đuổi theo tay bơi dẫn đầu & đẩy các tay bơi tụt hậu trôi khỏi màn hình (Left < 0)
   */
  function renderSwimmerPositionsUI() {
    if (!raceState.students) return;

    const startPx = 55;
    const maxDistancePx = 390; // Khoảng cách bơi tối đa để Avatar dẫn đầu chạm vạch đích đỏ mà không tràn ra ngoài

    let maxMeters = 0;
    (raceState.students || []).forEach((name) => {
      const d = distanceMeters[name] || 0;
      if (d > maxMeters) maxMeters = d;
    });

    const totalMeters = raceState.raceDistanceMeters || 500;
    
    // Tính toán góc quay Camera bám chặt tay bơi dẫn đầu (Viewport cố định 50m nước)
    const viewportSpanMeters = 50;
    let targetCam = 0;

    if (maxMeters < totalMeters - viewportSpanMeters * 0.4) {
      // Giữ người dẫn đầu luôn ở vị trí 65% khung nhìn lane
      targetCam = Math.max(0, maxMeters - viewportSpanMeters * 0.65);
    } else {
      // Đã tới chặng vạch đích -> Giữ cố định Camera ở cuối bể bơi
      targetCam = Math.max(0, totalMeters - viewportSpanMeters);
    }

    // Nội suy mượt mà vị trí Camera bám đuổi tay bơi dẫn đầu
    currentCameraStartMeters += (targetCam - currentCameraStartMeters) * 0.12;

    // Hiển thị vạch đích khi leader tiến vào chặng cuối hoặc camera đến khu vực đích!
    const poolContainer = document.getElementById("kyna-swim-lanes-container");
    if (poolContainer) {
      const finishLineEl = poolContainer.querySelector(".kyna-finish-line");
      if (finishLineEl) {
        if (
          maxMeters >= totalMeters - viewportSpanMeters * 0.75 ||
          currentCameraStartMeters >= totalMeters - viewportSpanMeters * 0.85 ||
          raceState.gameState === "FINISHED"
        ) {
          finishLineEl.classList.add("show-finish-line");
        } else {
          finishLineEl.classList.remove("show-finish-line");
        }
      }
    }

    raceState.students.forEach((name, idx) => {
      const swimmerEl = document.getElementById(`swimmer-lane-${idx}`);
      const rankSlotEl = document.getElementById(`rank-slot-${idx}`);
      if (!swimmerEl) return;

      const currentM = distanceMeters[name] || 0;
      let relPct = 0;
      
      if (raceState.raceMode === "AUTO_SPEED") {
        const relMeter = currentM - currentCameraStartMeters;
        relPct = relMeter / viewportSpanMeters;
      } else {
        relPct = (raceState.positions[name] || 0) / 100;
      }

      const currentPx = startPx + relPct * maxDistancePx;
      swimmerEl.style.left = `${currentPx}px`;

      // Cán qua đích: Tự động mờ biến mất KHI VỀ ĐÍCH để không bị tràn chữ khỏi đường bơi
      const isFinishedStudent = raceState.finishedStudents && raceState.finishedStudents[name];
      const hasReachedTargetMeters = raceState.raceMode === "AUTO_SPEED" 
        ? (currentM >= totalMeters || currentPx >= 445)
        : ((raceState.positions[name] || 0) >= 100);

      const hasCrossedFinish = isFinishedStudent || hasReachedTargetMeters || raceState.gameState === "FINISHED";

      if (hasCrossedFinish) {
        swimmerEl.classList.add("has-crossed-finish");
      } else {
        swimmerEl.classList.remove("has-crossed-finish");
      }

      // Cập nhật hiệu ứng Bứt Tốc / Đuối Sức trực tiếp trên avatar & tên (không dùng thẻ chữ)
      const effect = swimmerEffects[name];
      if (effect && effect.state === "BOOST") {
        swimmerEl.classList.add("is-boosting");
        swimmerEl.classList.remove("is-slowing");
      } else if (effect && effect.state === "SLOW") {
        swimmerEl.classList.add("is-slowing");
        swimmerEl.classList.remove("is-boosting");
      } else {
        swimmerEl.classList.remove("is-boosting", "is-slowing");
      }

      // Giữ làn bơi sạch sẽ 100% (Không hiện huy chương hay thẻ chữ lộn xộn trên đường bơi)
      // Danh hiệu Top 1 2 3 sẽ được công bố trang trọng tại Bảng Vinh Danh Podiums ở dưới khi cuộc đua kết thúc!
      if (rankSlotEl) {
        if (rankSlotEl.dataset.currentRankHtml !== "") {
          rankSlotEl.innerHTML = "";
          rankSlotEl.dataset.currentRankHtml = "";
        }
      }
    });
  }

  /**
   * Bảng vinh danh Top 3 nhà vô địch dạng bục trao giải 3D ngay chính giữa bể bơi
   */
  function renderPodiumUI() {
    const poolContainer = document.getElementById("kyna-swim-lanes-container");
    const bottomContainer = document.getElementById("kyna-podium-container");
    if (!poolContainer) return;

    let podiumOverlayEl = poolContainer.querySelector(".kyna-podium-ceremony-overlay");

    if (raceState.gameState !== "FINISHED" || !raceState.rankings || raceState.rankings.length === 0) {
      if (podiumOverlayEl) podiumOverlayEl.remove();
      if (bottomContainer) bottomContainer.innerHTML = "";
      return;
    }

    if (bottomContainer) bottomContainer.innerHTML = ""; // Giữ dưới gọn gàng

    const getStudentInfo = (rankIndex) => {
      const name = raceState.rankings[rankIndex];
      if (!name) return null;
      const sIdx = (raceState.students || []).indexOf(name);
      const avatar = sIdx !== -1 ? avatars[sIdx % avatars.length] : "🏊‍♂️";
      return { name, avatar };
    };

    const r1 = getStudentInfo(0);
    const r2 = getStudentInfo(1);
    const r3 = getStudentInfo(2);

    if (!podiumOverlayEl) {
      podiumOverlayEl = document.createElement("div");
      podiumOverlayEl.className = "kyna-podium-ceremony-overlay";
      poolContainer.appendChild(podiumOverlayEl);
    }

    podiumOverlayEl.innerHTML = `
      <div class="kyna-podium-ceremony-card">
        <div class="kyna-podium-header-banner">
          <span class="kyna-podium-crown-icon">👑</span>
          <span class="kyna-podium-header-title">HALL OF FAME - CHAMPIONS</span>
          <span class="kyna-podium-crown-icon">👑</span>
        </div>

        <div class="kyna-podium-stage">
          <!-- TOP 2 (BÊN TRÁI) -->
          ${r2 ? `
          <div class="kyna-podium-col col-rank-2">
            <div class="kyna-podium-student-badge">
              <span class="kyna-podium-avatar-icon">${r2.avatar}</span>
              <span class="kyna-podium-student-name">${escapeHtml(r2.name)}</span>
            </div>
            <div class="kyna-podium-pedestal pedestal-2">
              <span class="kyna-podium-medal-icon">🥈</span>
              <span class="kyna-podium-step-num">2</span>
            </div>
          </div>` : ""}

          <!-- TOP 1 (CHÍNH GIỮA - QUÁN QUÂN CAO NHẤT) -->
          ${r1 ? `
          <div class="kyna-podium-col col-rank-1">
            <div class="kyna-podium-top1-crown">👑 CHAMPION</div>
            <div class="kyna-podium-student-badge is-gold-winner">
              <span class="kyna-podium-avatar-icon gold-avatar">${r1.avatar}</span>
              <span class="kyna-podium-student-name gold-name">${escapeHtml(r1.name)}</span>
            </div>
            <div class="kyna-podium-pedestal pedestal-1">
              <span class="kyna-podium-medal-icon">🥇</span>
              <span class="kyna-podium-step-num">1</span>
            </div>
          </div>` : ""}

          <!-- TOP 3 (BÊN PHẢI) -->
          ${r3 ? `
          <div class="kyna-podium-col col-rank-3">
            <div class="kyna-podium-student-badge">
              <span class="kyna-podium-avatar-icon">${r3.avatar}</span>
              <span class="kyna-podium-student-name">${escapeHtml(r3.name)}</span>
            </div>
            <div class="kyna-podium-pedestal pedestal-3">
              <span class="kyna-podium-medal-icon">🥉</span>
              <span class="kyna-podium-step-num">3</span>
            </div>
          </div>` : ""}
        </div>

        <div class="kyna-podium-actions">
          <button class="kyna-podium-btn btn-restart-race" id="kyna-btn-restart-swim-race">🔄 Restart Race</button>
          <button class="kyna-podium-btn btn-close-podium" id="kyna-btn-close-podium">✖ Close</button>
        </div>
      </div>
    `;

    const restartBtn = podiumOverlayEl.querySelector("#kyna-btn-restart-swim-race");
    if (restartBtn) {
      restartBtn.addEventListener("click", () => {
        stopRaceAnimation();
        stopRaceCountdownTimer();
        raceState.gameState = "IDLE";
        raceState.rankings = [];
        raceState.finishedStudents = {};
        (raceState.students || []).forEach(name => {
          raceState.positions[name] = 0;
        });
        distanceMeters = {};
        currentSpeeds = {};
        targetSpeeds = {};
        phaseTicksLeft = {};
        swimmerEffects = {};
        swimmerSkills = {};
        currentCameraStartMeters = 0;
        saveStateToStorage();
        createOrUpdateOverlay();
      });
    }

    const closePodiumBtn = podiumOverlayEl.querySelector("#kyna-btn-close-podium");
    if (closePodiumBtn) {
      closePodiumBtn.addEventListener("click", () => {
        if (podiumOverlayEl) podiumOverlayEl.remove();
      });
    }
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


