/**
 * Instalasi METOPEN PFIS — Metode Penelitian Pendidikan Fisika.
 * Gunakan Spreadsheet dan folder Drive baru, isi StorageConfig.gs, lalu Run setupLms().
 */
function setupLms() {
  var lock=LockService.getScriptLock();lock.waitLock(30000);
  try{
    var sid=String(LMS_STORAGE_CONFIG.SPREADSHEET_ID||'').trim(),fid=String(LMS_STORAGE_CONFIG.ROOT_FOLDER_ID||'').trim();
    if(!sid||sid.indexOf('PASTE_')===0)throw new Error('Isi SPREADSHEET_ID pada StorageConfig.gs.');
    if(!fid||fid.indexOf('PASTE_')===0)throw new Error('Isi ROOT_FOLDER_ID pada StorageConfig.gs.');
    var ss=SpreadsheetApp.openById(sid);ss.getName();var root=DriveApp.getFolderById(fid);root.getName();
    props_().setProperties({SPREADSHEET_ID:sid,ROOT_FOLDER_ID:fid},false);
    ensureSecrets_();ensureSchema_();seedSettings_();seedWeeks_();seedCourseContent_();seedCourseActivities_();seedCourseDiscussions_();seedRubrics_();ensureFolders_();var admin=ensureAdmin_();
    Logger.log('=== METOPEN PFIS SIAP ===');Logger.log('Spreadsheet: '+ss.getUrl());Logger.log('Drive: '+root.getUrl());Logger.log('Login admin: ADMIN');if(admin.pin)Logger.log('PIN admin sementara: '+admin.pin);
    return {success:true,spreadsheetUrl:ss.getUrl(),folderUrl:root.getUrl(),adminLogin:'ADMIN',temporaryPin:admin.pin||''};
  }finally{lock.releaseLock();}
}

function ensureSchema_(){
  var ss=db_();Object.keys(SCHEMA).forEach(function(key){
    var name=LMS.SHEETS[key],headers=SCHEMA[key],sh=ss.getSheetByName(name)||ss.insertSheet(name);
    if(sh.getLastRow()===0){sh.getRange(1,1,1,headers.length).setValues([headers]);sh.setFrozenRows(1);sh.getRange(1,1,1,headers.length).setFontWeight('bold').setBackground('#E8F2E6').setFontColor('#2E7D32');return;}
    var current=sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0].map(String);
    if(current.join('|')!==headers.join('|'))throw new Error('Header sheet '+name+' berbeda. Gunakan Spreadsheet baru untuk METOPEN PFIS agar data lama tidak tertimpa.');
  });
  var d=ss.getSheetByName('Sheet1');if(d&&ss.getSheets().length>1&&d.getLastRow()===0)ss.deleteSheet(d);
}
function seedSettings_(){Object.keys(DEFAULT_SETTINGS).forEach(function(k){if(!findOne_(LMS.SHEETS.SETTINGS,'key',k))setSetting_(k,DEFAULT_SETTINGS[k]);});}

function seedWeeks_(){
  var titles=[
    'Orientasi Perkuliahan, Kontrak Belajar, dan Konsep Dasar Metode Ilmiah',
    'Isu-Isu Penelitian Pendidikan Fisika',
    'Pendekatan dan Jenis Penelitian',
    'Sampling, Variabel Penelitian, dan Skala Pengukuran',
    'Anggapan Dasar dan Perumusan Hipotesis',
    'Populasi, Sampel, dan Teknik Sampling',
    'Penelitian Kualitatif',
    'Evaluasi Tengah Semester',
    'Penelitian Kuantitatif: Eksperimen',
    'Penelitian Kuantitatif: Kuasi Eksperimen',
    'Penelitian Pengembangan (R&D)',
    'Penelitian Tindakan Kelas',
    'Analisis Data Penelitian',
    'Analisis Artikel Jurnal Nasional dan Internasional',
    'Presentasi Proposal atau Outline Penelitian',
    'Evaluasi Akhir Semester dan Finalisasi Proposal'
  ];
  var rows=[];for(var w=1;w<=16;w++){var id='W'+('0'+w).slice(-2);rows.push({week_id:id,week_no:w,title:titles[w-1],summary_html:'<p>Satu pertemuan memuat satu unit materi inti sesuai struktur RPS Metode Penelitian Pendidikan Fisika.</p>',open_at:'',close_at:'',visible:true,updated_at:nowIso_()});}
  bulkUpsert_(LMS.SHEETS.WEEKS,'week_id',rows);
}

