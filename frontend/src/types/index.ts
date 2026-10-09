export interface Cluster {
  id: number;
  title: string;
  category: string;
  latitude: number;
  longitude: number;
  report_count: number;
  priority_score: number;
  status: string;
  assigned_dept: string | null;
  sla_hours: number;
  before_image: string | null;
  citizen_name?: string | null;
  complaint_text?: string | null;
  created_at: string;
}

export interface ComplaintSubmitResponse {
  complaint_id: number;
  cluster_id: number;
  is_new_cluster: boolean;
  category: string;
  severity: string;
  priority_score: number;
  assigned_dept: string;
  report_count: number;
  sla_hours: number;
  agent_trace: string[];
}

export interface VerificationResponse {
  status: "VERIFIED" | "REJECTED";
  reason: string;
  layer_failed: string | null;
  updated_cluster_status: string;
  contractor_trust_score: number;
}

export interface AnalyticsStats {
  total_complaints: number;
  active_clusters: number;
  verified_closures: number;
  fraud_prevented_count: number;
  duplicate_reduction_pct: number;
}

export interface User {
  id: number;
  name: string;
  phone?: string | null;
  username?: string | null;
  role: "citizen" | "department" | "commissioner";
  department?: string | null;
  created_at: string;
}

export interface CitizenTicketItem {
  ticket_id: number;
  category: string;
  severity: string;
  raw_text: string;
  image_url: string | null;
  latitude: number;
  longitude: number;
  status: string;
  master_cluster_id: number | null;
  master_cluster_status: string | null;
  assigned_dept: string | null;
  sla_hours: number;
  cluster_report_count: number;
  created_at: string;
}

export interface CitizenTicketsResponse {
  tickets: CitizenTicketItem[];
  total_count: number;
  category_counts: Record<string, number>;
}

export interface DepartmentTile {
  slug: string;
  name_en: string;
  name_ta: string;
  example_en: string;
  example_ta: string;
  icon: string;
}

export interface DepartmentStatCards {
  department_name: string;
  slug: string;
  overall_registered: number;
  total_solved: number;
  today_received: number;
  pending: number;
  resolution_rate_pct: number;
  overdue: number;
  total_reports: number;
}

export interface OverviewStatsResponse {
  city_totals: DepartmentStatCards;
  departments: DepartmentStatCards[];
}

export interface DepartmentProblemItem {
  rank: number;
  id: number;
  title: string;
  category: string;
  citizen_name: string;
  complaint_text: string;
  tier: string;
  tier_number: number;
  priority_score: number;
  report_count: number;
  latitude: number;
  longitude: number;
  location_name: string;
  created_at: string;
  age_text: string;
  sla_hours: number;
  sla_due: string;
  sla_remaining_hours: number;
  is_overdue: boolean;
  status: string;
  before_image: string | null;
  after_image: string | null;
  assigned_dept: string;
}

export interface DepartmentProblemsResponse {
  department_name: string;
  slug: string;
  problems: DepartmentProblemItem[];
  total_count: number;
  page: number;
  page_size: number;
  total_pages: number;
}export interface AgentAuditLog {
  id?: number;
  cluster_id: number;
  agent_name: string;
  input_data: string;
  decision_output: string;
  confidence_score: number;
  timestamp: string;
}
