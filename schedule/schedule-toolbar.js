/**
 * SCHEDULE-TOOLBAR.JS - In-Page Floating Assistant Window (Overlay)
 * Replicates full Schedule Assistant features directly on Kyna Teacher Portal
 * and Calendar Simulator, styled like Kyna BBB Minigames overlays.
 */

(function () {
  if (typeof window !== "undefined" && window.KynaScheduleOverlay) return;

  class ScheduleOverlayController {
    constructor() {
      this.overlayEl = null;
      this.templates = [];
      this.settings = {
        syncDelayMs: 400,
        autoSkipConflicts: true
      };
      this.isMinimized = false;
      this.isVisible = false;

      this.init();
    }

    init() {
      this.setupRuntimeMessaging();
      this.loadSettingsAndTemplates();

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => this.checkAutoShow());
      } else {
        this.checkAutoShow();
      }
    }

    checkAutoShow() {
      // Check if user previously had the overlay open on this tab/session
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(["kynaScheduleOverlayVisible"], (res) => {
          if (res && res.kynaScheduleOverlayVisible) {
            this.show();
          }
        });
      }
    }

    setupRuntimeMessaging() {
      if (typeof chrome === "undefined" || !chrome.runtime || !chrome.runtime.onMessage) return;

      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (!message) return;

        if (message.action === "TOGGLE_SCHEDULE_OVERLAY") {
          this.toggle();
          sendResponse({ success: true, isVisible: this.isVisible });
          return true;
        }

        if (message.action === "SHOW_SCHEDULE_OVERLAY") {
          this.show();
          sendResponse({ success: true, isVisible: true });
          return true;
        }

        if (message.action === "HIDE_SCHEDULE_OVERLAY") {
          this.hide();
          sendResponse({ success: true, isVisible: false });
          return true;
        }
      });
    }

    loadSettingsAndTemplates() {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(["kynaScheduleTemplates", "kynaScheduleSettings"], (res) => {
          if (res.kynaScheduleTemplates && Array.isArray(res.kynaScheduleTemplates)) {
            this.templates = res.kynaScheduleTemplates;
          }
          if (res.kynaScheduleSettings) {
            this.settings = { ...this.settings, ...res.kynaScheduleSettings };
          }
          if (this.overlayEl) {
            this.renderTemplates();
            this.updateSettingsUI();
          }
        });

        chrome.storage.onChanged.addListener((changes, area) => {
          if (area === "local") {
            if (changes.kynaScheduleTemplates) {
              this.templates = changes.kynaScheduleTemplates.newValue || [];
              if (this.overlayEl) this.renderTemplates();
            }
            if (changes.kynaScheduleSettings) {
              this.settings = { ...this.settings, ...changes.kynaScheduleSettings.newValue };
              if (this.overlayEl) this.updateSettingsUI();
            }
          }
        });
      }
    }

    toggle() {
      if (this.isVisible) {
        this.hide();
      } else {
        this.show();
      }
    }

    show() {
      this.mount();
      if (this.overlayEl) {
        this.overlayEl.style.display = "flex";
        this.isVisible = true;
        this.updateStats();
        this.renderTemplates();
        this.updateSettingsUI();
      }
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ kynaScheduleOverlayVisible: true });
      }
    }

    hide() {
      if (this.overlayEl) {
        this.overlayEl.style.display = "none";
        this.isVisible = false;
      }
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ kynaScheduleOverlayVisible: false });
      }
    }

    mount() {
      if (document.getElementById("kyna-schedule-overlay")) {
        this.overlayEl = document.getElementById("kyna-schedule-overlay");
        return;
      }

      const container = document.createElement("div");
      container.id = "kyna-schedule-overlay";

      container.innerHTML = `
        <div class="kyna-schedule-header" id="kyna-schedule-overlay-drag-handle">
          <div class="kyna-schedule-title">
            <span>📅</span>
            <span>Trợ Lý Lịch Dạy Kyna</span>
          </div>
          <div class="kyna-schedule-controls">
            <button class="kyna-overlay-icon-btn" id="kyna-overlay-btn-min" title="Thu gọn / Mở rộng">➖</button>
            <button class="kyna-overlay-icon-btn close-btn" id="kyna-overlay-btn-close" title="Đóng cửa sổ">✖</button>
          </div>
        </div>

        <!-- Non-blocking Toast Container -->
        <div id="kyna-overlay-toast-container"></div>

        <div class="kyna-overlay-body">
          
          <!-- Non-blocking Modal Dialog Container (Confirmation / Prompt) -->
          <div id="kyna-overlay-dialog-container"></div>
          
          <!-- Live Status & Quick Action Card (Bright White Theme) -->
          <div class="kyna-overlay-card hero-hub">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <span id="kyna-overlay-dot" style="width: 9px; height: 9px; border-radius: 50%; background: #10b981; display: inline-block;"></span>
                <span id="kyna-overlay-status-text" style="font-weight: 700; font-size: 12px; color: #0284c7;">Đang kết nối lịch...</span>
              </div>
              <button id="kyna-overlay-btn-open-modal" class="kyna-btn-outline" style="color: #0284c7; border-color: #38bdf8; font-size: 11px; padding: 3px 8px; font-weight: 700;" title="Tự động mở bảng lịch Set up schedule trên Kyna">
                📅 Mở Lịch
              </button>
            </div>

            <!-- Selection & Target Week Bar -->
            <div style="display: flex; gap: 8px; align-items: center; margin-top: 8px;">
              <div style="flex: 1.1; padding: 6px 10px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; font-size: 11px; display: flex; justify-content: space-between; align-items: center; color: #1e293b;">
                <span>Đang chọn: <b id="kyna-overlay-sel-count" style="color: #0284c7; font-size: 12px;">0 ca</b> (<span id="kyna-overlay-sel-hours" style="font-weight: 700;">0.0h</span>)</span>
                <button id="kyna-overlay-btn-clear" style="color: #ef4444; background: transparent; border: none; font-size: 11px; cursor: pointer; padding: 0 4px;" title="Xóa toàn bộ ca đang chọn">🗑 Xóa</button>
              </div>
              <div style="flex: 0.9;">
                <select id="kyna-overlay-target-week" class="kyna-overlay-select" style="background: #ffffff; color: #0f172a; border-color: #cbd5e1; font-size: 11px; padding: 4px 6px; height: 32px;" title="Chọn tuần áp dụng mẫu">
                  <option value="1" selected>📅 Tuần 1 (Tuần này)</option>
                  <option value="2">📅 Tuần 2 (Tuần sau)</option>
                  <option value="3">📅 Tuần 3 (Tuần kế tiếp)</option>
                  <option value="ALL">🌟 Cả 3 Tuần</option>
                </select>
              </div>
            </div>

            <!-- Cancellation Target Info -->
            <div id="kyna-overlay-cancel-box" style="display: none; margin-top: 6px; padding: 6px 10px; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 8px; font-size: 11px; justify-content: space-between; align-items: center;">
              <span style="color: #b91c1c;">Đánh dấu hủy: <b id="kyna-overlay-cancel-count" style="color: #dc2626;">0 ca</b> (<span id="kyna-overlay-cancel-hours">0.0h</span>)</span>
              <button id="kyna-overlay-btn-unregister" class="kyna-btn-solid danger" style="font-size: 11px; padding: 2px 8px;">
                🗑️ Hủy Đăng Ký
              </button>
            </div>

            <!-- Batch Register Button -->
            <button id="kyna-overlay-btn-batch-sync" class="kyna-btn-solid primary" style="width: 100%; margin-top: 8px; font-size: 13px; font-weight: 800; padding: 8px 12px;" disabled>
              🚀 Đăng Ký Ca Đang Chọn Lên Kyna
            </button>

            <!-- Execution Progress Section (Only shows when actively saving slots) -->
            <div id="kyna-overlay-progress-section" style="display: none; margin-top: 8px; background: #eff6ff; border: 1px solid #bfdbfe; padding: 8px; border-radius: 8px;">
              <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; color: #1e293b; font-weight: 700;">
                <span id="kyna-overlay-progress-text">Đang lưu ca dạy...</span>
                <span id="kyna-overlay-progress-percent">0%</span>
              </div>
              <div style="background: #cbd5e1; height: 6px; border-radius: 3px; overflow: hidden;">
                <div id="kyna-overlay-progress-fill" style="width: 0%; height: 100%; background: #10b981; transition: width 0.2s;"></div>
              </div>
              <button id="kyna-overlay-btn-abort-sync" class="kyna-btn-solid danger" style="width: 100%; margin-top: 6px; font-size: 11px; padding: 4px 8px;">
                ⏹ Dừng lưu (Hủy)
              </button>
            </div>
          </div>

          <!-- Weekly Templates Card -->
          <div class="kyna-overlay-card">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 4px;">
              <span style="font-weight: 800; font-size: 13px; color: #0284c7;">
                <i class="fa-solid fa-calendar-check"></i> Mẫu Lịch Tuần (<span id="kyna-overlay-tpl-count">0</span>)
              </span>
              <div style="display: flex; gap: 4px; align-items: center;">
                <button id="kyna-overlay-btn-save-current" class="kyna-btn-outline" title="Lưu các ca đang chọn trên lịch thành mẫu mới">
                  <i class="fa-solid fa-floppy-disk"></i> Lưu ca chọn
                </button>
                <button id="kyna-overlay-btn-toggle-create" class="kyna-btn-solid primary" style="font-size: 11px; padding: 3px 8px;" title="Tạo mẫu mới thủ công">
                  <i class="fa-solid fa-plus"></i> + Mẫu
                </button>
              </div>
            </div>

            <!-- Create Template Form (Accordion) -->
            <div id="kyna-overlay-create-form" style="display: none; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 10px; margin-bottom: 10px;">
              <div style="font-weight: 800; font-size: 12px; color: #0284c7; margin-bottom: 6px;">✨ Tạo Mẫu Lịch Mới</div>
              
              <div style="margin-bottom: 6px;">
                <label style="font-size: 11px; font-weight: 700; color: #334155; display: block; margin-bottom: 2px;">Tên gợi nhớ *</label>
                <input type="text" id="kyna-overlay-input-tpl-name" class="kyna-overlay-input" placeholder="ví dụ: Lịch Tối T2 - T6">
              </div>

              <div style="margin-bottom: 6px;">
                <label style="font-size: 11px; font-weight: 700; color: #334155; display: block; margin-bottom: 2px;">Các ngày trong tuần:</label>
                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                  <label class="kyna-overlay-day-chip"><input type="checkbox" name="overlay-day" value="1" checked> T2</label>
                  <label class="kyna-overlay-day-chip"><input type="checkbox" name="overlay-day" value="2" checked> T3</label>
                  <label class="kyna-overlay-day-chip"><input type="checkbox" name="overlay-day" value="3" checked> T4</label>
                  <label class="kyna-overlay-day-chip"><input type="checkbox" name="overlay-day" value="4" checked> T5</label>
                  <label class="kyna-overlay-day-chip"><input type="checkbox" name="overlay-day" value="5" checked> T6</label>
                  <label class="kyna-overlay-day-chip"><input type="checkbox" name="overlay-day" value="6"> T7</label>
                  <label class="kyna-overlay-day-chip"><input type="checkbox" name="overlay-day" value="7"> CN</label>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px;">
                <div>
                  <label style="font-size: 11px; font-weight: 700; color: #334155;">Từ giờ:</label>
                  <select id="kyna-overlay-select-start" class="kyna-overlay-select">
                    <option value="07:00">07:00</option>
                    <option value="08:00">08:00</option>
                    <option value="09:00">09:00</option>
                    <option value="17:00">17:00</option>
                    <option value="18:00" selected>18:00 (Tối)</option>
                    <option value="19:00">19:00</option>
                    <option value="20:00">20:00</option>
                  </select>
                </div>
                <div>
                  <label style="font-size: 11px; font-weight: 700; color: #334155;">Đến giờ:</label>
                  <select id="kyna-overlay-select-end" class="kyna-overlay-select">
                    <option value="11:00">11:00</option>
                    <option value="12:00">12:00</option>
                    <option value="20:00">20:00</option>
                    <option value="21:00" selected>21:00</option>
                    <option value="21:30">21:30</option>
                    <option value="22:00">22:00</option>
                    <option value="23:00">23:00</option>
                  </select>
                </div>
              </div>

              <div style="display: flex; justify-content: flex-end; gap: 6px;">
                <button id="kyna-overlay-btn-cancel-create" class="kyna-btn-outline" style="border-color: #cbd5e1; color: #64748b;">Hủy</button>
                <button id="kyna-overlay-btn-save-tpl" class="kyna-btn-solid primary" style="font-size: 11px; padding: 4px 10px;">Lưu Mẫu</button>
              </div>
            </div>

            <!-- Templates List Container -->
            <div id="kyna-overlay-templates-list" style="display: flex; flex-direction: column; gap: 8px;">
              <!-- Rendered dynamically -->
            </div>
          </div>

          <!-- Safe Settings Card -->
          <div class="kyna-overlay-card">
            <div style="font-weight: 800; font-size: 12px; color: #334155; margin-bottom: 6px;">
              <i class="fa-solid fa-sliders"></i> Cài Đặt Tốc Độ Lưu Lịch
            </div>
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <div>
                <label style="font-size: 11px; font-weight: 700; color: #475569; display: block; margin-bottom: 2px;">Thời gian chờ giữa các ca khi lưu:</label>
                <select id="kyna-overlay-setting-delay" class="kyna-overlay-select">
                  <option value="300">300ms (Nhanh)</option>
                  <option value="400" selected>400ms (Khuyến nghị - An toàn)</option>
                  <option value="500">500ms (An toàn cao)</option>
                </select>
              </div>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 11px; color: #475569; cursor: pointer;">
                <input type="checkbox" id="kyna-overlay-setting-autoskip" checked>
                <span>Tự động bỏ qua ca trùng / đã có học sinh</span>
              </label>
            </div>
          </div>

        </div>
      `;

      document.body.appendChild(container);
      this.overlayEl = container;

      this.bindOverlayEvents();
      this.makeOverlayDraggable();
      this.subscribeGridEvents();
    }

    makeOverlayDraggable() {
      const elmnt = this.overlayEl;
      const dragHeader = document.getElementById("kyna-schedule-overlay-drag-handle");
      if (!elmnt || !dragHeader) return;

      let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

      dragHeader.onmousedown = function (e) {
        if (e.target.closest("button") || e.target.closest("input") || e.target.closest("select")) return;
        e = e || window.event;
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;

        document.onmouseup = function () {
          document.onmouseup = null;
          document.onmousemove = null;
        };

        document.onmousemove = function (e2) {
          e2 = e2 || window.event;
          e2.preventDefault();
          pos1 = pos3 - e2.clientX;
          pos2 = pos4 - e2.clientY;
          pos3 = e2.clientX;
          pos4 = e2.clientY;

          elmnt.style.top = Math.max(10, elmnt.offsetTop - pos2) + "px";
          elmnt.style.left = Math.max(10, elmnt.offsetLeft - pos1) + "px";
          elmnt.style.right = "auto";
          elmnt.style.bottom = "auto";
        };
      };
    }

    subscribeGridEvents() {
      if (window.KynaScheduleGridSelector) {
        window.KynaScheduleGridSelector.onSelectionChange(() => {
          this.updateStats();
        });
      }
      window.addEventListener("KynaScheduleSelectionChanged", () => {
        this.updateStats();
      });
    }

    bindOverlayEvents() {
      // Minimize button
      const minBtn = document.getElementById("kyna-overlay-btn-min");
      if (minBtn) {
        minBtn.addEventListener("click", () => {
          this.isMinimized = !this.isMinimized;
          this.overlayEl.classList.toggle("minimized", this.isMinimized);
          minBtn.textContent = this.isMinimized ? "➕" : "➖";
        });
      }

      // Close button
      const closeBtn = document.getElementById("kyna-overlay-btn-close");
      if (closeBtn) {
        closeBtn.addEventListener("click", () => {
          this.hide();
        });
      }

      // Open Kyna Modal button
      const openModalBtn = document.getElementById("kyna-overlay-btn-open-modal");
      if (openModalBtn) {
        openModalBtn.addEventListener("click", () => {
          this.triggerOpenKynaScheduleModal();
        });
      }

      // Clear selection button
      const clearBtn = document.getElementById("kyna-overlay-btn-clear");
      if (clearBtn) {
        clearBtn.addEventListener("click", () => {
          if (window.KynaScheduleGridSelector) {
            window.KynaScheduleGridSelector.clearAllSelected();
            this.updateStats();
          }
        });
      }

      // Batch Register button
      const batchSyncBtn = document.getElementById("kyna-overlay-btn-batch-sync");
      if (batchSyncBtn) {
        batchSyncBtn.addEventListener("click", () => {
          this.triggerBatchRegister();
        });
      }

      // Batch Unregister button
      const unregisterBtn = document.getElementById("kyna-overlay-btn-unregister");
      if (unregisterBtn) {
        unregisterBtn.addEventListener("click", () => {
          this.triggerBatchUnregister();
        });
      }

      // Abort Sync button
      const abortBtn = document.getElementById("kyna-overlay-btn-abort-sync");
      if (abortBtn) {
        abortBtn.addEventListener("click", () => {
          if (window.KynaScheduleSyncEngine) {
            window.KynaScheduleSyncEngine.abort();
          }
          const progressSection = document.getElementById("kyna-overlay-progress-section");
          if (progressSection) progressSection.style.display = "none";
          const syncBtn = document.getElementById("kyna-overlay-btn-batch-sync");
          if (syncBtn) syncBtn.disabled = false;
        });
      }

      // Toggle Create Template Form
      const toggleCreateBtn = document.getElementById("kyna-overlay-btn-toggle-create");
      const createForm = document.getElementById("kyna-overlay-create-form");
      const cancelCreateBtn = document.getElementById("kyna-overlay-btn-cancel-create");
      const saveTplBtn = document.getElementById("kyna-overlay-btn-save-tpl");

      if (toggleCreateBtn && createForm) {
        toggleCreateBtn.addEventListener("click", () => {
          createForm.style.display = createForm.style.display === "none" ? "block" : "none";
        });
      }

      if (cancelCreateBtn && createForm) {
        cancelCreateBtn.addEventListener("click", () => {
          createForm.style.display = "none";
        });
      }

      if (saveTplBtn) {
        saveTplBtn.addEventListener("click", () => {
          this.handleCreateTemplate();
        });
      }

      // Save Current Selection as Template (Non-blocking)
      const saveCurrentBtn = document.getElementById("kyna-overlay-btn-save-current");
      if (saveCurrentBtn) {
        saveCurrentBtn.addEventListener("click", () => {
          const grid = window.KynaScheduleGridSelector;
          if (!grid) return;
          const selected = grid.getSelectedSlots();
          if (!selected || selected.length === 0) {
            this.showToast("Chưa có ca nào được chọn trên lịch để lưu!", "warning");
            return;
          }
          this.showPromptDialog(
            "Lưu ca đang chọn thành Mẫu Mới:",
            `Lịch Dạy Chuẩn (${selected.length} ca)`,
            (name) => {
              grid.saveCurrentSelectionAsTemplate(name).then((res) => {
                this.showToast(res.message, "success");
                this.loadSettingsAndTemplates();
              });
            }
          );
        });
      }

      // Settings changes
      const delaySelect = document.getElementById("kyna-overlay-setting-delay");
      if (delaySelect) {
        delaySelect.addEventListener("change", (e) => {
          this.settings.syncDelayMs = parseInt(e.target.value, 10);
          this.saveSettings();
        });
      }

      const autoskipCheck = document.getElementById("kyna-overlay-setting-autoskip");
      if (autoskipCheck) {
        autoskipCheck.addEventListener("change", (e) => {
          this.settings.autoSkipConflicts = !!e.target.checked;
          this.saveSettings();
        });
      }
    }

    saveSettings() {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ kynaScheduleSettings: this.settings });
      }
    }

    updateSettingsUI() {
      const delaySelect = document.getElementById("kyna-overlay-setting-delay");
      const autoskipCheck = document.getElementById("kyna-overlay-setting-autoskip");
      if (delaySelect) delaySelect.value = String(this.settings.syncDelayMs || 400);
      if (autoskipCheck) autoskipCheck.checked = this.settings.autoSkipConflicts !== false;
    }

    showToast(message, type = "info", duration = 3000) {
      const container = document.getElementById("kyna-overlay-toast-container") || this.overlayEl;
      if (!container) return;

      const oldToast = document.querySelector(".kyna-overlay-toast");
      if (oldToast) oldToast.remove();

      const icons = {
        info: "ℹ️",
        success: "✅",
        warning: "⚠️",
        error: "❌"
      };

      const toast = document.createElement("div");
      toast.className = `kyna-overlay-toast ${type}`;
      toast.innerHTML = `
        <span style="font-size: 14px;">${icons[type] || "ℹ️"}</span>
        <span style="flex: 1;">${this.escapeHtml(message)}</span>
        <span style="cursor: pointer; opacity: 0.7; font-size: 13px;" title="Đóng">✕</span>
      `;

      const closeSpan = toast.querySelector("span:last-child");
      if (closeSpan) {
        closeSpan.onclick = () => toast.remove();
      }

      container.appendChild(toast);

      if (duration > 0) {
        setTimeout(() => {
          if (toast && toast.parentNode) {
            toast.style.opacity = "0";
            toast.style.transform = "translateY(-6px)";
            setTimeout(() => toast.remove(), 200);
          }
        }, duration);
      }
    }

    showConfirmDialog(title, message, onConfirm, onCancel, confirmText = "Đồng ý", isDanger = false) {
      const container = document.getElementById("kyna-overlay-dialog-container");
      if (!container) {
        if (onConfirm) onConfirm();
        return;
      }

      container.innerHTML = "";
      const box = document.createElement("div");
      box.className = "kyna-overlay-dialog-box";
      if (isDanger) box.style.borderColor = "#ef4444";

      const icon = isDanger ? "⚠️" : "❓";

      box.innerHTML = `
        <div class="kyna-overlay-dialog-title" style="color: ${isDanger ? '#dc2626' : '#1e40af'};">
          <span>${icon}</span>
          <span>${this.escapeHtml(title)}</span>
        </div>
        <div class="kyna-overlay-dialog-content">${this.escapeHtml(message)}</div>
        <div class="kyna-overlay-dialog-actions">
          <button class="kyna-btn-outline btn-dlg-cancel" style="font-size: 11px; padding: 4px 10px;">Hủy</button>
          <button class="kyna-btn-solid ${isDanger ? 'danger' : 'primary'} btn-dlg-confirm" style="font-size: 11px; padding: 4px 12px; font-weight: 700;">${this.escapeHtml(confirmText)}</button>
        </div>
      `;

      const cancelBtn = box.querySelector(".btn-dlg-cancel");
      const confirmBtn = box.querySelector(".btn-dlg-confirm");

      cancelBtn.addEventListener("click", () => {
        box.remove();
        if (onCancel) onCancel();
      });

      confirmBtn.addEventListener("click", () => {
        box.remove();
        if (onConfirm) onConfirm();
      });

      container.appendChild(box);
      box.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    showPromptDialog(title, defaultValue, onSubmit, onCancel) {
      const container = document.getElementById("kyna-overlay-dialog-container");
      if (!container) {
        if (onSubmit) onSubmit(defaultValue);
        return;
      }

      container.innerHTML = "";
      const box = document.createElement("div");
      box.className = "kyna-overlay-dialog-box";

      box.innerHTML = `
        <div class="kyna-overlay-dialog-title">
          <span>💾</span>
          <span>${this.escapeHtml(title)}</span>
        </div>
        <div style="margin-bottom: 8px;">
          <input type="text" id="kyna-dlg-input" class="kyna-overlay-input" style="width: 100%; box-sizing: border-box; font-size: 12px; padding: 6px 8px;" value="${this.escapeHtml(defaultValue)}">
        </div>
        <div class="kyna-overlay-dialog-actions">
          <button class="kyna-btn-outline btn-dlg-cancel" style="font-size: 11px; padding: 4px 10px;">Hủy</button>
          <button class="kyna-btn-solid primary btn-dlg-confirm" style="font-size: 11px; padding: 4px 12px; font-weight: 700;">Lưu Mẫu</button>
        </div>
      `;

      const input = box.querySelector("#kyna-dlg-input");
      const cancelBtn = box.querySelector(".btn-dlg-cancel");
      const confirmBtn = box.querySelector(".btn-dlg-confirm");

      const handleConfirm = () => {
        const val = (input.value || "").trim();
        if (!val) {
          this.showToast("Vui lòng nhập tên cho mẫu lịch!", "warning");
          input.focus();
          return;
        }
        box.remove();
        if (onSubmit) onSubmit(val);
      };

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleConfirm();
        if (e.key === "Escape") {
          box.remove();
          if (onCancel) onCancel();
        }
      });

      cancelBtn.addEventListener("click", () => {
        box.remove();
        if (onCancel) onCancel();
      });

      confirmBtn.addEventListener("click", handleConfirm);

      container.appendChild(box);
      setTimeout(() => input.focus(), 50);
    }

    triggerOpenKynaScheduleModal() {
      const grid = window.KynaScheduleGridSelector;
      const statusText = document.getElementById("kyna-overlay-status-text");

      // 1. Check if the modal or grid is already present and visible
      const modal = document.querySelector('.setup-schedule, .setup-schedule__content, [data-kyna-schedule-grid="true"]');
      const isVisible = !!(modal && (modal.offsetParent !== null || window.getComputedStyle(modal).display !== "none"));

      if (isVisible) {
        if (grid) grid.detectAndBindGrid();
        try {
          modal.scrollIntoView({ behavior: "smooth", block: "center" });
        } catch (e) {}
        this.updateStats();
        this.showToast("Bảng lịch Kyna đã mở sẵn trên trang!", "success", 2000);
        return;
      }

      // 2. Fast targeted trigger lookup (NO slow querySelectorAll DOM loops)
      let trigger = document.querySelector('.check-now, #btn-mock-check-now, #btn-open-mock-modal, [data-open-modal], .home-page-right__potential--content .check-now, .home-page-right .check-now');

      if (trigger) {
        if (statusText) statusText.textContent = "Đang mở bảng lịch Kyna...";
        this.showToast("Đang mở bảng lịch Kyna...", "info", 1500);

        // Dispatch synthetic events for React
        const opts = { bubbles: true, cancelable: true, view: window };
        try {
          trigger.dispatchEvent(new PointerEvent("pointerdown", opts));
          trigger.dispatchEvent(new MouseEvent("mousedown", opts));
          trigger.dispatchEvent(new PointerEvent("pointerup", opts));
          trigger.dispatchEvent(new MouseEvent("mouseup", opts));
        } catch (e) {}
        trigger.click();

        setTimeout(() => {
          if (grid) grid.detectAndBindGrid();
          this.updateStats();
          const opened = document.querySelector('.setup-schedule, .setup-schedule__content, [data-kyna-schedule-grid="true"]');
          if (opened && (opened.offsetParent !== null || window.getComputedStyle(opened).display !== "none")) {
            try {
              opened.scrollIntoView({ behavior: "smooth", block: "center" });
            } catch (e) {}
            this.showToast("Đã mở bảng lịch Kyna thành công!", "success", 2500);
          }
        }, 600);
      } else {
        if (statusText) statusText.textContent = "Chưa tìm thấy nút mở lịch";
        this.showToast("Không tìm thấy nút 'Set Your Schedule'! Hãy kiểm tra bạn đang ở trang Home của Kyna Teacher.", "warning", 4000);
      }
    }

    updateStats() {
      const grid = window.KynaScheduleGridSelector;
      const dot = document.getElementById("kyna-overlay-dot");
      const statusText = document.getElementById("kyna-overlay-status-text");
      const countEl = document.getElementById("kyna-overlay-sel-count");
      const hoursEl = document.getElementById("kyna-overlay-sel-hours");
      const syncBtn = document.getElementById("kyna-overlay-btn-batch-sync");
      const cancelBox = document.getElementById("kyna-overlay-cancel-box");
      const cancelCountEl = document.getElementById("kyna-overlay-cancel-count");
      const cancelHoursEl = document.getElementById("kyna-overlay-cancel-hours");
      const weekSelect = document.getElementById("kyna-overlay-target-week");

      if (!grid) return;

      const modal = document.querySelector('.setup-schedule, .setup-schedule__content, [data-kyna-schedule-grid="true"]');
      const isModal = !!(modal && (modal.offsetParent !== null || window.getComputedStyle(modal).display !== "none"));
      const hasGrid = !!(grid.gridElement && document.body.contains(grid.gridElement) && grid.orderedSlots.length > 0);

      if (isModal && hasGrid) {
        if (dot) dot.style.background = "#10b981";
        if (statusText) statusText.textContent = "Đã kết nối bảng lịch Kyna";
      } else if (isModal && !hasGrid) {
        if (dot) dot.style.background = "#f59e0b";
        if (statusText) statusText.textContent = "Đang tải dữ liệu bảng lịch...";
      } else {
        if (dot) dot.style.background = "#94a3b8";
        if (statusText) statusText.textContent = "Chưa mở bảng lịch (Bấm '📅 Mở Lịch')";
      }

      const selected = grid.getSelectedSlots ? grid.getSelectedSlots() : [];
      const count = selected.length;
      const hours = count * 0.5;

      if (countEl) countEl.textContent = `${count} ca`;
      if (hoursEl) hoursEl.textContent = `${hours.toFixed(1)}h`;
      if (syncBtn) syncBtn.disabled = (count === 0);

      // Cancellation target updates
      const toCancel = grid.getSlotsToCancel ? grid.getSlotsToCancel() : [];
      if (cancelBox) {
        if (toCancel.length > 0) {
          cancelBox.style.display = "flex";
          if (cancelCountEl) cancelCountEl.textContent = `${toCancel.length} ca`;
          if (cancelHoursEl) cancelHoursEl.textContent = `${(toCancel.length * 0.5).toFixed(1)}h`;
        } else {
          cancelBox.style.display = "none";
        }
      }

      // Update date columns in week selector
      if (weekSelect && grid.dateColumns && grid.dateColumns.length >= 21) {
        const cols = grid.dateColumns;
        weekSelect.innerHTML = `
          <option value="1" selected>📅 Tuần 1 (${cols[0].dateLabel} - ${cols[6].dateLabel})</option>
          <option value="2">📅 Tuần 2 (${cols[7].dateLabel} - ${cols[13].dateLabel})</option>
          <option value="3">📅 Tuần 3 (${cols[14].dateLabel} - ${cols[20].dateLabel})</option>
          <option value="ALL">🌟 Cả 3 Tuần (${cols[0].dateLabel} - ${cols[20].dateLabel})</option>
        `;
      }
    }

    renderTemplates() {
      const container = document.getElementById("kyna-overlay-templates-list");
      const countEl = document.getElementById("kyna-overlay-tpl-count");
      if (!container) return;

      if (countEl) countEl.textContent = this.templates.length;
      container.innerHTML = "";

      if (this.templates.length === 0) {
        container.innerHTML = `<div style="font-size:11px; color:#94a3b8; text-align:center; padding:10px;">Chưa có mẫu nào. Bấm <b>+ Mẫu</b> để tạo mẫu mới!</div>`;
        return;
      }

      this.templates.forEach(tpl => {
        const card = document.createElement("div");
        card.className = "kyna-overlay-tpl-card";

        card.innerHTML = `
          <div class="kyna-overlay-tpl-header">
            <span class="kyna-overlay-tpl-title">📋 ${this.escapeHtml(tpl.name)}</span>
            <span class="kyna-overlay-tpl-badge">${tpl.totalSlots} ca (${tpl.totalHours}h)</span>
          </div>
          <div class="kyna-overlay-tpl-desc">${this.escapeHtml(tpl.description || "")}</div>
          <div class="kyna-overlay-tpl-actions">
            <button class="kyna-btn-outline danger btn-del-tpl" data-id="${tpl.id}" title="Xóa mẫu">
              <i class="fa-solid fa-trash-can"></i> Xóa
            </button>
            <button class="kyna-btn-outline btn-apply-tpl" data-id="${tpl.id}" title="Chỉ chọn nháp trên bảng lịch">
              <i class="fa-solid fa-wand-magic-sparkles"></i> Áp dụng
            </button>
            <button class="kyna-btn-solid primary btn-apply-sync-tpl" style="font-size:11px; padding:3px 8px;" data-id="${tpl.id}" title="Áp dụng và đăng ký ngay">
              <i class="fa-solid fa-paper-plane"></i> Áp dụng & Đăng ký
            </button>
          </div>
        `;

        card.querySelector(".btn-apply-tpl").addEventListener("click", () => {
          this.applyTemplate(tpl, { autoSync: false });
        });

        card.querySelector(".btn-apply-sync-tpl").addEventListener("click", () => {
          this.applyTemplate(tpl, { autoSync: true });
        });

        card.querySelector(".btn-del-tpl").addEventListener("click", () => {
          this.showConfirmDialog(
            "Xóa Mẫu Lịch",
            `Bạn có chắc chắn muốn xóa mẫu "${tpl.name}"?`,
            () => {
              this.templates = this.templates.filter(t => t.id !== tpl.id);
              if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
                chrome.storage.local.set({ kynaScheduleTemplates: this.templates });
              }
              this.renderTemplates();
              this.showToast(`Đã xóa mẫu "${tpl.name}"`, "info", 2000);
            },
            null,
            "Xóa Mẫu",
            true
          );
        });

        container.appendChild(card);
      });
    }

    applyTemplate(template, options = {}) {
      const grid = window.KynaScheduleGridSelector;
      if (!grid) return;

      const weekSelect = document.getElementById("kyna-overlay-target-week");
      const targetWeek = weekSelect ? weekSelect.value : "1";

      const modal = document.querySelector('.setup-schedule, .setup-schedule__content, [data-kyna-schedule-grid="true"]');
      if (!modal) {
        this.showToast("Chưa mở bảng lịch Kyna! Bấm '📅 Mở Lịch' trước khi áp dụng.", "warning");
        return;
      }

      const res = grid.applyTemplate(template, targetWeek);
      const weekLabel = targetWeek === "ALL" ? "Cả 3 tuần" : `Tuần ${targetWeek}`;
      this.updateStats();

      if (options.autoSync) {
        this.triggerBatchRegister(`Áp dụng mẫu "${template.name}" cho ${weekLabel}`);
      } else {
        this.showToast(`Đã áp dụng mẫu "${template.name}" cho ${weekLabel} (${res.applied} ca được chọn)!`, "success", 3000);
      }
    }

    triggerBatchRegister(contextTitle = "") {
      const grid = window.KynaScheduleGridSelector;
      const syncEngine = window.KynaScheduleSyncEngine;
      if (!grid || !syncEngine) return;

      const selected = grid.getSelectedSlots();
      if (!selected || selected.length === 0) {
        this.showToast("Không tìm thấy ca nào đang chọn để đăng ký!", "warning");
        return;
      }

      const summary = syncEngine.generateDryRunSummary(selected);
      const headerTitle = contextTitle ? `XÁC NHẬN: ${contextTitle}` : "XÁC NHẬN ĐĂNG KÝ CA DẠY LÊN KYNA";
      const conflictNote = summary.conflicts && summary.conflicts.length > 0
        ? `\n• Tự động bỏ qua an toàn: ${summary.conflicts.length} ca (đã có học sinh hoặc bị khóa)`
        : "";

      const confirmMsg =
        `• Tổng số ca đăng ký: ${summary.totalSelected} ca (${summary.totalHours.toFixed(1)} giờ)` +
        conflictNote +
        `\n\nBạn có muốn tiến hành đăng ký các ca này lên hệ thống Kyna?`;

      this.showConfirmDialog(headerTitle, confirmMsg, () => {
        const progressSection = document.getElementById("kyna-overlay-progress-section");
        const progressText = document.getElementById("kyna-overlay-progress-text");
        const progressPercent = document.getElementById("kyna-overlay-progress-percent");
        const progressFill = document.getElementById("kyna-overlay-progress-fill");
        const syncBtn = document.getElementById("kyna-overlay-btn-batch-sync");

        if (progressSection) progressSection.style.display = "block";
        if (syncBtn) syncBtn.disabled = true;

        syncEngine.executeBatchSync(selected, {
          onProgress: (p) => {
            if (progressText) progressText.textContent = `Đang lưu ca ${p.currentIndex}/${p.totalCount}...`;
            if (progressPercent) progressPercent.textContent = `${p.progressPercent}%`;
            if (progressFill) progressFill.style.width = `${p.progressPercent}%`;
          },
          onComplete: (res) => {
            if (progressSection) progressSection.style.display = "none";
            if (syncBtn) syncBtn.disabled = false;
            this.showToast(`Đăng ký thành công ${res.successCount} ca lên Kyna!`, "success", 4000);
            grid.scanCalendarSlots();
            this.updateStats();
          },
          onAbort: (data) => {
            if (progressSection) progressSection.style.display = "none";
            if (syncBtn) syncBtn.disabled = false;
            this.showToast(`Đã dừng an toàn tại ca ${data.processedCount}/${data.totalCount}.`, "info", 3000);
            grid.scanCalendarSlots();
            this.updateStats();
          },
          onError: (err) => {
            if (progressSection) progressSection.style.display = "none";
            if (syncBtn) syncBtn.disabled = false;
            this.showToast("Lỗi khi xử lý: " + err.message, "error", 4000);
            this.updateStats();
          }
        });
      }, null, "Tiến Hành Đăng Ký");
    }

    triggerBatchUnregister() {
      const grid = window.KynaScheduleGridSelector;
      const syncEngine = window.KynaScheduleSyncEngine;
      if (!grid || !syncEngine) return;

      const toCancel = grid.getSlotsToCancel();
      if (!toCancel || toCancel.length === 0) {
        this.showToast("Chưa có ca nào được đánh dấu để hủy!", "warning");
        return;
      }

      const summary = syncEngine.generateDryRunSummary(toCancel);
      const confirmMsg =
        `• Tổng số ca sẽ HỦY: ${summary.totalSelected} ca (${summary.totalHours.toFixed(1)} giờ)\n\n` +
        `Các ca này sẽ bị xóa khỏi lịch dạy chính thức của bạn trên Kyna.\nBạn có chắc chắn muốn tiến hành hủy không?`;

      this.showConfirmDialog("CẢNH BÁO HỦY ĐĂNG KÝ HÀNG LOẠT", confirmMsg, () => {
        const progressSection = document.getElementById("kyna-overlay-progress-section");
        const progressText = document.getElementById("kyna-overlay-progress-text");
        const progressPercent = document.getElementById("kyna-overlay-progress-percent");
        const progressFill = document.getElementById("kyna-overlay-progress-fill");

        if (progressSection) progressSection.style.display = "block";

        syncEngine.executeBatchUnregister(toCancel, {
          onProgress: (p) => {
            if (progressText) progressText.textContent = `Đang hủy ca ${p.currentIndex}/${p.totalCount}...`;
            if (progressPercent) progressPercent.textContent = `${p.progressPercent}%`;
            if (progressFill) progressFill.style.width = `${p.progressPercent}%`;
          },
          onComplete: (res) => {
            if (progressSection) progressSection.style.display = "none";
            this.showToast(`Đã hủy đăng ký thành công ${res.successCount} ca trên Kyna!`, "success", 4000);
            grid.scanCalendarSlots();
            this.updateStats();
          },
          onAbort: (data) => {
            if (progressSection) progressSection.style.display = "none";
            this.showToast(`Đã dừng hủy tại ca ${data.processedCount}/${data.totalCount}.`, "info", 3000);
            grid.scanCalendarSlots();
            this.updateStats();
          },
          onError: (err) => {
            if (progressSection) progressSection.style.display = "none";
            this.showToast("Lỗi khi hủy ca: " + err.message, "error", 4000);
            this.updateStats();
          }
        });
      }, null, "Xác Nhận Hủy", true);
    }

    handleCreateTemplate() {
      const nameInput = document.getElementById("kyna-overlay-input-tpl-name");
      const name = (nameInput.value || "").trim();
      if (!name) {
        this.showToast("Vui lòng nhập tên cho mẫu lịch!", "warning");
        if (nameInput) nameInput.focus();
        return;
      }

      const checkedDays = Array.from(
        document.querySelectorAll("input[name='overlay-day']:checked")
      ).map(el => parseInt(el.value, 10));

      if (checkedDays.length === 0) {
        this.showToast("Vui lòng chọn ít nhất một ngày trong tuần!", "warning");
        return;
      }

      const start = document.getElementById("kyna-overlay-select-start").value;
      const end = document.getElementById("kyna-overlay-select-end").value;

      const startMins = this.timeToMins(start);
      const endMins = this.timeToMins(end);

      if (endMins <= startMins) {
        this.showToast("Giờ kết thúc phải lớn hơn giờ bắt đầu!", "warning");
        return;
      }

      const slots = [];
      checkedDays.forEach(day => {
        let curr = startMins;
        while (curr < endMins) {
          slots.push({
            dayOfWeek: day,
            timeStart: this.minsToTime(curr),
            timeEnd: this.minsToTime(curr + 30)
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

      this.templates.unshift(newTemplate);
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ kynaScheduleTemplates: this.templates });
      }

      nameInput.value = "";
      const form = document.getElementById("kyna-overlay-create-form");
      if (form) form.style.display = "none";

      this.renderTemplates();
      this.showToast(`Đã tạo thành công mẫu "${name}" (${newTemplate.totalSlots} ca)!`, "success", 3000);
    }

    timeToMins(t) {
      const parts = t.split(":");
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    }

    minsToTime(m) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
    }

    escapeHtml(str) {
      return (str || "").replace(/[&<>'"]/g,
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
      );
    }
  }

  window.KynaScheduleOverlay = new ScheduleOverlayController();
})();