function seedCourseContent_(){
  var units=[
    ['Konsep Dasar Metode Ilmiah','<h2>Penelitian sebagai Proses Ilmiah</h2><p>Orientasi mata kuliah, kontrak belajar, kebenaran ilmiah, fungsi metode ilmiah, dan pentingnya penelitian pendidikan fisika bagi calon guru.</p><h3>Pertanyaan pemantik</h3><p>Apa yang membedakan masalah kelas biasa dengan masalah yang layak diteliti?</p>'],
    ['Isu Penelitian Pendidikan Fisika','<h2>Dari Fenomena ke Isu Penelitian</h2><p>Telusuri fenomena pembelajaran fisika, bukti empiris, miskonsepsi, asesmen, media, pedagogi, teknologi, dan konteks sekolah untuk menemukan isu yang relevan.</p><p><strong>Target:</strong> satu tema yang didukung minimal lima artikel relevan.</p>'],
    ['Pendekatan dan Jenis Penelitian','<h2>Memilih Pendekatan berdasarkan Masalah</h2><p>Bandingkan pendekatan kuantitatif, kualitatif, survei, eksperimen/kuasi eksperimen, R&D, dan desain lain yang relevan. Pemilihan metode harus mengikuti pertanyaan penelitian.</p>'],
    ['Sampling, Variabel, dan Skala Pengukuran','<h2>Apa yang Diukur dan Siapa yang Diteliti?</h2><p>Bahas variabel/fokus, data, definisi operasional, skala pengukuran, serta hubungan awal dengan sampel penelitian.</p>'],
    ['Anggapan Dasar dan Hipotesis','<h2>Dari Argumentasi ke Hipotesis</h2><p>Pelajari anggapan dasar, pengertian dan jenis hipotesis, perumusan hipotesis, serta kondisi ketika penelitian tidak menggunakan hipotesis.</p>'],
    ['Populasi, Sampel, dan Teknik Sampling','<h2>Menentukan Representasi Subjek Penelitian</h2><p>Pelajari populasi, sampel, ukuran sampel, probability/non-probability sampling, serta alasan metodologis pemilihannya.</p>'],
    ['Penelitian Kualitatif','<h2>Memahami Makna dan Konteks</h2><p>Bandingkan kualitatif dan kuantitatif; tentukan fokus, rumusan masalah, informan/subjek, teknik pengumpulan data, kredibilitas, dan langkah dasar penelitian kualitatif.</p>'],
    ['Evaluasi Tengah Semester','<h2>Evaluasi Tengah Semester</h2><p>Evaluasi mengintegrasikan materi pertemuan 1–7. Instruksi teknis UTS dapat diedit dosen melalui menu Kelola Aktivitas tanpa mengubah kode LMS.</p>'],
    ['Penelitian Kuantitatif: Eksperimen','<h2>Eksperimen dalam Pendidikan Fisika</h2><p>Pelajari variabel perlakuan, kontrol, desain eksperimen, validitas internal, instrumen, prosedur, dan keterkaitan desain dengan analisis data.</p>'],
    ['Penelitian Kuantitatif: Kuasi Eksperimen','<h2>Kuasi Eksperimen di Kelas Nyata</h2><p>Pelajari karakteristik kuasi eksperimen, kelompok yang sudah terbentuk, desain pretest-posttest, ancaman validitas, instrumen, dan rencana analisis.</p>'],
    ['Penelitian Pengembangan (R&D)','<h2>Penelitian yang Menghasilkan Produk</h2><p>Bahas konsep R&D, karakteristik, model/tahapan pengembangan, validasi ahli, uji coba, revisi, dan instrumen penelitian pengembangan.</p>'],
    ['Penelitian Tindakan Kelas','<h2>Perbaikan Pembelajaran melalui Siklus Tindakan</h2><p>Bahas masalah kelas, perencanaan, tindakan, observasi, refleksi, indikator keberhasilan, dan instrumen PTK.</p>'],
    ['Analisis Data Penelitian','<h2>Dari Data ke Kesimpulan</h2><p>Tentukan analisis berdasarkan pertanyaan/hipotesis, desain, jenis data, dan asumsi. Latih deskripsi, uji coba, analisis, serta interpretasi hasil.</p>'],
    ['Analisis Artikel Jurnal Nasional dan Internasional','<h2>Literatur sebagai Evidence</h2><p>Telusuri artikel relevan, baca kritis masalah, teori, metode, temuan, kekuatan, keterbatasan, dan posisi penelitian untuk membangun research gap serta state of the art.</p>'],
    ['Presentasi Proposal atau Outline Penelitian','<h2>Defend Your Research Design</h2><p>Presentasikan judul, latar belakang, gap, rumusan masalah, teori, metode, instrumen, dan analisis data. Gunakan pertanyaan dan feedback sebagai dasar revisi.</p>'],
    ['Evaluasi Akhir Semester dan Finalisasi Proposal','<h2>Proposal sebagai Produk Integratif</h2><p>Finalisasi proposal BAB I–III, lakukan audit konsistensi masalah–tujuan–teori–metode–instrumen–analisis, lalu refleksikan kesiapan menuju tugas akhir.</p>']
  ];
  var rows=[];units.forEach(function(u,i){var no=i+1,wid='W'+('0'+no).slice(-2);rows.push({material_id:'MAT'+('00'+no).slice(-3),week_id:wid,material_no:no,order_no:1,title:u[0],content_html:u[1],resource_url:'',visible:true,updated_at:nowIso_()});});
  bulkUpsert_(LMS.SHEETS.MATERIALS,'material_id',rows);
}

