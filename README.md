# StreamChat Desktop 🚀

Aplikasi desktop modern berbasis **Electron + React + TypeScript + Vite** untuk membaca live chat **YouTube** dan **TikTok** secara bersamaan, menggabungkan chat dalam satu dashboard terpadu, serta menampilkan overlay transparan dan animasi gift TikTok otomatis pada **OBS Studio**.

---

## ✨ Fitur Utama

1. **Dual Independent Live Ingestion**:
   - **YouTube Live Chat**: Membaca pesan, nama display, avatar, dan role badge (Owner, Mod, Member, Verified) menggunakan library `youtubei.js`.
   - **TikTok LIVE**: Membaca komentar, display name, avatar, badge, serta event gift dan streak gift menggunakan library `tiktok-live-connector`.
   - Koneksi kedua platform berjalan mandiri (jika salah satu gagal, platform lainnya tetap normal).
2. **Unified Chat Dashboard**:
   - Badge pembeda jelas: `[YT]` warna merah crimson dan `[TT]` warna gradien neon cyan/pink.
   - Filter tab: **Semua**, **YouTube**, atau **TikTok**.
   - Pencarian pesan chat real-time.
   - Smart Auto-scroll: Berhenti saat Anda membaca ke atas, dan tombol lanjutkan muncul otomatis.
   - Toggle tampilan avatar & pembersih riwayat chat.
3. **TikTok Gift Event & Animation System**:
   - Panel khusus event gift TikTok real-time dengan penghitung streak (anti ganda).
   - Antrean FIFO Gift Queue dengan batas kapasitas.
   - Animasi gift otomatis di OBS: **Bounce**, **Pop Up**, **Slide In**, dan **Fade**.
   - Efek suara Chime otomatis disintesis menggunakan Web Audio API (tanpa ketergantungan file eksternal).
4. **OBS Studio Browser Source Integration**:
   - Server lokal HTTP & WebSocket bawaan pada port `3210`:
     - `http://127.0.0.1:3210/overlay/chat` — Chat transparan (YT + TT)
     - `http://127.0.0.1:3210/overlay/gifts` — Gift alert TikTok transparan
     - `http://127.0.0.1:3210/overlay/all` — Gabungan chat + gift
   - Background transparan 100%, zero-scrollbar, dan auto-reconnect WebSocket jika OBS di-refresh.
   - Kustomisasi visual langsung tersinkronisasi ke overlay secara live (warna teks, warna background, opacity, font size, animasi, durasi pesan).
5. **Simulasi / Testing Bawaan**:
   - Tombol **Test Chat** dan **Test Gift** untuk memverifikasi tampilan dashboard dan overlay OBS tanpa perlu live stream sungguhan.
6. **Keamanan & Performa**:
   - Memenuhi standar keamanan Electron: `contextIsolation: true`, secure preload IPC, validasi input, sanitasi teks HTML.

---

## 🛠️ Cara Menjalankan Aplikasi

### 1. Mode Development
Jalankan Vite renderer dan Electron secara bersamaan:
```bash
npm run dev
```

### 2. Mode Production / Langsung Jalankan
Build aset dan luncurkan aplikasi:
```bash
npm start
```

### 3. Menjalankan Uji Coba Otomatis (Automated Tests)
Verifikasi parser URL YouTube, server HTTP/WebSocket, dan integrasi:
```bash
npm test
```

---

## 🎥 Panduan Pemasangan di OBS Studio

1. Buka **OBS Studio**.
2. Pada panel **Sources**, klik tombol **+** lalu pilih **Browser**.
3. Masukkan nama (misalnya: `StreamChat Overlay`).
4. Pada kolom **URL**, masukkan salah satu link berikut:
   - Chat saja: `http://127.0.0.1:3210/overlay/chat`
   - Gift saja: `http://127.0.0.1:3210/overlay/gifts`
   - Chat + Gift: `http://127.0.0.1:3210/overlay/all`
5. Atur dimensi yang disarankan:
   - **Width**: `480` (atau sesuai lebar kolom layout streaming Anda)
   - **Height**: `800`
6. Centang opsi:
   - *Shutdown source when not visible* (opsional)
   - *Refresh browser when scene becomes active* (opsional)
7. Klik **OK**. Chat dan Gift akan muncul transparan di atas game atau kamera Anda!

---

## 📁 Struktur Folder Proyek

```text
chatfull/
├── electron/
│   ├── main.ts               # Entry point Electron main process
│   ├── preload.ts            # Secure contextBridge API
│   └── services/
│       ├── event-bus.ts      # Event bus internal
│       ├── youtube-adapter.ts # Adapter youtubei.js
│       ├── tiktok-adapter.ts  # Adapter tiktok-live-connector
│       ├── gift-queue.ts     # Antrean FIFO gift & streak deduplication
│       ├── overlay-server.ts # HTTP & WebSocket server untuk OBS
│       └── store.ts          # Penyimpanan preferensi & konfigurasi lokal
├── src/
│   ├── components/
│   │   ├── Header.tsx             # Header utama & status
│   │   ├── ConnectionPanel.tsx    # Panel input YouTube & TikTok
│   │   ├── ChatList.tsx           # Unified chat feed & filter
│   │   ├── ChatMessageItem.tsx    # Kartu pesan dengan badge YT/TT
│   │   ├── GiftEventPanel.tsx     # Feed aktivitas gift TikTok
│   │   ├── SettingsModal.tsx      # Modal konfigurasi overlay & gift
│   │   ├── OverlayLinksModal.tsx  # Panduan & salin link OBS
│   │   └── LogDrawer.tsx          # Konsol log sistem & debug
│   ├── types/
│   │   └── index.ts          # Tipe data bersama (ChatMessage, GiftEvent, dll)
│   ├── styles/
│   │   └── index.css         # Desain glassmorphism modern & tokens
│   ├── App.tsx               # Komponen utama React
│   └── main.tsx              # Root React DOM
├── tests/
│   └── verify-core.ts        # Script automated test
├── vite.config.ts            # Konfigurasi Vite
├── tsconfig.json             # Konfigurasi TypeScript
├── package.json
├── reqirement.txt            # Dokumen spesifikasi PRD asli
└── README.md
```

---

Dibuat sesuai seluruh spesifikasi dan kebutuhan pada **PRD — StreamChat Desktop**.
