function ok_(data){return {ok:true,data:data};}
function fail_(err,code){return {ok:false,error:{message:String(err&&err.message?err.message:err),code:code||'REQUEST_FAILED'}};}

function api(request) {
  request=request||{};var action=String(request.action||''),payload=request.payload||{};
  try{
    switch(action){
      case 'login': return ok_(loginService_(payload));
      case 'me': return ok_({user:safeUser_(requireUser_(request))});
      case 'getDashboard': return ok_(dashboardService_(request));
      case 'listWeeks': return ok_(listWeeksService_(request));
      case 'getWeek': return ok_(getWeekService_(request,payload));
      case 'listDiscussions': return ok_(listDiscussionsService_(request));
      case 'getDiscussion': return ok_(getDiscussionService_(request,payload));
      case 'createPost': return ok_(createPostService_(request,payload));
      case 'listTasks': return ok_(listTasksService_(request));
      case 'getTask': return ok_(taskDataService_(request,payload));
      case 'submitWork': return ok_(submitWorkService_(request,payload));
      case 'listGrades': return ok_(listGradesService_(request));
      case 'getQuiz': return ok_(getQuizService_(request,payload));
      case 'submitQuiz': return ok_(submitQuizService_(request,payload));
      case 'getStaticQuizStatus': return ok_(getStaticQuizStatusService_(request,payload));
      case 'submitStaticQuiz': return ok_(submitStaticQuizService_(request,payload));
      case 'getStaticDiscussionPosts': return ok_(getStaticDiscussionPostsService_(request,payload));
      case 'createStaticPost': return ok_(createStaticPostService_(request,payload));
      case 'getStaticActivityProgress': return ok_(getStaticActivityProgressService_(request));
      case 'getProjectPlan': return ok_(getProjectPlanService_(request,payload));
      case 'saveProjectPlan': return ok_(saveProjectPlanService_(request,payload));
      case 'getProjectFinalReport': return ok_(getProjectFinalReportService_(request,payload));
      case 'saveProjectFinalReport': return ok_(saveProjectFinalReportService_(request,payload));
      case 'uploadAsset': return ok_(uploadAssetService_(request,payload));

      case 'adminListMaterials': return ok_(adminListMaterials_(request));
      case 'adminSaveMaterial': return ok_(adminSaveMaterial_(request,payload));
      case 'adminListActivities': return ok_(adminListActivities_(request));
      case 'adminSaveActivity': return ok_(adminSaveActivity_(request,payload));
      case 'adminListDiscussions': return ok_(adminListDiscussions_(request));
      case 'adminSaveDiscussion': return ok_(adminSaveDiscussion_(request,payload));
      case 'adminListQuizzes': return ok_(adminListQuizzes_(request));
      case 'adminGetQuiz': return ok_(adminGetQuiz_(request,payload));
      case 'adminSaveQuiz': return ok_(adminSaveQuiz_(request,payload));
      case 'adminSaveQuizQuestion': return ok_(adminSaveQuizQuestion_(request,payload));
      case 'adminDeleteQuizQuestion': return ok_(adminDeleteQuizQuestion_(request,payload));
      case 'adminListUsers': return ok_(adminListUsers_(request));
      case 'adminSaveUser': return ok_(adminSaveUser_(request,payload));
      case 'adminResetPin': return ok_(adminResetPin_(request,payload));
      case 'adminImportUsers': return ok_(adminImportUsers_(request,payload));
      case 'adminListAnnouncements': return ok_(adminListAnnouncements_(request));
      case 'adminSaveAnnouncement': return ok_(adminSaveAnnouncement_(request,payload));
      case 'adminListGroups': return ok_(adminListGroups_(request));
      case 'adminSaveGroup': return ok_(adminSaveGroup_(request,payload));
      case 'adminImportGroups': return ok_(adminImportGroups_(request,payload));
      case 'adminListProjectPlans': return ok_(adminListProjectPlans_(request));
      case 'adminReviewProjectPlan': return ok_(adminReviewProjectPlan_(request,payload));
      case 'adminGradebookActivities': return ok_(adminGradebookActivities_(request));
      case 'adminActivityRoster': return ok_(adminActivityRoster_(request,payload));
      case 'adminSaveGrade': return ok_(adminSaveGrade_(request,payload));
      case 'adminGetRubricEvaluation': return ok_(adminGetRubricEvaluation_(request,payload));
      case 'adminSaveRubricEvaluation': return ok_(adminSaveRubricEvaluation_(request,payload));
      case 'adminImportGrades': return ok_(adminImportGrades_(request,payload));
      case 'adminAddSubmissionComment': return ok_(adminAddSubmissionComment_(request,payload));
      case 'adminSeedBundledContent': return ok_(adminSeedBundledContent_(request,payload));
      case 'adminExportWorkbook': return ok_(adminExportWorkbook_(request));
      case 'adminImportWorkbook': return ok_(adminImportWorkbook_(request,payload));
      default: throw new Error('Action tidak dikenal: '+action);
    }
  }catch(err){return fail_(err);}
}
