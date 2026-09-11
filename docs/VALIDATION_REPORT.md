# Validation Report — METOPEN PFIS LMS v2.0.0

Validasi statis `npm run lint:content` memeriksa:

- branding METOPEN PFIS;
- 3 SKS, 16 pertemuan, dan 3 CPMK;
- lima tugas formal dan lima rubrik;
- Tugas 1 memiliki lima sumber artikel terstruktur;
- Proposal BAB I–BAB III;
- rubrik Tugas 3 total 100%;
- schema Supabase + RLS;
- seed Supabase 16 pertemuan/16 materi/aktivitas/rubrik;
- menu Karya Mahasiswa;
- Apps Script upload-only;
- PWA standalone;
- tidak membawa branding mata kuliah lain.

Pada revisi v2.0.0 juga dilakukan parse/syntax check terhadap seluruh file TypeScript/TSX yang dimodifikasi. Build penuh Next.js tetap harus dijalankan setelah `npm install` pada lingkungan dengan dependency npm tersedia.
