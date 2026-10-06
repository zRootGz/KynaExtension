# 🎨 Kyna BigBlueButton (BBB) Classroom Games Extension (v1.0)

> **Bộ tiện ích Game tương tác lớp học thông minh tích hợp trực tiếp trên BigBlueButton dành riêng cho Giáo viên Kyna English.**  
> Hỗ trợ tạo hoạt động học tập sôi nổi, tự động quét học sinh, nhận diện câu trả lời qua Chat real-time và xuất bảng điểm Excel CSV chuyên nghiệp.

---

## 📌 MỤC LỤC
1. [Giới thiệu Tổng quan](#1-giới-thiệu-tổng-quan)
2. [Hướng dẫn Cài đặt Tiện ích (Chrome / Edge / Cốc Cốc)](#2-hướng-dẫn-cài-đặt-tiện-ích)
3. [Game 1: 🎨 Đoán Chữ (Guess The Word)](#3-game-1--đoán-chữ-guess-the-word)
   - [Cách vận hành Game](#cách-vận-hành-game-đoán-chữ)
   - [Chọn chủ đề từ vựng sẵn có](#chọn-chủ-đề-từ-vựng-sẵn-có-240-từ)
   - [Thêm từ vựng thủ công](#thêm-từ-vựng-thủ-công)
   - [Nhập hàng loạt từ vựng từ File Excel (.xls / .csv)](#nhập-hàng-loạt-từ-vựng-từ-file-excel-xls--csv)
   - [Xuất bộ từ vựng ra File Excel](#xuất-bộ-từ-vựng-ra-file-excel)
4. [Game 2: 🏊 Đua Bơi Kỳ Phùng Địch Thủ (Swimming Relay Race)](#4-game-2--đua-bơi-kỳ-phùng-địch-thủ-swimming-relay-race)
   - [Thể thức 1: 🔤 Đua Bơi Tiếp Sức Từ Vựng (Word Relay)](#thể-thức-1--đua-bơi-tiếp-sức-từ-vựng-word-relay)
   - [Thể thức 2: 🦆 Đua Bơi Tự Động kiểu Game Vịt (Duck Race)](#thể-thức-2--đua-bơi-tự-động-kiểu-game-vịt-duck-race)
   - [Ghi danh học sinh & Quyền bắt đầu](#ghi-danh-học-sinh--quần-bắt-đầu)
   - [Tự động nạp danh sách học sinh từ BBB](#tự-động-nạp-danh-sách-học-sinh-từ-bbb)
5. [Bảng Điểm & Xuất File CSV Excel (Leaderboard & Export)](#5-bảng-điểm--xuất-file-csv-excel)
6. [Xử lý Sự cố Thường gặp (Troubleshooting)](#6-xử-lý-sự-cố-thường-gặp)

---

## 1. Giới thiệu Tổng quan

**Kyna BBB Extension** là tiện ích mở rộng Chrome/Edge (Manifest V3) được thiết kế đặc biệt nhằm nâng cao tính tương tác trong các buổi học trực tuyến tại **Kyna English**. 

### 🌟 Điểm nổi bật:
- ⚡ **Tương tác Real-time:** Tự động lắng nghe câu trả lời của học sinh từ khung chat BBB không độ trễ.
- 🎨 **Đồ họa sống động:** Giao diện Hồ bơi và Khung vẽ chữ nổi (Overlay) mượt mà, nhiều màu sắc thu hút học sinh.
- 📊 **Quản lý dữ liệu thông minh:** Hỗ trợ nhập/xuất bài học từ File Excel, tính điểm tự động và xuất báo cáo kết quả ra Excel CSV UTF-8.
- 🔒 **Độc lập & An toàn:** Không làm thay đổi cấu trúc cốt lõi của BBB, chạy hoàn toàn cục bộ trên trình duyệt giáo viên.

---

## 2. Hướng dẫn Cài đặt Tiện ích

### 🛠️ Các bước cài đặt trên Chrome / Edge / Cốc Cốc:
1. **Tải bộ mã nguồn tiện ích** về máy tính và giải nén thư mục `KynaExtension`.
2. Mở trình duyệt và truy cập trang quản lý Tiện ích:
   - **Google Chrome / Cốc Cốc:** `chrome://extensions/`
   - **Microsoft Edge:** `edge://extensions/`
3. Bật chế độ dành cho nhà phát triển (**Developer mode**) ở góc trên bên phải màn hình.
4. Bấm nút **Tải tiện ích đã giải nén (Load unpacked)**.
5. Trỏ tới thư mục `KynaExtension` và bấm **Select Folder**.
6. Ghim biểu tượng 🎨 **Kyna BBB Extension** lên thanh công cụ trình duyệt để tiện truy cập.

> 💡 **Lưu ý:** Mỗi khi có cập nhật mới, chỉ cần vào trang `chrome://extensions` và bấm nút **Tải lại (Reload 🔄)**.

---

## 3. Game 1: 🎨 Đoán Chữ (Guess The Word)

Game **Đoán Chữ** giúp học sinh luyện phản xạ từ vựng Tiếng Anh qua hình ảnh nét vẽ tay Doodle sống động và gợi ý thông minh.

![Guess The Word Interface](games/guess-the-word/game-style.css)

### Cách vận hành Game Đoán Chữ:
1. Mở tiện ích $\rightarrow$ Chọn Tab **🎨 Đoán chữ**.
2. Chọn bộ từ vựng muốn đố.
3. Bấm nút **🚀 Bắt đầu Game**.
4. Khung hình ảnh đố chữ (Overlay) sẽ xuất hiện trên màn hình BBB:
   - Học sinh gõ đáp án vào khung chat BBB.
   - Hệ thống tự động kiểm tra đáp án (không phân biệt hoa/thường, tự bỏ qua dấu chấm/phẩy).
   - Học sinh trả lời đúng nhanh nhất sẽ được **+10 điểm** (người trả lời đúng tiếp theo được **+5 điểm**).
5. Giáo viên bấm **⏭️ Từ tiếp theo** để chuyển sang từ đố mới, hoặc **💡 Mở 1 chữ cái** để trợ giúp.

### Chọn chủ đề từ vựng sẵn có (240+ từ):
Có sẵn 8 chủ đề từ vựng Tiếng Anh chuẩn Oxford:
- 🐶 **Animals** (Động vật)
- 🍎 **Fruits** (Hoa quả)
- 👨‍⚕️ **Occupations** (Nghề nghiệp)
- ✏️ **School** (Trường học)
- 🚀 **Transport** (Giao thông)
- 👕 **Clothing** (Trang phục)
- 🌈 **Colors** (Màu sắc)
- 🏊 **Actions** (Hành động)

### Thêm từ vựng thủ công:
- Bấm nút **`+ Tạo 1 từ`**.
- Nhập **Từ Tiếng Anh** (VD: `BUTTERFLY`) và **Gợi ý Tiếng Anh** (VD: `A beautiful insect with wings`).
- Bấm **➕ Thêm vào danh sách Game**.

### Nhập hàng loạt từ vựng từ File Excel (.xls / .csv):
1. Bấm nút **`📤 Nhập Excel/CSV`**.
2. Bấm nút **`📥 Tải File mẫu Excel (.xls)`**. 
   - File Excel mẫu được định dạng sẵn cột rộng rãi, chuyên nghiệp với các cột: `Word (English)`, `English Hint`, `Image URL (Optional)`.
3. Nhập danh sách từ vựng Tiếng Anh và Gợi ý Tiếng Anh của bạn vào file Excel.
4. Bấm **`📁 Chọn File Excel/CSV tải lên`** và chọn file của bạn.
5. Hàng chục/hàng trăm từ vựng sẽ tự động nạp vào game trong 1 giây!

### Xuất bộ từ vựng ra File Excel:
- Bấm nút **`📊 Xuất Excel`** tại mục danh sách từ vựng để lưu bộ từ hiện tại thành file Excel CSV (.csv) sẵn sàng chia sẻ cho các giáo viên khác.

---

## 4. Game 2: 🏊 Đua Bơi Kỳ Phùng Địch Thủ (Swimming Relay Race)

Game **Đua Bơi** tạo không khí thi đấu sôi nổi kịch tính giữa các học sinh trên một hồ bơi chuyển động với hiệu ứng gợn nước và huy chương trao giải.

### Thể thức 1: 🔤 Đua Bơi Tiếp Sức Từ Vựng (Word Relay)
- **Cơ chế:** Một Thẻ Từ Vựng Tiếng Anh ngẫu nhiên (VD: `🍌 BANANA - 💡 A long yellow fruit`) sẽ xuất hiện nổi bật ở đầu đường bơi.
- **Cách chơi:**
  - Học sinh nhắn **ĐÚNG** từ vựng đang hiển thị trong chat BBB $\rightarrow$ Nhân vật bơi của học sinh đó quạt tay tiến lên 1 bước (+16%).
  - **Từ vựng ngay lập tức được đổi sang một từ mới ngẫu nhiên** để cả lớp tiếp tục thi đua!
  - Học sinh cán đích (100%) sẽ nhận huy chương (🥇 Hạng 1, 🥈 Hạng 2, 🥉 Hạng 3) và hiển thị `🏁 Đã về đích (Chờ các bạn khác...)`. Cuộc đua tiếp tục cho đến khi các bạn còn lại hoàn thành.

### Thể thức 2: 🦆 Đua Bơi Tự Động kiểu Game Vịt (Duck Race)
- **Cơ chế:** Các nhân vật bơi thi đấu tự động theo thuật toán bứt phá & bám đuổi ngẫu nhiên kịch tính.
- **Tùy chỉnh thời gian:** Giáo viên chọn thời lượng đua: **15s, 30s (khuyên dùng), 45s, 60s, 90s, 120s**.

### Ghi danh học sinh & Quyền bắt đầu:
- **Học sinh ghi danh:** Học sinh chỉ cần nhắn `"join"` (hoặc `"ready"`, `"r"`, `"1"`) trong khung chat BBB $\rightarrow$ Tên tự động được ghi danh vào một làn bơi riêng.
- **Quyền xuất phát:** Cuộc đua **CHỈ BẮT ĐẦU** khi Giáo viên nhấn nút **`🚀 Bắt đầu Đua Bơi`** trên Bảng điều khiển Extension.
- **Xóa danh sách:** Bấm nút **`🗑️ Xóa danh sách`** để reset đường đua về 0 học sinh bất kỳ lúc nào.

### Tự động nạp danh sách học sinh từ BBB:
- Bấm nút **`📥 Lấy từ lớp BBB`** để tiện ích tự động quét tất cả tên học sinh đang có mặt trong cột "Thành viên" của lớp học BigBlueButton.

---

## 5. Bảng Điểm & Xuất File CSV Excel

- Tất cả điểm số của học sinh qua các lượt chơi Đoán Chữ được lưu tự động tại Tab **🏆 Bảng điểm**.
- Bấm nút **`📊 Xuất file Excel/CSV`** để tải về báo cáo danh sách điểm học sinh dạng file CSV UTF-8 BOM (mở trực tiếp đẹp mắt trên Microsoft Excel không bị lỗi phông chữ).

---

## 6. Xử lý Sự cố Thường gặp

| Sự cố | Nguyên nhân | Cách khắc phục |
| :--- | :--- | :--- |
| **Không thấy Overlay xuất hiện trên BBB** | Chưa bật Overlay hoặc tab BBB bị mất kết nối script | Bấm nút `🎮 Bật Overlay` trên Extension hoặc nhấn `F5` làm mới trang BBB. |
| **Extension không đọc được chat học sinh** | Cột Khung Chat trong BBB đang bị thu nhỏ/đóng | Đảm bảo cột Chat công khai trong BigBlueButton đang được mở. |
| **File Excel nhập vào bị báo lỗi** | Cột 1 không có Từ Tiếng Anh hoặc cột 2 thiếu Gợi ý | Bấm nút `📥 Tải File mẫu Excel (.xls)` để lấy chuẩn định dạng file. |
| **Tên học sinh không cập nhật vào Đua bơi** | Học sinh nhắn từ khác không phải `join` | Nhắc học sinh nhắn đúng từ `join` hoặc `ready` vào chat, hoặc bấm `📥 Lấy từ lớp BBB`. |

---

## 📞 Hỗ trợ & Đóng góp
- **Đơn vị phát triển:** ThuanDepTraiBoDoiThe (phanngocthuan293@gmail.com)
- **Phiên bản:** v1.0 (Manifest V3)
- **Tương thích:** BigBlueButton v2.4+, Chrome v100+, Edge v100+
