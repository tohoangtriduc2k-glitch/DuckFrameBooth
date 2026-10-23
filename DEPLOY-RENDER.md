# Deploy DuckFrameBooth lên Render

## 1. Đưa mã nguồn lên GitHub
1. Giải nén ZIP.
2. Trong GitHub Desktop, chọn repository DuckFrameBooth và mở thư mục local.
3. Sao lưu bản cũ trước khi thay file. Chép nội dung bên trong thư mục `DuckFrameBooth` vào thư mục repository (không tạo thêm một thư mục lồng cùng tên).
4. Kiểm tra `data/frames.json` và `public/frames/` đều có trong repository.
5. GitHub Desktop → Summary nhập `Prepare DuckFrameBooth deployment` → Commit to main → Push origin.

## 2. Tạo website trên Render
1. Đăng nhập Render.com và kết nối tài khoản GitHub.
2. Chọn **New + → Blueprint** (hoặc New Web Service), chọn repository DuckFrameBooth.
3. Nếu dùng Blueprint, Render đọc `render.yaml` và tạo dịch vụ; nếu dùng Web Service, chọn Runtime Node, Build Command `npm ci`, Start Command `npm start`.
4. Chờ deploy thành công rồi mở URL `https://...onrender.com` do Render cấp.
5. Mở URL `/api/frames` để xác nhận API trả về danh sách frame.

## Lưu ý quan trọng
- Dịch vụ miễn phí có thể ngủ khi không hoạt động và lần mở đầu có thể chậm.
- Dữ liệu chỉnh ô ảnh được ghi vào `data/frames.json`. Trên hosting có filesystem tạm thời, thay đổi có thể mất khi deploy/restart; hãy hoàn thiện và commit cấu hình frame trước khi mở cho khách. Nếu cần chỉnh trực tiếp trên web và giữ dữ liệu bền vững, cần thêm lưu trữ bền vững (ví dụ database/disk) và bảo vệ trang quản trị.
- Không đặt mật khẩu, token hay khóa bí mật vào repository công khai.
- QR chỉ tạo sau khi có URL HTTPS thật của website.
