# Changelog

## 2.0.0 — Supabase database & peer project gallery

- Database LMS dipindahkan dari Google Sheets/Apps Script ke Supabase PostgreSQL.
- Google Apps Script disederhanakan menjadi upload-only bridge ke Google Drive.
- Ditambahkan schema Supabase, migrator XLSX, dan tool bootstrap admin.
- Tugas 1 memiliki lima slot sumber artikel; masing-masing mendukung link dan/atau PDF.
- Sumber artikel melekat pada versi submission melalui tabel `submission_articles`.
- Ditambahkan menu **Karya Mahasiswa** agar submission terbaru Tugas 1–5 dapat dilihat seluruh pengguna LMS yang sudah login.
- Nilai, skor rubrik, email/NIM, dan feedback dosen tidak diekspos pada galeri mahasiswa.
- Endpoint frontend dipindahkan ke `/api/lms`; `/api/gas` hanya mengizinkan `uploadAsset`.
- Backup/restore admin diperbarui untuk PostgreSQL/JSON.
- Struktur Apps Script lama disimpan di `apps-script-legacy/` hanya sebagai referensi migrasi.

## 1.0.1

- Penyesuaian rubrik Tugas 3 menjadi total 100%.
- Penyempurnaan Gradebook dan validasi konten.