function seedCourseActivities_(){
  var now=nowIso_(),rows=[
    {activity_id:'TASK1_ISSUE',week_id:'W02',type:'assignment',title:'Tugas 1 — Analisis Isu melalui Kajian Pustaka',description_html:'<p><strong>CPMK 1.</strong> Lakukan kajian pustaka minimal <strong>5 artikel dengan tema yang sama</strong>. Identifikasi fenomena/permasalahan pembelajaran fisika, analisis penyebab/akar masalah, tentukan topik/judul awal, dan bangun argumentasi akademik dengan referensi relevan.</p>',mode:'individual',max_score:100,due_at:'',visible:true,allow_comments:true,project_code:'',created_at:now,updated_at:now},
    {activity_id:'TASK2_GAP',week_id:'W03',type:'assignment',title:'Tugas 2 — Analisis Masalah, GAP, State of the Art & Artikel Penelitian',description_html:'<p><strong>CPMK 1.</strong> Analisis masalah, gap, dan state of the art dari isu yang diperoleh. Dokumen sumber juga meminta mahasiswa memilih satu artikel penelitian pendidikan fisika dan menganalisis pendekatan, jenis/desain, subjek, instrumen, analisis data, kontribusi, kelebihan, dan keterbatasannya.</p>',mode:'individual',max_score:100,due_at:'',visible:true,allow_comments:true,project_code:'',created_at:now,updated_at:now},
    {activity_id:'UTS_METOPEN',week_id:'W08',type:'assignment',title:'UTS — Evaluasi Tengah Semester',description_html:'<p>Evaluasi Tengah Semester sesuai instruksi dosen. RPS menyebut EVALUASI TENGAH SEMESTER tetapi tidak merinci format/bobot terpisah; instruksi ini dapat diedit melalui Kelola Aktivitas.</p>',mode:'individual',max_score:100,due_at:'',visible:true,allow_comments:true,project_code:'',created_at:now,updated_at:now},
    {activity_id:'TASK3_DESIGN',week_id:'W11',type:'assignment',title:'Tugas 3 — Rancangan Desain Penelitian Pendidikan Fisika',description_html:'<p><strong>CPMK 2.</strong> Susun rancangan penelitian berdasarkan topik yang telah dipilih. Tentukan rumusan masalah/tujuan, variabel atau fokus, desain penelitian (kualitatif/kuantitatif/R&D sesuai kebutuhan), populasi-sampel/teknik sampling bila relevan, serta rencana analisis data.</p>',mode:'individual',max_score:100,due_at:'',visible:true,allow_comments:true,project_code:'',created_at:now,updated_at:now},
    {activity_id:'TASK4_INSTRUMENT',week_id:'W12',type:'assignment',title:'Tugas 4 — Pengembangan Instrumen Penelitian',description_html:'<p><strong>CPMK 2.</strong> Kembangkan instrumen sesuai rancangan penelitian: definisi variabel/fokus dan indikator, kisi-kisi, butir instrumen, serta rencana uji validitas dan reliabilitas/kualitas instrumen.</p>',mode:'individual',max_score:100,due_at:'',visible:true,allow_comments:true,project_code:'',created_at:now,updated_at:now},
    {activity_id:'TASK5_PROPOSAL',week_id:'W15',type:'assignment',title:'Tugas 5 — Proposal Penelitian BAB I–BAB III',description_html:'<p><strong>CPMK 3.</strong> Susun proposal penelitian pendidikan fisika BAB I–BAB III secara sistematis, termasuk judul, latar belakang dan identifikasi masalah, rumusan masalah/tujuan/manfaat, kajian teori dan penelitian relevan, desain/metode, instrumen dan teknik pengumpulan data, teknik analisis data, serta sitasi/referensi.</p>',mode:'individual',max_score:100,due_at:'',visible:true,allow_comments:true,project_code:'',created_at:now,updated_at:now},
    {activity_id:'UAS_METOPEN',week_id:'W16',type:'assignment',title:'UAS — Evaluasi Akhir Semester / Finalisasi Proposal',description_html:'<p>Evaluasi Akhir Semester dan finalisasi proposal sesuai instruksi dosen. RPS menyebut EVALUASI AKHIR SEMESTER tanpa rincian format/bobot terpisah.</p>',mode:'individual',max_score:100,due_at:'',visible:true,allow_comments:true,project_code:'',created_at:now,updated_at:now}
  ];
  bulkUpsert_(LMS.SHEETS.ACTIVITIES,'activity_id',rows);SpreadsheetApp.flush();
}

