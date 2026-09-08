export type CourseMeeting = {
  no:number;
  phase:number;
  phaseLabel:string;
  title:string;
  mode:string;
  cpmk:string[];
  objectives:string[];
  before:string[];
  during:string[];
  after:string[];
  outputs:string[];
  activityHref?:string;
  activityLabel?:string;
};

export const APP_NAME='METOPEN PFIS';
export const COURSE_NAME='Metode Penelitian Pendidikan Fisika';
export const COURSE_CODE='PFS115036';
export const COURSE_SEMESTER='5';
export const COURSE_TAGLINE='Explore • Analyze • Design • Validate • Propose';
export const COURSE_SKS=3;
export const COURSE_MEETING_COUNT=16;
// RPS sumber menuliskan alokasi 100 menit pada tabel pertemuan; nilai ini dipertahankan apa adanya.
export const COURSE_CONTACT_MINUTES=100;

export const CPL = [
  'CP-8: Mampu menggunakan metodologi penelitian pendidikan dalam rangka menyusun deskripsi saintifik berbentuk laporan tugas akhir skripsi atau bentuk lain yang setara untuk menemukan solusi inovatif terhadap permasalahan pendidikan fisika dengan mengintegrasikan potensi lokal dan nilai-nilai keislaman.'
] as const;

export const CPMK = [
  'CPMK 1: Mahasiswa mampu menganalisis konsep dasar penelitian dalam pendidikan fisika, mengidentifikasi topik penelitian dan menentukan jenis penelitian.',
  'CPMK 2: Mahasiswa mampu merancang desain penelitian, menentukan variabel, populasi dan sampel, teknik sampling, serta perumusan hipotesis, dan mengembangkan/menyusun instrumen beserta uji kualitas (validitas–reliabilitas) dan rencana analisis data.',
  'CPMK 3: Mahasiswa mampu merancang dan mengembangkan produk penelitian berupa proposal tugas akhir secara sistematis.'
] as const;

export const PHASES=[
  {no:1,label:'Research Foundations & Problem Finding',range:'Pertemuan 1–8',description:'Fondasi metode ilmiah, isu penelitian pendidikan fisika, pendekatan dan jenis penelitian, variabel, hipotesis, populasi-sampel, penelitian kualitatif, lalu evaluasi tengah semester.'},
  {no:2,label:'Research Design & Method Selection',range:'Pertemuan 9–13',description:'Pendalaman penelitian kuantitatif eksperimen/kuasi eksperimen, penelitian pengembangan, penelitian tindakan kelas, serta analisis data penelitian.'},
  {no:3,label:'Evidence Synthesis & Proposal Development',range:'Pertemuan 14–16',description:'Analisis artikel nasional/internasional, presentasi proposal/outline, finalisasi proposal BAB I–III, dan evaluasi akhir semester.'}
] as const;

// Bobot ini mengikuti angka yang tertulis pada tabel RPS per pertemuan, bukan bobot 5 tugas produk.
export const RPS_ASSESSMENT_WEIGHTS=[
  {code:'W01_07',label:'Pertemuan 1–7 • tugas tertulis',weight:35},
  {code:'W09_10',label:'Pertemuan 9–10 • penelitian kuantitatif',weight:5},
  {code:'W11',label:'Pertemuan 11 • penelitian pengembangan',weight:5},
  {code:'W12',label:'Pertemuan 12 • penelitian tindakan kelas',weight:5},
  {code:'W13',label:'Pertemuan 13 • analisis data',weight:5},
  {code:'W14',label:'Pertemuan 14 • analisis jurnal',weight:15},
  {code:'W15',label:'Pertemuan 15 • presentasi proposal/outline',weight:30}
] as const;

export const FORMAL_TASKS=[
  {code:'TASK1_ISSUE',no:1,cpmk:'CPMK 1',title:'Analisis Isu melalui Kajian Pustaka',short:'Kajian minimal 5 artikel dengan tema yang sama untuk menemukan fenomena/permasalahan pembelajaran fisika yang potensial menjadi topik penelitian.',week:2},
  {code:'TASK2_GAP',no:2,cpmk:'CPMK 1',title:'Analisis Masalah, GAP, State of the Art & Artikel Penelitian',short:'Menganalisis masalah/gap dan satu artikel penelitian pendidikan fisika, termasuk pendekatan, jenis penelitian, metodologi, kontribusi, kelebihan, dan keterbatasan.',week:3},
  {code:'TASK3_DESIGN',no:3,cpmk:'CPMK 2',title:'Rancangan Desain Penelitian Pendidikan Fisika',short:'Menyusun rancangan penelitian sesuai topik yang telah dipilih: kualitatif, kuantitatif, atau R&D, termasuk variabel/fokus, sampel, desain, dan rencana analisis.',week:11},
  {code:'TASK4_INSTRUMENT',no:4,cpmk:'CPMK 2',title:'Pengembangan Instrumen Penelitian',short:'Mengembangkan definisi variabel/fokus, indikator, kisi-kisi, butir instrumen, serta rencana validitas dan reliabilitas sesuai rancangan penelitian.',week:12},
  {code:'TASK5_PROPOSAL',no:5,cpmk:'CPMK 3',title:'Proposal Penelitian BAB I–BAB III',short:'Menyusun proposal penelitian pendidikan fisika secara sistematis dari judul, latar belakang, rumusan masalah, kajian teori, metode, instrumen, hingga analisis data.',week:15}
] as const;

