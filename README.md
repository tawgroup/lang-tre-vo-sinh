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

## Mở rộng map và cốt truyện

- `src/content/maps.ts`: cấu hình map, background, blocker, vùng nước, exit, NPC, collectibles, mục tiêu luyện.
- `src/content/story.ts`: thoại/cốt truyện theo phase.
- `src/gameState.ts`: phase quest, inventory/progress, serialize save.
- `src/save.ts`: auto-save qua `localStorage`.

Muốn thêm map mới: thêm id vào `MapId`, thêm entry trong `MAPS`, rồi thêm background vào `public/assets/maps/`.

## Vật lý/terrain

- Deep water đang là collider: chưa học bơi thì không đi thẳng xuống ao/hồ.
- Shallow water làm nhân vật đi chậm và đổi trạng thái HUD thành `Lội nước`.
- Exit xuống map mới nằm ở vùng đường đất phía nam, không còn bị blocker che.

## Asset

Sprite võ sinh, thầy Ba, và map background được AI-generate, xử lý/chuẩn hóa rồi đặt trong `public/assets/`.