function seedCourseDiscussions_(){
  var now=nowIso_();
  var acts=[
    {activity_id:'DISC_ISSUE',week_id:'W02',type:'discussion',title:'Diskusi — Kapan Fenomena Layak Menjadi Masalah Penelitian?',description_html:'',mode:'individual',max_score:100,due_at:'',visible:true,allow_comments:true,project_code:'',created_at:now,updated_at:now},
    {activity_id:'DISC_QUAL',week_id:'W07',type:'discussion',title:'Diskusi — Kapan Memilih Pendekatan Kualitatif?',description_html:'',mode:'individual',max_score:100,due_at:'',visible:true,allow_comments:true,project_code:'',created_at:now,updated_at:now},
    {activity_id:'DISC_QUASI',week_id:'W10',type:'discussion',title:'Diskusi — Eksperimen atau Kuasi Eksperimen?',description_html:'',mode:'individual',max_score:100,due_at:'',visible:true,allow_comments:true,project_code:'',created_at:now,updated_at:now},
    {activity_id:'DISC_GAP',week_id:'W14',type:'discussion',title:'Diskusi — Apakah Research Gap Saya Benar-benar Gap?',description_html:'',mode:'individual',max_score:100,due_at:'',visible:true,allow_comments:true,project_code:'',created_at:now,updated_at:now}
  ];
  var ds=[
    {discussion_id:'D_ISSUE',activity_id:'DISC_ISSUE',prompt_html:'<p>Ajukan satu fenomena pembelajaran fisika yang Anda anggap layak diteliti. Jelaskan bukti awal, siapa yang terdampak, mengapa penting, dan apa yang masih belum diketahui. Tanggapi minimal satu post teman.</p>',min_posts:2,grading_mode:'manual',updated_at:now},
    {discussion_id:'D_QUAL',activity_id:'DISC_QUAL',prompt_html:'<p>Berikan satu masalah pendidikan fisika yang lebih tepat dijawab secara kualitatif daripada kuantitatif. Jelaskan fokus, calon informan/subjek, dan jenis evidence yang ingin diperoleh.</p>',min_posts:2,grading_mode:'manual',updated_at:now},
    {discussion_id:'D_QUASI',activity_id:'DISC_QUASI',prompt_html:'<p>Dalam konteks kelas nyata, kapan kuasi eksperimen lebih realistis daripada eksperimen murni? Jelaskan konsekuensi terhadap validitas dan interpretasi hasil.</p>',min_posts:2,grading_mode:'manual',updated_at:now},
    {discussion_id:'D_GAP',activity_id:'DISC_GAP',prompt_html:'<p>Tuliskan klaim research gap Anda dalam 2–3 kalimat dan sebutkan evidence artikel yang mendukung. Tanggapi klaim teman: apakah benar gap, sekadar topik baru, atau hanya keterbatasan studi sebelumnya?</p>',min_posts:2,grading_mode:'manual',updated_at:now}
  ];
  bulkUpsert_(LMS.SHEETS.ACTIVITIES,'activity_id',acts);bulkUpsert_(LMS.SHEETS.DISCUSSIONS,'discussion_id',ds);
}

