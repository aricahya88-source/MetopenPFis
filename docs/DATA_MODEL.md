# Data Model METOPEN PFIS LMS

Tabel inti: `USERS`, `WEEKS`, `MATERIALS`, `ACTIVITIES`, `DISCUSSIONS`, `POSTS`, `COMMENTS`, `SUBMISSIONS`, `GRADES`, `RUBRICS`, `RUBRIC_SCORES`, `ANNOUNCEMENTS`, `ACTIVITY_LOG`.

Tabel kompatibilitas engine (`QUIZZES`, `QUIZ_QUESTIONS`, `QUIZ_ATTEMPTS`, `GROUPS`, `GROUP_MEMBERS`, `PROJECT_PLANS`) tetap tersedia agar backend reusable, tetapi tidak menjadi seed utama mata kuliah METOPEN PFIS.

Lima rubrik tersimpan dalam `RUBRICS.criteria_json`; skor per mahasiswa tersimpan di `RUBRIC_SCORES` dan hasil normalisasi 0–100 disalin ke `GRADES`.
