# DuckFrameBooth — Website ghép frame cute

Tên web: **DuckFrameBooth**  
Thông tin chân trang:
- Điện thoại: 0877567590
- Bản quyền web: Hoàng Đức
- Facebook: Hoàng Đức (Đứk)
- TikTok: Photo Chả Mực

Toàn bộ 64 ảnh trong ZIP được đưa vào `public/frames/`. Ứng dụng chạy bằng Node.js, phù hợp điện thoại và máy tính. Khách chọn frame, chọn ảnh cho từng ô, thu phóng/kéo ảnh để căn chỉnh, sau đó tải PNG được xuất ở đúng kích thước pixel của frame gốc.

## 1. Chạy thử trong Visual Studio Code

1. Cài Node.js LTS: https://nodejs.org/
2. Giải nén ZIP này rồi mở thư mục `DuckFrameBooth` bằng Visual Studio Code.
3. Mở Terminal → New Terminal, chạy:

   ```bash
   npm install
   npm start
   ```

4. Mở `http://localhost:3000`.

Ảnh khách chọn được xử lý trực tiếp trong trình duyệt; file ảnh không cần tải lên máy chủ. Cấu hình vị trí ô ảnh được lưu vào `data/frames.json`.

## 2. Cấu hình frame trước khi mở cho khách

Các frame gốc đã được nhập vào thư viện. Vì ZIP có cả frame ô chữ nhật, ô tròn, ô hình trái tim và ảnh nghiêng, công cụ tự dò chỉ có thể tạo **vị trí ô ban đầu**; bạn nên kiểm tra các frame trước khi đưa cho khách sử dụng.

- Mở `http://localhost:3000/?admin=1` để bật nút quản trị **Sửa vị trí ô ảnh**.
- Chọn frame cần sửa.
- Bấm “Sửa vị trí ô ảnh”, kéo trên ảnh preview để vẽ mỗi vùng ảnh cần ghép thành một ô chữ nhật.
- Vẽ đủ số ô theo thứ tự, sau đó bấm “Lưu vị trí ô ảnh”.
- Lặp lại với frame có vị trí ô chưa chuẩn. Cấu hình được lưu trên máy chủ, nên áp dụng cho mọi khách truy cập website đó.

Lưu ý: phiên bản hiện tại ghép ảnh trong các vùng chữ nhật. Với ô trái tim, ô tròn hoặc ô nghiêng, bạn cần cung cấp frame có vùng ảnh dạng chữ nhật phù hợp hoặc cần bổ sung mask/rotation riêng cho frame đó. Không nên phát hành một frame trước khi đã kiểm tra vị trí các ô.

## 3. Chất lượng ảnh tải về

- Canvas xuất ở đúng kích thước pixel của frame gốc; ảnh nguồn không bị giảm kích thước trước khi ghép.
- File tải về là PNG để tránh nén mất dữ liệu thêm.
- Độ nét tối đa phụ thuộc vào độ phân giải frame gốc và ảnh khách chọn. Nếu frame gốc là 1024×1536, xuất PNG sẽ giữ 1024×1536; không thể khôi phục chi tiết mà file gốc không có.
- Ảnh được crop theo kiểu lấp đầy ô; khách có thể kéo ảnh trong ô và dùng thanh thu phóng.

## 4. Đưa website lên mạng để khách truy cập bằng điện thoại

Website hiện chạy ở máy tính cá nhân. Để khách ở nơi khác truy cập, cần deploy ứng dụng Node.js lên một dịch vụ hosting hỗ trợ Node.js (ví dụ Render, Railway hoặc VPS) và gắn tên miền nếu muốn. Hãy tải cả thư mục dự án lên dịch vụ hosting, cài dependencies và chạy `npm start`.

Nếu khách chỉ ở cùng Wi-Fi, bạn có thể mở địa chỉ LAN mà Terminal in ra, nhưng địa chỉ đó không dùng được từ mạng ngoài.

## 5. Tạo mã QR thật

Chưa thể tạo mã QR hoạt động dẫn đến website của bạn khi website chưa có URL công khai. Không nên tạo QR bằng `localhost`, vì điện thoại khách sẽ không mở được.

Sau khi deploy:
1. Mở `https://TEN-MIEN-THAT/?admin=1` hoặc mở mục **Tạo QR website** ở chân trang.
2. Nhập URL HTTPS thật của website.
3. Bấm “Tạo mã QR” rồi tải file `DuckFrameBooth-QR.png`.
4. In mã QR và đặt tại quầy Selfbooth.

Để người dùng gõ “DuckFrameBooth” trên Google/trình duyệt rồi tìm thấy trang, nên gắn tên miền dễ nhớ, thêm tiêu đề/description (đã có trong HTML), sau đó đăng ký website với Google Search Console và chờ được lập chỉ mục. Việc gõ tên trên thanh địa chỉ không tự động mở website nếu chưa có tên miền hoặc kết quả tìm kiếm.

## 6. Chỗ thường sửa

- Giao diện, màu sắc, font, bố cục: `public/style.css`
- Lời chào, tên web, thông tin chân trang: `public/index.html`
- Luồng chọn frame, upload ảnh, crop/zoom, xuất PNG, QR: `public/app.js`
- Danh sách frame và vị trí các ô: `data/frames.json`
- Ảnh frame gốc: `public/frames/`
- API lưu cấu hình và tạo QR: `server.js`

Không thay tên file frame trong `public/frames/` trừ khi sửa tương ứng trong `data/frames.json`.
