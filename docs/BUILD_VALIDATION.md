# Build / Validation v2.0.0

Validasi statis yang dapat dijalankan tanpa kredensial eksternal:

```bash
npm run lint:content
```

Validator memeriksa branding, 16 pertemuan, 3 CPMK, lima tugas, lima rubrik, bobot Tugas 3, schema Supabase, lima sumber artikel Tugas 1, galeri Karya Mahasiswa, PWA, dan pembatasan Apps Script upload-only.

Build penuh:

```bash
npm install
npm run build
```

Build penuh membutuhkan dependency npm. Endpoint Supabase/Apps Script baru dapat diuji end-to-end setelah environment variable dan layanan eksternal dikonfigurasi.
