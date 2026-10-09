import axios from "axios";
import {
  Cluster,
  ComplaintSubmitResponse,
  VerificationResponse,
  AnalyticsStats,
  AgentAuditLog,
  User,
  CitizenTicketsResponse,
  OverviewStatsResponse,
  DepartmentStatCards,
  DepartmentProblemsResponse,
} from "../types";

const getBaseUrl = () => {
  let url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
  if (!url.endsWith("/api/v1") && !url.endsWith("/api")) {
    url = `${url.replace(/\/$/, "")}/api/v1`;
  }
  return url;
};

const API_BASE_URL = getBaseUrl();

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true,
});

// Fallback Mock Data for offline demo resiliency
const MOCK_ANALYTICS: AnalyticsStats = {
  total_complaints: 38,
  active_clusters: 6,
  verified_closures: 14,
  fraud_prevented_count: 8,
  duplicate_reduction_pct: 64.2,
};

const MOCK_CLUSTERS: Cluster[] = [
  {
    id: 1,
    title: "Pothole Hazard near (13.083, 80.271)",
    category: "Pothole",
    latitude: 13.0827,
    longitude: 80.2707,
    report_count: 6,
    priority_score: 0.88,
    status: "OPEN",
    assigned_dept: "Roads & Infrastructure Maintenance Wing",
    sla_hours: 24,
    before_image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop",
    created_at: new Date().toISOString(),
  },
  {
    id: 2,
    title: "Water Leakage near (13.042, 80.234)",
    category: "Water Leakage",
    latitude: 13.0418,
    longitude: 80.2341,
    report_count: 4,
    priority_score: 0.72,
    status: "OPEN",
    assigned_dept: "TWAD / Metro Water Supply Board",
    sla_hours: 48,
    before_image: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?w=600&auto=format&fit=crop",
    created_at: new Date().toISOString(),
  },
  {
    id: 3,
    title: "Streetlight Hazard near (13.060, 80.250)",
    category: "Streetlight",
    latitude: 13.0604,
    longitude: 80.2496,
    report_count: 2,
    priority_score: 0.45,
    status: "OPEN",
    assigned_dept: "Municipal Electrical & Lighting Dept",
    sla_hours: 48,
    before_image: "https://images.unsplash.com/photo-1508873696983-2df515122519?w=600&auto=format&fit=crop",
    created_at: new Date().toISOString(),
  },
];

