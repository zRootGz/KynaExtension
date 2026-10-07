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

### ✨ Các tính năng & Cải tiến nổi bật:
- 🔤 **Gom nhóm theo từ & Xuống dòng thông minh (`.kyna-word-group`)**: 
  - Hỗ trợ cả từ dài (như `BUTTERFLY`, `WATERMELON`) và cụm từ nhiều từ (như `ICE CREAM`, `BLACK CAT`). 
  - Ô chữ của cùng 1 từ được gom trong nhóm riêng; khi hết chiều rộng dòng, nguyên từ tiếp theo mới chuyển xuống dòng mới, tuyệt đối không bị ngắt đôi giữa chừng chữ cái.
- 📐 **Tự động co giãn kích thước ô chữ (`box-medium`, `box-small`)**:
  - Từ ngắn ($\le 7$ ký tự): Ô chữ lớn chuẩn **48x58px**.
  - Từ trung bình ($8 - 10$ ký tự): Ô chữ vừa **40x50px**.
  - Từ/Cụm từ dài ($> 10$ ký tự): Ô chữ nhỏ **34x44px**.
- 🖼️ **Giao diện tối ưu cho Chia sẻ Màn hình BBB (Screen Share Zoom)**:
  - Khung Overlay mở rộng tới **680px** (tối đa `92vw`).
  - Khung ảnh minh họa Doodle cao **380px** với biểu tượng nét vẽ Doodle cỡ lớn **76px** cực kỳ rõ nét từ xa.
- ⏱️ **Tự động chuyển câu sau 60s / khi đoán đúng**:
  - Khi hết 60s đếm ngược (hoặc khi có học sinh đoán đúng), hệ thống mở toàn bộ đáp án, hiển thị thông báo chúc mừng/hết giờ màu sắc và tự động sang câu mới sau **3.5 giây**.
  - Nút **⏭️ Từ tiếp theo** giúp Giáo viên chuyển câu lập tức mà không bị xung đột bộ đếm.

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

Game **Đua Bơi** tạo không khí thi đấu sôi nổi kịch tính giữa các học sinh trên một hồ bơi chuyển động với hiệu ứng sóng nước, bứt tốc rượt đuổi và trao giải huy chương.

### Thể thức 1: 🔤 Đua Bơi Tiếp Sức Từ Vựng (Word Relay)
- **Thẻ Từ Vựng Mục Tiêu Nổi Bật (`kyna-swim-word-card`)**: Một Thẻ Từ Vựng Tiếng Anh (VD: `🎯 BANANA - 💡 A long yellow fruit`) với chữ phát sáng **32px** và icon nổi bật sẽ hiển thị ngay đầu đường bơi.
- **Cách chơi:**
  - Học sinh nhắn **ĐÚNG** từ vựng đang hiển thị trong chat BBB $\rightarrow$ Nhân vật bơi của học sinh đó quạt tay tiến lên 1 bước (+16%).
  - **Từ vựng ngay lập tức được đổi sang một từ mới ngẫu nhiên** để cả lớp tiếp tục thi đua!
  - Học sinh cán đích (100%) sẽ nhận huy chương (🥇 Hạng 1, 🥈 Hạng 2, 🥉 Hạng 3) và hiển thị `🏁 Đã về đích`.

### Thể thức 2: 🦆 Đua Bơi Tự Động kiểu Game Vịt (Duck Race)
- **Hệ số Thể lực & Bứt tốc Phân hóa (`⚡ BỨT TỐC!`, `💦 ĐUỐI SỨC`)**: Mỗi vận động viên được gán hệ số thể lực/kỹ năng riêng ngẫu nhiên ($0.65\times - 1.55\times$) kết hợp bứt tốc ngẫu nhiên khủng (**$3.5\times - 6.0\times$**), giúp các tay bơi bỏ xa nhau kịch tính thực sự chuẩn phong cách Game Vịt.
- **Tối ưu Giao diện Vạch Đích**: Khung thông tin vận động viên (`.kyna-swimmer`) được bảo vệ bằng quy tắc `white-space: nowrap` và giới hạn điểm dừng 360px sát vạch cảm ứng, tuyệt đối không bị dồn ép hay vỡ chữ khi sát vạch đích.
- **Hiệu ứng Sóng nước Cuộn dài (`is-racing`)**: Nền đường bơi có hoạt ảnh sóng nước cuộn về phía sau mượt mà, tạo cảm giác đường đua có chiều sâu thực sự.

### ⏱️ Bộ đếm thời gian tổng cuộc đua & Trao giải khi Hết giờ:
- **Đa dạng Tùy chọn Thời lượng:** Giáo viên có thể tùy chọn linh hoạt từ **15s, 30s, 45s, 60s, 90s (Khuyên dùng), 120s, 180s (3m), 240s (4m), 300s (5m)** đến **600s (10m)**.
- **Trao giải khi Hết giờ:** Khi đồng hồ đếm ngược về `0s`, cuộc đua tự động dừng lại. Học sinh chưa về đích 100% sẽ được tự động xếp hạng trao giải (🥇 🥈 🥉) dựa trên **phần trăm quãng đường đã bơi xa nhất**!

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
| **Extension không đọc được chat học sinh** | Cột Khung Chat trong BBB đang bị thu nhỏ/đóng | Đảm bảo cột Chat công khai trong BigBlueButton đang được mở và các quyền của extension đã được bật hết trong mục `Details` |
| **File Excel nhập vào bị báo lỗi** | Cột 1 không có Từ Tiếng Anh hoặc cột 2 thiếu Gợi ý | Bấm nút `📥 Tải File mẫu Excel (.xls)` để lấy chuẩn định dạng file. |
| **Tên học sinh không cập nhật vào Đua bơi** | Học sinh nhắn từ khác không phải `join` | Nhắc học sinh nhắn đúng từ `join` hoặc `ready` vào chat, hoặc bấm `📥 Lấy từ lớp BBB`. |

---

## 📞 Hỗ trợ & Đóng góp
- **Đơn vị phát triển:** ThuanDepTraiBoDoiThe (phanngocthuan293@gmail.com)
- **Phiên bản:** v1.0 (Manifest V3)
- **Tương thích:** BigBlueButton v2.4+, Chrome v100+, Edge v100+