function criterion_(id,name,weight,l4,l3,l2,l1){return {id:id,name:name,weight:weight,levels:[{score:4,description:l4},{score:3,description:l3},{score:2,description:l2},{score:1,description:l1}]};}
function seedRubrics_(){
  var now=nowIso_(),rubrics=[
    {rubric_id:'R_TASK1',activity_id:'TASK1_ISSUE',name:'Rubrik Tugas 1 — Analisis Isu',criteria:[
      criterion_('T1C1','Identifikasi fenomena/permasalahan penelitian',25,'Masalah spesifik, aktual, relevan dengan pembelajaran fisika, disertai bukti/fakta pendukung.','Masalah cukup jelas dan relevan, tetapi bukti pendukung masih terbatas.','Masalah masih umum dan belum menunjukkan fokus penelitian.','Tidak mampu mengidentifikasi masalah penelitian.'),
      criterion_('T1C2','Analisis penyebab dan akar masalah',25,'Menjelaskan penyebab secara mendalam berdasarkan teori atau penelitian terdahulu.','Menjelaskan penyebab tetapi belum dikaitkan dengan teori secara kuat.','Analisis penyebab masih terbatas.','Tidak ada analisis penyebab masalah.'),
      criterion_('T1C3','Penentuan topik/judul penelitian',25,'Judul jelas, spesifik, memiliki variabel/fokus tepat, dan sesuai bidang pendidikan fisika.','Judul cukup sesuai tetapi masih perlu penyempurnaan.','Judul terlalu luas atau kurang menggambarkan penelitian.','Judul tidak sesuai dengan masalah.'),
      criterion_('T1C4','Argumentasi akademik dan referensi',25,'Menggunakan sumber ilmiah relevan dan memberikan argumentasi akademik yang kuat.','Menggunakan beberapa referensi tetapi analisis belum mendalam.','Referensi terbatas dan argumentasi kurang kuat.','Tidak menggunakan referensi ilmiah.')
    ]},
    {rubric_id:'R_TASK2',activity_id:'TASK2_GAP',name:'Rubrik Tugas 2 — Analisis GAP & Artikel',criteria:[
      criterion_('T2C1','Pemahaman masalah, gap, dan tujuan penelitian',25,'Menjelaskan masalah, gap, dan tujuan secara tepat dan mendalam.','Menjelaskan masalah dan tujuan dengan cukup tepat.','Hanya menjelaskan masalah secara deskriptif.','Tidak memahami masalah penelitian.'),
      criterion_('T2C2','Analisis metodologi penelitian',30,'Menganalisis pendekatan, desain, subjek, instrumen, dan analisis data serta kesesuaiannya.','Menjelaskan sebagian besar komponen metode penelitian.','Analisis metode terbatas pada deskripsi.','Tidak mampu menjelaskan metode penelitian.'),
      criterion_('T2C3','Evaluasi kelebihan dan keterbatasan penelitian',25,'Memberikan kritik akademik berdasarkan teori dan metodologi penelitian.','Memberikan evaluasi tetapi masih sederhana.','Evaluasi hanya berupa pendapat pribadi.','Tidak memberikan evaluasi.'),
      criterion_('T2C4','Sistematika laporan dan kualitas akademik',20,'Laporan sistematis, bahasa ilmiah, referensi relevan, dan sesuai kaidah akademik.','Laporan cukup sistematis dengan beberapa kekurangan.','Struktur laporan kurang rapi.','Laporan tidak memenuhi standar akademik.')
    ]},
    {rubric_id:'R_TASK3',activity_id:'TASK3_DESIGN',name:'Rubrik Tugas 3 — Rancangan Desain Penelitian',criteria:[
      criterion_('T3C1','Rumusan masalah dan tujuan penelitian',20,'Rumusan sangat jelas, spesifik, terukur, dan konsisten dengan tujuan.','Rumusan cukup jelas tetapi masih perlu penyempurnaan.','Rumusan masih umum.','Tidak mampu merumuskan masalah.'),
      criterion_('T3C2','Identifikasi variabel penelitian',25,'Variabel bebas, terikat, dan definisi operasional ditentukan dengan sangat tepat.','Variabel tepat tetapi definisi operasional belum lengkap.','Variabel kurang tepat atau belum jelas.','Tidak memahami variabel penelitian.'),
      criterion_('T3C3','Pemilihan desain penelitian',15,'Desain sangat sesuai dengan masalah/tujuan dan disertai alasan.','Desain sesuai tetapi alasan pemilihan kurang kuat.','Desain kurang sesuai dengan masalah.','Tidak mampu menentukan desain penelitian.'),
      criterion_('T3C4','Populasi, sampel, dan teknik sampling',15,'Menentukan populasi, sampel, dan teknik sampling secara tepat serta argumentatif.','Komponen sampling cukup tepat.','Penentuan sampel kurang sesuai.','Tidak memahami konsep sampling.'),
      criterion_('T3C5','Rencana analisis data',25,'Teknik analisis sesuai dengan desain dan hipotesis penelitian.','Analisis data cukup sesuai.','Analisis data kurang tepat.','Tidak menentukan analisis data.')
    ],note:'Bobot rubrik LMS telah disesuaikan menjadi 100% atas keputusan dosen; Rencana Analisis Data berbobot 25%.'},
    {rubric_id:'R_TASK4',activity_id:'TASK4_INSTRUMENT',name:'Rubrik Tugas 4 — Pengembangan Instrumen',criteria:[
      criterion_('T4C1','Definisi variabel dan indikator penelitian',25,'Definisi variabel jelas berdasarkan teori dan indikator sesuai konstruk.','Definisi cukup jelas dan indikator cukup sesuai.','Definisi dan indikator kurang lengkap.','Tidak mampu menentukan indikator.'),
      criterion_('T4C2','Penyusunan kisi-kisi instrumen',25,'Kisi-kisi lengkap, sistematis, dan menunjukkan hubungan indikator dengan item.','Kisi-kisi cukup lengkap tetapi masih ada kekurangan.','Kisi-kisi belum sistematis.','Tidak membuat kisi-kisi.'),
      criterion_('T4C3','Kualitas butir instrumen',25,'Butir sesuai indikator, jelas, tidak bias, dan sangat sesuai.','Butir cukup sesuai tetapi masih terdapat beberapa kelemahan.','Sebagian butir belum sesuai indikator.','Butir instrumen tidak sesuai.'),
      criterion_('T4C4','Perencanaan uji validitas dan reliabilitas',25,'Menjelaskan validasi ahli, validitas empiris, dan reliabilitas secara tepat.','Menjelaskan sebagian prosedur pengujian.','Penjelasan masih terbatas.','Tidak memahami validitas dan reliabilitas.')
    ]},
    {rubric_id:'R_TASK5',activity_id:'TASK5_PROPOSAL',name:'Rubrik Tugas 5 — Proposal BAB I–III',criteria:[
      criterion_('T5C1','Kesesuaian dan kualitas judul penelitian',10,'Judul spesifik, jelas, menggambarkan variabel/fokus, dan sesuai bidang pendidikan fisika.','Judul cukup jelas dan sesuai tetapi perlu penyempurnaan.','Judul terlalu luas dan belum menunjukkan fokus.','Judul tidak menggambarkan penelitian yang akan dilakukan.'),
      criterion_('T5C2','Latar belakang dan identifikasi masalah',20,'Latar belakang sistematis berdasarkan fenomena, data empiris, teori, dan menunjukkan urgensi penelitian.','Cukup jelas dan didukung teori, tetapi analisis masalah belum mendalam.','Masih berupa deskripsi umum tanpa menunjukkan gap penelitian.','Tidak menunjukkan masalah penelitian.'),
      criterion_('T5C3','Rumusan masalah, tujuan, dan manfaat penelitian',15,'Rumusan jelas sesuai latar belakang, tujuan terukur, dan manfaat teoritis/praktis relevan.','Rumusan dan tujuan cukup sesuai tetapi belum konsisten sepenuhnya.','Rumusan masih umum dan kurang fokus.','Tidak terdapat keterkaitan antara masalah dan tujuan.'),
      criterion_('T5C4','Kajian teori dan penelitian relevan',15,'Menggunakan teori relevan, sumber mutakhir, dan menunjukkan posisi penelitian dibanding penelitian sebelumnya.','Kajian cukup relevan tetapi hubungan dengan penelitian masih terbatas.','Referensi terbatas dan hanya berupa rangkuman teori.','Tidak menggunakan kajian teori yang memadai.'),
      criterion_('T5C5','Ketepatan desain/metode penelitian',20,'Metode sangat sesuai dengan masalah, meliputi desain, prosedur, subjek, dan tahapan secara jelas.','Metode sesuai tetapi beberapa komponen belum lengkap.','Metode kurang sesuai dengan tujuan penelitian.','Tidak mampu menentukan metode penelitian.'),
      criterion_('T5C6','Instrumen dan teknik pengumpulan data',10,'Instrumen sesuai variabel/fokus, indikator jelas, dan teknik pengumpulan data tepat.','Instrumen cukup sesuai tetapi belum lengkap.','Instrumen kurang sesuai dengan tujuan penelitian.','Tidak menjelaskan instrumen penelitian.'),
      criterion_('T5C7','Teknik analisis data',5,'Teknik analisis sangat sesuai dengan desain dan dijelaskan secara tepat.','Cukup sesuai tetapi kurang detail.','Analisis data masih umum.','Tidak menjelaskan analisis data.'),
      criterion_('T5C8','Sistematika penulisan dan kualitas akademik',5,'Proposal sistematis, bahasa akademik baik, sitasi dan referensi sesuai standar ilmiah.','Proposal cukup sistematis dengan sedikit kesalahan.','Sistematika dan bahasa perlu banyak perbaikan.','Proposal tidak mengikuti struktur ilmiah.')
    ]}
  ];
  var rows=rubrics.map(function(r){return {rubric_id:r.rubric_id,activity_id:r.activity_id,name:r.name,criteria_json:JSON.stringify({criteria:r.criteria,note:r.note||'',source_weight_total:r.criteria.reduce(function(s,c){return s+Number(c.weight||0);},0)}),updated_at:now};});
  bulkUpsert_(LMS.SHEETS.RUBRICS,'rubric_id',rows);
}


