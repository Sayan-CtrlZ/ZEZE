import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  signInWithEmailAndPassword,
  updatePassword as updateAuthPassword,
  deleteUser as deleteAuthUser,
  type Auth,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

export class GoogleAccountNotFoundError extends Error {
  email: string;
  userName: string;
  uid: string;
  constructor(email: string, userName: string, uid: string) {
    super("No account found for this Google email. Please create a profile to continue.");
    this.name = "GoogleAccountNotFoundError";
    this.email = email;
    this.userName = userName;
    this.uid = uid;
  }
}

export interface ClinicianDetails {
  specialty?: string;
  hospital?: string;
  licenseNumber?: string;
}

export interface TraineeDetails {
  medicalSchool?: string;
  trainingLevel?: string;
  academicFocus?: string;
}

export interface PatientDetails {
  age?: string;
  sex?: "Male" | "Female";
  healthGoal?: string;
}

export type RoleDetails = ClinicianDetails | TraineeDetails | PatientDetails;

export interface ZezeUserProfile {
  uid: string;
  name: string;
  email: string;
  role: "clinician" | "trainee" | "patient";
  authMethod: "email" | "google";
  details?: RoleDetails;
  designation?: string;
  specialty?: string;
  hospital?: string;
  licenseNumber?: string;
  medicalSchool?: string;
  trainingLevel?: string;
  academicFocus?: string;
  age?: string;
  sex?: string;
  token?: string;
  hasPassword?: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}

// ------------------------------------------------------------------------------
// Firebase Client SDK Configuration & Initialization
// ------------------------------------------------------------------------------
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBpJtrd-kwvNV9V5vePiKkkykhBsdeNKHQ",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "zeze-3e3d1.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "zeze-3e3d1",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "zeze-3e3d1.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "201767435174",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:201767435174:web:e8b5dfad6fb4995a2a6d67",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-82NNW9TQHC",
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  googleProvider.setCustomParameters({ prompt: "select_account" });
} catch (e) {
  console.warn("[Firebase Client Init Notice]", e);
}

export { app, auth, db, googleProvider };

export const getBackendBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:10000";
};

/**
 * Resilient fetch that automatically tries localhost:10000 and localhost:8000
 * if one of the local development ports is unreachable.
 */
export const backendFetch = async (
  endpoint: string,
  init?: RequestInit
): Promise<Response> => {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const primaryBase = getBackendBaseUrl().replace(/\/$/, "");
  const primaryUrl = `${primaryBase}${cleanEndpoint}`;

  try {
    return await fetch(primaryUrl, init);
  } catch (err: unknown) {
    const isNetworkErr =
      err instanceof TypeError ||
      (err instanceof Error &&
        (err.message.includes("fetch") ||
          err.message.includes("NetworkError") ||
          err.message.includes("Failed to fetch")));

    if (isNetworkErr && (primaryBase.includes("localhost") || primaryBase.includes("127.0.0.1"))) {
      const altBase = primaryBase.includes("8000")
        ? primaryBase.replace("8000", "10000")
        : primaryBase.replace("10000", "8000");
      const altUrl = `${altBase}${cleanEndpoint}`;
      try {
        console.info(`[Backend Failover] ${primaryBase} unreachable, attempting ${altBase}...`);
        return await fetch(altUrl, init);
      } catch {
        // Fall through to throw original error
      }
    }
    throw err;
  }
};

/**
 * Persist user profile and session token to browser storage
 */
export const persistLocalSession = (profile: ZezeUserProfile, token?: string) => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem("zeze_user", JSON.stringify(profile));
    sessionStorage.setItem(
      "zeze_profile",
      JSON.stringify({ name: profile.name, role: profile.role })
    );
    sessionStorage.setItem("zeze_selected_role", profile.role);
    if (token) {
      sessionStorage.setItem("zeze_auth_token", token);
    } else if (profile.token) {
      sessionStorage.setItem("zeze_auth_token", profile.token);
    }
  } catch (e) {
    console.error("[Session] Error persisting session:", e);
  }
};

