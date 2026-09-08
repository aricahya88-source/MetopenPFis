export type RubricLevel = {score:4|3|2|1;description:string};
export type RubricCriterion = {id:string;name:string;weight:number;levels:RubricLevel[]};
export type TaskRubric = {activityId:string;name:string;criteria:RubricCriterion[];sourceWeightTotal:number;note?:string};

export const TASK_RUBRICS:Record<string,TaskRubric> = {
  TASK1_ISSUE:{
    activityId:'TASK1_ISSUE',name:'Rubrik Tugas 1 — Analisis Isu melalui Kajian Pustaka',sourceWeightTotal:100,
    criteria:[
      {id:'T1C1',name:'Identifikasi fenomena/permasalahan penelitian',weight:25,levels:[
        {score:4,description:'Mampu menemukan masalah penelitian yang spesifik, aktual, relevan dengan pembelajaran fisika, serta disertai bukti/fakta pendukung.'},
        {score:3,description:'Masalah penelitian cukup jelas dan relevan, tetapi bukti pendukung masih terbatas.'},
        {score:2,description:'Masalah masih bersifat umum dan belum menunjukkan fokus penelitian.'},
        {score:1,description:'Tidak mampu mengidentifikasi masalah penelitian.'}
      ]},
      {id:'T1C2',name:'Analisis penyebab dan akar masalah',weight:25,levels:[
        {score:4,description:'Mampu menjelaskan penyebab masalah secara mendalam berdasarkan teori atau penelitian terdahulu.'},
        {score:3,description:'Mampu menjelaskan penyebab masalah tetapi belum dikaitkan dengan teori secara kuat.'},
        {score:2,description:'Analisis penyebab masih terbatas dan belum menunjukkan hubungan yang kuat dengan teori/penelitian terdahulu.'},
        {score:1,description:'Tidak ada analisis penyebab masalah.'}
      ]},
      {id:'T1C3',name:'Penentuan topik/judul penelitian',weight:25,levels:[
        {score:4,description:'Judul penelitian jelas, spesifik, memiliki variabel/fokus yang tepat, dan sesuai bidang pendidikan fisika.'},
        {score:3,description:'Judul cukup sesuai tetapi masih perlu penyempurnaan.'},
        {score:2,description:'Judul masih terlalu luas atau kurang menggambarkan penelitian.'},
        {score:1,description:'Judul tidak sesuai dengan masalah.'}
      ]},
      {id:'T1C4',name:'Argumentasi akademik dan referensi',weight:25,levels:[
        {score:4,description:'Menggunakan sumber ilmiah relevan dan mampu memberikan argumentasi akademik yang kuat.'},
        {score:3,description:'Menggunakan beberapa referensi tetapi analisis belum mendalam.'},
        {score:2,description:'Referensi terbatas dan argumentasi kurang kuat.'},
        {score:1,description:'Tidak menggunakan referensi ilmiah.'}
      ]}
    ]
  },
  TASK2_GAP:{
    activityId:'TASK2_GAP',name:'Rubrik Tugas 2 — Analisis Masalah, GAP, State of the Art & Artikel',sourceWeightTotal:100,
    criteria:[
      {id:'T2C1',name:'Pemahaman terhadap masalah, gap, dan tujuan penelitian',weight:25,levels:[
        {score:4,description:'Mampu menjelaskan masalah, gap penelitian, dan tujuan penelitian secara tepat dan mendalam.'},
        {score:3,description:'Mampu menjelaskan masalah dan tujuan penelitian dengan cukup tepat.'},
        {score:2,description:'Hanya menjelaskan masalah secara deskriptif.'},
        {score:1,description:'Tidak memahami masalah penelitian.'}
      ]},
      {id:'T2C2',name:'Analisis metodologi penelitian',weight:30,levels:[
        {score:4,description:'Mampu menganalisis pendekatan, desain, subjek, instrumen, dan analisis data serta kesesuaiannya.'},
        {score:3,description:'Mampu menjelaskan sebagian besar komponen metode penelitian.'},
        {score:2,description:'Analisis metode masih terbatas pada deskripsi.'},
        {score:1,description:'Tidak mampu menjelaskan metode penelitian.'}
      ]},
      {id:'T2C3',name:'Evaluasi kelebihan dan keterbatasan penelitian',weight:25,levels:[
        {score:4,description:'Memberikan kritik akademik berdasarkan teori dan metodologi penelitian.'},
        {score:3,description:'Memberikan evaluasi tetapi masih sederhana.'},
        {score:2,description:'Evaluasi hanya berupa pendapat pribadi.'},
        {score:1,description:'Tidak memberikan evaluasi.'}
      ]},
      {id:'T2C4',name:'Sistematika laporan dan kualitas akademik',weight:20,levels:[
        {score:4,description:'Laporan sistematis, bahasa ilmiah, referensi relevan, dan sesuai kaidah akademik.'},
        {score:3,description:'Laporan cukup sistematis dengan beberapa kekurangan.'},
        {score:2,description:'Struktur laporan kurang rapi.'},
        {score:1,description:'Laporan tidak memenuhi standar akademik.'}
      ]}
    ]
  },
  TASK3_DESIGN:{
    activityId:'TASK3_DESIGN',name:'Rubrik Tugas 3 — Rancangan Desain Penelitian',sourceWeightTotal:100,
    note:'Bobot rubrik LMS telah disesuaikan menjadi 100% atas keputusan dosen. Empat bobot awal dipertahankan dan Rencana Analisis Data ditetapkan 25%.',
    criteria:[
      {id:'T3C1',name:'Rumusan masalah dan tujuan penelitian',weight:20,levels:[
        {score:4,description:'Rumusan masalah sangat jelas, spesifik, terukur, dan konsisten dengan tujuan penelitian.'},
        {score:3,description:'Rumusan masalah cukup jelas tetapi masih perlu penyempurnaan.'},
        {score:2,description:'Rumusan masalah masih umum.'},
        {score:1,description:'Tidak mampu merumuskan masalah.'}
      ]},
      {id:'T3C2',name:'Identifikasi variabel penelitian',weight:25,levels:[
        {score:4,description:'Variabel bebas, terikat, dan definisi operasional ditentukan dengan sangat tepat.'},
        {score:3,description:'Variabel sudah tepat tetapi definisi operasional belum lengkap.'},
        {score:2,description:'Variabel kurang tepat atau belum jelas.'},
        {score:1,description:'Tidak memahami variabel penelitian.'}
      ]},
      {id:'T3C3',name:'Pemilihan desain penelitian',weight:15,levels:[
        {score:4,description:'Desain penelitian sangat sesuai dengan masalah dan tujuan penelitian serta disertai alasan.'},
        {score:3,description:'Desain sesuai tetapi alasan pemilihan kurang kuat.'},
        {score:2,description:'Desain kurang sesuai dengan masalah.'},
        {score:1,description:'Tidak mampu menentukan desain penelitian.'}
      ]},
      {id:'T3C4',name:'Populasi, sampel, dan teknik sampling',weight:15,levels:[
        {score:4,description:'Menentukan populasi, sampel, dan teknik sampling secara tepat serta argumentatif.'},
        {score:3,description:'Komponen sampling cukup tepat.'},
        {score:2,description:'Penentuan sampel kurang sesuai.'},
        {score:1,description:'Tidak memahami konsep sampling.'}
      ]},
      {id:'T3C5',name:'Rencana analisis data',weight:25,levels:[
        {score:4,description:'Teknik analisis data sesuai dengan desain dan hipotesis penelitian.'},
        {score:3,description:'Analisis data cukup sesuai.'},
        {score:2,description:'Analisis data kurang tepat.'},
        {score:1,description:'Tidak menentukan analisis data.'}
      ]}
    ]
  },
  TASK4_INSTRUMENT:{
    activityId:'TASK4_INSTRUMENT',name:'Rubrik Tugas 4 — Pengembangan Instrumen Penelitian',sourceWeightTotal:100,
    criteria:[
      {id:'T4C1',name:'Definisi variabel dan indikator penelitian',weight:25,levels:[
        {score:4,description:'Definisi variabel jelas, berdasarkan teori, dan indikator sesuai dengan konstruk yang diukur.'},
        {score:3,description:'Definisi variabel cukup jelas dan indikator cukup sesuai.'},
        {score:2,description:'Definisi dan indikator masih kurang lengkap.'},
        {score:1,description:'Tidak mampu menentukan indikator.'}
      ]},
      {id:'T4C2',name:'Penyusunan kisi-kisi instrumen',weight:25,levels:[
        {score:4,description:'Kisi-kisi lengkap, sistematis, dan menunjukkan hubungan indikator dengan item instrumen.'},
        {score:3,description:'Kisi-kisi cukup lengkap tetapi masih ada kekurangan.'},
        {score:2,description:'Kisi-kisi belum sistematis.'},
        {score:1,description:'Tidak membuat kisi-kisi.'}
      ]},
      {id:'T4C3',name:'Kualitas butir instrumen',weight:25,levels:[
        {score:4,description:'Butir instrumen sesuai indikator, jelas, tidak bias, dan memiliki tingkat kesesuaian tinggi.'},
        {score:3,description:'Butir instrumen cukup sesuai tetapi masih terdapat beberapa kelemahan.'},
        {score:2,description:'Sebagian butir belum sesuai indikator.'},
        {score:1,description:'Butir instrumen tidak sesuai.'}
      ]},
      {id:'T4C4',name:'Perencanaan uji validitas dan reliabilitas',weight:25,levels:[
        {score:4,description:'Menjelaskan metode validasi ahli, uji validitas empiris, dan reliabilitas secara tepat.'},
        {score:3,description:'Menjelaskan sebagian prosedur pengujian.'},
        {score:2,description:'Penjelasan masih terbatas.'},
        {score:1,description:'Tidak memahami validitas dan reliabilitas.'}
      ]}
    ]
  },
  TASK5_PROPOSAL:{
    activityId:'TASK5_PROPOSAL',name:'Rubrik Tugas 5 — Proposal Penelitian BAB I–BAB III',sourceWeightTotal:100,
    criteria:[
      {id:'T5C1',name:'Kesesuaian dan kualitas judul penelitian',weight:10,levels:[
        {score:4,description:'Judul spesifik, jelas, menggambarkan variabel/fokus penelitian, serta sesuai dengan bidang pendidikan fisika.'},
        {score:3,description:'Judul cukup jelas dan sesuai bidang pendidikan fisika tetapi masih perlu penyempurnaan.'},
        {score:2,description:'Judul masih terlalu luas dan belum menunjukkan fokus penelitian.'},
        {score:1,description:'Judul tidak menggambarkan penelitian yang akan dilakukan.'}
      ]},
      {id:'T5C2',name:'Latar belakang dan identifikasi masalah',weight:20,levels:[
        {score:4,description:'Latar belakang disusun sistematis berdasarkan fenomena, data empiris, teori, dan menunjukkan urgensi penelitian.'},
        {score:3,description:'Latar belakang cukup jelas dan memiliki dukungan teori, tetapi analisis masalah belum mendalam.'},
        {score:2,description:'Latar belakang masih berupa deskripsi umum tanpa menunjukkan gap penelitian.'},
        {score:1,description:'Latar belakang tidak menunjukkan masalah penelitian.'}
      ]},
      {id:'T5C3',name:'Rumusan masalah, tujuan, dan manfaat penelitian',weight:15,levels:[
        {score:4,description:'Rumusan masalah sangat jelas, sesuai latar belakang, tujuan terukur, dan manfaat teoritis/praktis relevan.'},
        {score:3,description:'Rumusan masalah dan tujuan cukup sesuai tetapi belum konsisten sepenuhnya.'},
        {score:2,description:'Rumusan masalah masih umum dan kurang fokus.'},
        {score:1,description:'Tidak terdapat keterkaitan antara masalah dan tujuan.'}
      ]},
      {id:'T5C4',name:'Kajian teori dan penelitian relevan',weight:15,levels:[
        {score:4,description:'Menggunakan teori relevan, sumber ilmiah mutakhir, dan mampu menunjukkan posisi penelitian dibanding penelitian sebelumnya.'},
        {score:3,description:'Kajian teori cukup relevan tetapi hubungan dengan penelitian masih terbatas.'},
        {score:2,description:'Referensi terbatas dan hanya berupa rangkuman teori.'},
        {score:1,description:'Tidak menggunakan kajian teori yang memadai.'}
      ]},
      {id:'T5C5',name:'Ketepatan desain/metode penelitian',weight:20,levels:[
        {score:4,description:'Metode penelitian sangat sesuai dengan masalah, meliputi desain, prosedur, subjek, dan tahapan penelitian secara jelas.'},
        {score:3,description:'Metode sesuai tetapi beberapa komponen belum lengkap.'},
        {score:2,description:'Metode kurang sesuai dengan tujuan penelitian.'},
        {score:1,description:'Tidak mampu menentukan metode penelitian.'}
      ]},
      {id:'T5C6',name:'Instrumen dan teknik pengumpulan data',weight:10,levels:[
        {score:4,description:'Instrumen sesuai variabel/fokus penelitian, indikator jelas, dan teknik pengumpulan data tepat.'},
        {score:3,description:'Instrumen cukup sesuai tetapi belum lengkap.'},
        {score:2,description:'Instrumen kurang sesuai dengan tujuan penelitian.'},
        {score:1,description:'Tidak menjelaskan instrumen penelitian.'}
      ]},
      {id:'T5C7',name:'Teknik analisis data',weight:5,levels:[
        {score:4,description:'Teknik analisis data sangat sesuai dengan desain penelitian dan dijelaskan secara tepat.'},
        {score:3,description:'Teknik analisis cukup sesuai tetapi kurang detail.'},
        {score:2,description:'Analisis data masih umum.'},
        {score:1,description:'Tidak menjelaskan analisis data.'}
      ]},
      {id:'T5C8',name:'Sistematika penulisan dan kualitas akademik',weight:5,levels:[
        {score:4,description:'Proposal tersusun sistematis, bahasa akademik baik, sitasi dan referensi sesuai standar ilmiah.'},
        {score:3,description:'Proposal cukup sistematis dengan sedikit kesalahan.'},
        {score:2,description:'Sistematika dan bahasa masih perlu banyak perbaikan.'},
        {score:1,description:'Proposal tidak mengikuti struktur ilmiah.'}
      ]}
    ]
  }
};

export function rubricFor(activityId:string){return TASK_RUBRICS[activityId];}
export function rubricScore100(rubric:TaskRubric,scores:Record<string,number>){
  const totalWeight=rubric.criteria.reduce((s,c)=>s+c.weight,0)||1;
  const weighted=rubric.criteria.reduce((s,c)=>{
    const raw=Math.max(1,Math.min(4,Number(scores[c.id]||1)));
    return s+(raw/4)*c.weight;
  },0);
  return Math.round((weighted/totalWeight)*10000)/100;
}
