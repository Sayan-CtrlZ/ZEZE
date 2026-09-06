"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Stethoscope,
  GraduationCap,
  User,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Mail,
  CheckCircle2,
  Edit3,
  Save,
  Lock,
  Eye,
  EyeOff,
  Info,
  Trash2,
} from "lucide-react";
import AppNavbar from "@/components/AppNavbar";
import {
  saveUserProfileToFirestore,
  updateAccountPassword,
  deleteUserAccount,
  auth,
  type RoleDetails,
} from "@/lib/firebase";

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isQueryCompleteMode = searchParams.get("complete") === "true";
  const queryRole = searchParams.get("role") as "clinician" | "trainee" | "patient" | null;

  const [role, setRole] = useState<"clinician" | "trainee" | "patient">(queryRole || "clinician");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [authMethod, setAuthMethod] = useState("google");

  // Clinician fields
  const [specialty, setSpecialty] = useState("");
  const [hospital, setHospital] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  // Trainee fields
  const [medicalSchool, setMedicalSchool] = useState("");
  const [trainingLevel, setTrainingLevel] = useState("MS3 - Clinical Rotations");
  const [academicFocus, setAcademicFocus] = useState("");

  // Patient fields
  const [patientAge, setPatientAge] = useState("");
  const [patientSex, setPatientSex] = useState<"Male" | "Female">("Male");

  // Password fields (for OAuth users to set email/password or existing users to update)
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Existing password tracking & old password verification modal
  const [hasPassword, setHasPassword] = useState(false);
  const [showOldPasswordModal, setShowOldPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [oldPasswordError, setOldPasswordError] = useState<string | null>(null);
  const [oldPasswordLoading, setOldPasswordLoading] = useState(false);

  // Status & Lock Mode State
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(!isQueryCompleteMode);
  const [isEditing, setIsEditing] = useState<boolean>(isQueryCompleteMode);
  const [saveToast, setSaveToast] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Delete Account Confirmation State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const rawUser = sessionStorage.getItem("zeze_user");
        if (rawUser) {
          const parsed = JSON.parse(rawUser);
          if (parsed.role) setRole(parsed.role);
          if (parsed.name) setName(parsed.name);
          if (parsed.email) setEmail(parsed.email);
          if (parsed.authMethod) setAuthMethod(parsed.authMethod);
          if (parsed.authMethod === "email" || parsed.hasPassword === true) {
            setHasPassword(true);
          }

          if (parsed.isComplete === false || isQueryCompleteMode) {
            setIsProfileComplete(false);
            setIsEditing(true);
          } else if (parsed.isComplete === true) {
            setIsProfileComplete(true);
          }

          if (parsed.details) {
            if (parsed.role === "clinician") {
              if (parsed.details.specialty) setSpecialty(parsed.details.specialty);
              if (parsed.details.hospital) setHospital(parsed.details.hospital);
              if (parsed.details.licenseNumber) setLicenseNumber(parsed.details.licenseNumber);
            } else if (parsed.role === "trainee") {
              if (parsed.details.medicalSchool) setMedicalSchool(parsed.details.medicalSchool);
              if (parsed.details.trainingLevel) setTrainingLevel(parsed.details.trainingLevel);
              if (parsed.details.academicFocus) setAcademicFocus(parsed.details.academicFocus);
            } else {
              if (parsed.details.age) setPatientAge(parsed.details.age);
              if (parsed.details.sex) setPatientSex(parsed.details.sex);
            }
          }
        } else {
          if (queryRole) setRole(queryRole);
          if (isQueryCompleteMode) {
            setIsProfileComplete(false);
            setIsEditing(true);
          }
        }
      } catch {
        // ignore
      }
    }

    let unsubAuth: (() => void) | undefined;
    if (auth) {
      unsubAuth = auth.onAuthStateChanged((currentUser) => {
        if (currentUser) {
          const hasPassProvider = currentUser.providerData?.some(
            (p) => p.providerId === "password"
          );
          if (hasPassProvider) {
            setHasPassword(true);
          }
        }
      });
    }

    return () => {
      if (unsubAuth) unsubAuth();
    };
  }, [isQueryCompleteMode, queryRole]);

  const isWorkspaceLocked = !isProfileComplete;

  const handleSaveProfile = async () => {
    setValidationError(null);

    // Validate required fields
    if (role === "clinician") {
      if (!name.trim()) {
        setValidationError("Please enter your Full Name & Title.");
        return;
      }
      if (!specialty.trim()) {
        setValidationError("Please enter your Specialty / Department.");
        return;
      }
      if (!hospital.trim()) {
        setValidationError("Please enter your Hospital or Practice Center.");
        return;
      }
    } else if (role === "trainee") {
      if (!name.trim()) {
        setValidationError("Please enter your Full Name.");
        return;
      }
      if (!medicalSchool.trim()) {
        setValidationError("Please enter your Medical School / University.");
        return;
      }
      if (!academicFocus.trim()) {
        setValidationError("Please enter your Primary Academic Focus.");
        return;
      }
    } else {
      if (!name.trim()) {
        setValidationError("Please enter your Name.");
        return;
      }
      if (!patientAge || parseInt(patientAge, 10) < 1 || parseInt(patientAge, 10) > 120) {
        setValidationError("Please provide a valid Age.");
        return;
      }
    }

    // Validate password if provided
    if (password) {
      if (password.length < 6) {
        setValidationError("Password must be at least 6 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setValidationError("Passwords do not match.");
        return;
      }

      // If user already has an existing password, prompt for old password verification
      if (hasPassword) {
        setOldPassword("");
        setOldPasswordError(null);
        setShowOldPasswordModal(true);
        return;
      }
    }

    await executeProfileSave(password ? password : undefined);
  };

  const executeProfileSave = async (newPass?: string) => {
    const details: RoleDetails =
      role === "clinician"
        ? { specialty, hospital, licenseNumber }
        : role === "trainee"
        ? { medicalSchool, trainingLevel, academicFocus }
        : { age: patientAge, sex: patientSex };

    const updatedUser = {
      name,
      role,
      email,
      authMethod,
      details,
      isComplete: true,
      hasPassword: hasPassword || Boolean(newPass),
      updatedAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      let uid = "usr_current";
      try {
        const raw = sessionStorage.getItem("zeze_user");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.uid) uid = parsed.uid;
        }
      } catch {
        // ignore
      }

      saveUserProfileToFirestore(uid, {
        name,
        role,
        email,
        authMethod: (authMethod as "email" | "google") || "google",
        details,
      }).catch((e) => console.warn("[Profile] Firestore write error:", e));

      sessionStorage.setItem("zeze_user", JSON.stringify({ ...updatedUser, uid }));
      sessionStorage.setItem("zeze_profile", JSON.stringify({ name, role }));
      sessionStorage.setItem("zeze_selected_role", role);
    }

    if (newPass) {
      try {
        await updateAccountPassword(newPass);
        setHasPassword(true);
      } catch (passErr: unknown) {
        const errObj = passErr as Error;
        console.warn("[Profile] Password update notice:", errObj.message);
      }
      setPassword("");
      setConfirmPassword("");
    }

    setIsProfileComplete(true);
    setIsEditing(false);
    setSaveToast(true);

    setTimeout(() => {
      setSaveToast(false);
    }, 2500);
  };

  const handleConfirmOldPassword = async () => {
    if (!oldPassword) {
      setOldPasswordError("Please enter your old password.");
      return;
    }
    setOldPasswordLoading(true);
    setOldPasswordError(null);
    try {
      await updateAccountPassword(password, oldPassword);
      setShowOldPasswordModal(false);
      setOldPassword("");
      setPassword("");
      setConfirmPassword("");
      await executeProfileSave();
    } catch (err: unknown) {
      const errObj = err as Error;
      setOldPasswordError(errObj?.message || "Incorrect old password. Please try again.");
    } finally {
      setOldPasswordLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmText.trim().toLowerCase() !== "delete") {
      setDeleteError("Please type 'delete' to confirm.");
      return;
    }
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteUserAccount();
      setShowDeleteModal(false);
      router.push("/");
    } catch (err: unknown) {
      const errObj = err as Error;
      setDeleteError(errObj?.message || "Failed to delete account. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const roleMeta = {
    clinician: {
      title: "Clinician / Doctor",
      icon: Stethoscope,
      accentBg: "#2563eb",
    },
    trainee: {
      title: "Healthcare Trainee",
      icon: GraduationCap,
      accentBg: "#7c3aed",
    },
    patient: {
      title: "Patient / General User",
      icon: User,
      accentBg: "#0d9488",
    },
  }[role];

  const RoleIcon = roleMeta.icon;

  return (
    <main className="min-h-screen bg-[#edf3f9] relative pb-16 pt-2 sm:pt-3">
      <div className="max-w-[1640px] 2xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Floating Pill Navbar */}
        <AppNavbar currentRole={role} pageType="profile" isLocked={isWorkspaceLocked} />

        {/* Inner Content */}
        <div className="max-w-2xl mx-auto space-y-3">
          {/* Top Breadcrumb / Toast */}
          {(!isWorkspaceLocked || saveToast) && (
            <div className="flex items-center justify-between">
              {!isWorkspaceLocked ? (
                <Link
                  href={`/assessment?role=${role}`}
                  className="neu-button-secondary inline-flex items-center gap-2 px-4 py-2 text-slate-800 text-xs sm:text-sm font-black active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-700" />
                  <span>Back to Workspace</span>
                </Link>
              ) : (
                <div />
              )}

              {saveToast && (
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100 neu-inset border border-emerald-300 text-emerald-900 text-xs font-black animate-in fade-in duration-200 ml-auto">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Profile updated successfully!</span>
                </div>
              )}
            </div>
          )}

          {/* Main Neumorphic Card */}
          <div className="neu-card-glass p-6 sm:p-10 rounded-3xl border border-white/80 space-y-7 relative overflow-hidden">
            {/* Simple Locked Notification Banner */}
            {isWorkspaceLocked && (
              <div className="p-4 rounded-2xl neu-inset bg-blue-50/70 border border-blue-200/80 text-xs font-semibold text-slate-700 flex items-center gap-3">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>Please complete the profile fields below to activate your workspace.</span>
              </div>
            )}

            {/* Validation Error Banner */}
            {validationError && (
              <div className="p-3.5 rounded-2xl neu-inset-sm bg-rose-500/10 border border-rose-300 text-rose-800 text-xs sm:text-sm font-bold flex items-start gap-2.5 animate-in fade-in duration-200">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Profile Header Block */}
            <div className="flex items-center justify-between pb-6 border-b border-slate-200/80">
              <div className="flex items-center gap-4">
                {/* 3D Avatar Icon */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md shrink-0"
                  style={{ backgroundColor: roleMeta.accentBg }}
                >
                  <RoleIcon className="w-7 h-7 text-white" strokeWidth={2.4} />
                </div>

                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-[#0a192f] tracking-tight">
                    {name || (role === "clinician" ? "Clinician Profile" : "User Profile")}
                  </h1>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{email || "Connected Account"}</span>
                  </div>
                </div>
              </div>

              {/* Top-Right Action: Edit / Save toggle */}
              <div className="shrink-0">
                {isEditing ? (
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="neu-button-3d inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-black uppercase tracking-wider cursor-pointer active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="neu-button-secondary inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider cursor-pointer active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              {/* Clinician Fields */}
              {role === "clinician" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Full Name &amp; Title
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Dr. Sarah Jenkins, MD"
                      className="neu-input w-full px-4.5 py-3.5 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none disabled:opacity-75"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Specialty / Department
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="e.g. Cardiology / Internal Medicine"
                      className="neu-input w-full px-4.5 py-3.5 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none disabled:opacity-75"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Hospital or Practice Center
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={hospital}
                      onChange={(e) => setHospital(e.target.value)}
                      placeholder="e.g. City Heart Center"
                      className="neu-input w-full px-4.5 py-3.5 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none disabled:opacity-75"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Medical License Number <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      placeholder="e.g. MD-982412"
                      className="neu-input w-full px-4.5 py-3.5 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none disabled:opacity-75"
                    />
                  </div>
                </div>
              )}

              {/* Trainee Fields */}
              {role === "trainee" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Rivera"
                      className="neu-input w-full px-4.5 py-3.5 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none disabled:opacity-75"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Medical School / Institution
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={medicalSchool}
                      onChange={(e) => setMedicalSchool(e.target.value)}
                      placeholder="e.g. Johns Hopkins School of Medicine"
                      className="neu-input w-full px-4.5 py-3.5 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none disabled:opacity-75"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Training Level
                    </label>
                    <select
                      disabled={!isEditing}
                      value={trainingLevel}
                      onChange={(e) => setTrainingLevel(e.target.value)}
                      className="neu-input w-full px-4.5 py-3.5 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none disabled:opacity-75"
                    >
                      <option value="MS1 - Pre-Clinical Sciences">MS1 - Pre-Clinical Sciences</option>
                      <option value="MS2 - Organ Systems & Pathology">MS2 - Organ Systems &amp; Pathology</option>
                      <option value="MS3 - Clinical Rotations">MS3 - Clinical Rotations</option>
                      <option value="MS4 - Sub-Internship & Electives">MS4 - Sub-Internship &amp; Electives</option>
                      <option value="PGY1 - Internal Medicine Resident">PGY1 - Internal Medicine Resident</option>
                      <option value="PGY2/3 - Senior Medical Resident">PGY2/3 - Senior Medical Resident</option>
                      <option value="Cardiology Fellow">Cardiology Fellow</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Primary Academic Focus
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={academicFocus}
                      onChange={(e) => setAcademicFocus(e.target.value)}
                      placeholder="e.g. Hemodynamics & Cardiovascular Pathophysiology"
                      className="neu-input w-full px-4.5 py-3.5 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none disabled:opacity-75"
                    />
                  </div>
                </div>
              )}

              {/* Patient Fields */}
              {role === "patient" && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe"
                      className="neu-input w-full px-4.5 py-3.5 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none disabled:opacity-75"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                        Age (Years)
                      </label>
                      <input
                        type="number"
                        min="18"
                        max="105"
                        disabled={!isEditing}
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        placeholder="e.g. 52"
                        className="neu-input w-full px-4.5 py-3.5 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none disabled:opacity-75"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                        Biological Sex
                      </label>
                      <select
                        disabled={!isEditing}
                        value={patientSex}
                        onChange={(e) => setPatientSex(e.target.value as "Male" | "Female")}
                        className="neu-input w-full px-4.5 py-3.5 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none disabled:opacity-75"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* PASSWORD SECTION (Dynamic: Change Password vs Create Password) */}
              <div className="pt-6 border-t border-slate-200/80 space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                      {hasPassword ? "Change Password" : "Create Password"}{" "}
                      <span className="text-slate-400 font-normal">(Optional)</span>
                    </h3>
                    {hasPassword && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-700 border border-blue-200">
                        Password Protected
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 mt-1">
                    {hasPassword
                      ? "Enter your new password and confirm it. When saving, you will be prompted to verify your old password."
                      : "Create a password to enable direct email and password sign in alongside Google."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                      {hasPassword ? "New Password" : "Password"}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        disabled={!isEditing}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="neu-input w-full pl-4 pr-10 py-3 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none disabled:opacity-75"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">
                      {hasPassword ? "Confirm New Password" : "Confirm Password"}
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        disabled={!isEditing}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="neu-input w-full pl-4 pr-10 py-3 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none disabled:opacity-75"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Action Area: Delete Account */}
            <div className="pt-6 border-t border-slate-200/80 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmText("");
                  setDeleteError(null);
                  setShowDeleteModal(true);
                }}
                className="neu-button-secondary text-rose-700 hover:text-rose-900 border-rose-200/80 text-xs font-black uppercase tracking-wider px-4 py-2.5 inline-flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete Account</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal - Requires Typing 'delete' */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg sm:max-w-xl bg-[#edf3f9] p-7 sm:p-9 rounded-3xl border border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3)] space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[#0a192f] tracking-tight">
                  Delete Account
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
                  Permanently delete your profile, credentials, and settings.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-4 rounded-2xl neu-inset-sm bg-rose-500/10 border border-rose-300 text-rose-800 text-xs sm:text-sm font-bold flex items-start gap-2.5">
                <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="space-y-2.5">
              <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
                Type <span className="text-rose-600 font-extrabold normal-case">&apos;delete&apos;</span> to confirm
              </label>
              <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
                This action is permanent and cannot be undone. To proceed with deleting your account, please type <strong className="text-slate-900 font-bold">delete</strong> below.
              </p>
              <input
                type="text"
                autoFocus
                value={deleteConfirmText}
                onChange={(e) => {
                  setDeleteConfirmText(e.target.value);
                  setDeleteError(null);
                }}
                placeholder="delete"
                className="neu-input w-full px-5 py-3.5 rounded-2xl text-sm sm:text-base font-bold text-slate-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3.5 pt-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                  setDeleteError(null);
                }}
                className="neu-button-secondary px-5 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 cursor-pointer active:scale-95"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading || deleteConfirmText.trim().toLowerCase() !== "delete"}
                onClick={handleConfirmDelete}
                className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-rose-600/25 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deleteLoading ? (
                  <span>Deleting...</span>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Old Password Verification Modal */}
      {showOldPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg sm:max-w-xl bg-[#edf3f9] p-7 sm:p-9 rounded-3xl border border-slate-200/90 shadow-[0_25px_60px_-15px_rgba(15,23,42,0.3)] space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-[#0a192f] tracking-tight">
                  Verify Old Password
                </h3>
                <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-0.5">
                  Enter your current password to authorize this update.
                </p>
              </div>
            </div>

            {/* Error Display with Forgot Password Option */}
            {oldPasswordError && (
              <div className="p-4 rounded-2xl neu-inset-sm bg-rose-500/10 border border-rose-300 space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-start gap-2 text-rose-800 text-xs sm:text-sm font-bold">
                  <div className="w-2 h-2 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <span>{oldPasswordError}</span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-rose-200/70 text-xs sm:text-sm">
                  <span className="text-slate-600 font-medium">
                    Forgot your current password?
                  </span>
                  <Link
                    href="/forgot-password"
                    className="text-blue-600 hover:text-blue-700 font-bold underline cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    Forgot Password?
                  </Link>
                </div>
              </div>
            )}

            <div className="space-y-2.5">
              <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showOldPassword ? "text" : "password"}
                  autoFocus
                  value={oldPassword}
                  onChange={(e) => {
                    setOldPassword(e.target.value);
                    setOldPasswordError(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && oldPassword.trim() && !oldPasswordLoading) {
                      e.preventDefault();
                      handleConfirmOldPassword();
                    }
                  }}
                  placeholder="••••••••••••"
                  className="neu-input w-full pl-5 pr-12 py-3.5 rounded-2xl text-sm sm:text-base font-bold text-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link
                href="/forgot-password"
                className="text-xs sm:text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors"
              >
                Forgot Password?
              </Link>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={oldPasswordLoading}
                  onClick={() => {
                    setShowOldPasswordModal(false);
                    setOldPassword("");
                    setOldPasswordError(null);
                  }}
                  className="neu-button-secondary px-5 py-3 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-700 cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={oldPasswordLoading || !oldPassword.trim()}
                  onClick={handleConfirmOldPassword}
                  className="neu-button-3d px-6 py-3 text-xs sm:text-sm font-black uppercase tracking-wider cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {oldPasswordLoading ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm &amp; Save</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#edf3f9] flex items-center justify-center">
          <div className="neu-card-glass p-8 rounded-3xl text-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-black text-[#0a192f]">Loading Profile...</p>
          </div>
        </main>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