function upgradeTask3RubricTo100(){
  ensureSecrets_();ensureSchema_();
  var rubric=rubricByActivity_('TASK3_DESIGN');
  if(!rubric)throw new Error('Rubrik Tugas 3 belum tersedia. Jalankan setupLms() atau repairLms() terlebih dahulu.');
  var parsed=parseRubricCriteria_(rubric),criteria=parsed.criteria||[];
  var found=false;
  criteria.forEach(function(c){if(String(c.id)==='T3C5'){c.weight=25;found=true;}});
  if(!found)throw new Error('Kriteria T3C5 tidak ditemukan pada Rubrik Tugas 3.');
  var total=criteria.reduce(function(s,c){return s+Number(c.weight||0);},0);
  if(total!==100)throw new Error('Total bobot Rubrik Tugas 3 setelah upgrade bukan 100%. Total='+total);
  var payload={criteria:criteria,note:'Bobot rubrik LMS telah disesuaikan menjadi 100% atas keputusan dosen; Rencana Analisis Data berbobot 25%.',source_weight_total:100};
  upsertObj_(LMS.SHEETS.RUBRICS,'rubric_id',{rubric_id:rubric.rubric_id,activity_id:rubric.activity_id,name:rubric.name,criteria_json:JSON.stringify(payload),updated_at:nowIso_()});
  return {success:true,total_weight:100,message:'Rubrik Tugas 3 berhasil diperbarui menjadi total 100%.'};
}

