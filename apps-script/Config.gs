var LMS = {
  APP_NAME:'METOPEN PFIS',
  VERSION:'1.0.2',
  SHEETS: {
    SETTINGS:'SETTINGS', USERS:'USERS', WEEKS:'WEEKS', MATERIALS:'MATERIALS', ACTIVITIES:'ACTIVITIES',
    DISCUSSIONS:'DISCUSSIONS', POSTS:'POSTS', COMMENTS:'COMMENTS', SUBMISSIONS:'SUBMISSIONS', GRADES:'GRADES', RUBRICS:'RUBRICS',
    RUBRIC_SCORES:'RUBRIC_SCORES', QUIZZES:'QUIZZES', QUIZ_QUESTIONS:'QUIZ_QUESTIONS', QUIZ_ATTEMPTS:'QUIZ_ATTEMPTS',
    GROUPS:'GROUPS', GROUP_MEMBERS:'GROUP_MEMBERS', PROJECT_PLANS:'PROJECT_PLANS', ANNOUNCEMENTS:'ANNOUNCEMENTS', ACTIVITY_LOG:'ACTIVITY_LOG'
  },
  FOLDERS: {SUBMISSIONS:'01_Submissions',ASSETS:'02_Assets',EXPORTS:'03_Exports',TEMP:'99_Temp'}
};
var SCHEMA = {
  SETTINGS:['key','value','updated_at'],
  USERS:['user_id','nim','name','email','role','class_name','pin_salt','pin_hash','active','created_at','updated_at'],
  WEEKS:['week_id','week_no','title','summary_html','open_at','close_at','visible','updated_at'],
  MATERIALS:['material_id','week_id','material_no','order_no','title','content_html','resource_url','visible','updated_at'],
  ACTIVITIES:['activity_id','week_id','type','title','description_html','mode','max_score','due_at','visible','allow_comments','project_code','created_at','updated_at'],
  DISCUSSIONS:['discussion_id','activity_id','prompt_html','min_posts','grading_mode','updated_at'],
  POSTS:['post_id','discussion_id','user_id','parent_post_id','content_html','created_at','updated_at','status'],
  COMMENTS:['comment_id','entity_type','entity_id','user_id','parent_comment_id','content_html','created_at','updated_at'],
  SUBMISSIONS:['submission_id','activity_id','user_id','group_id','version','content_html','link_url','file_name','file_url','status','submitted_at','updated_at'],
  GRADES:['grade_id','activity_id','user_id','submission_id','score','max_score','feedback_html','published','graded_by','graded_at','updated_at'],
  RUBRICS:['rubric_id','activity_id','name','criteria_json','updated_at'],
  RUBRIC_SCORES:['rubric_score_id','rubric_id','user_id','submission_id','scores_json','total_score','graded_by','graded_at'],
  QUIZZES:['quiz_id','activity_id','instructions_html','attempt_limit','show_feedback','shuffle_questions','updated_at'],
  QUIZ_QUESTIONS:['question_id','quiz_id','order_no','question_html','option_a_html','option_b_html','option_c_html','option_d_html','correct_option','points','explanation_html','updated_at'],
  QUIZ_ATTEMPTS:['attempt_id','quiz_id','user_id','attempt_no','answers_json','score','max_score','percentage','submitted_at'],
  GROUPS:['group_id','project_code','name','meeting_no','topic','created_at','updated_at'],
  GROUP_MEMBERS:['membership_id','group_id','user_id','role','created_at'],
  PROJECT_PLANS:['plan_id','project_code','user_id','group_id','title','theme_code','topic','maharah_json','target_users_html','problem_html','objectives_html','features_html','flow_html','technology_html','test_plan_html','team_html','detail_json','status','revision_no','lecturer_feedback_html','submitted_at','approved_at','updated_at'],
  ANNOUNCEMENTS:['announcement_id','title','content_html','published_at','visible','created_by','updated_at'],
  ACTIVITY_LOG:['log_id','user_id','action','entity_type','entity_id','metadata_json','created_at']
};
var DEFAULT_SETTINGS = {
  APP_NAME:LMS.APP_NAME,
  COURSE_NAME:'Metode Penelitian Pendidikan Fisika',
  COURSE_CODE:'PFS115036',
  COURSE_WEEKS:'16',
  COURSE_MEETINGS:'16',
  COURSE_SKS:'3',
  CONTACT_MINUTES_PER_MEETING:'100',
  FILE_SHARING_MODE:'LINK_VIEWER',
  CURRENT_WEEK:'1',
  WEEK_MODE:'MANUAL'
};

// Guard endpoint legacy. Bank kuis statis tidak dipakai sebagai seed utama,
// namun API kompatibilitas tetap dipertahankan agar engine mudah dikembangkan.
var STATIC_QUIZ_BANK = {};
var STATIC_DISCUSSION_BANK = {};
var STATIC_ACTIVITY_META = [];
