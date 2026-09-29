# Thư Viện Số - Library Management System

Project hoàn chỉnh theo implementation plan: Node.js + Express + EJS + SQLite.

## 1. Cài đặt

Mở CMD tại thư mục project:

```bash
npm install
npm start
```

Sau đó mở:

http://localhost:3000

## 2. Tài khoản mặc định

- Username: `admin`
- Password: `admin123`

## 3. Các chức năng

- Landing page public
- Đăng nhập / đăng ký
- Dashboard
- Quản lý sách: thêm, sửa, xóa, chi tiết, tìm kiếm
- Quản lý bạn đọc: thêm, tìm kiếm, chi tiết
- Mượn / trả sách
- Tự động cập nhật số lượng sách còn
- Cảnh báo quá hạn
- Báo cáo thống kê
- Tra cứu sách không cần đăng nhập
- Responsive cơ bản
- In báo cáo bằng `window.print()`

## 4. Database

SQLite tự tạo tại:

`database/library.db`

Không cần cài MySQL.

## 5. Nếu muốn reset dữ liệu

Dừng server, xóa:

`database/library.db`

Sau đó chạy lại:

```bash
npm start
```

Database và dữ liệu mẫu sẽ được tạo lại.

## 6. Lưu ý

Project sử dụng ảnh nền từ Unsplash trong CSS nên cần Internet để hiển thị ảnh nền. Phần chức năng và database vẫn chạy khi không có ảnh.


## Deploy Railway (SQLite + Persistent Volume)

Project này đã hỗ trợ biến môi trường `DB_PATH`, vì vậy có thể giữ SQLite khi deploy.

### 1. Đẩy project lên GitHub

Trong PowerShell tại thư mục project:

```powershell
git init
git add .
git commit -m "Initial library management system"
git branch -M main
git remote add origin https://github.com/USERNAME/library-management.git
git push -u origin main
```

Thay `USERNAME` bằng tài khoản GitHub của bạn.

### 2. Tạo project trên Railway

- Chọn **Deploy from GitHub repo**.
- Chọn repository `library-management`.
- Railway sẽ dùng lệnh `npm start` trong `package.json`.

### 3. Tạo Volume cho SQLite

Tạo một Volume và mount vào:

```text
/data
```

Sau đó tạo Variables:

```text
NODE_ENV=production
DB_PATH=/data/library.db
SESSION_SECRET=thay-bang-mot-chuoi-bi-mat-dai
```

`DB_PATH=/data/library.db` rất quan trọng: nếu không có Volume thì SQLite có thể mất dữ liệu sau khi service được redeploy/restart.

### 4. Tạo domain

Trong Railway, tạo public domain cho service. Sau đó mở domain bằng trình duyệt và kiểm tra:

```text
/health
```

Nếu trả về JSON có `"status":"ok"` thì server đã chạy.

### Tài khoản demo

```text
Username: admin
Password: admin123
```

Nên đổi mật khẩu sau khi deploy nếu website được chia sẻ công khai.
