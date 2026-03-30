# Kịch bản quay video demo - SecureVault Password Manager

**Môn:** Bảo mật thông tin Web
**Thời lượng dự kiến:** 8-10 phút
**Công cụ:** Trình quay màn hình (OBS / Xbox Game Bar)

---

## Cấu trúc video

| STT | Nội dung | Thời lượng |
|-----|----------|------------|
| 1 | Giới thiệu tổng quan | ~45s |
| 2 | Đăng ký tài khoản | ~1m |
| 3 | Đăng nhập | ~45s |
| 4 | Thêm mật khẩu mới | ~1m |
| 5 | Xem & giải mã mật khẩu | ~1m |
| 6 | Chỉnh sửa mật khẩu | ~1m |
| 7 | Sao chép & tự động xóa clipboard | ~30s |
| 8 | Tạo mật khẩu ngẫu nhiên | ~1m |
| 9 | Xóa mật khẩu | ~30s |
| 10 | Kiểm tra cơ sở dữ liệu (chứng minh mã hóa) | ~1m |
| 11 | Tính năng tự động khóa | ~30s |
| 12 | Kết luận | ~30s |

---

## Chi tiết từng phân cảnh

---

### PHÂN CẢNH 1: Giới thiệu tổng quan (~45s)

**Hình ảnh:** Hiển thị sơ đồ kiến trúc Zero-Knowledge trên README.md

**Lời dẫn:**
> "Đây là SecureVault - trình quản lý mật khẩu được xây dựng theo kiến trúc Zero-Knowledge. Điểm đặc biệt là server KHÔNG BAO GIỜ nhìn thấy mật khẩu gốc của người dùng. Mọi mã hóa và giải mã đều diễn ra ở phía trình duyệt."

**Thao tác màn hình:**
- Mở file `README.md` hoặc `flow.md` → cuộn đến phần Architecture diagram
- Highlight sơ đồ 3 tầng: Client - Server - Database
- Chỉ vào dòng "Master password never leaves the client"

**Lời dẫn (tiếp):**
> "Các thuật toán được sử dụng: PBKDF2 với 100.000 lần lặp để tạo khóa từ mật khẩu master, AES-256-GCM để mã hóa dữ liệu, bcrypt để lưu trữ trên server, và JWT để quản lý phiên."

---

### PHÂN CẢNH 2: Đăng ký tài khoản (~1m)

**Hình ảnh:** Trang Register

**Lời dẫn:**
> "Bắt đầu với chức năng đăng ký. Khi người dùng nhập username và master password, trình duyệt sẽ thực hiện các bước sau:"

**Thao tác màn hình:**
1. Mở trình duyệt → truy cập `http://localhost:5173`
2. Click vào nút "Register" / chuyển đến trang đăng ký
3. Nhập username: `demo_user`
4. Nhập master password: `SecurePass123!`
5. Nhập confirm password
6. Click "Register"

**Lời dẫn (giải thích khi thao tác):**
> "Sau khi nhấn Register, client tự động: tạo salt ngẫu nhiên 16 byte, dùng PBKDF2 với 100.000 lần lặp để tạo derived key 256-bit, sau đó hash derived key bằng SHA-256 và gửi lên server. Master password KHÔNG được gửi đi."

**Thao tác bổ sung:**
- Mở DevTools (F12) → tab Network → chỉ vào request POST `/api/auth/register`
- Hiển thị request body: `{ username, salt, passwordHash }` — không có master password

---

### PHÂN CẢNH 3: Đăng nhập (~45s)

**Hình ảnh:** Trang Login

**Lời dẫn:**
> "Đăng nhập lại để lấy derived key về bộ nhớ. Server xác minh bằng bcrypt và trả về JWT token."

**Thao tác màn hình:**
1. Click "Logout" (nếu đang đăng nhập) hoặc refresh trang
2. Nhập username: `demo_user`
3. Nhập master password: `SecurePass123!`
4. Click "Login"
5. Chuyển đến trang Dashboard

**Lời dẫn (giải thích):**
> "Client gửi username lên server để lấy salt, dùng PBKDF2 derive lại key, hash và gửi lên xác minh. Server trả về JWT token. Derived key được giữ trong bộ nhớ trình duyệt, KHÔNG lưu vào localStorage."

---

### PHÂN CẢNH 4: Thêm mật khẩu mới (~1m)

**Hình ảnh:** Trang Dashboard - Form thêm credential

**Lời dẫn:**
> "Giờ ta thêm một tài khoản mới. Khi nhập thông tin đăng nhập, mật khẩu sẽ được mã hóa NGAY TẠI TRÌNH DUYỆT trước khi gửi lên server."

