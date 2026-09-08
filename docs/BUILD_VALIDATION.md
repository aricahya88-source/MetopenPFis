# Build & Validation Notes — METOPEN PFIS LMS v1.0.0

Validasi yang sudah dijalankan pada paket ini:

- `node tools/validate-content.mjs` — **PASS** untuk branding, 3 SKS, 16 pertemuan, 3 CPMK, 5 tugas, 5 rubrik, 16 materi seed, Tugas 1 minimal 5 artikel, proposal BAB I–III, Task 3 total weight 100, dan PWA.
- Seluruh file `apps-script/*.gs` diperiksa dengan parser JavaScript (`node --check`) — **PASS**.
- Pemeriksaan TypeScript tidak menemukan error sintaks TS1xxx. Pemeriksaan tipe/build penuh belum dapat diselesaikan di environment pembuatan karena dependency npm tidak tersedia di cache dan registry npm tidak dapat diakses dari container.

Pada mesin/CI dengan akses npm, jalankan:

```bash
npm install
npm run lint:content
npm run build
```

Setelah backend dipasang pada Google Apps Script, jalankan `setupLms()` lalu `verifyBackend()` untuk validasi schema dan seed runtime.