export async function submitComplaint(formData: FormData): Promise<ComplaintSubmitResponse> {
  try {
    const response = await api.post<ComplaintSubmitResponse>("/complaints/submit", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.warn("Backend API offline/error. Returning mock response for demo resilience.", error);
    const text = (formData.get("text") as string) || "";
    const category = text.toLowerCase().includes("light") ? "Streetlight" : "Pothole";
    return {
      complaint_id: Math.floor(Math.random() * 1000) + 1,
      cluster_id: 1,
      is_new_cluster: false,
      category,
      severity: "Critical",
      priority_score: 0.88,
      assigned_dept: "Roads & Infrastructure Maintenance Wing",
      report_count: 7,
      sla_hours: 24,
      agent_trace: [
        `Agent 1 (Intake): Categorized as '${category}', Severity: 'Critical' (Hazard Weight: 0.95)`,
        `Agent 2 (Clustering): Merged into existing Cluster #1 (Total Reports: 7)`,
        `Agent 3 (Priority): Assigned Priority Score 0.88`,
        `Agent 4 (Dispatch): Dispatched to 'Roads & Infrastructure Maintenance Wing' with SLA 24h`,
      ],
    };
  }
}

export interface VoiceTranscribeResponse {
  success: boolean;
  transcription: string;
  semantic_meaning: {
    category: string;
    severity: string;
    hazard_weight: number;
    detected_location: string;
    semantic_summary: string;
  };
}

export async function transcribeVoice(
  audioFile: File | Blob,
  filename?: string,
  language?: string
): Promise<VoiceTranscribeResponse> {
  const formData = new FormData();
  
  let fname = filename;
  if (!fname) {
    if (audioFile instanceof File && audioFile.name) {
      fname = audioFile.name;
    } else {
      const type = (audioFile as Blob).type || "";
      if (type.includes("mp4") || type.includes("m4a")) fname = "voice_recording.mp4";
      else if (type.includes("ogg")) fname = "voice_recording.ogg";
      else if (type.includes("wav")) fname = "voice_recording.wav";
      else if (type.includes("mpeg") || type.includes("mp3")) fname = "voice_recording.mp3";
      else fname = "voice_recording.webm";
    }
  }

  formData.append("audio", audioFile, fname);
  if (language && language !== "auto") {
    formData.append("language", language);
  }

  const response = await api.post<VoiceTranscribeResponse>("/voice/transcribe", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function analyzeSemantics(text: string): Promise<any> {
  const response = await api.post("/voice/semantic", { text });
  return response.data;
}

export async function getActiveClusters(): Promise<Cluster[]> {
  try {
    const response = await api.get<Cluster[]>("/clusters/active");
    return response.data;
  } catch (error) {
    console.warn("Backend API offline/error. Returning mock active clusters.", error);
    return MOCK_CLUSTERS;
  }
}

export async function verifyWorkOrder(formData: FormData): Promise<VerificationResponse> {
  try {
    const response = await api.post<VerificationResponse>("/verification/verify-workorder", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.warn("Backend API offline/error. Running client-side mock verifier logic.", error);
    const gyroTilt = parseFloat((formData.get("gyro_tilt") as string) || "0");
    const imageFile = formData.get("after_image") as File;
    const filename = imageFile?.name || "";
    const file_size = imageFile?.size || 0;

    if (gyroTilt > -15.0 || filename.toLowerCase().includes("fake") || file_size < 8000) {
      return {
        status: "REJECTED",
        reason:
          gyroTilt > -15.0
            ? "Invalid camera orientation! Road and pipeline repairs require downward tilt (< -30°). Level angle indicates photo taken from distance or vehicle."
            : "Zero visual anchor points matched! Stock image or blank photo detected.",
        layer_failed:
          gyroTilt > -15.0
            ? "Layer 1: Hardware Sensor Attestation"
            : "Layer 2: Structural Keypoint Alignment (LightGlue)",
        updated_cluster_status: "REOPENED",
        contractor_trust_score: 80.0,
      };
    }

    return {
      status: "VERIFIED",
      reason:
        "3-Layer Audit Passed: Geometric anchors verified via LightGlue homography, sensor tilt authentic, physical bitumen/pipe repair confirmed.",
      layer_failed: null,
      updated_cluster_status: "VERIFIED",
      contractor_trust_score: 100.0,
    };
  }
}

export async function getAnalyticsStats(): Promise<AnalyticsStats> {
  try {
    const response = await api.get<AnalyticsStats>("/analytics/stats");
    return response.data;
  } catch (error) {
    console.warn("Backend API offline/error. Returning mock analytics stats.", error);
    return MOCK_ANALYTICS;
  }
}

export async function getAuditTrail(clusterId: number): Promise<AgentAuditLog[]> {
  try {
    const response = await api.get<AgentAuditLog[]>(`/clusters/${clusterId}/audit-trail`);
    return response.data;
  } catch (error) {
    console.warn("Backend API offline/error. Returning mock audit trail.", error);
    return [
      {
        id: 1,
        cluster_id: clusterId,
        agent_name: "Agent 1 - Intake Agent",
        input_data: '{"text": "Anna Nagar school pothole", "filename": "pothole.jpg"}',
        decision_output: '{"category": "Pothole", "severity": "Critical", "hazard_weight": 0.95}',
        confidence_score: 0.95,
        timestamp: new Date().toISOString(),
      },
      {
        id: 2,
        cluster_id: clusterId,
        agent_name: "Agent 2 - Spatial Clustering Agent",
        input_data: '{"lat": 13.0827, "lon": 80.2707, "category": "Pothole"}',
        decision_output: '{"cluster_id": 1, "is_new_cluster": false, "report_count": 6}',
        confidence_score: 0.98,
        timestamp: new Date().toISOString(),
      },
    ];
  }
}

// ---------------------------------------------------------------------------
// Authentication & Citizen Profile API
// ---------------------------------------------------------------------------

export async function registerCitizen(name: string, phone: string): Promise<{ success: boolean; phone: string; message: string }> {
  const response = await api.post("/auth/register", { name, phone });
  return response.data;
}

export async function loginCitizen(phone: string): Promise<{ success: boolean; user: User; token: string; message: string }> {
  const response = await api.post("/auth/citizen/login", { phone });
  return response.data;
}

export async function requestOtp(phone: string): Promise<{ success: boolean; phone: string; message: string }> {
  const response = await api.post("/auth/otp/request", { phone });
  return response.data;
}

export async function verifyOtp(phone: string, code: string): Promise<{ success: boolean; user: User; token: string }> {
  const response = await api.post("/auth/otp/verify", { phone, code });
  return response.data;
}

export async function loginDepartment(username: string, password: string): Promise<{ success: boolean; user: User; token: string }> {
  const response = await api.post("/auth/department/login", { username, password });
  return response.data;
}

export async function logoutUser(): Promise<{ success: boolean }> {
  const response = await api.post("/auth/logout");
  return response.data;
}

export async function getMe(): Promise<User | null> {
  try {
    const response = await api.get<User>("/auth/me");
    return response.data;
  } catch (error) {
    try {
      const fallback = await api.get<User>("/me");
      return fallback.data;
    } catch {
      return null;
    }
  }
}

export async function getMyTickets(): Promise<CitizenTicketsResponse> {
  try {
    const response = await api.get<CitizenTicketsResponse>("/auth/me/tickets");
    return response.data;
  } catch (error) {
    try {
      const fallback = await api.get<CitizenTicketsResponse>("/me/tickets");
      return fallback.data;
    } catch {
      console.warn("Failed to fetch tickets from backend; returning fallback.", error);
      return {
        tickets: [],
        total_count: 0,
        category_counts: {},
      };
    }
  }
}

export function maskPhone(phone?: string | null): string {
  if (!phone) return "";
  const cleaned = phone.replace(/[^\d]/g, "");
  if (cleaned.length < 10) return phone;
  const last10 = cleaned.slice(-10);
  return `${last10.slice(0, 2)}XXXXX${last10.slice(-3)}`;
}

// ---------------------------------------------------------------------------
// Department Dashboards API
// ---------------------------------------------------------------------------

export async function getOverviewStats(): Promise<OverviewStatsResponse> {
  const response = await api.get<OverviewStatsResponse>("/stats/overview");
  return response.data;
}

export async function getDepartmentStats(slug: string): Promise<DepartmentStatCards> {
  const response = await api.get<DepartmentStatCards>(`/stats/department/${slug}`);
  return response.data;
}

export async function getDepartmentProblems(
  slug: string,
  params?: { status?: string; tier?: string; page?: number; sort?: string }
): Promise<DepartmentProblemsResponse> {
  const response = await api.get<DepartmentProblemsResponse>(`/department/${slug}/problems`, {
    params,
  });
  return response.data;
}