function ensureAdmin_(){var users=rows_(LMS.SHEETS.USERS),found=null;for(var i=0;i<users.length;i++)if(String(users[i].role).toLowerCase()==='admin'&&asBool_(users[i].active)){found=users[i];break;}if(found)return {created:false,pin:''};var pin=String(Math.floor(100000+Math.random()*900000)),hp=makeUserPin_(pin);appendObj_(LMS.SHEETS.USERS,{user_id:makeId_('USR'),nim:'ADMIN',name:'Administrator',email:'',role:'admin',class_name:'',pin_salt:hp.salt,pin_hash:hp.hash,active:true,created_at:nowIso_(),updated_at:nowIso_()});return {created:true,pin:pin};}
function repairLms(){ensureSecrets_();ensureSchema_();seedSettings_();seedWeeks_();seedCourseContent_();seedCourseActivities_();seedCourseDiscussions_();seedRubrics_();ensureFolders_();return {success:true,message:'METOPEN PFIS diperiksa dan seed inti telah dipasang.'};}
function resetAdminPin(){var pin='123456';if(String(pin).length<6)throw new Error('PIN minimal 6 karakter.');var admin=findUserByIdentity_('ADMIN');if(!admin)throw new Error('Admin tidak ditemukan.');var hp=makeUserPin_(pin);updateRowObj_(LMS.SHEETS.USERS,admin.__row,{pin_salt:hp.salt,pin_hash:hp.hash,updated_at:nowIso_()});Logger.log('PIN admin baru: '+pin);return true;}