const base=(no:number,phase:number,title:string,mode:string,cpmk:string[],objectives:string[],during:string[],outputs:string[],activityHref?:string,activityLabel?:string):CourseMeeting=>({
  no,phase,phaseLabel:PHASES.find(p=>p.no===phase)?.label||'',title,mode,cpmk,objectives,
  before:['Pelajari satu unit materi inti pada LMS dan baca sumber yang ditautkan dosen sebelum pertemuan.'],
  during,
  after:['Catat keputusan penelitian, evidence, atau revisi yang dapat digunakan untuk membangun tugas berikutnya dan proposal akhir.'],outputs,activityHref,activityLabel
});

export const MEETINGS:CourseMeeting[]=[
  base(1,1,'Orientasi Perkuliahan, Kontrak Belajar, dan Konsep Dasar Metode Ilmiah','Ceramah • diskusi • studi kasus',['CPMK 1'],['Memahami konsep dasar metode ilmiah dalam penelitian dan pentingnya penelitian pendidikan fisika bagi calon guru.'],['Orientasi perkuliahan, diskusi kebenaran ilmiah, studi kasus sederhana, dan refleksi peran penelitian pendidikan fisika.'],['Refleksi singkat tentang pentingnya penelitian pendidikan fisika.']),
  base(2,1,'Isu-Isu Penelitian Pendidikan Fisika','Ceramah • diskusi • telaah sumber',['CPMK 1'],['Mencari, menjelaskan, dan menilai isu penelitian pendidikan fisika serta merumuskan ide/tema penelitian yang relevan.'],['Penelusuran isu, telaah sumber, pemetaan fenomena/permasalahan, dan diskusi calon tema penelitian.'],['Daftar isu/topik potensial dan evidence awal dari literatur.'],'/tasks/TASK1_ISSUE','Tugas 1 — Analisis Isu'),
  base(3,1,'Pendekatan dan Jenis Penelitian','Ceramah • brainstorming • diskusi kasus',['CPMK 1'],['Menjelaskan pendekatan dan jenis penelitian serta menentukan pilihan yang sesuai dengan masalah penelitian.'],['Membandingkan pendekatan, jenis penelitian, survei, dan contoh desain berdasarkan masalah pendidikan fisika.'],['Keputusan awal pendekatan/jenis penelitian dan argumentasinya.'],'/tasks/TASK2_GAP','Tugas 2 — Analisis GAP & Artikel'),
  base(4,1,'Sampling, Variabel Penelitian, dan Skala Pengukuran','Ceramah • diskusi • penugasan',['CPMK 2'],['Menentukan variabel/fokus, membedakan variabel dan data, memahami skala pengukuran, serta menghubungkannya dengan sampling.'],['Latihan identifikasi variabel/fokus, definisi operasional awal, skala pengukuran, dan penentuan konteks sampel.'],['Peta variabel/fokus dan definisi operasional awal.']),
  base(5,1,'Anggapan Dasar dan Perumusan Hipotesis','Ceramah • diskusi • contoh kasus',['CPMK 2'],['Merumuskan anggapan dasar dan menentukan hipotesis penelitian secara tepat, termasuk memahami penelitian tanpa hipotesis.'],['Analisis contoh hipotesis, jenis hipotesis, hubungan dengan desain penelitian, dan latihan perumusan.'],['Draft anggapan dasar/hipotesis atau argumentasi mengapa penelitian tidak memerlukan hipotesis.']),
  base(6,1,'Populasi, Sampel, dan Teknik Sampling','Ceramah • diskusi • penugasan',['CPMK 2'],['Menentukan populasi, ukuran sampel, dan teknik sampling yang sesuai dengan tujuan serta desain penelitian.'],['Latihan menentukan populasi, sampel, ukuran sampel, dan teknik sampling pada beberapa skenario penelitian pendidikan fisika.'],['Rancangan populasi-sampel dan justifikasi teknik sampling.']),
  base(7,1,'Penelitian Kualitatif','Ceramah • diskusi • studi kasus',['CPMK 1','CPMK 2'],['Membedakan penelitian kualitatif dan kuantitatif, memahami fokus dan rumusan masalah kualitatif, serta mengenali langkah dasar penelitian kualitatif.'],['Analisis kasus, perumusan fokus, pertanyaan penelitian, subjek/informan, dan teknik pengumpulan data kualitatif.'],['Mini-rancangan penelitian kualitatif.']),
  base(8,1,'Evaluasi Tengah Semester','Evaluasi Tengah Semester',['CPMK 1','CPMK 2'],['Mengintegrasikan pemahaman konsep dasar, isu, jenis penelitian, variabel, hipotesis, populasi-sampel, dan penelitian kualitatif.'],['Evaluasi Tengah Semester sesuai instruksi dosen. Instruksi detail dapat diedit melalui menu Kelola Aktivitas.'],['Bukti evaluasi tengah semester.'],'/tasks/UTS_METOPEN','UTS'),
  base(9,2,'Penelitian Kuantitatif: Eksperimen','Ceramah • brainstorming • diskusi',['CPMK 2'],['Menjelaskan konsep dan karakteristik penelitian eksperimen serta menghubungkannya dengan rancangan instrumen dan analisis data.'],['Analisis desain eksperimen, variabel, kontrol, prosedur, instrumen, dan contoh penelitian pendidikan fisika.'],['Sketsa desain penelitian eksperimen.']),
  base(10,2,'Penelitian Kuantitatif: Kuasi Eksperimen','Ceramah • brainstorming • diskusi',['CPMK 2'],['Menjelaskan karakteristik kuasi eksperimen dan membedakannya dari eksperimen murni dalam konteks penelitian pendidikan.'],['Perbandingan desain eksperimen/kuasi eksperimen, pemilihan kelompok, ancaman validitas, instrumen, dan rencana analisis.'],['Sketsa desain kuasi eksperimen dan alasan pemilihannya.']),
  base(11,2,'Penelitian Pengembangan (R&D)','Ceramah • diskusi • penugasan',['CPMK 2'],['Menjelaskan konsep dan karakteristik penelitian pengembangan serta merancang komponen penelitian pengembangan.'],['Menganalisis tahapan R&D, produk, validasi, uji coba, instrumen, dan kriteria keberhasilan.'],['Rancangan metode penelitian yang dipilih.'],'/tasks/TASK3_DESIGN','Tugas 3 — Rancangan Desain Penelitian'),
  base(12,2,'Penelitian Tindakan Kelas','Ceramah • diskusi • penugasan',['CPMK 2'],['Menjelaskan konsep dan karakteristik PTK serta menyusun instrumen yang mendukung siklus tindakan kelas.'],['Analisis masalah kelas, siklus tindakan, indikator keberhasilan, instrumen observasi/tes, dan refleksi.'],['Draft instrumen sesuai rancangan penelitian.'],'/tasks/TASK4_INSTRUMENT','Tugas 4 — Pengembangan Instrumen'),
  base(13,2,'Analisis Data Penelitian','Ceramah • diskusi • latihan analisis',['CPMK 2'],['Menguji coba, mendeskripsikan, menganalisis, dan menginterpretasikan data hasil penelitian sesuai desain.'],['Menentukan rencana analisis berdasarkan pertanyaan/hipotesis, jenis data, desain, dan contoh hasil uji coba.'],['Rencana analisis data dan contoh interpretasi.']),
  base(14,3,'Analisis Artikel Jurnal Nasional dan Internasional','Presentasi • diskusi • penugasan',['CPMK 1','CPMK 3'],['Mencari artikel relevan, memahami isinya, dan memanfaatkannya sebagai landasan penelitian serta dasar melihat posisi penelitian.'],['Penelusuran artikel, matriks literatur, critical reading, sintesis, identifikasi gap, dan pemetaan state of the art.'],['Matriks artikel dan sintesis posisi penelitian.']),
  base(15,3,'Presentasi Produk Akhir: Proposal atau Outline Penelitian','Presentasi • diskusi • peer feedback',['CPMK 3'],['Mempresentasikan hasil penyusunan proposal/outline penelitian tugas akhir secara sistematis dan mempertahankan keputusan metodologis.'],['Presentasi proposal, questioning, peer feedback, dan revisi terarah.'],['Proposal BAB I–BAB III versi presentasi/revisi.'],'/tasks/TASK5_PROPOSAL','Tugas 5 — Proposal BAB I–III'),
  base(16,3,'Evaluasi Akhir Semester dan Finalisasi Proposal','Evaluasi Akhir Semester • refleksi',['CPMK 3'],['Mengintegrasikan seluruh keputusan penelitian menjadi proposal akhir yang sistematis dan merefleksikan kesiapan menuju penelitian tugas akhir.'],['Evaluasi Akhir Semester, final check proposal, refleksi proses penelitian, dan rencana tindak lanjut.'],['Proposal akhir / bukti evaluasi akhir semester.'],'/tasks/UAS_METOPEN','UAS / Finalisasi Proposal')
];

export function meetingByNo(no:number){return MEETINGS.find(m=>m.no===no);}
export function phaseByMeeting(no:number){return MEETINGS.find(m=>m.no===no)?.phase||1;}