**Thao tác màn hình:**
1. Click nút "Add Credential" / "Thêm mới"
2. Nhập website: `github.com`
3. Nhập username: `john_dev`
4. Nhập password: `MyGitHub@2024`
5. Click "Save" / "Lưu"

**Lời dẫn (giải thích):**
> "Client tạo IV ngẫu nhiên 12 byte, dùng AES-256-GCM mã hóa mật khẩu với derived key. Chỉ ciphertext và IV được gửi lên server. Server lưu trữ nhưng KHÔNG THỂ giải mã."

**Thao tác bổ sung:**
- Mở DevTools → Network → click vào request POST `/api/credentials`
- Hiển thị body: `{ website, username, encryptedPassword, iv }` — mật khẩu gốc không xuất hiện

**Thêm 1-2 credential nữa để demo list:**
- `gmail.com` / `john@gmail.com` / `Gmail_Pass_456`
- `facebook.com` / `john.fb` / `FB_Secure_789`

---

### PHÂN CẢNH 5: Xem & giải mã mật khẩu (~1m)

**Hình ảnh:** Danh sách credential trên Dashboard

**Lời dẫn:**
> "Danh sách hiển thị website và username ở dạng plaintext, nhưng mật khẩu được ẩn đi. Chỉ khi người dùng click vào icon con mắt, mật khẩu mới được giải mã và hiển thị."

**Thao tác màn hình:**
1. Hiển thị danh sách 3 credential vừa thêm
2. Mật khẩu hiển thị dạng `●●●●●●●●`
3. Click icon "mắt" (eye icon) ở credential `github.com`
4. Mật khẩu được giải mã: `MyGitHub@2024` hiển thị ra

**Lời dẫn (giải thích):**
> "Quá trình giải mã: server trả về ciphertext và IV, client dùng derived key đã lưu trong bộ nhớ để giải mã AES-256-GCM. Nếu nhập sai master password lúc đăng nhập, derived key sẽ sai và giải mã thất bại."

---

### PHÂN CẢNH 6: Chỉnh sửa mật khẩu (~1m)

**Hình ảnh:** Form edit credential

**Lời dẫn:**
> "Khi chỉnh sửa, client sẽ tạo MỘT IV MỚI và mã hóa lại mật khẩu. Mỗi lần mã hóa dùng IV khác nhau để đảm bảo an toàn."

**Thao tác màn hình:**
1. Click nút "Edit" trên credential `github.com`
2. Thay đổi password thành: `NewGitHub@2025`
3. Click "Save" / "Cập nhật"
4. Click eye icon → xác nhận mật khẩu mới đã được giải mã đúng

---

### PHÂN CẢNH 7: Sao chép & tự động xóa clipboard (~30s)

**Hình ảnh:** Credential list với nút copy

**Lời dẫn:**
> "Tính năng sao chép mật khẩu có cơ chế tự động xóa clipboard sau 30 giây,防止 mật khẩu bị dán nhầm nơi hoặc留在 clipboard太久."

**Thao tác màn hình:**
1. Click nút "Copy" (icon copy) trên một credential
2. Paste ra Notepad để chứng minh đã copy: `Gmail_Pass_456`
3. Chờ 5-10 giây (hoặc giải thích "sau 30 giây clipboard sẽ tự động xóa")
4. Paste lại → hiển thị rỗng hoặc nội dung khác

---

### PHÂN CẢNH 8: Tạo mật khẩu ngẫu nhiên (~1m)

**Hình ảnh:** Password Generator (trong form Add/Edit credential hoặc trang riêng)

**Lời dẫn:**
> "Chức năng tạo mật khẩu ngẫu nhiên sử dụng CSPRNG - bộ tạo số ngẫu nhiên mật mã học, KHÔNG PHẢI Math.random(). Sử dụng crypto.getRandomValues() của Web Crypto API."

**Thao tác màn hình:**
1. Mở form Add Credential hoặc tìm nút "Generate Password"
2. Set độ dài: 20 ký tự
3. Bật tất cả tùy chọn: Uppercase, Lowercase, Numbers, Special
4. Click "Generate"
5. Hiển thị mật khẩu ngẫu nhiên: ví dụ `kR7#mP2$xN9@qL4!wJ6`
6. Click "Generate" lần nữa → mật khẩu khác hoàn toàn
7. Click "Use" / "Sử dụng" để dùng mật khẩu này

---

### PHÂN CẢNH 9: Xóa mật khẩu (~30s)

**Hình ảnh:** Danh sách credential