/**
 * Clear user session from storage
 */
export const clearLocalSession = () => {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem("zeze_user");
    sessionStorage.removeItem("zeze_profile");
    sessionStorage.removeItem("zeze_selected_role");
    sessionStorage.removeItem("zeze_form_data");
    sessionStorage.removeItem("zeze_auth_token");
  } catch (e) {
    console.error("[Session] Error clearing session:", e);
  }
};

/**
 * Register a new user via FastAPI Backend -> Firebase Auth & Firestore
 */
export const registerWithEmail = async (
  email: string,
  pass: string,
  profileData: {
    name: string;
    role: "clinician" | "trainee" | "patient";
    details?: RoleDetails;
  }
): Promise<ZezeUserProfile> => {
  const payload = {
    name: profileData.name,
    email,
    password: pass,
    role: profileData.role,
    details: profileData.details || {},
  };

  try {
    const res = await backendFetch("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Registration failed on server");
    }

    const user: ZezeUserProfile = data.user;
    if (data.token) {
      user.token = data.token;
    }
    user.hasPassword = true;
    persistLocalSession(user, data.token);
    return user;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Registration failed";
    console.warn("[Auth API] Backend registration notice:", err);
    if (message.includes("already registered") || message.includes("least 6 characters")) {
      throw err;
    }
    // Fallback in case of temporary offline backend
    const fallbackProfile: ZezeUserProfile = {
      uid: "usr_" + Math.random().toString(36).substring(2, 10),
      name: profileData.name,
      email,
      role: profileData.role,
      authMethod: "email",
      details: profileData.details,
      hasPassword: true,
    };
    persistLocalSession(fallbackProfile);
    return fallbackProfile;
  }
};

/**
 * Sign in existing user via FastAPI Backend -> Firebase Auth & Firestore
 */
export const loginWithEmail = async (
  email: string,
  pass: string
): Promise<ZezeUserProfile> => {
  const payload = {
    email,
    password: pass,
  };

  const res = await backendFetch("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || "Invalid email or password");
  }

  const user: ZezeUserProfile = data.user;
  if (data.token) {
    user.token = data.token;
  }
  user.hasPassword = true;
  persistLocalSession(user, data.token);
  return user;
};


/**
 * Google Sign In / Sign Up using Firebase Auth Client Popup
 */
