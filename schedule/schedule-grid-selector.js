/**
 * SCHEDULE-GRID-SELECTOR.JS - DOM Scanner & Drag-to-Select Engine
 * Features:
 * - Scans real Kyna Teacher DOM (.setup-schedule, .setup-schedule__content) and fallback tables
 * - Detects 21-day rolling schedule (Week 1, Week 2, Week 3) with exact calendar dates
 * - Classifies real Kyna statuses: empty, available (selected), accepted/approved (booked), waiting (locked)
 * - Auto-skips conflicts (accepted, waiting, booked, locked) per FR-007
 * - Supports targeted week application (Week 1, Week 2, Week 3, or ALL)
 * - Provides 60fps pointer drag-to-select and deselect capabilities (FR-001, FR-002)
 */

(function () {
  if (typeof window !== "undefined" && window.KynaScheduleGridSelector) return;

  const TIME_FORMAT_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;
  const DAY_NAME_MAP = {
    "mon": 1, "tue": 2, "wed": 3, "thu": 4, "fri": 5, "sat": 6, "sun": 7,
    "t2": 1, "t3": 2, "t4": 3, "t5": 4, "t6": 5, "t7": 6, "cn": 7,
    "thứ hai": 1, "thứ ba": 2, "thứ tư": 3, "thứ năm": 4, "thứ sáu": 5, "thứ bảy": 6, "chủ nhật": 7
  };

  class ScheduleGridSelector {
    constructor() {
      this.gridElement = null;
      this.isKynaNativeGrid = false;
      this.dateColumns = []; // Array of { index, dayOfWeek, dayName, dayNumber, dateLabel, weekIndex }
      this.slotsMap = new Map(); // slotId -> ScheduleSlot
      this.orderedSlots = [];
      this.isDragging = false;
      this.dragStartSlot = null;
      this.currentMode = "SELECT"; // "SELECT" | "DESELECT"
      this.selectionBoxEl = null;
      this.onSelectionChangeCallbacks = [];
      this.lassoCoords = { startX: 0, startY: 0 };

      this.init();
    }

    init() {
      // Register runtime messaging immediately
      this.setupRuntimeMessaging();

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => this.detectAndBindGrid());
      } else {
        this.detectAndBindGrid();
      }

      // Re-scan if DOM changes (e.g. Kyna modal opens, finishes loading spinner, or SPA navigates)
      const observer = new MutationObserver(() => {
        // Re-detect if grid not found, removed from DOM, or if it was bound while still loading (no slots yet)
        if (!this.gridElement || !document.body.contains(this.gridElement) || this.orderedSlots.length === 0) {
          this.detectAndBindGrid();
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    /**
     * Locate schedule grid on page (Prioritizing real Kyna Teacher DOM once fully loaded)
     */
    detectAndBindGrid() {
      // 1. Real Kyna Teacher Portal selectors - only bind when content is actually rendered (not loading spinner)
      const dateWrapper = document.querySelector('.setup-schedule__content__date-wrapper');
      const hasDateItems = !!document.querySelector('.setup-schedule__content__date-item');
      const kynaNative = document.querySelector('.setup-schedule, .setup-schedule__content');

      if (kynaNative && (dateWrapper || hasDateItems)) {
        this.gridElement = kynaNative;
        this.isKynaNativeGrid = true;
        this.scanKynaNativeCalendar();
        this.bindMouseEvents();
        console.log("[Kyna Schedule Assistant] Real Kyna setup-schedule grid detected and loaded:", kynaNative);
        return true;
      }

      // 2. Fallback table selectors
      const fallbackSelectors = [
        '[data-kyna-schedule-grid="true"]',
        'table.kyna-schedule-grid',
        '.schedule-table',
        'table.calendar-grid',
        '[data-schedule-table]'
      ];

      for (const sel of fallbackSelectors) {
        const el = document.querySelector(sel);
        if (el) {
          this.gridElement = el;
          this.isKynaNativeGrid = false;
          this.scanFallbackTableSlots();
          this.bindMouseEvents();
          console.log("[Kyna Schedule Assistant] Fallback grid detected:", el);
          return true;
        }
      }
      return false;
    }

    /**
     * Parse 21-day dates from Kyna's .setup-schedule__content__date-wrapper
     */
    parseKynaDateHeaders() {
      this.dateColumns = [];
      // STRICT: query only the parent date-item DIVs, filtering out any child <p> tags
      const rawItems = this.gridElement.querySelectorAll(
        '.setup-schedule__content__date-wrapper > .setup-schedule__content__date-item, .setup-schedule__content__date-item'
      );
      const dateItems = Array.from(rawItems).filter(el => el.tagName === "DIV");

      dateItems.forEach((item, colIdx) => {
        const textEl = item.querySelector('.setup-schedule__content__date-item__text, [class*="date-item__text"]');
        const numEl = item.querySelector('.setup-schedule__content__date-item__number, [class*="date-item__number"]');

        const dayText = textEl ? textEl.textContent.trim() : `Day ${colIdx + 1}`;
        const dayNumber = numEl ? numEl.textContent.trim() : "";

        const textClean = dayText.toLowerCase().replace(/[^a-z0-9à-ỹ]/g, "");
        const dayOfWeek = DAY_NAME_MAP[textClean] || ((colIdx % 7) + 1);

        // Compute rolling week index: 0..6 = Week 1, 7..13 = Week 2, 14..20 = Week 3
        const weekIndex = Math.floor(colIdx / 7) + 1;
        const dateLabel = dayNumber ? `${dayText} ${dayNumber}` : dayText;

        this.dateColumns.push({
          index: colIdx,
          dayOfWeek: dayOfWeek,
          dayName: dayText,
          dayNumber: dayNumber,
          dateLabel: dateLabel,
          weekIndex: weekIndex,
          element: item
        });
      });

      console.log(`[Kyna Schedule Assistant] Parsed ${this.dateColumns.length} date columns across rolling weeks.`);
    }

    /**
     * Scan real Kyna Teacher DOM structure
     */
    scanKynaNativeCalendar() {
      if (!this.gridElement) return [];
      this.slotsMap.clear();
      this.orderedSlots = [];

      this.parseKynaDateHeaders();

      // Find all time items (rows)
      const timeItems = this.gridElement.querySelectorAll(
        '.setup-schedule__content__time-item, [class*="setup-schedule__content__time-item"]'
      );

      timeItems.forEach((timeItem, rowIdx) => {
        const timeNameEl = timeItem.querySelector(
          '.setup-schedule__content__time-name p, [class*="time-name"] p, [class*="time-name"]'
        );
        let timeStart = timeNameEl ? timeNameEl.textContent.trim() : "";
        if (!TIME_FORMAT_REGEX.test(timeStart)) {
          timeStart = "08:00";
        }
        const timeEnd = this.addMinutesToTime(timeStart, 30);

        // Find cells in this row
        const cells = timeItem.querySelectorAll(
          '.setup-schedule__content__time-item__date-row, [class*="date-row"]'
        );

        cells.forEach((cell, colIdx) => {
          const colInfo = this.dateColumns[colIdx] || {
            dayOfWeek: (colIdx % 7) + 1,
            dateLabel: `Day ${colIdx + 1}`,
            weekIndex: Math.floor(colIdx / 7) + 1
          };

          const slotId = `slot-c${colIdx}-r${rowIdx}-${timeStart.replace(":", "")}`;

          // Classify status based on Kyna status div
          let status = "AVAILABLE";
          const statusDiv = cell.querySelector('.setup-schedule__content__time-item__status, [class*="time-item__status"], [class*="status"]');

          if (statusDiv) {
            const cls = statusDiv.className.toLowerCase();
            if (cls.includes("accepted") || cls.includes("approved")) {
              status = "BOOKED"; // Class confirmed with student
            } else if (cls.includes("waiting")) {
              status = "LOCKED"; // Pending approval
            } else if (cls.includes("available") || cls.includes("selected")) {
              status = "REGISTERED"; // Already confirmed on Kyna
            }
          } else if (cell.classList.contains("kyna-slot-selected")) {
            status = "SELECTED"; // Draft selected in extension
          }

          // In SELECT mode: only open available slots can be drafted
          // In DESELECT mode: draft slots can be unticked
          const isEligible = status === "AVAILABLE" || status === "SELECTED";

          const slotEntity = {
            slotId: slotId,
            colIndex: colIdx,
            rowIndex: rowIdx,
            dayOfWeek: colInfo.dayOfWeek,
            dayName: colInfo.dayName || `Thứ ${colInfo.dayOfWeek}`,
            dateLabel: colInfo.dateLabel,
            weekIndex: colInfo.weekIndex,
            timeStart: timeStart,
            timeEnd: timeEnd,
            status: status,
            isEligible: isEligible,
            domElement: cell
          };

          cell.dataset.kynaParsedId = slotId;
          this.slotsMap.set(slotId, slotEntity);
          this.orderedSlots.push(slotEntity);
        });
      });

      this.notifySelectionChange();
      return this.orderedSlots;
    }

    /**
     * Fallback scanner for standard HTML table grids
     */
    scanFallbackTableSlots() {
      if (!this.gridElement) return [];
      this.slotsMap.clear();
      this.orderedSlots = [];

      const cellSelectors = '[data-kyna-slot="true"], td.slot-cell, div.slot-cell, td[data-time-start]';
      const cells = this.gridElement.querySelectorAll(cellSelectors);

      cells.forEach((cell, index) => {
        const dayOfWeekRaw = cell.dataset.dayOfWeek || cell.getAttribute("data-day") || "1";
        const dayOfWeek = parseInt(dayOfWeekRaw, 10);
        const colIdx = (dayOfWeek - 1) % 7;
        const weekIndex = Math.floor((dayOfWeek - 1) / 7) + 1;

        let timeStart = cell.dataset.timeStart || "";
        let timeEnd = cell.dataset.timeEnd || "";

        if (!timeStart) {
          const row = cell.closest("tr");
          if (row) {
            const timeText = row.querySelector(".time-cell, th, td:first-child")?.textContent || "";
            const match = timeText.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
            if (match) {
              timeStart = match[1].padStart(5, "0");
              timeEnd = match[2].padStart(5, "0");
            }
          }
        }

        if (!TIME_FORMAT_REGEX.test(timeStart)) timeStart = "08:00";
        if (!TIME_FORMAT_REGEX.test(timeEnd)) timeEnd = "08:30";

        const slotId = cell.dataset.slotId || `slot-${dayOfWeek}-${timeStart.replace(":", "")}-${index}`;

        let status = "AVAILABLE";
        if (cell.classList.contains("slot-booked") || cell.dataset.state === "booked") {
          status = "BOOKED";
        } else if (cell.classList.contains("slot-locked") || cell.dataset.state === "locked") {
          status = "LOCKED";
        } else if (cell.querySelector('.available, .selected') || cell.dataset.state === "registered") {
          status = "REGISTERED";
        } else if (cell.classList.contains("slot-selected") || cell.classList.contains("kyna-slot-selected") || cell.dataset.state === "selected") {
          status = "SELECTED";
        }

        const isEligible = status === "AVAILABLE" || status === "SELECTED";

        const slotEntity = {
          slotId: slotId,
          colIndex: colIdx,
          rowIndex: index,
          dayOfWeek: dayOfWeek,
          dayName: `Thứ ${dayOfWeek === 7 ? "CN" : dayOfWeek + 1}`,
          dateLabel: `Thứ ${dayOfWeek === 7 ? "CN" : dayOfWeek + 1}`,
          weekIndex: weekIndex,
          timeStart: timeStart,
          timeEnd: timeEnd,
          status: status,
          isEligible: isEligible,
          domElement: cell
        };

        cell.dataset.kynaParsedId = slotId;
        this.slotsMap.set(slotId, slotEntity);
        this.orderedSlots.push(slotEntity);
      });

      this.notifySelectionChange();
      return this.orderedSlots;
    }

    scanCalendarSlots() {
      if (this.isKynaNativeGrid) {
        return this.scanKynaNativeCalendar();
      }
      return this.scanFallbackTableSlots();
    }

    bindMouseEvents() {
      if (!this.gridElement) return;

      this.gridElement.addEventListener("mousedown", (e) => this.handleMouseDown(e));
      document.addEventListener("mousemove", (e) => this.handleMouseMove(e));
      document.addEventListener("mouseup", (e) => this.handleMouseUp(e));

      if (!this.selectionBoxEl) {
        this.selectionBoxEl = document.createElement("div");
        this.selectionBoxEl.className = "kyna-drag-selection-box";
        this.selectionBoxEl.style.display = "none";
        document.body.appendChild(this.selectionBoxEl);
      }
    }

    handleMouseDown(e) {
      if (e.button !== 0) return;
      const targetCell = e.target.closest('[data-kyna-parsed-id], .setup-schedule__content__time-item__date-row, .slot-cell');
      if (!targetCell) return;

      const slotId = targetCell.dataset.kynaParsedId;
      const slot = this.slotsMap.get(slotId);
      if (!slot) return;

      // Auto-skip booked or locked slots (FR-007)
      if (slot.status === "BOOKED" || slot.status === "LOCKED") return;

      // T042 & T044: Smart Mode Auto-Detection & Modifier Key
      const isAltOrCtrl = e.altKey || e.ctrlKey;
      if (isAltOrCtrl) {
        this.currentMode = "DESELECT";
      } else if (slot.status === "SELECTED" || slot.domElement.classList.contains("kyna-slot-to-cancel")) {
        // Drag starts on an already selected slot -> Smart Deselect mode!
        this.currentMode = "DESELECT";
      } else if (slot.status === "REGISTERED") {
        // Drag starts on a registered Kyna slot -> Toggle cancel target!
        this.currentMode = "TOGGLE_CANCEL";
      } else {
        // Drag starts on empty available slot -> Select mode!
        this.currentMode = "SELECT";
      }

      this.isDragging = true;
      this.dragStartSlot = slot;
      this.lassoCoords = { startX: e.pageX, startY: e.pageY };

      // Update lasso appearance (T045)
      if (this.currentMode === "DESELECT" || this.currentMode === "TOGGLE_CANCEL") {
        this.selectionBoxEl.classList.add("remove-mode");
      } else {
        this.selectionBoxEl.classList.remove("remove-mode");
      }

      this.updateSelectionBox(e.pageX, e.pageY);
      this.selectionBoxEl.style.display = "block";

      this.highlightSlotsInBox(slot, slot);
      e.preventDefault();
    }

    handleMouseMove(e) {
      if (!this.isDragging || !this.dragStartSlot) return;

      this.updateSelectionBox(e.pageX, e.pageY);

      const el = document.elementFromPoint(e.clientX, e.clientY);
      const targetCell = el ? el.closest('[data-kyna-parsed-id], .setup-schedule__content__time-item__date-row, .slot-cell') : null;
      const currentSlot = targetCell ? this.slotsMap.get(targetCell.dataset.kynaParsedId) : null;

      if (currentSlot) {
        this.highlightSlotsInBox(this.dragStartSlot, currentSlot);
      }
    }

    handleMouseUp(e) {
      if (!this.isDragging) return;

      this.isDragging = false;
      if (this.selectionBoxEl) {
        this.selectionBoxEl.style.display = "none";
        this.selectionBoxEl.classList.remove("remove-mode");
      }

      const dx = Math.abs(e.pageX - this.lassoCoords.startX);
      const dy = Math.abs(e.pageY - this.lassoCoords.startY);
      const isSingleClick = Math.hypot(dx, dy) < 5;

      if (isSingleClick && this.dragStartSlot) {
        // T043: Single-Click Toggle on clicked slot
        const slot = this.dragStartSlot;
        const cell = slot.domElement;

        // Clear preview highlights
        this.gridElement.querySelectorAll(".kyna-slot-selecting, .kyna-slot-selecting-remove").forEach(el => {
          el.classList.remove("kyna-slot-selecting", "kyna-slot-selecting-remove");
        });

        if (slot.status === "SELECTED") {
          // Toggle off draft selection
          cell.classList.remove("slot-selected", "kyna-slot-selected");
          slot.status = "AVAILABLE";
        } else if (slot.status === "AVAILABLE") {
          // Toggle on draft selection
          cell.classList.add("slot-selected", "kyna-slot-selected");
          slot.status = "SELECTED";
        } else if (slot.status === "REGISTERED") {
          // Toggle cancellation mark on confirmed slot (T046)
          if (cell.classList.contains("kyna-slot-to-cancel")) {
            cell.classList.remove("kyna-slot-to-cancel");
          } else {
            cell.classList.add("kyna-slot-to-cancel");
          }
        }
      } else {
        // Lasso Bounding Box Release
        const previewCells = this.gridElement.querySelectorAll(".kyna-slot-selecting, .kyna-slot-selecting-remove");

        previewCells.forEach((cell) => {
          cell.classList.remove("kyna-slot-selecting", "kyna-slot-selecting-remove");
          const slot = this.slotsMap.get(cell.dataset.kynaParsedId);
          if (!slot) return;

          if (this.currentMode === "SELECT") {
            if (slot.status === "AVAILABLE") {
              cell.classList.add("slot-selected", "kyna-slot-selected");
              slot.status = "SELECTED";
            }
          } else if (this.currentMode === "DESELECT") {
            if (slot.status === "SELECTED") {
              cell.classList.remove("slot-selected", "kyna-slot-selected");
              slot.status = "AVAILABLE";
            }
            if (cell.classList.contains("kyna-slot-to-cancel")) {
              cell.classList.remove("kyna-slot-to-cancel");
            }
          } else if (this.currentMode === "TOGGLE_CANCEL") {
            if (slot.status === "REGISTERED") {
              cell.classList.add("kyna-slot-to-cancel");
            }
          }
        });
      }

      this.dragStartSlot = null;
      this.notifySelectionChange();
    }

    updateSelectionBox(currentX, currentY) {
      if (!this.selectionBoxEl) return;
      const left = Math.min(this.lassoCoords.startX, currentX);
      const top = Math.min(this.lassoCoords.startY, currentY);
      const width = Math.abs(this.lassoCoords.startX - currentX);
      const height = Math.abs(this.lassoCoords.startY - currentY);

      this.selectionBoxEl.style.left = `${left}px`;
      this.selectionBoxEl.style.top = `${top}px`;
      this.selectionBoxEl.style.width = `${width}px`;
      this.selectionBoxEl.style.height = `${height}px`;
    }

    highlightSlotsInBox(startSlot, endSlot) {
      this.gridElement.querySelectorAll(".kyna-slot-selecting, .kyna-slot-selecting-remove").forEach(el => {
        el.classList.remove("kyna-slot-selecting", "kyna-slot-selecting-remove");
      });

      const minCol = Math.min(startSlot.colIndex, endSlot.colIndex);
      const maxCol = Math.max(startSlot.colIndex, endSlot.colIndex);

      const startTimeNum = this.timeToMinutes(startSlot.timeStart);
      const endTimeNum = this.timeToMinutes(endSlot.timeStart);
      const minTime = Math.min(startTimeNum, endTimeNum);
      const maxTime = Math.max(startTimeNum, endTimeNum);

      const isRemove = this.currentMode === "DESELECT" || this.currentMode === "TOGGLE_CANCEL";
      const targetClass = isRemove ? "kyna-slot-selecting-remove" : "kyna-slot-selecting";

      this.orderedSlots.forEach((slot) => {
        if (slot.status === "BOOKED" || slot.status === "LOCKED") return; // Conflict auto-skip (FR-007)

        if (this.currentMode === "SELECT" && slot.status !== "AVAILABLE") return;
        if (this.currentMode === "DESELECT" && slot.status !== "SELECTED" && !slot.domElement.classList.contains("kyna-slot-to-cancel")) return;
        if (this.currentMode === "TOGGLE_CANCEL" && slot.status !== "REGISTERED") return;

        const slotTime = this.timeToMinutes(slot.timeStart);
        if (
          slot.colIndex >= minCol &&
          slot.colIndex <= maxCol &&
          slotTime >= minTime &&
          slotTime <= maxTime
        ) {
          slot.domElement.classList.add(targetClass);
        }
      });
    }

    /**
     * Apply template with Target Week scope (T025)
     * @param {Object} template - Weekly template definition
     * @param {number|string} targetWeek - 1, 2, 3, or "ALL"
     */
    applyTemplate(template, targetWeek = "1") {
      if (!template || !Array.isArray(template.slots)) return { applied: 0, skipped: 0 };

      let appliedCount = 0;
      let skippedCount = 0;

      const targetWeekParsed = targetWeek === "ALL" ? "ALL" : parseInt(targetWeek, 10);

      this.orderedSlots.forEach((slot) => {
        // Filter by target week scope
        if (targetWeekParsed !== "ALL" && slot.weekIndex !== targetWeekParsed) {
          return;
        }

        const matches = template.slots.some(
          ts => ts.dayOfWeek === slot.dayOfWeek && ts.timeStart === slot.timeStart
        );

        if (matches) {
          if (slot.status === "AVAILABLE") {
            slot.domElement.classList.add("slot-selected", "kyna-slot-selected");
            slot.status = "SELECTED";
            appliedCount++;
          } else {
            skippedCount++;
          }
        }
      });

      this.notifySelectionChange();
      return { applied: appliedCount, skipped: skippedCount };
    }

    clearAllSelected() {
      this.orderedSlots.forEach((slot) => {
        if (slot.status === "SELECTED") {
          slot.domElement.classList.remove("slot-selected", "kyna-slot-selected");
          slot.status = "AVAILABLE";
        }
        if (slot.domElement && slot.domElement.classList.contains("kyna-slot-to-cancel")) {
          slot.domElement.classList.remove("kyna-slot-to-cancel");
        }
      });
      this.notifySelectionChange();
    }

    getSelectedSlots() {
      return this.orderedSlots.filter(s => s.status === "SELECTED");
    }

    getSlotsToCancel() {
      return this.orderedSlots.filter(s =>
        s.status === "REGISTERED" && s.domElement && s.domElement.classList.contains("kyna-slot-to-cancel")
      );
    }

    getDateColumns() {
      return this.dateColumns;
    }

    setSelectionMode(mode) {
      if (mode === "SELECT" || mode === "DESELECT") {
        this.currentMode = mode;
      }
    }

    getSelectionMode() {
      return this.currentMode;
    }

    onSelectionChange(callback) {
      if (typeof callback === "function") {
        this.onSelectionChangeCallbacks.push(callback);
      }
    }

    notifySelectionChange() {
      const selected = this.getSelectedSlots();
      const toCancel = this.getSlotsToCancel();
      const payload = {
        totalSelected: selected.length,
        totalHours: selected.length * 0.5,
        totalToCancel: toCancel.length,
        cancelHours: toCancel.length * 0.5,
        slots: selected,
        cancelSlots: toCancel
      };

      this.onSelectionChangeCallbacks.forEach(cb => {
        try { cb(payload); } catch (e) { console.error(e); }
      });

      const event = new CustomEvent("KynaScheduleSelectionChanged", { detail: payload });
      window.dispatchEvent(event);
    }

    saveCurrentSelectionAsTemplate(templateName) {
      const activeSlots = this.orderedSlots.filter(s => s.status === "SELECTED" || s.status === "REGISTERED");
      if (!activeSlots || activeSlots.length === 0) {
        return Promise.resolve({ success: false, message: "Chưa có ca nào được chọn hoặc đã mở trên lịch để lưu mẫu!" });
      }

      const templateSlots = [];
      const seen = new Set();
      activeSlots.forEach(s => {
        const key = `${s.dayOfWeek}_${s.timeStart}`;
        if (!seen.has(key)) {
          seen.add(key);
          templateSlots.push({
            dayOfWeek: s.dayOfWeek,
            dayName: s.dayName || `Thứ ${s.dayOfWeek}`,
            timeStart: s.timeStart,
            timeEnd: s.timeEnd
          });
        }
      });

      // Sort by dayOfWeek ascending, then timeStart ascending
      templateSlots.sort((a, b) => {
        if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
        return a.timeStart.localeCompare(b.timeStart);
      });

      const daySummaryCount = {};
      templateSlots.forEach(s => {
        daySummaryCount[s.dayName] = (daySummaryCount[s.dayName] || 0) + 1;
      });
      const daysCount = Object.keys(daySummaryCount).length;

      const newTemplate = {
        id: "tpl_" + Date.now(),
        name: (templateName || "").trim() || `Mẫu lịch (${daysCount} ngày / ${templateSlots.length} ca)`,
        description: `Mẫu thực tế gồm ${templateSlots.length} ca (${(templateSlots.length * 0.5).toFixed(1)}h) trải đều ${daysCount} ngày trong tuần`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        slots: templateSlots,
        totalSlots: templateSlots.length,
        totalHours: templateSlots.length * 0.5
      };

      return new Promise((resolve) => {
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.get(["kynaScheduleTemplates"], (res) => {
            const list = res.kynaScheduleTemplates || [];
            list.unshift(newTemplate);
            chrome.storage.local.set({ kynaScheduleTemplates: list }, () => {
              resolve({
                success: true,
                template: newTemplate,
                message: `Đã lưu thành công mẫu "${newTemplate.name}" với ${newTemplate.totalSlots} ca dạy!`
              });
            });
          });
        } else {
          resolve({
            success: true,
            template: newTemplate,
            message: `Đã lưu mẫu "${newTemplate.name}" (${newTemplate.totalSlots} ca)!`
          });
        }
      });
    }

    setupRuntimeMessaging() {
      if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.onMessage) return;

      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (!message) return;

        // 1. Get Live Status
        if (message.action === "GET_SCHEDULE_STATUS") {
          const modal = document.querySelector('.setup-schedule, .setup-schedule__content, [data-kyna-schedule-grid="true"]');
          const isModal = !!(modal && (modal.offsetParent !== null || window.getComputedStyle(modal).display !== "none"));
          const hasGrid = !!(this.gridElement && document.body.contains(this.gridElement) && this.orderedSlots.length > 0);
          const selected = this.getSelectedSlots();
          const toCancel = this.getSlotsToCancel();

          sendResponse({
            isModalOpen: isModal,
            hasGrid: hasGrid,
            selectedCount: selected.length,
            totalHours: selected.length * 0.5,
            cancelCount: toCancel.length,
            cancelHours: toCancel.length * 0.5,
            dateColumns: this.dateColumns
          });
          return true;
        }

        // 2. Apply Template to Grid
        if (message.action === "APPLY_TEMPLATE_TO_GRID") {
          const modal = document.querySelector('.setup-schedule, .setup-schedule__content, [data-kyna-schedule-grid="true"]');
          if (!modal) {
            sendResponse({
              success: false,
              message: "Chưa mở bảng đăng ký lịch trên trang Kyna!\nVui lòng nhấn nút 'Set up schedule' trước khi áp dụng."
            });
            return true;
          }

          if (!this.gridElement || !document.body.contains(this.gridElement) || this.orderedSlots.length === 0) {
            this.detectAndBindGrid();
          }

          if (!this.gridElement) {
            sendResponse({
              success: false,
              message: "Bảng lịch chưa tải xong. Vui lòng đợi bảng tải xong dữ liệu rồi thử lại."
            });
            return true;
          }

          const targetWeek = message.targetWeek || "1";
          const res = this.applyTemplate(message.template, targetWeek);
          sendResponse({
            success: true,
            matchedCount: res.applied,
            conflictsSkipped: res.skipped,
            targetWeek: targetWeek
          });
          return true;
        }

        // 3. Save Current Selection as Template
        if (message.action === "SAVE_CURRENT_SELECTION_AS_TEMPLATE") {
          this.saveCurrentSelectionAsTemplate(message.name).then(res => {
            sendResponse(res);
          });
          return true;
        }

        // 4. Clear Selection
        if (message.action === "CLEAR_ALL_SELECTION") {
          this.clearAllSelected();
          sendResponse({ success: true });
          return true;
        }

        // 5. Get Dry Run Summary
        if (message.action === "GET_DRY_RUN_SUMMARY") {
          const syncEngine = window.KynaScheduleSyncEngine;
          const selected = this.getSelectedSlots();
          if (!syncEngine || selected.length === 0) {
            sendResponse({ success: false, message: "Chưa có ca nào được chọn!" });
            return true;
          }
          const summary = syncEngine.generateDryRunSummary(selected);
          sendResponse({ success: true, summary: summary });
          return true;
        }

        // 6. Execute Batch Sync
        if (message.action === "EXECUTE_BATCH_SYNC") {
          const syncEngine = window.KynaScheduleSyncEngine;
          const selected = this.getSelectedSlots();
          if (!syncEngine || selected.length === 0) {
            sendResponse({ success: false, message: "Chưa có ca nào được chọn để đồng bộ!" });
            return true;
          }

          syncEngine.executeBatchSync(selected, {
            onProgress: (p) => {
              chrome.runtime.sendMessage({ action: "SYNC_PROGRESS", data: p }).catch(() => {});
            },
            onComplete: (res) => {
              chrome.runtime.sendMessage({ action: "SYNC_COMPLETE", data: res }).catch(() => {});
              this.scanCalendarSlots();
            },
            onAbort: (data) => {
              chrome.runtime.sendMessage({ action: "SYNC_ABORTED", data: data }).catch(() => {});
              this.scanCalendarSlots();
            },
            onError: (err) => {
              chrome.runtime.sendMessage({ action: "SYNC_ERROR", error: err.message }).catch(() => {});
            }
          });

          sendResponse({ success: true, message: "Bắt đầu đồng bộ..." });
          return true;
        }

        // 7. Get Unregister Summary (T048)
        if (message.action === "GET_UNREGISTER_SUMMARY") {
          const syncEngine = window.KynaScheduleSyncEngine;
          const toCancel = this.getSlotsToCancel();
          if (!syncEngine || toCancel.length === 0) {
            sendResponse({ success: false, message: "Chưa có ca nào được đánh dấu để hủy!" });
            return true;
          }
          const summary = syncEngine.generateDryRunSummary(toCancel);
          sendResponse({ success: true, summary: summary });
          return true;
        }

        // 8. Execute Batch Unregister (T048, T049 / User Story 4)
        if (message.action === "EXECUTE_BATCH_UNREGISTER") {
          const syncEngine = window.KynaScheduleSyncEngine;
          const toCancel = this.getSlotsToCancel();
          if (!syncEngine || toCancel.length === 0) {
            sendResponse({ success: false, message: "Chưa có ca nào được đánh dấu để hủy đăng ký!" });
            return true;
          }

          syncEngine.executeBatchUnregister(toCancel, {
            onProgress: (p) => {
              chrome.runtime.sendMessage({ action: "SYNC_PROGRESS", data: p }).catch(() => {});
            },
            onComplete: (res) => {
              chrome.runtime.sendMessage({ action: "UNREGISTER_COMPLETE", data: res }).catch(() => {});
              this.scanCalendarSlots();
            },
            onAbort: (data) => {
              chrome.runtime.sendMessage({ action: "SYNC_ABORTED", data: data }).catch(() => {});
              this.scanCalendarSlots();
            },
            onError: (err) => {
              chrome.runtime.sendMessage({ action: "SYNC_ERROR", error: err.message }).catch(() => {});
            }
          });

          sendResponse({ success: true, message: "Bắt đầu hủy đăng ký ca dạy..." });
          return true;
        }

        // 9. Abort Batch Execution
        if (message.action === "ABORT_BATCH_SYNC") {
          const syncEngine = window.KynaScheduleSyncEngine;
          if (syncEngine) syncEngine.abort();
          sendResponse({ success: true });
          return true;
        }

        // 10. Open Kyna Schedule Modal (FR-013, T059)
        if (message.action === "OPEN_KYNA_SCHEDULE_MODAL") {
          const modal = document.querySelector('.setup-schedule, .setup-schedule__content, [data-kyna-schedule-grid="true"]');
          const isModalVisible = !!(modal && (modal.offsetParent !== null || window.getComputedStyle(modal).display !== "none"));

          if (isModalVisible) {
            this.detectAndBindGrid();
            try {
              modal.scrollIntoView({ behavior: "smooth", block: "center" });
            } catch (e) {}
            sendResponse({ success: true, message: "Bảng lịch Kyna đã được mở sẵn trên trang!" });
            return true;
          }

          // Search for native trigger element on Kyna Teacher portal using fast targeted selectors
          let triggerBtn = document.querySelector('.check-now, #btn-mock-check-now, #btn-open-mock-modal, [data-open-modal], .home-page-right__potential--content .check-now, .home-page-right .check-now');

          if (triggerBtn) {
            const opts = { bubbles: true, cancelable: true, view: window };
            try {
              triggerBtn.dispatchEvent(new PointerEvent("pointerdown", opts));
              triggerBtn.dispatchEvent(new MouseEvent("mousedown", opts));
              triggerBtn.dispatchEvent(new PointerEvent("pointerup", opts));
              triggerBtn.dispatchEvent(new MouseEvent("mouseup", opts));
            } catch (e) {}
            triggerBtn.click();
            setTimeout(() => {
              this.detectAndBindGrid();
            }, 600);
            sendResponse({ success: true, message: "Đã kích hoạt mở bảng lịch Kyna thành công!" });
            return true;
          } else {
            sendResponse({
              success: false,
              message: "Không tìm thấy nút 'Set Your Schedule' trên trang! Vui lòng đảm bảo bạn đang ở trang Home của Kyna Teacher."
            });
            return true;
          }
        }
      });
    }

    timeToMinutes(timeStr) {
      const parts = timeStr.split(":");
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }

    addMinutesToTime(timeStr, minutesToAdd) {
      const total = this.timeToMinutes(timeStr) + minutesToAdd;
      const h = Math.floor(total / 60) % 24;
      const m = total % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
  }

  window.KynaScheduleGridSelector = new ScheduleGridSelector();
})();