**Lời dẫn:**
> "Xóa credential gửi request DELETE kèm JWT. Server chỉ xóa nếu user_id trùng khớp,防止 người dùng xóa dữ liệu của người khác."

**Thao tác màn hình:**
1. Click nút "Delete" trên credential `facebook.com`
2. Xác nhận xóa (nếu có dialog confirm)
3. Credential biến khỏi danh sách

---

### PHÂN CẢNH 10: Kiểm tra cơ sở dữ liệu (~1m)

**Hình ảnh:** Terminal hoặc SQLite browser

**Lời dẫn:**
> "Đây là phần quan trọng nhất. Ta mở trực tiếp cơ sở dữ liệu SQLite để chứng minh: server chỉ lưu dữ liệu đã mã hóa."

**Thao tác màn hình:**
1. Mở terminal
2. Chạy lệnh mở database:
   ```bash
   cd server
   # hoặc dùng DB Browser for SQLite
   sqlite3 database.sqlite
   ```
3. Query bảng users:
   ```sql
   SELECT id, username, salt, password_hash FROM users;
   ```
   - Hiển thị: salt là Base64 random string, password_hash là bcrypt hash
   - KHÔNG có master password

4. Query bảng credentials:
   ```sql
   SELECT id, website, username, encrypted_password, iv FROM credentials;
   ```
   - Hiển thị: encrypted_password là chuỗi Base64 dài, KHÔNG phải plaintext
   - Website và username ở dạng plaintext (không cần mã hóa)

**Lời dẫn (tóm tắt):**
> "Như các bạn thấy, ngay cả khi attacker truy cập được database, họ chỉ thấy ciphertext. Không có cách nào giải mã mà không có derived key từ master password."

---

### PHÂN CẢNH 11: Tính năng tự động khóa (~30s)

**Hình ảnh:** Trang Dashboard đang đăng nhập

**Lời dẫn:**
> "Sau 5 phút không hoạt động, hệ thống tự động khóa phiên. Derived key bị xóa khỏi bộ nhớ, JWT token bị xóa, và người dùng bị chuyển về trang đăng nhập."

**Thao tác màn hình:**
- **Cách 1 (nếu có thể chờ):** Đứng yên 5 phút → hệ thống tự logout
- **Cách 2 (demo nhanh):** Giải thích logic, hiển thị code `auto-lock` trong source, chỉ vào:
  - `mousemove`, `keydown`, `click` events theo dõi hoạt động
  - `setTimeout` / `setInterval` kiểm tra mỗi 30 giây
  - Nếu quá 5 phút → gọi `logout()`

---

### PHÂN CẢNH 12: Kết luận (~30s)

**Hình ảnh:** Quay lại sơ đồ kiến trúc hoặc trang Dashboard

**Lời dẫn:**
> "Tóm lại, SecureVault đảm bảo các tính chất bảo mật:"
>
> "1. **Zero-Knowledge**: Server không bao giờ thấy mật khẩu gốc."
> "2. **Client-side Encryption**: Mã hóa AES-256-GCM ở trình duyệt."
> "3. **Key Derivation an toàn**: PBKDF2 với 100.000 lần lặp."
> "4. **Session Security**: JWT với thời hạn 24 giờ."
> "5. **Auto-Lock**: Tự khóa sau 5 phút không hoạt động."
> "6. **Clipboard Security**: Tự xóa clipboard sau 30 giây."

> "Đây là đồ án môn Bảo mật thông tin Web. Cảm ơn các bạn đã theo dõi."

---

## Mẹo quay video

1. **Chuẩn bị trước:** Đăng ký sẵn 1 tài khoản test, thêm vài credential để demo nhanh
2. **Zoom:** Phóng to trình duyệt 125-150% cho dễ nhìn
3. **DevTools:** Mở sẵn F12, chuẩn bị sẵn Network tab
4. **Tempo:** Nói chậm, rõ ràng, pause giữa các phân cảnh
5. **Fullscreen:** Quay toàn màn hình hoặc vùng cố định
6. **Audio:** Nếu có voice-over thì tốt, không thì dùng text overlay

---

## Checklist trước khi quay

- [ ] Server chạy trên `http://localhost:3000`
- [ ] Client chạy trên `http://localhost:5173`
- [ ] Database đã được seed hoặc sẵn sàng tạo mới
- [ ] Trình duyệt ở chế độ 100% zoom hoặc 125%
- [ ] DevTools đã mở sẵn tab Network
- [ ] SQLite browser hoặc terminal sẵn sàng cho phân cảnh 10
- [ ] Chụp ảnh/ghi chú các giá trị test (username, password)

---

*SecureVault - Password Manager*
*Bảo mật thông tin Web*
