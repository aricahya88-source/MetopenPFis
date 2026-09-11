# Data Model METOPEN PFIS LMS v2.0

Tabel inti PostgreSQL:

- `users`
- `weeks`
- `materials`
- `activities`
- `discussions`
- `posts`
- `comments`
- `submissions`
- `submission_articles`
- `grades`
- `rubrics`
- `rubric_scores`
- `announcements`
- `activity_log`

Tabel kompatibilitas data lama: `quizzes`, `quiz_questions`, `quiz_attempts`, `groups`, `group_members`, `project_plans`.

## Relasi Tugas 1

```text
users 1 ── * submissions * ── 1 activities
                    |
                    └── 1..5 submission_articles
```

`submission_articles` memiliki `slot_no` 1–5, URL artikel, nama file, URL file Drive, dan MIME type. Unique constraint `(submission_id, slot_no)` memastikan satu slot per versi submission.

## Visibilitas

- Karya mahasiswa: submission terbaru Tugas 1–5 dapat dibaca oleh semua pengguna LMS yang sudah login melalui API aplikasi.
- Nilai: hanya pemilik nilai dan admin/dosen pada alur yang relevan.
- Hash PIN dan data autentikasi tidak pernah dikirim ke frontend.
