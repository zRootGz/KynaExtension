/**
 * CORE/BBB-CHAT-OBSERVER.JS - Quét Chat BigBlueButton (BBB) & Tiện ích dùng chung
 * Chức năng: Đọc tự động các tin nhắn chat mới của học sinh trên giao diện BBB và chuẩn hóa chuỗi văn bản.
 */

(function () {
  if (typeof window !== "undefined" && window.kynaBBBMessageObserverLoaded) return;
  if (typeof window !== "undefined") window.kynaBBBMessageObserverLoaded = true;

  let chatObserver = null;
  let observerCallbacks = [];

  const CHAT_TEXT_SELECTORS = [
    '[data-test="messageContent"] p',
    '[data-test="messageContent"]',
    '[data-test="chatMessageText"]',
    '[class*="chatMessageText"]',
    '[class*="messageText"]',
    '[class*="chat-message-content"]',
    '[class*="messageContent"]',
    '[class*="content--"]',
    '[class*="text--"]',
    '.message-text'
  ].join(', ');

  const SENDER_NAME_SELECTORS = [
    '[data-test="chatMessageSenderName"]',
    '[class*="chatMessageSenderName"]',
    '[class*="jQmKAM"]',
    '[class*="sc-jQmKAM"]',
    '[class*="senderName"]',
    '[class*="sender--"]',
    '[class*="userName"]',
    '[class*="name--"]',
    '[data-test="chatUser"]',
    '.sender-name'
  ].join(', ');

  const PARENT_CONTAINER_SELECTORS = [
    '[data-test="chatMessageItem"]',
    '[data-test="chatMessage"]',
    '[class*="chatMessageItem"]',
    '[class*="chat-message-container"]',
    '[class*="chatMessage"]',
    '[class*="item--"]',
    '[class*="messageItem"]',
    '[class*="message--"]',
    '[class*="chat-item"]',
    '[class*="message-item"]',
    '.chat-message-item'
  ].join(', ');

  /**
   * Chuẩn hóa chuỗi văn bản (Xóa dấu tiếng Việt, viết hoa, xóa khoảng trắng/ký tự đặc biệt)
   */
  function normalizeAnswerString(str) {
    if (!str) return "";
    return str
      .toString()
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Z0-9]/g, "");
  }

  /**
   * Đăng ký MutationObserver quét toàn bộ khung chat BBB
   * @param {Function} onNewChatMessageCallback (senderName, messageText, msgEl) => void
   */
  function initBBBMessageObserver(onNewChatMessageCallback) {
    if (typeof onNewChatMessageCallback === "function" && !observerCallbacks.includes(onNewChatMessageCallback)) {
      observerCallbacks.push(onNewChatMessageCallback);
    }

    if (chatObserver) {
      scanExistingChatMessages();
      return;
    }

    // Quét tức thời các tin nhắn hiện có trong DOM
    scanExistingChatMessages();

    chatObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              processChatMessageNode(node);
            }
          });
        }
      }
    });

    chatObserver.observe(document.body, { childList: true, subtree: true });

    // Quét định kỳ mỗi 1s để đảm bảo không bỏ sót tin nhắn chat trên các bản BBB tùy biến
    setInterval(() => {
      scanExistingChatMessages();
    }, 1000);
  }

  function notifyCallbacks(senderName, txt, node) {
    observerCallbacks.forEach(cb => {
      try {
        cb(senderName, txt, node);
      } catch (e) {}
    });
  }

  function markExistingChatMessagesAsOld() {
    const parentContainers = document.querySelectorAll(PARENT_CONTAINER_SELECTORS);
    parentContainers.forEach(container => {
      if (container && container.dataset) container.dataset.kynaOldMsg = "true";
    });
    document.querySelectorAll(CHAT_TEXT_SELECTORS).forEach(el => {
      if (el && el.dataset) el.dataset.kynaOldMsg = "true";
    });
  }

  function scanExistingChatMessages() {
    const parentContainers = document.querySelectorAll(PARENT_CONTAINER_SELECTORS);
    if (parentContainers.length > 0) {
      parentContainers.forEach(container => parseContainerMessages(container));
    }
    document.querySelectorAll(CHAT_TEXT_SELECTORS).forEach(el => {
      parseSingleChatMessage(el);
    });
  }

  function parseContainerMessages(container) {
    if (!container) return;
    
    let senderName = "Học Sinh";
    let nameEl = container.querySelector(SENDER_NAME_SELECTORS);

    // Nếu tin nhắn liên tiếp không chứa thẻ tên người gửi, duyệt ngược về container trước đó
    if (!nameEl) {
      let prev = container.previousElementSibling;
      while (prev) {
        const prevName = prev.querySelector(SENDER_NAME_SELECTORS);
        if (prevName && prevName.textContent.trim()) {
          nameEl = prevName;
          break;
        }
        if (!prev.matches || !prev.matches(PARENT_CONTAINER_SELECTORS)) break;
        prev = prev.previousElementSibling;
      }
    }

    if (nameEl && nameEl.textContent.trim()) {
      senderName = nameEl.textContent.trim();
    }

    const textNodes = container.querySelectorAll('[data-test="messageContent"] p, [data-test="messageContent"], ' + CHAT_TEXT_SELECTORS);
    textNodes.forEach(node => {
      if (nameEl && (node === nameEl || nameEl.contains(node))) return;
      parseSingleChatMessageWithSender(node, senderName);
    });
  }

  function parseSingleChatMessageWithSender(msgEl, senderName) {
    if (!msgEl) return;
    const txt = (msgEl.textContent || "").trim();
    if (!txt || txt.length > 150) return;

    notifyCallbacks(senderName, txt, msgEl);
  }

  /**
   * Xử lý từng Node tin nhắn chat được thêm vào DOM
   */
  function processChatMessageNode(node) {
    if (!node) return;

    if (node.matches && node.matches(PARENT_CONTAINER_SELECTORS)) {
      parseContainerMessages(node);
      return;
    }

    const textNodes = node.querySelectorAll ? node.querySelectorAll(CHAT_TEXT_SELECTORS) : [];

    if (textNodes.length > 0) {
      textNodes.forEach(el => parseSingleChatMessage(el));
    } else if (node.matches && node.matches(CHAT_TEXT_SELECTORS)) {
      parseSingleChatMessage(node);
    }
  }

  /**
   * Trích xuất thông tin Tên người gửi & Nội dung tin nhắn
   */
  function parseSingleChatMessage(msgEl) {
    if (!msgEl) return;

    let senderName = "Học Sinh";
    const parentContainer = msgEl.closest(PARENT_CONTAINER_SELECTORS) || msgEl.parentElement;

    if (parentContainer) {
      let nameEl = parentContainer.querySelector(SENDER_NAME_SELECTORS);
      if (!nameEl) {
        let prev = parentContainer.previousElementSibling;
        while (prev) {
          const prevName = prev.querySelector(SENDER_NAME_SELECTORS);
          if (prevName && prevName.textContent.trim()) {
            nameEl = prevName;
            break;
          }
          if (!prev.matches || !prev.matches(PARENT_CONTAINER_SELECTORS)) break;
          prev = prev.previousElementSibling;
        }
      }
      if (nameEl && nameEl.textContent.trim()) {
        senderName = nameEl.textContent.trim();
      }
    }

    parseSingleChatMessageWithSender(msgEl, senderName);
  }

  /**
   * Utility cho phép Kéo Thả một Phần tử HTML (Draggable UI)
   */
  function makeElementDraggable(elmnt, dragHeader) {
    if (!elmnt || !dragHeader) return;
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    dragHeader.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
      elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
      elmnt.style.right = "auto";
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  // Export lên window
  if (typeof window !== "undefined") {
    window.normalizeAnswerString = normalizeAnswerString;
    window.initBBBMessageObserver = initBBBMessageObserver;
    window.scanExistingChatMessages = scanExistingChatMessages;
    window.markExistingChatMessagesAsOld = markExistingChatMessagesAsOld;
    window.makeElementDraggable = makeElementDraggable;
  }
})();
