# Võ Sinh Làng Tre

Prototype game 2D browser theo tinh thần nhập môn võ đường làng Việt Nam.

## Chơi thử local

```bash
npm install
npm run dev
```

Mặc định Vite chạy ở `http://localhost:5173`; trong phiên Codex hiện tại đang dùng `http://localhost:5187`.

## Điều khiển

- `WASD` hoặc phím mũi tên: di chuyển
- `Space` hoặc `E`: nói chuyện, tiếp thoại, tương tác cổng/lối đi; nếu không có gì gần thì vung gậy
- Nút cảm ứng hiện trên màn hình nhỏ

## Loop hiện tại

1. Nói chuyện với thầy Ba ở đình làng.
2. Hái 5 bông sen và luyện 4 bù nhìn rơm.
3. Đi xuống lối đất phía nam để sang bãi tre.
4. Nhặt 3 thẻ tre, luyện gậy.
5. Quay về đình làng để hoàn thành nhập môn.

## Asset

Sprite võ sinh và thầy Ba được AI-generate, xử lý chroma-key sang PNG alpha, rồi chuẩn hóa thành spritesheet trong `public/assets/`.
