import { VerificationResult } from './types';

export const APP_NAME = "Sentinel";

export const MOCK_VERIFICATION_RESULT: VerificationResult = {
  match: true,
  confidence: 0.95,
  reason: "Simulated match for development without API key."
};

// Local Storage Keys
export const STORAGE_KEYS = {
  USERS: 'sentinel_users',
  ATTENDANCE: 'sentinel_attendance'
};

export const ROLES = ["Employee", "Student", "Visitor", "Staff"];
