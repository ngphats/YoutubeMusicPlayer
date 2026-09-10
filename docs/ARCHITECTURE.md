# 📚 Tài liệu kiến trúc — YoutubeMusicPlayer

> Tài liệu mô tả chi tiết dự án **YoutubeMusicPlayer** (webpack_node sample) — ứng dụng nghe nhạc chung theo playlist thời gian thực.
> Dựa trên source tại commit `b3921ed` (2025-06-23), **đã cập nhật theo vòng nâng cấp 1 (10/09/2026)**: nâng patch/minor toàn bộ dependency, gỡ dependency chết (jQuery, vue-router, archiver, graphql, graphql-http, express-session), 54 → 16 lỗ hổng npm (0 critical). Ngôn ngữ: Tiếng Việt.

---

## 1. Tổng quan

**YoutubeMusicPlayer** là ứng dụng web cho phép nhiều người dùng cùng chia sẻ một playlist nhạc YouTube:

- Một người **thêm bài hát** (bằng URL YouTube hoặc tìm kiếm) → tất cả các thiết bị đang mở trang đều nhận được bài hát đó ngay lập tức.
- Một người **điều khiển phát nhạc** (play / next / stop / chọn bài) trên **bất kỳ thiết bị nào** trong danh sách — mô hình *"điều khiển từ xa"*: máy A bấm play, máy B phát ra tiếng.
- Giao diện Bootstrap 5 + Vue.js 2, đồng bộ qua **Socket.IO**, phát nhạc bằng thư viện **Playem** (đa nền tảng: YouTube, Dailymotion, Deezer, Bandcamp...).
- Dữ liệu playlist lưu trên **Firebase Firestore** (nếu có credentials), nếu không thì dùng bộ nhớ tạm.

## 2. Tech Stack

| Lớp | Công nghệ | Phiên bản |
|---|---|---|
| Backend | Node.js, Express.js | 4.22.2 |
| Real-time | Socket.IO (server + client) | 4.8.3 |
| Frontend | Vue.js 2 | 2.7.16 |
| UI | Bootstrap 5, Popper, Font Awesome 6 | 5.3.8 / 2.11.8 / 6.7.2 |
| Phát nhạc | Playem (`playemjs`) | 1.3.2 (bản bundle tĩnh trong `public/assets/js/playem.js`) |
| Build | Webpack 5 + Babel 7 + vue-loader 15 | 5.110.3 |
| Database | Firebase Admin SDK → Firestore | 12.7.0 |
| Khác | helmet, compression, cors, dotenv, EJS | 8.3.0 / 1.8.1 / 2.8.6 / 16.6.1 / 3.1.10 |
| Runtime khuyến nghị | Node.js 24 LTS (README cũ ghi 14+ — đã EOL) | — |

## 3. Sơ đồ kiến trúc

