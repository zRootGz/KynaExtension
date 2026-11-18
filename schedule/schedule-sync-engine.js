/**
 * SCHEDULE-SYNC-ENGINE.JS - Throttled Sequential Batch Sync & Dry-Run Analyzer
 * Features:
 * - Computes DryRunSummary with conflict analysis (FR-008, Option C)
 * - Executes sequential slot registration with safety delay (~200ms/slot)
 * - Emits real-time progress events for UI progress bar
 * - Supports instant abort via AbortController
 * - Triggers audio feedback on completion
 */

(function () {
  if (typeof window !== "undefined" && window.KynaScheduleSyncEngine) return;

  class ScheduleSyncEngine {
    constructor() {
      this.activeAbortController = null;
      this.isSyncing = false;
      this.settings = {
        syncDelayMs: 400,
        autoSkipConflicts: true
      };

      this.loadSettings();
    }

    loadSettings() {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(["kynaScheduleSettings"], (res) => {
          if (res.kynaScheduleSettings) {
            this.settings = { ...this.settings, ...res.kynaScheduleSettings };
          }
        });
        chrome.storage.onChanged.addListener((changes, area) => {
          if (area === "local" && changes.kynaScheduleSettings) {
            this.settings = { ...this.settings, ...changes.kynaScheduleSettings.newValue };
          }
        });
      }
    }

    /**
     * Generate structured Dry-Run summary for review with exact calendar dates
     * @param {Array} candidateSlots - List of ScheduleSlot entities
     */
    generateDryRunSummary(candidateSlots) {
      const dayNames = {
        1: "Thứ Hai",
        2: "Thứ Ba",
        3: "Thứ Tư",
        4: "Thứ Năm",
        5: "Thứ Sáu",
        6: "Thứ Bảy",
        7: "Chủ Nhật"
      };

      const validSlots = [];
      const conflicts = [];
      const dateBreakdownMap = new Map(); // dateKey -> { dayName, dateLabel, weekIndex, count }

      candidateSlots.forEach((slot) => {
        if (!slot.isEligible) {
          conflicts.push({
            slot: slot,
            reason: slot.status === "BOOKED" ? "Đã có học sinh đặt lịch" : "Ca bị khóa bởi quản trị viên"
          });
        } else {
          validSlots.push(slot);

          const dateKey = slot.dateLabel ? `${slot.dateLabel} (Tuần ${slot.weekIndex})` : (dayNames[slot.dayOfWeek] || `Thứ ${slot.dayOfWeek}`);
          if (!dateBreakdownMap.has(dateKey)) {
            dateBreakdownMap.set(dateKey, {
              dateKey: dateKey,
              dayName: dayNames[slot.dayOfWeek] || slot.dayName,
              dateLabel: slot.dateLabel || dayNames[slot.dayOfWeek],
              weekIndex: slot.weekIndex || 1,
              count: 0
            });
          }
          dateBreakdownMap.get(dateKey).count++;
        }
      });

      const daySummaryList = Array.from(dateBreakdownMap.values()).map(item => ({
        ...item,
        hours: item.count * 0.5
      }));

      // Sort by weekIndex and day order
      daySummaryList.sort((a, b) => a.weekIndex - b.weekIndex);

      return {
        totalSelected: validSlots.length,
        totalHours: validSlots.length * 0.5,
        validSlots: validSlots,
        conflicts: conflicts,
        daySummaryList: daySummaryList
      };
    }

    /**
     * Start throttled batch synchronization
     */
    async executeBatchSync(slots, callbacks = {}) {
      if (this.isSyncing) {
        throw new Error("Một phiên đồng bộ khác đang diễn ra!");
      }

      const {
        onProgress = () => {},
        onComplete = () => {},
        onAbort = () => {},
        onError = () => {}
      } = callbacks;

      this.isSyncing = true;
      this.activeAbortController = new AbortController();
      const signal = this.activeAbortController.signal;

      const delayMs = Math.max(100, this.settings.syncDelayMs || 400);
      const totalCount = slots.length;
      let successCount = 0;
      let failureCount = 0;
      const startTime = Date.now();

      console.log(`[Kyna Schedule Sync] Starting batch sync for ${totalCount} slots (Delay: ${delayMs}ms)`);

      try {
        for (let i = 0; i < totalCount; i++) {
          if (signal.aborted) {
            console.warn("[Kyna Schedule Sync] Sync aborted by user at index:", i);
            this.isSyncing = false;
            onAbort({
              processedCount: i,
              successCount: successCount,
              totalCount: totalCount
            });
            this.playAudioAlert("abort");
            return;
          }

          const slot = slots[i];
          try {
            this.simulateNativeSlotClick(slot.domElement);
            successCount++;
          } catch (err) {
            console.error("[Kyna Schedule Sync] Failed clicking slot:", slot, err);
            failureCount++;
          }

          const progressPercent = Math.round(((i + 1) / totalCount) * 100);
          onProgress({
            currentIndex: i + 1,
            totalCount: totalCount,
            progressPercent: progressPercent,
            currentSlot: slot
          });

          // Throttled delay
          if (i < totalCount - 1) {
            await this.sleep(delayMs, signal);
          }
        }

        const durationMs = Date.now() - startTime;
        this.isSyncing = false;
        this.playAudioAlert("success");

        onComplete({
          totalProcessed: totalCount,
          successCount: successCount,
          failureCount: failureCount,
          durationMs: durationMs
        });
      } catch (err) {
        this.isSyncing = false;
        if (signal.aborted) {
          onAbort({ processedCount: successCount, totalCount });
        } else {
          console.error("[Kyna Schedule Sync] Error during batch sync:", err);
          this.playAudioAlert("error");
          onError(err);
        }
      }
    }

    /**
     * Start throttled batch unregistration (T049 / User Story 4)
     */
    async executeBatchUnregister(slots, callbacks = {}) {
      if (this.isSyncing) {
        throw new Error("Một phiên đồng bộ/hủy khác đang diễn ra!");
      }

      const {
        onProgress = () => {},
        onComplete = () => {},
        onAbort = () => {},
        onError = () => {}
      } = callbacks;

      this.isSyncing = true;
      this.activeAbortController = new AbortController();
      const signal = this.activeAbortController.signal;

      const delayMs = Math.max(100, this.settings.syncDelayMs || 400);
      const totalCount = slots.length;
      let successCount = 0;
      let failureCount = 0;
      const startTime = Date.now();

      console.log(`[Kyna Schedule Sync] Starting batch unregister for ${totalCount} slots (Delay: ${delayMs}ms)`);

      try {
        for (let i = 0; i < totalCount; i++) {
          if (signal.aborted) {
            console.warn("[Kyna Schedule Sync] Unregister aborted by user at index:", i);
            this.isSyncing = false;
            onAbort({
              processedCount: i,
              successCount: successCount,
              totalCount: totalCount
            });
            this.playAudioAlert("abort");
            return;
          }

          const slot = slots[i];
          try {
            this.simulateNativeSlotClick(slot.domElement);
            successCount++;
          } catch (err) {
            console.error("[Kyna Schedule Sync] Failed clicking slot for unregister:", slot, err);
            failureCount++;
          }

          const progressPercent = Math.round(((i + 1) / totalCount) * 100);
          onProgress({
            currentIndex: i + 1,
            totalCount: totalCount,
            progressPercent: progressPercent,
            currentSlot: slot
          });

          // Throttled delay
          if (i < totalCount - 1) {
            await this.sleep(delayMs, signal);
          }
        }

        const durationMs = Date.now() - startTime;
        this.isSyncing = false;
        this.playAudioAlert("success");

        onComplete({
          totalProcessed: totalCount,
          successCount: successCount,
          failureCount: failureCount,
          durationMs: durationMs
        });
      } catch (err) {
        this.isSyncing = false;
        if (signal.aborted) {
          onAbort({ processedCount: successCount, totalCount });
        } else {
          console.error("[Kyna Schedule Sync] Error during batch unregister:", err);
          this.playAudioAlert("error");
          onError(err);
        }
      }
    }

    /**
     * Abort active batch execution
     */
    abort() {
      if (this.activeAbortController) {
        this.activeAbortController.abort();
      }
    }

    /**
     * Simulate authentic DOM click sequence for React Fiber compatibility (T040, T041)
     * Non-destructive, single click event dispatch to prevent toggle-off and React reconciliation crash
     */
    simulateNativeSlotClick(element) {
      if (!element) return;

      // T041: Remove draft selection and cancel mark classes so React renders clean native checkmark/empty state
      element.classList.remove("kyna-slot-selected", "slot-selected", "kyna-slot-to-cancel");

      // Ensure element is visible without jerky viewport jumps
      element.scrollIntoView({ behavior: "auto", block: "nearest" });

      const eventInit = {
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window,
        detail: 1
      };

      try {
        // Dispatch genuine pointer and mouse sequence ending in a SINGLE click
        element.dispatchEvent(new PointerEvent("pointerdown", eventInit));
        element.dispatchEvent(new MouseEvent("mousedown", eventInit));
        element.dispatchEvent(new PointerEvent("pointerup", eventInit));
        element.dispatchEvent(new MouseEvent("mouseup", eventInit));
        element.dispatchEvent(new MouseEvent("click", eventInit));
      } catch (e) {
        try {
          element.click();
        } catch (err) {
          console.error("[Kyna Schedule Sync] Failed to click slot element:", err);
        }
      }
    }

    sleep(ms, signal) {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, ms);
        if (signal) {
          signal.addEventListener("abort", () => {
            clearTimeout(timer);
            resolve();
          });
        }
      });
    }

    playAudioAlert(type) {
      // Use existing audio synthesizer if present or HTML5 Web Audio
      if (typeof window.kynaPlayVictorySound === "function" && type === "success") {
        window.kynaPlayVictorySound(true);
        return;
      }

      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();

        if (type === "success") {
          // Cheerful chime (C5 - E5 - G5)
          const notes = [523.25, 659.25, 783.99];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.frequency.value = freq;
            osc.type = "sine";
            gain.gain.setValueAtTime(0.15, ctx.currentTime + idx * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(ctx.currentTime + idx * 0.1);
            osc.stop(ctx.currentTime + idx * 0.1 + 0.3);
          });
        } else if (type === "abort") {
          // Low abort tone
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.value = 220;
          osc.type = "triangle";
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        }
      } catch (e) {
        // Audio optional, ignore
      }
    }
  }

  window.KynaScheduleSyncEngine = new ScheduleSyncEngine();
})();
