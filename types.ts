export interface User {
  id: string;
  name: string;
  role: string;
  photoData: string | null; // Null if imported via bulk upload but not face-registered
  status: 'ACTIVE' | 'PENDING'; // PENDING means data exists, but face not captured
  registeredAt: string;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  timestamp: string;
  status: 'PRESENT' | 'REJECTED';
  verificationConfidence: number;
  reason?: string;
  photoSnapshot: string; // Base64 of the attempt
  sessionName?: string; // E.g., "Math 101", "Morning Assembly"
}

export interface AttendanceSession {
  sessionId: string;
  className: string;
  timestamp: number;
  hostId: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  REGISTER = 'REGISTER',
  KIOSK = 'KIOSK',
  ID_CARD = 'ID_CARD'
}

export interface VerificationResult {
  match: boolean;
  confidence: number;
  reason: string;
}

export type UserRole = 'TEACHER' | 'STUDENT';

export interface AuthState {
  isAuthenticated: boolean;
  role: UserRole | null;
  currentUser: User | null; // Null if teacher (admin user)
}