```
┌────────────────────────────── Browser (nhiều thiết bị) ──────────────────────────────┐
│  views/home.ejs  ──►  Vue 2 (HomeComponent.vue)                                      │
│     │                    │                                                           │
│     │  HTTP (axios)      │  WebSocket (socket.io-client)                             │
│     ▼                    ▼                                                           │
│  REST API  / /view /add  │  player_active, add_new_track, play, on_track_change      │
└─────────────┬────────────┴─────────────┬─────────────────────────────────────────────┘
              │                          │
              ▼                          ▼
┌────────────────────────────── Node.js Server (app.js) ───────────────────────────────┐
│  Express (router, /api)  ◄────►  Socket.IO (server/services/socket)                  │
│       │                                │  lsPlayerActive (in-memory)                 │
│       ▼                                │                                             │
│  Controllers (HomeController)          └── emit: list_player_active / play / ...     │
│       │                                                                              │
│       ▼                                                                              │
│  Models (PlayListModel) ───► Firebase Firestore (collection `koi-streaming`)         │
│       │                     hoặc fallback: mockPlaylist (in-memory)                  │
│       ▼                                                                              │
│  Services (YouTubeAPIService) ──► YouTube Data API v3 (search / details / playlist)  │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

**Luồng tổng quát:**

1. Client mở trang → server render `home.ejs` kèm biến `serverURL` (`SOCKET_SERVER`).
2. Vue mount → kết nối Socket.IO, emit `player_active` để đăng ký làm "thiết bị phát".
3. Vue gọi `POST /view` lấy toàn bộ playlist → nạp từng bài vào queue của Playem.
4. Thêm bài: lấy thông tin video qua Playem (`getTrackInfo`) → `POST /add` lưu DB → emit `add_new_track` cho tất cả.
5. Điều khiển: bấm play → nếu chọn "This Device" thì phát trực tiếp, nếu chọn máy khác thì emit `play` kèm `socket.id` của máy đích → server chuyển lệnh tới đúng máy đó.

---

## 4. Cấu trúc thư mục

```
YTPlaylist/
├── app.js                      # Entry point server: Express + Socket.IO + Firebase
├── package.json                # Scripts: start, nm (nodemon), build, dev, watch
├── webpack.config.js           # Build Vue → public/assets/js (app.js + vendors.js)
├── .babelrc                    # Babel preset-env (last 2 versions, IE 11)
├── Dockerfile                  # node:20-alpine
├── docker-compose.yml          # Chạy nodemon, map cổng 8081
├── example.env                 # Mẫu biến môi trường
├── .env                        # (gitignored) cấu hình thực tế
├── update-assets.js            # Trống — chưa dùng
│
├── server/
│   ├── index.js                # Barrel export: socket(router) + services
│   ├── router/
│   │   ├── index.js            # Router trang: GET /, POST /view, /add, /testapi
│   │   └── api.js              # Router API: /api/youtube/*, /api/update
│   ├── controllers/
│   │   └── HomeController.js   # Xử lý view/add/update/delete/sort (một phần comment)
│   ├── models/
│   │   └── PlayListModel.js    # Firestore collection `koi-streaming` + mock fallback
│   ├── services/
│   │   ├── index.js            # Barrel export services
│   │   ├── socket/index.js     # Toàn bộ Socket.IO events
│   │   └── YouTubeAPIService.js# Proxy YouTube Data API v3 (search/video/playlist)
│   └── library/
│       └── Log.js              # Ghi log vào tmp/logs/<name>_yyyymmddHH.log
│
├── views/
│   ├── home.ejs                # Template chính (đưa serverURL vào global)
│   └── index.html              # Trang test YouTube IFrame API cũ (không dùng)
│
├── resources/assets/           # Source frontend
│   ├── js/app.js               # Entry Vue: import bootstrap/FontAwesome + HomeComponent
│   ├── js/components/HomeComponent.vue   # Toàn bộ UI + logic client
│   └── css/style.css           # Gần như trống (chưa dùng)
│
├── public/                     # Static assets
│   └── assets/js/
│       ├── app.js              # (build output — gitignored)
│       ├── vendors.js          # (build output) thư viện chung
│       ├── playem.js           # Bundle Playem (~70KB, được commit sẵn)
│       └── fonts/              # Font Awesome (build output)
│
└── credentials/                # (gitignored) firestore-koi-streaming.json — Firebase SA
```

---

## 5. Backend chi tiết

### 5.1. `app.js` — khởi động & middleware (theo thứ tự)

| Thứ tự | Thành phần | Ghi chú |
|---|---|---|
| 1 | `dotenv.config()` | Nạp `.env` |
| 2 | Firebase Admin | `require('./credentials/firestore-koi-streaming.json')`; nếu thiếu → chỉ **cảnh báo**, server vẫn chạy ở chế độ không DB |
| 3 | Serve `node_modules` | `/bootstrap.min.css`, `/bootstrap.min.js`, `/popper.min.js` từ node_modules |
| 4 | `body-parser` | JSON + urlencoded |
| 5 | `express.static('./public')` | Assets tĩnh |
| 6 | View engine EJS | `views/` |
| 7 | Router trang | `GET /`, `POST /view`, `/add`, `/testapi` |
| 8 | `authorizationJWT` | Nếu có header `Authorization: Bearer <idToken>` thì verify bằng Firebase Auth; **không chặn** request không có token — hiện chỉ là middleware "tùy chọn" |
| 9 | Router API | `/api/*` |
| 10 | `helmet` | CSP **tắt** (cho dev), COEP tắt |
| 11 | `compression` | Gzip |
| 12 | `cors()` | ⚠️ Đặt **sau** các router nên không áp dụng cho preflight của `/api` — xem §8 |
| 13 | `GET /test` | Health check: `{message:"Hello world!"}` |
| 14 | 404 + error handler | Trả thẳng object lỗi (không che thông tin) |
| 15 | Socket.IO | `service.socket.events(io, dbAdmin)` |
| 16 | `server.listen(SERVER_PORT)` | Mặc định 8080 |

> ✂️ Đã gỡ trong vòng nâng cấp 1 (10/09/2026): endpoint `/graphql` (hello-world demo), middleware `express-session` (không route nào đọc session), static serve `jquery.min.js` (code không dùng jQuery).

### 5.2. REST API

**Router trang:**

| Method | Path | Mô tả | Trả về |
|---|---|---|---|
| GET | `/` | Render `home.ejs` với `serverURL` | HTML |
| POST | `/view` | Lấy toàn bộ playlist | `{status:"OK", data:[...]}` |
| POST | `/add` | Thêm track (cần `title` + `url`), tự thêm `add_datetime` | `{status:"OK", data}` hoặc `{status:"NG"}` |
| POST | `/testapi` | Echo body | `{message:"done"}` |

**Router API (`/api`):**

| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/youtube/config` | Trả `YOUTUBE_PUBLIC_API_KEY` cho client |
| GET | `/api/youtube/search?q=&maxResults=` | Tìm kiếm YouTube (dùng `YOUTUBE_PRIVATE_API_KEY`) |
| GET | `/api/youtube/video/:videoId` | Chi tiết video |
| GET | `/api/youtube/playlist/:playlistId` | Danh sách item của playlist YouTube |
| POST | `/api/update` | Update track (chưa implement thực sự) |

### 5.3. Model — `PlayListModel.js`

- Collection Firestore: **`koi-streaming`**, sắp xếp theo trường `add_datetime`.
- Fallback khi không có Firebase: mảng `mockPlaylist` **trong RAM** → mất dữ liệu khi restart server.
- API: `getAll()`, `add(data)`, `update(ID, data)`.
- ⚠️ `add_datetime` là **chuỗi** `"yyyy-mm-dd HH:MM:ss"` (từ `dateformat`) chứ không phải timestamp chuẩn — sắp xếp theo thứ tự từ điển, may mắn vẫn đúng thứ tự thời gian.

### 5.4. Socket.IO — `server/services/socket/index.js`

Server duy trì danh sách `lsPlayerActive` (in-memory, **mất khi restart**, không chia sẻ giữa nhiều process).

| Hướng | Event | Payload | Hành vi |
|---|---|---|---|
| C → S | `player_active` | — | Thêm `{socket_id, player_ip, player_name}` vào `lsPlayerActive`, emit `list_player_active` cho tất cả |
| C → S | `hello` | data | Broadcast `message-test1` (test) |
| C → S | `add_new_track` | track | Broadcast lại cho tất cả client **khác** |
| C → S | `play` | `{player_selected, track_idx}` | `io.to(player_selected).emit('play', {track_idx})` — gửi lệnh tới đúng thiết bị |
| C → S | `on_track_change` | params | Broadcast cho client khác |
| C → S | `on_device_change` | params | ⚠️ Broadcast lại với tên event **`on_track_change`** (bug — sai tên event, xem §8) |
| S → C | `list_player_active` | danh sách thiết bị | Cập nhật dropdown "Select Device" |
| S → C | `play` | `{track_idx}` | Máy đích gọi `playem.play(track_idx)` |
| S → C | `on_track_change` | `{player, track_active}` | Đồng bộ highlight bài đang phát |

Khi client `disconnect` → xóa khỏi `lsPlayerActive` và cập nhật lại danh sách.
Server **không bao giờ emit** `player_connect` / `player_disconnect` mặc dù client có lắng nghe (dead code).

### 5.5. Log — `server/library/Log.js`

- Ghi file tại `tmp/logs/<logName>_yyyymmddHH.log` (thư mục cần tồn tại trước, nếu không server **crash** với `ENOENT` — đã từng xảy ra khi chạy lần đầu).
- API: `Log.debug(logName, data, dir?)`.

### 5.6. YouTube API — `YouTubeAPIService.js`

- Đọc key từ `process.env.YOUTUBE_PRIVATE_API_KEY` ⚠️ (trong khi `example.env` khai báo `YOUTUBE_API_KEY` — **không khớp tên**).
- Các method: `searchVideos(q, maxResults)`, `getVideoDetails(videoId)`, `getPlaylistItems(playlistId)` — luôn trả `{success, data|error}`, không throw.
- ⚠️ Frontend **hiện không dùng** các endpoint này: tìm kiếm trên client chạy trực tiếp qua `playem.searchTracks()`.

---

## 6. Frontend chi tiết

### 6.1. Entry — `resources/assets/js/app.js`

```js
import "bootstrap/dist/css/bootstrap.css";
import "@fortawesome/fontawesome-free/css/all.css";
import HomeComponent from "./components/HomeComponent.vue";
// render HomeComponent vào #app
```

Webpack build ra `public/assets/js/app.js` (code app) + `vendors.js` (node_modules) + fonts. `playem.js` được giữ nguyên nhờ `clean.keep`.

### 6.2. `HomeComponent.vue` — toàn bộ UI

**Template gồm 4 khối:**
1. **Ô tìm kiếm** (readonly, click để mở modal Search).
2. **Player Controls**: dropdown chọn thiết bị (`player_selected`) + các nút Play / Next / Stop / Add.
3. **Playlist**: danh sách bài (thumbnail, tiêu đề, message, thời gian thêm), highlight bài đang phát (`active-song`), click để phát.
4. **2 modal**: `modalAdd` (thêm bằng URL YouTube + message tùy chọn), `modalSearch` (tìm kiếm với debounce 1s, hiển thị spinner, kết quả dạng card, nút "Add to Playlist").

**Dữ liệu (data):** `socket`, `playList`, `tmpFormLink/Message`, `errorTmpFormLink`, `activeTrack`, `list_player_active`, `player_selected`, `search_key`, `searchResultList`, `isSearching`...

**Vòng đời:**
- `created()`: kết nối `io(serverURL)`; emit `player_active` khi connect; khởi tạo `new Playem()` + `addPlayer(YoutubePlayer, {playerContainer: #playem_video})`; đăng ký event `onTrackChange` của Playem → cập nhật `activeTrack` và broadcast `on_track_change`.
- `mounted()`: `this.view()` (POST /view → nạp playlist vào Vue **và** queue Playem); lắng nghe event Bootstrap modal (hidden → clear form).

**Các method quan trọng:**

| Method | Hoạt động |
|---|---|
| `view()` | Kéo playlist từ server, `addTrack` từng bài vào Playem |
| `addTrack(track)` | `playem.addTrackByUrl(track.url)` — thêm vào queue phát |
| `formAddSubmit()` | `playem.getTrackInfo(url)` → `POST /add` → `playList.push` → `socket.emit("add_new_track")` |
| `chooseTrack(track)` | Từ kết quả search → `POST /add` → broadcast |
| `play(ind)` | Nếu `player_selected === socket.id` → phát local; ngược lại emit `play` tới máy khác |
| `playTrack(ytid)` | Tìm index trong `playem.getQueue()` rồi `play(index)` |
| `next()` / `stop()` | Điều khiển Playem |
| `search()` | `playem.searchTracks(key, cb)` — tìm qua Playem (không qua server) |
| `formatDate()` | Format `add_datetime` sang ngày giờ vi-VN |

**Socket client nhận:** `list_player_active` (cập nhật dropdown), `add_new_track` (thêm vào playlist + queue), `play` (phát), `on_track_change` (highlight nếu `params.player === player_selected`).

### 6.3. Playem (`playemjs` 1.3.2)

Thư viện phát nhạc đa nền tảng, dùng dạng **global** (`new Playem()`, `YoutubePlayer`) từ file `public/assets/js/playem.js` (được commit sẵn, không import qua webpack).

API được dùng trong dự án:

| API | Mô tả |
|---|---|
| `new Playem()` | Khởi tạo queue |
| `addPlayer(YoutubePlayer, {playerContainer})` | Gắn player YouTube vào container `#playem_video` |
| `addTrackByUrl(url)` | Thêm track vào cuối queue |
| `getQueue()` | Lấy mảng track `{trackId, title, ...}` |
| `getTrackInfo(url, cb)` | Lấy metadata (id, img, title, url) — callback nhận `undefined` nếu lỗi |
| `searchTracks(key, cb)` | Tìm kiếm, callback chạy nhiều lần theo từng kết quả, cuối cùng nhận `undefined` |
| `play(idx)` / `next()` / `pause()` / `stop()` | Điều khiển phát |
| `on("onTrackChange", cb)` | Event khi chuyển bài |

Player YouTube được nhúng trong `<div id="playem_video">` (fixed góc trái dưới màn hình theo `home.ejs`).

---

## 7. Cấu hình & vận hành

### 7.1. Biến môi trường (`.env`)

| Biến | Dùng ở đâu | Bắt buộc |
|---|---|---|
| `SERVER_PORT` | `app.js` — cổng listen | ✅ (mặc định 8080) |
| `SOCKET_SERVER` | `home.ejs` → global `serverURL` cho socket.io-client | ✅ (VD: `http://localhost:8080`) |
| `HOST_IP` | ⚠️ Khai báo nhưng **chưa được dùng** trong code | ❌ |
| `YOUTUBE_API_KEY` | ⚠️ Chỉ có trong example.env, code **không đọc** | ❌ |
| `YOUTUBE_PUBLIC_API_KEY` | `GET /api/youtube/config` | Tùy chọn |
| `YOUTUBE_PRIVATE_API_KEY` | `YouTubeAPIService` (search/video/playlist) | Tùy chọn |
| `BANDCAMP_API_KEY` | Không dùng | ❌ |

### 7.2. Credentials Firebase

Đặt file service-account tại **`credentials/firestore-koi-streaming.json`** (gitignored). Không có file → app chạy chế độ **mock in-memory** (playlist mất khi restart).

### 7.3. Scripts

| Lệnh | Mô tả |
|---|---|
| `npm install --legacy-peer-deps` | Cài dependencies (bắt buộc dùng flag này) |
| `npm run build` | Webpack production → `public/assets/js` |
| `npm run dev` / `npm run watch` | Webpack development / watch |
| `npm start` | Chạy `node app` (production) |
| `npm run nm` | Chạy `nodemon app` (auto-restart khi sửa server) |

### 7.4. Docker

- **Dockerfile**: base `node:20-alpine`, `npm install` (⚠️ thiếu `--legacy-peer-deps`, có thể fail), cài nodemon global, COPY toàn bộ source — **không có CMD** (phụ thuộc compose).
- **docker-compose.yml**: chạy `nodemon -L app.js`, mount source, map **`8081:8081`** ⚠️ (trong khi mặc định `SERVER_PORT=8080` → cần set lại env khi dùng Docker).
- `.dockerignore`: loại `node_modules`, `.git`, logs...

---

## 8. Các vấn đề hiện tại (bugs / nợ kỹ thuật)

### 🔴 Bug rõ ràng
1. **`on_device_change` emit sai tên event** — broadcast là `on_track_change` (server/services/socket/index.js:115-117).
2. **Server crash nếu `tmp/logs/` không tồn tại** — `Log.getLogPath()` mở WriteStream mà không tạo thư mục (`ENOENT`).
3. **`cors()` đặt sau router** → preflight của `/api` không được xử lý CORS đúng.
4. **`home.ejs` tham chiếu `/assets/js/youtube-helper.js`** — file không tồn tại → 404.
5. **`favicon.png` không tồn tại** trong `public/` → 404.
6. **Tên biến env không khớp**: example.env dùng `YOUTUBE_API_KEY`, code dùng `YOUTUBE_PRIVATE_API_KEY` / `YOUTUBE_PUBLIC_API_KEY` → search qua server không hoạt động nếu chỉ copy example.
7. **Docker**: map cổng 8081 nhưng app nghe 8080; Dockerfile thiếu `--legacy-peer-deps` và `CMD`.

> ✅ Đã xử lý trong vòng nâng cấp 1 (10/09/2026): bug session `secure: true` (gỡ luôn express-session), endpoint `/graphql` demo, serve jQuery thừa.

### 🟡 Hạn chế / nợ kỹ thuật
1. **Không có database thì playlist mất khi restart** (mock in-memory).
2. **Không có authentication thực sự** — `authorizationJWT` không chặn ai; Firebase Auth cài nhưng frontend không dùng.
3. **Không thể xóa / sắp xếp lại bài hát** — `update/delete/sort` chỉ là stub comment.
4. **`lsPlayerActive` in-memory** — không scale nhiều process (không có Redis adapter / sticky session).
5. **`add_datetime` là chuỗi** `"yyyy-mm-dd HH:MM:ss"` — không chuẩn ISO, `new Date()` ở frontend parse phụ thuộc trình duyệt.
6. **Không có validation** URL/title phía server (chỉ check truthy).
7. **Error handler trả nguyên object lỗi** ra client (lộ thông tin).
8. **16 npm vulnerabilities còn lại** (1 high, 14 moderate, 1 low) — toàn bộ nằm ở các gói cần nâng **major** mới hết: chain Vue 2 (`vue`, `vue-template-compiler` XSS, `postcss` cũ của vue-loader 15), `qs` cũ của Express 4, `uuid` cũ của firebase-admin 12. Không còn critical.
9. **Code chết / không dùng**: `views/index.html` (test IFrame cũ), `resources/assets/css/style.css`, `update-assets.js` (trống), event `player_connect`/`player_disconnect`, `HOST_IP`.
10. **Playem dùng bản bundle tĩnh** (`public/assets/js/playem.js`) trong khi package `playemjs` cũng có trong node_modules → hai nguồn, dễ lệch phiên bản.
11. **Không có test, không có lint/format**.
12. **Frontend tìm kiếm qua Playem trực tiếp** → không kiểm soát được quota/phím API, không cache, không nhất quán với `/api/youtube/search` đã viết sẵn.

---

## 9. Đề xuất hướng cải tiến (roadmap)

### Giai đoạn 0 — Nâng cấp công nghệ (vòng 1)
- [x] ✅ **Đã xong (10/09/2026)**: nâng patch/minor (webpack 5.110, socket.io 4.8.3, axios 1.20, helmet 8, bootstrap 5.3.8, dotenv 16.6...), gỡ 6 dependency chết (jQuery, vue-router, archiver, graphql, graphql-http, express-session), 54 → 16 lỗ hổng (0 critical).
- [ ] Vòng 2: Express 4→5 (bỏ body-parser), firebase-admin 12→14, ejs 3→6.
- [ ] Vòng 3: Vue 2→3 (`@vue/compat`), thay Playem bằng YouTube IFrame API, Babel 8.
- [ ] Vòng 4: Node 24 LTS, Docker `node:24-alpine`.

### Giai đoạn 1 — Ổn định & sửa bug (nhanh, an toàn)
- [ ] Sửa các bug §8 mục 🔴 (đặc biệt: `tmp/logs` tự tạo, event `on_device_change`, CORS, 404 assets, Docker).
- [ ] Thống nhất tên biến env (`YOUTUBE_*`), cập nhật `example.env`.
- [ ] Thêm validation phía server + trả lỗi chuẩn JSON (không lộ stack).
- [ ] Chuyển `add_datetime` sang timestamp chuẩn (ISO), giữ tương thích dữ liệu cũ.

### Giai đoạn 2 — Tính năng cốt lõi
- [ ] **Xóa bài / sắp xếp lại playlist** (kéo thả), đồng bộ qua Socket.IO.
- [ ] **Room theo playlist**: mỗi phòng có link riêng (`/room/:id`), nhiều playlist độc lập.
- [ ] **Tự động phát bài tiếp theo khi hết bài** (next-trigger server-side), đồng bộ vị trí phát.
- [ ] **Tìm kiếm qua server** (`/api/youtube/search`) thay cho Playem trực tiếp + cache + debounce.
- [ ] **Authentication thực sự** (Firebase Auth UI / đăng nhập Google) — chặn thêm bài khi chưa đăng nhập nếu cần.
- [ ] Lưu trạng thái `play_status` đầy đủ (waiting/playing/played) và lịch sử phát.

### Giai đoạn 3 — Trải nghiệm & vận hành
- [ ] UI: dark mode, progress bar, volume, responsive mobile tốt hơn, toast thông báo.
- [ ] Docker hoàn chỉnh (fix port/env/CMD), CI/CD build + deploy.
- [ ] Viết unit test (model, controller, socket) + ESLint/Prettier.
- [ ] Nâng cấp dependency còn lại (16 lỗ hổng — cần major: Vue 3, Express 5, firebase-admin 14).
- [ ] Scale: Redis adapter cho Socket.IO nếu chạy nhiều instance.
- [ ] Giám sát log (log rotation cho `tmp/logs`).

---

## 10. Tham khảo nhanh — các dòng code quan trọng

| Thành phần | File: dòng |
|---|---|
| Khởi tạo Firebase (try/catch) | `app.js:19-29` |
| Middleware auth tùy chọn | `app.js:52-89` |
| Listen cổng | `app.js:129-132` |
| Render view + serverURL | `server/controllers/HomeController.js:13-15` |
| Lấy/Thêm playlist | `server/controllers/HomeController.js:20-60` |
| Firestore collection | `server/models/PlayListModel.js` |
| Toàn bộ socket events | `server/services/socket/index.js:77-118` |
| YouTube API proxy | `server/router/api.js` |
| Kết nối socket client | `resources/assets/js/components/HomeComponent.vue:359-397` |
| Thêm bài + broadcast | `HomeComponent.vue:520-554` |
| Điều khiển play từ xa | `HomeComponent.vue:473-481` |
| Tìm kiếm (debounce 1s) | `HomeComponent.vue:572-641` |
| Queue Playem | `public/assets/js/playem.js` |