export const loginWithGoogle = async (
  mode: "signin" | "signup" = "signup",
  desiredRole?: "clinician" | "trainee" | "patient",
  additionalDetails?: RoleDetails
): Promise<{ profile: ZezeUserProfile; isNewUser: boolean; email: string; name: string; uid: string }> => {
  if (!auth) {
    throw new Error("Firebase Auth client is not initialized. Check your client environment configuration.");
  }

  const provider = googleProvider || new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  let cred;
  try {
    cred = await signInWithPopup(auth, provider);
  } catch (err: unknown) {
    const errorObj = err as { code?: string; message?: string };
    if (
      errorObj.code === "auth/popup-closed-by-user" ||
      errorObj.code === "auth/cancelled-popup-request" ||
      errorObj.code === "auth/popup-blocked" ||
      errorObj.message?.includes("closed-by-user") ||
      errorObj.message?.includes("popup has been closed")
    ) {
      throw new Error("cancelled");
    }
    if (errorObj.code === "auth/unauthorized-domain") {
      const currentHost = typeof window !== "undefined" ? window.location.hostname : "your current domain";
      const isIp = currentHost === "127.0.0.1" || currentHost.startsWith("192.168.") || currentHost.startsWith("10.");
      const tip = isIp
        ? `Domain '${currentHost}' is not authorized. Please open the app at http://localhost:3000 or add '${currentHost}' to Firebase Console > Authentication > Settings > Authorized domains.`
        : `Domain '${currentHost}' is not authorized. Please add '${currentHost}' in Firebase Console (Authentication > Settings > Authorized domains).`;
      console.error("[Firebase Unauthorized Domain]", tip);
      throw new Error(tip);
    }
    console.error("[Firebase Google Auth Error]", err);
    throw err;
  }

  const googleUser = cred.user;
  const googleEmail = googleUser.email || "";
  const googleName = googleUser.displayName || (desiredRole === "clinician" ? "Medical Clinician" : "Medical User");
  const googleUid = googleUser.uid;
  let idToken: string | undefined;

  try {
    idToken = await googleUser.getIdToken();
  } catch (tokenErr) {
    console.warn("[Firebase Token Warning]", tokenErr);
  }

  const baseUrl = getBackendBaseUrl();

  // Synchronize Google user with Backend & Firestore database
  try {
    const res = await backendFetch("/auth/google", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: googleUid,
        email: googleEmail,
        name: googleName,
        role: desiredRole || "clinician",
        mode,
        idToken,
        details: additionalDetails || {},
      }),
    });

    if (res.status === 404) {
      throw new GoogleAccountNotFoundError(googleEmail, googleName, googleUid);
    }

    if (res.ok) {
      const data = await res.json();
      const serverProfile: ZezeUserProfile = {
        ...data.user,
        token: idToken || data.token,
      };
      persistLocalSession(serverProfile, idToken);
      return {
        profile: serverProfile,
        isNewUser: data.isNewUser ?? false,
        email: googleEmail,
        name: googleName,
        uid: googleUid,
      };
    }
  } catch (err) {
    if (err instanceof GoogleAccountNotFoundError) {
      throw err;
    }
    console.warn("[Google Auth Backend Sync Warning]:", err);
  }

  // If sign in mode and backend rejected / not found
  if (mode === "signin") {
    const savedUser = typeof window !== "undefined" ? sessionStorage.getItem("zeze_user") : null;
    if (!savedUser) {
      throw new GoogleAccountNotFoundError(googleEmail, googleName, googleUid);
    }
  }

  const clientProfile: ZezeUserProfile = {
    uid: googleUid,
    name: googleName,
    email: googleEmail,
    role: desiredRole || "clinician",
    authMethod: "google",
    details: additionalDetails || {},
    token: idToken,
  };
  persistLocalSession(clientProfile, idToken);
  return {
    profile: clientProfile,
    isNewUser: mode === "signup",
    email: googleEmail,
    name: googleName,
    uid: googleUid,
  };
};

/**
 * Trigger Password Reset Email via FastAPI Backend (Firebase Identity Toolkit)
 */
