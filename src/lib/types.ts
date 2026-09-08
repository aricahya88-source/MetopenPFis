export type Role = 'admin' | 'dosen' | 'mahasiswa';

export type User = {
  user_id: string;
  nim: string;
  name: string;
  email: string;
  role: Role;
  class_name?: string;
};

export type ApiResponse<T = unknown> = {
  ok: boolean;
  data?: T;
  error?: { message: string; code?: string };
};

export type WeekSummary = {
  week_id: string;
  week_no: number;
  title: string;
  material_count: number;
  activity_count: number;
  meeting_date?: string;
  meeting_date_label?: string;
  block?: number;
  block_deadline?: string;
  block_deadline_label?: string;
};

export type Material = {
  material_id: string;
  week_id: string;
  material_no: number;
  order_no: number;
  title: string;
  content_html: string;
  resource_url?: string;
  visible?: boolean;
};

export type Activity = {
  activity_id: string;
  week_id: string;
  type: string;
  title: string;
  description_html?: string;
  mode?: string;
  max_score?: number;
  due_at?: string;
  visible?: boolean;
  project_code?: string;
};

export type DiscussionSummary = {
  discussion_id: string;
  activity_id: string;
  week_id: string;
  title: string;
  prompt_html: string;
  max_score: number;
  post_count?: number;
  checkpoint_no?: number;
  material_range?: string;
  recommended_date?: string;
  recommended_date_label?: string;
  due_at?: string;
  due_label?: string;
};

export type Post = {
  post_id: string;
  discussion_id: string;
  user_id: string;
  parent_post_id?: string;
  content_html: string;
  created_at: string;
  author?: User;
};

export type Grade = {
  grade_id: string;
  activity_id: string;
  score: number;
  max_score: number;
  feedback_html?: string;
  published?: boolean;
  activity_title?: string;
};

export type ProjectPlan = {
  plan_id?: string;
  project_code: string;
  user_id?: string;
  group_id?: string;
  title: string;
  theme_code: string;
  topic: string;
  maharah_json: string;
  target_users_html: string;
  problem_html: string;
  objectives_html: string;
  features_html: string;
  flow_html: string;
  technology_html: string;
  test_plan_html: string;
  team_html: string;
  detail_json: string;
  status?: string;
  revision_no?: number;
  lecturer_feedback_html?: string;
  updated_at?: string;
};
