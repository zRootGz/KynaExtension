# 🎨 Kyna BigBlueButton (BBB) Classroom Games Extension

> **Bộ tiện ích Game tương tác lớp học thông minh dành riêng cho Giáo viên Kyna English trên nền tảng BigBlueButton (BBB).**  
> Tự động quét tên học sinh, nhận diện câu trả lời qua Chat real-time, tổ chức trò chơi sinh động và xuất báo cáo kết quả ra file Excel chuyên nghiệp.

---

## 📌 MỤC LỤC
1. [Giới thiệu Tổng quan](#gioi-thieu)
2. [Hướng dẫn Cài đặt Tiện ích](#cai-dat)
3. [Game 1: 🎨 Đoán Chữ (Guess The Word)](#game-doan-chu)
   - [Cách vận hành trò chơi](#cach-van-hanh-doan-chu)
   - [Danh mục 17 chủ đề từ vựng (450+ từ)](#danh-muc-tu-vung)
   - [Tự thêm từ mới & Nhập/Xuất File Excel (.xlsx / .csv)](#quan-ly-tu-vung)
4. [Game 2: 🏊 Đua Bơi Kỳ Phùng Địch Thủ (Swimming Race)](#game-dua-boi)
   - [Thể thức 1: Đua Bơi Tiếp Sức Từ Vựng (Word Relay)](#dua-boi-tiep-suc)
   - [Thể thức 2: Đua Bơi Tự Động kiểu Game Vịt (Duck Race)](#dua-boi-tu-dong)
   - [Cách ghi danh học sinh & Bắt đầu đua](#ghi-danh-dua-boi)
5. [🏆 Bảng Điểm & Xuất Báo Cáo Excel](#bang-diem)
6. [❓ Xử lý Sự cố Thường gặp](#xu-ly-su-co)
7. [🛠️ Dành Cho Developer (Cấu trúc & Kiến trúc Tiện ích)](#danh-cho-developer)

---

<div id="gioi-thieu"></div>

## 1. Giới thiệu Tổng quan

**Kyna BBB Classroom Games Extension** là tiện ích mở rộng trên trình duyệt giúp Giáo viên Kyna biến các buổi học trực tuyến trên BigBlueButton thành những giờ học sôi nổi và cuốn hút.

### 🌟 Tính năng nổi bật:
- ⚡ **Tự động đọc Chat Real-time:** Nhận diện câu trả lời của học sinh trực tiếp từ khung chat công khai của BBB mà không gây gián đoạn buổi học.
- 🎨 **Đồ họa minh họa Doodle sống động:** Hình vẽ đố chữ nhiều màu sắc, tự động co giãn đẹp mắt trên màn hình chia sẻ.
- 🎯 **17 Chủ đề từ vựng chuẩn Oxford:** Hơn 450+ từ vựng sẵn có thuộc nhiều chủ đề quen thuộc và mở rộng (Động vật, Hoa quả, Vũ trụ, Địa điểm, Đồ chơi...).
- 🏁 **2 Chế độ Đua Bơi kịch tính:** Đua bơi gõ từ vựng tiếp sức và Đua vịt tự động theo cự ly mét.
- 📊 **Quản lý & Xuất điểm tự động:** Tự động tính điểm, công bố Top 3 Podium vinh danh và xuất báo cáo kết quả ra file Excel/CSV.
- 🔒 **Thông minh & Chỉ hiển thị ở tab đang dạy:** Tiện ích hoạt động chính xác trên màn hình lớp học mà Giáo viên đang mở, không bị hiện chồng lấp sang các trang web khác.

---

<div id="cai-dat"></div>

## 2. Hướng dẫn Cài đặt Tiện ích

🎥 **Video Hướng dẫn chi tiết:** [Xem trên YouTube](https://youtu.be/Ysb3Jz4JFFM)

Giáo viên có thể dễ dàng cài đặt tiện ích trên các trình duyệt Chrome, Microsoft Edge hoặc Cốc Cốc theo các bước sau:

1. **Tải & Giải nén:** Tải thư mục tiện ích về máy tính và giải nén thư mục `KynaExtension`.
2. **Mở trang quản lý Tiện ích:**
   - Trên **Google Chrome / Cốc Cốc:** Nhập `chrome://extensions/` vào thanh địa chỉ.
   - Trên **Microsoft Edge:** Nhập `edge://extensions/` vào thanh địa chỉ.
3. **Bật Chế độ nhà phát triển:** Bật công tắc **Developer mode** (Chế độ dành cho nhà phát triển) ở góc trên bên phải màn hình.
4. **Tải tiện ích:** Nhấn nút **Tải tiện ích đã giải nén (Load unpacked)**.
5. **Chọn thư mục:** Tìm đến thư mục `KynaExtension` đã giải nén và nhấn **Select Folder**.
6. **Ghim tiện ích:** Nhấn vào biểu tượng mảnh ghép 🧩 ở góc trên trình duyệt và chọn ghim 📌 **Kyna BBB Extension** lên thanh công cụ để dễ mở khi dạy học.

> 💡 **Lưu ý:** Khi có phiên bản cập nhật mới, Giáo viên chỉ cần vào lại trang `chrome://extensions/` và bấm nút **Tải lại (Reload 🔄)** tại tiện ích.

---

<div id="game-doan-chu"></div>

## 3. Game 1: 🎨 Đoán Chữ (Guess The Word)

Game **Đoán Chữ** giúp học sinh đoán từ vựng Tiếng Anh qua hình vẽ Doodle minh họa, chữ cái ẩn và gợi ý bằng tiếng Anh.

<div id="cach-van-hanh-doan-chu"></div>

### Cách vận hành Game Đoán Chữ:
1. Mở cửa sổ Tiện ích $\rightarrow$ Chọn tab **🎨 Đoán chữ**.
2. Chọn **Chủ đề từ vựng** (hoặc chọn tất cả) và cài đặt **Thời gian đếm ngược** (30s, 45s, 60s, 90s).
3. Nhấn nút **🚀 Bắt đầu Game**.
4. Bảng đố chữ (Overlay) sẽ hiển thị ngay trên màn hình BigBlueButton:
   - Học sinh gõ từ tiếng Anh vào khung Chat BBB.
   - Hệ thống tự động chấm câu trả lời (không phân biệt chữ hoa/thường, tự loại bỏ dấu câu dư thừa).
   - Học sinh trả lời đúng & nhanh nhất được **+10 điểm**, các bạn đúng tiếp theo được **+5 điểm**.
5. Các nút điều khiển tiện lợi cho Giáo viên trên bảng điều khiển:
   - **💡 Mở 1 chữ cái (Hint):** Mở gợi ý 1 chữ cái ngẫu nhiên cho học sinh khi gặp từ khó.
   - **⏭️ Từ tiếp theo:** Chuyển sang từ đố tiếp theo ngay lập tức.
   - **🔄 Chơi lại câu này:** Reset thời gian và chơi lại từ hiện tại.
   - **🏆 Tổng kết Game:** Mở bảng vinh danh 3D Podium Top 3 học sinh xuất sắc nhất lượt chơi.

<div id="danh-muc-tu-vung"></div>

### Danh mục 17 chủ đề từ vựng sẵn có (450+ từ):
- 🐶 **Animals** (Động vật)
- 🍎 **Fruits** (Hoa quả)
- 👨‍⚕️ **Occupations** (Nghề nghiệp)
- ✏️ **School** (Trường học)
- 🚀 **Transport** (Phương tiện giao thông)
- 👕 **Clothing** (Trang phục)
- 🌈 **Colors** (Màu sắc)
- 🏊 **Actions** (Hành động)
- ⚽ **Sports & Hobbies** (Thể thao & Sở thích)
- 🍔 **Food & Drinks** (Thực phẩm & Đồ uống)
- 👨‍👩‍👧 **Family & People** (Gia đình & Con người)
- ☀️ **Weather & Nature** (Thời tiết & Thiên nhiên)
- 👂 **Body Parts** (Bộ phận cơ thể)
- 🏠 **House & Items** (Nhà cửa & Đồ dùng)
- 🪐 **Space & Solar System** (Vũ trụ & Hệ mặt trời)
- 🏰 **Places & Buildings** (Địa điểm & Công trình)
- 🧸 **Toys & Play** (Đồ chơi & Trò chơi)

<div id="quan-ly-tu-vung"></div>

### Quản lý từ vựng tùy chỉnh & Nhập/Xuất Excel:
- **Tìm kiếm từ:** Nhập từ cần tìm vào ô tìm kiếm để tra cứu nhanh từ vựng trong kho.
- **Thêm từ thủ công:** Nhấn **`+ Tạo 1 từ`**, nhập Từ Tiếng Anh và Gợi ý Tiếng Anh, sau đó bấm **Thêm vào danh sách**.
- **Nhập hàng loạt từ Excel/CSV:** 
  1. Nhấn nút **`📤 Nhập Excel/CSV`**.
  2. Tải **File mẫu Excel** về máy.
  3. Điền từ vựng và gợi ý theo đúng các cột mẫu trong file Excel.
  4. Chọn tải file Excel của bạn lên để nạp ngay hàng trăm từ mới vào game.
- **Xuất bộ từ vựng ra Excel:** Nhấn nút **`📊 Xuất Excel`** để tải về file danh sách từ vựng hiện có.

---

<div id="game-dua-boi"></div>

## 4. Game 2: 🏊 Đua Bơi Kỳ Phùng Địch Thủ (Swimming Race)

Game **Đua Bơi** biến đường đua dưới nước thành cuộc tranh tài sôi nổi giữa các học sinh trong lớp.

<div id="dua-boi-tiep-suc"></div>

### Thể thức 1: Đua Bơi Tiếp Sức Từ Vựng (Word Relay)
- **Luật chơi:** Một Thẻ Từ Vựng Tiếng Anh kèm gợi ý sẽ xuất hiện nổi bật phía trên đường đua.
- Học sinh gõ **ĐÚNG** từ vựng đang đố vào khung Chat BBB $\rightarrow$ Nhân vật bơi của học sinh đó sẽ bơi vọt tiến lên 1 bước!
- Ngay khi có bạn gõ đúng, từ vựng sẽ tự động đổi sang một từ mới ngẫu nhiên để cả lớp tiếp tục thi đua bứt tốc về đích.

<div id="dua-boi-tu-dong"></div>

### Thể thức 2: Đua Bơi Tự Động kiểu Game Vịt (Duck Race)
- **Luật chơi:** Giáo viên chọn cự ly đường đua (từ **100m** đến **2000m**).
- Các nhân vật sẽ tự động bơi uốn lượn kịch tính với tốc độ ngẫu nhiên.
- Camera thông minh tự động khóa bám theo nhóm người dẫn đầu, tạo cảm giác hồi hộp như một giải đấu thực thụ.
- Ngay khi xác định đủ Top 1, Top 2, Top 3 cán đích, cuộc đua hoàn tất và hiển thị Bảng Vinh Danh Podiums trao huy chương.

<div id="ghi-danh-dua-boi"></div>

### Cách ghi danh học sinh & Bắt đầu đua:
- **Học sinh tự ghi danh:** Học sinh chỉ cần gõ chữ `"join"` (hoặc `"ready"`, `"r"`, `"1"`) vào khung chat BBB $\rightarrow$ Tên học sinh sẽ lập tức xuất hiện trên một làn bơi riêng.
- **Lấy danh sách tự động:** Nhấn nút **`📥 Lấy từ lớp BBB`** để tiện ích tự động quét tất cả tên học sinh đang tham gia lớp học BigBlueButton.
- **Bắt đầu đua:** Giáo viên bấm **`🚀 Bắt đầu Đua Bơi`** để khởi động đường đua.
- **Làm mới:** Nhấn **`🗑️ Xóa danh sách`** để reset danh sách vận động viên chuẩn bị cho lượt đua mới.

---

<div id="bang-diem"></div>

## 5. 🏆 Bảng Điểm & Xuất Báo Cáo Excel

- Tất cả điểm số tích lũy của học sinh qua các lượt chơi trò chơi đều được ghi nhận tự động tại tab **🏆 Bảng điểm**.
- Giáo viên nhấn nút **`📊 Xuất file Excel/CSV`** để tải về báo cáo danh sách điểm số của cả lớp dạng file Excel CSV (định dạng chuẩn UTF-8 BOM, mở trực tiếp trên Microsoft Excel không bị lỗi phông chữ tiếng Việt).

---

<div id="xu-ly-su-co"></div>

## 6. ❓ Xử lý Sự cố Thường gặp

| Sự cố | Nguyên nhân có thể | Cách xử lý |
| :--- | :--- | :--- |
| **Không thấy bảng Game (Overlay) trên BBB** | Trang BBB chưa bật Overlay hoặc chưa nhận tiện ích | Nhấn nút `🎮 Bật Overlay` trên menu tiện ích hoặc nhấn phím `F5` để tải lại trang BBB. |
| **Game không tự nhận diện tin nhắn học sinh** | Khung chat công khai trên BBB đang bị đóng/thu nhỏ | Mở lại cột Chat Công Khai (Public Chat) trên giao diện BigBlueButton để tiện ích quét được tin nhắn. |
| **Nhập file Excel từ vựng bị báo lỗi** | Tiêu đề cột hoặc định dạng file chưa đúng mẫu | Nhấn nút `📥 Tải File mẫu Excel (.xls)` trên tiện ích để lấy file chuẩn mẫu trước khi nhập dữ liệu. |
| **Học sinh gõ mà không xuất hiện tên đua bơi** | Học sinh gõ chưa đúng từ khóa ghi danh | Nhắc học sinh gõ đúng từ `join` hoặc `ready` vào chat BBB, hoặc bấm `📥 Lấy từ lớp BBB` để nạp tên tự động. |
| **Bảng Game xuất hiện trên tab trình duyệt khác** | Trình duyệt chưa xác định được tab active | Chuyển sang tab BBB và mở lại menu tiện ích để hệ thống tự động khóa hiển thị đúng tab lớp học. |

---

> 💡 **Lời khuyên cho Giáo viên:** Giáo viên nên ghim tiện ích lên thanh công cụ trình duyệt và mở sẵn bảng điều khiển trước khi bắt đầu buổi học để dễ dàng chọn bài đố và theo dõi điểm số của học sinh!

---

<div id="danh-cho-developer"></div>

## 7. 🛠️ Dành Cho Developer (Cấu trúc & Kiến trúc Tiện ích)

Dành cho các lập trình viên muốn nghiên cứu mã nguồn hoặc phát triển thêm tính năng mới cho tiện ích Kyna BBB Games.

### 📁 Cấu trúc thư mục (Directory Structure)

Dự án được tổ chức theo module, phân tách rõ ràng giữa Core (Lõi xử lý) và Games (Giao diện và Logic từng trò chơi):

```text
KynaExtension/
├── manifest.json              # File cấu hình chính của Chrome Extension (Manifest V3)
├── background.js              # Service Worker chạy ngầm, quản lý state và điều phối injection
├── popup.html & popup.js      # Giao diện Bảng điều khiển (Control Panel) của Giáo viên
├── popup.css                  # Style cho Bảng điều khiển
├── core/                      # Lõi xử lý dùng chung
│   ├── bbb-chat-observer.js   # Script quét DOM BBB để bắt tin nhắn chat realtime
│   └── audio-synthesizer.js   # Bộ tổng hợp âm thanh (Sound effects) cho game
├── games/                     # Chứa logic và UI của các minigame
│   ├── guess-the-word/        # Game 1: Đoán chữ
│   │   ├── words.js           # Database từ vựng (450+ từ, 17 chủ đề)
│   │   ├── game-logic.js      # Script xử lý logic game, tính điểm, vẽ Doodle và UI
│   │   └── game-style.css     # CSS cho Overlay màn hình đố chữ
│   └── swimming-race/         # Game 2: Đua bơi
│       ├── race-logic.js      # Cỗ máy vật lý (Physics engine), camera bám đuổi và logic đua
│       └── race-style.css     # CSS cho đường đua dưới nước và bục nhận giải
└── test-environment/          # Môi trường giả lập BBB để DEV/Giáo viên test extension offline
    └── kyna_bbb_simulator.html
```

### 🧠 Kiến trúc Hoạt động (Architecture)

1. **Quét Chat (DOM Mutation Observer):**
   - File `core/bbb-chat-observer.js` đóng vai trò là "con mắt" của tiện ích. Script này sử dụng `MutationObserver` để lắng nghe những thay đổi trên DOM của BigBlueButton (cụ thể là khu vực `chatMessagesList`).
   - Khi học sinh chat, observer sẽ bắt được tên và nội dung, chuẩn hóa chuỗi và phát ra CustomEvent `KynaBBBMessage` cho các Game lắng nghe.

2. **Giao tiếp State (Popup $\leftrightarrow$ Content Scripts):**
   - Bảng điều khiển `popup.js` và các game (như `game-logic.js`, `race-logic.js`) giao tiếp với nhau bằng `chrome.runtime.sendMessage` và `chrome.storage.local`.
   - **State Synchronization:** Khi Giáo viên bấm "Start Game", `popup.js` gửi Action `SYNC_GAME_STATE` cho Content Scripts. Content Script (Overlay) sẽ hiển thị lên màn hình BBB của Giáo viên dựa trên state này. Điểm số từ Content Script cũng liên tục được đẩy ngược về `kynaGameState` trong `chrome.storage.local` để Bảng điều khiển cập nhật realtime.

3. **Giao diện Nổi (UI Overlay Injection):**
   - Các game không can thiệp sâu vào DOM của BBB để tránh lỗi cấu trúc web gốc. Thay vào đó, chúng tạo ra các khối `<div id="kyna-game-overlay">` nổi (Position Fixed, Z-Index cao) đè lên giao diện hiện tại.
   - Khi Game kết thúc hoặc Giáo viên ấn "Stop", các Overlay này sẽ bị gỡ bỏ hoàn toàn khỏi DOM (DOM Cleanup).

4. **Quản lý Cửa sổ (Window & Tab Targeting):**
   - Để tránh Extension chạy nhầm trên nhiều Tab BBB cùng lúc, hệ thống sử dụng cờ `lastFocusedWindow: true` khi lưu state, đảm bảo Game Overlay chỉ xuất hiện trên lớp học mà Giáo viên đang mở và thao tác (Tab Active). Điểm lưu trữ tích lũy (All-time High Score) được quản lý qua key `kynaHighScores`.

---