export const resetPasswordEmail = async (email: string): Promise<boolean> => {
  try {
    const res = await backendFetch("/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) return true;
    const data = await res.json();
    throw new Error(data.detail || "Failed to dispatch recovery email");
  } catch (err) {
    console.warn("[Auth API] Forgot password notice:", err);
    return true;
  }
};

/**
 * Save / Update user profile via FastAPI Backend (written to Cloud Firestore by Backend)
 */
export const saveUserProfileToFirestore = async (
  uid: string,
  data: Omit<ZezeUserProfile, "uid" | "createdAt" | "updatedAt">
): Promise<ZezeUserProfile> => {
  const baseUrl = getBackendBaseUrl();
  const details = data.details || {};

  const profile: ZezeUserProfile = {
    uid,
    name: data.name,
    email: data.email,
    role: data.role,
    authMethod: data.authMethod,
    details,
  };

  if ("specialty" in details && details.specialty) {
    profile.specialty = details.specialty;
    profile.designation = details.specialty;
  }
  if ("hospital" in details && details.hospital) {
    profile.hospital = details.hospital;
  }
  if ("licenseNumber" in details && details.licenseNumber) {
    profile.licenseNumber = details.licenseNumber;
  }
  if ("medicalSchool" in details && details.medicalSchool) {
    profile.medicalSchool = details.medicalSchool;
  }
  if ("trainingLevel" in details && details.trainingLevel) {
    profile.trainingLevel = details.trainingLevel;
  }
  if ("academicFocus" in details && details.academicFocus) {
    profile.academicFocus = details.academicFocus;
  }
  if ("age" in details && details.age) {
    profile.age = details.age;
  }
  if ("sex" in details && details.sex) {
    profile.sex = details.sex;
  }

  // Update profile in backend
  try {
    const token = typeof window !== "undefined" ? sessionStorage.getItem("zeze_auth_token") : null;
    await backendFetch(`/auth/profile/${uid}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        name: data.name,
        role: data.role,
        email: data.email,
        details,
      }),
    });
  } catch (e) {
    console.warn("[Auth API] Error saving profile to backend:", e);
  }

  persistLocalSession(profile);
  return profile;
};

/**
 * Fetch user profile from Backend / Cloud Firestore
 */
export const getUserProfileFromFirestore = async (uid: string): Promise<ZezeUserProfile | null> => {
  try {
    const res = await backendFetch(`/auth/profile/${uid}`);
    if (res.ok) {
      const data = await res.json();
      if (data.user) {
        persistLocalSession(data.user);
        return data.user;
      }
    }
  } catch (e) {
    console.warn("[Auth API] Error fetching profile from backend:", e);
  }
  return null;
};

/**
 * Update password for current user via FastAPI Backend
 */
export const updateAccountPassword = async (
  newPassword: string,
  oldPassword?: string
): Promise<void> => {
  if (typeof window === "undefined") return;
  let email = "";
  try {
    const raw = sessionStorage.getItem("zeze_user");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.email) email = parsed.email;
    }
  } catch {
    // ignore
  }

  // Also update Firebase Client Auth password if current session user exists
  if (auth?.currentUser) {
    try {
      await updateAuthPassword(auth.currentUser, newPassword);
    } catch (clientErr) {
      console.warn("[Firebase Client Password Update Notice]", clientErr);
    }
  }

  const res = await backendFetch("/auth/update-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, oldPassword, newPassword }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    if (errData?.detail) {
      throw new Error(errData.detail);
    }
    throw new Error("Failed to update password. Please check your credentials.");
  }

  // Update session to mark that user now has a password
  try {
    const raw = sessionStorage.getItem("zeze_user");
    if (raw) {
      const parsed = JSON.parse(raw);
      parsed.hasPassword = true;
      sessionStorage.setItem("zeze_user", JSON.stringify(parsed));
    }
  } catch {
    // ignore
  }
};

/**
 * Permanently delete user account via FastAPI Backend & Firebase
 */
export const deleteUserAccount = async (password?: string): Promise<void> => {
  if (typeof window === "undefined") return;
  let uid = auth?.currentUser?.uid || "usr_current";
  let email = auth?.currentUser?.email || "";

  try {
    const raw = sessionStorage.getItem("zeze_user");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.uid) uid = parsed.uid;
      if (parsed.email) email = parsed.email;
    }
  } catch {
    // ignore
  }

  let idToken = sessionStorage.getItem("zeze_auth_token") || undefined;
  if (auth?.currentUser) {
    try {
      idToken = await auth.currentUser.getIdToken();
    } catch {}
  }

  // Call FastAPI backend to permanently delete user from Firebase Auth & Firestore
  try {
    const res = await backendFetch(`/auth/profile/${uid}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, idToken }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      if (errData?.detail) {
        console.warn("[Backend Delete Warning]", errData.detail);
      }
    }
  } catch (apiErr) {
    console.warn("[Auth API] delete profile warning:", apiErr);
  }

  // Delete directly from Firebase client auth if available
  if (auth?.currentUser) {
    try {
      await deleteAuthUser(auth.currentUser);
    } catch (clientErr) {
      console.warn("[Firebase Client User Delete Notice]", clientErr);
    }
  }

  clearLocalSession();
};

/**
 * Sign out user from Firebase Auth and clear local storage
 */
export const signOutFirebaseUser = async (): Promise<void> => {
  try {
    if (auth) {
      await signOut(auth);
    }
  } catch (err) {
    console.warn("[Firebase SignOut Notice]", err);
  }
  clearLocalSession();
};

function absHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 1000000;
}
