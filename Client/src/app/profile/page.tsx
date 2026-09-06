"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Sparkles,
  Activity,
} from "lucide-react";
import AppNavbar from "@/components/AppNavbar";

export default function ProfilePage() {
  const router = useRouter();

  const [role, setRole] = useState<"clinician" | "trainee" | "patient">("clinician");
  const [name, setName] = useState("Dr. Sarah Jenkins, MD");
  const [email, setEmail] = useState("s.jenkins@cardio-center.org");
  const [authMethod, setAuthMethod] = useState("email");

  // Clinician fields
  const [specialty, setSpecialty] = useState("Cardiology / Internal Medicine");
  const [hospital, setHospital] = useState("Metropolitan Heart Center");
  const [licenseNumber, setLicenseNumber] = useState("NPI-19482048");

  // Trainee fields
  const [medicalSchool, setMedicalSchool] = useState("Johns Hopkins School of Medicine");
  const [trainingLevel, setTrainingLevel] = useState("MS3 - Clinical Rotations");
  const [academicFocus, setAcademicFocus] = useState("Hemodynamics & Cardiovascular Pathophysiology");

  // Patient fields
  const [patientAge, setPatientAge] = useState("55");
  const [patientSex, setPatientSex] = useState<"Male" | "Female">("Male");
  const [healthGoal, setHealthGoal] = useState("Routine Cardiovascular Assessment");

  // UI State
  const [isEditing, setIsEditing] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

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
              if (parsed.details.goal) setHealthGoal(parsed.details.goal);
            }
          }
        } else {
          const savedRole = sessionStorage.getItem("zeze_selected_role");
          if (savedRole === "trainee" || savedRole === "patient" || savedRole === "clinician") {
            setRole(savedRole);
          }
          const savedProfile = sessionStorage.getItem("zeze_profile");
          if (savedProfile) {
            const parsed = JSON.parse(savedProfile);
            if (parsed.name) setName(parsed.name);
          }
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const handleSaveProfile = () => {
    const updatedUser = {
      name,
      role,
      email,
      authMethod,
      details:
        role === "clinician"
          ? { specialty, hospital, licenseNumber }
          : role === "trainee"
          ? { medicalSchool, trainingLevel, academicFocus }
          : { age: patientAge, sex: patientSex, goal: healthGoal },
      updatedAt: new Date().toISOString(),
    };

    if (typeof window !== "undefined") {
      sessionStorage.setItem("zeze_user", JSON.stringify(updatedUser));
      sessionStorage.setItem("zeze_profile", JSON.stringify({ name, role }));
      sessionStorage.setItem("zeze_selected_role", role);
    }

    setIsEditing(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  const roleMeta = {
    clinician: {
      title: "Clinician / Doctor",
      badge: "Clinical Decision Support",
      icon: Stethoscope,
      accentBg: "#2563eb",
      badgeClass: "bg-blue-100 text-blue-900 border-blue-200",
      description: "Full clinical report analysis, calibrated ACC/AHA risk staging, and differential diagnosis.",
    },
    trainee: {
      title: "Healthcare Trainee / Student",
      badge: "Supervised Learning",
      icon: GraduationCap,
      accentBg: "#7c3aed",
      badgeClass: "bg-purple-100 text-purple-900 border-purple-200",
      description: "Supervised learning interface, SHAP feature importance rationales, and hemodynamic mechanics.",
    },
    patient: {
      title: "Patient / General User",
      badge: "Personal Health Guidance",
      icon: User,
      accentBg: "#0d9488",
      badgeClass: "bg-teal-100 text-teal-900 border-teal-200",
      description: "Plain-language interpretations of cardiac vitals, lifestyle prevention roadmaps, and doctor discussion guides.",
    },
  }[role];

  const RoleIcon = roleMeta.icon;

  return (
    <main className="min-h-screen bg-[#edf3f9] relative pb-16 pt-4 sm:pt-6">
      <div className="max-w-[1640px] 2xl:max-w-[1720px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Signature Neumorphic Floating Pill Navbar */}
        <AppNavbar currentRole={role} pageType="profile" />

        {/* Inner Content Layout */}
        <div className="max-w-4xl mx-auto space-y-6 pt-2">
          {/* Breadcrumbs & Toast */}
          <div className="flex items-center justify-between">
            <Link
              href={`/assessment?role=${role}`}
              className="neu-button-secondary inline-flex items-center gap-2 px-4 py-2 text-slate-800 text-xs sm:text-sm font-black active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-slate-700" />
              <span>Back to Assessment Workspace</span>
            </Link>

            {saveToast && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-100 neu-inset border border-emerald-300 text-emerald-900 text-xs font-black animate-in fade-in duration-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Profile updated successfully!</span>
              </div>
            )}
          </div>

          {/* Main Neumorphic Card */}
          <div className="neu-card-glass p-6 sm:p-10 lg:p-12 space-y-6">
            {/* Watermark Persona Badge */}
            <div className="card-watermark-num select-none">
              {role === "clinician" ? "MD" : role === "trainee" ? "EDU" : "PT"}
            </div>

            {/* Profile Header Block */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-200/80">
              <div className="flex items-center gap-5">
                {/* 3D Carved Avatar Well */}
                <div
                  className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center text-white shadow-md shrink-0"
                  style={{ backgroundColor: roleMeta.accentBg }}
                >
                  <RoleIcon className="w-10 h-10 text-white" strokeWidth={2.4} />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h1 className="text-2xl sm:text-3xl font-black text-[#0a192f] tracking-tight">
                      {name}
                    </h1>
                    <span
                      className={`px-3 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-wide border ${roleMeta.badgeClass}`}
                    >
                      {roleMeta.badge}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-slate-500 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-slate-400" />
                      {email}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Verified {authMethod === "google" ? "Google OAuth" : "Account"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Edit / Save Button */}
              <div className="shrink-0 w-full sm:w-auto">
                {isEditing ? (
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="neu-button-3d w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs sm:text-sm font-black uppercase tracking-wider"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Changes</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="neu-button-secondary w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 text-xs sm:text-sm font-black uppercase tracking-wider"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>
            </div>

            {/* Profile Fields Section with .neu-input */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-[#0a192f] tracking-tight">
                  {role === "clinician"
                    ? "Clinical Credentials & Affiliation"
                    : role === "trainee"
                    ? "Academic & Medical Training Details"
                    : "Personal Health Profile & Goals"}
                </h2>
                {isEditing && (
                  <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
                    Editing Mode Active
                  </span>
                )}
              </div>

              {/* Clinician Fields */}
              {role === "clinician" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Full Name &amp; Title
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="neu-input w-full px-4 py-3 rounded-xl text-sm font-bold text-slate-900 disabled:opacity-75 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Specialty / Department
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      className="neu-input w-full px-4 py-3 rounded-xl text-sm font-bold text-slate-900 disabled:opacity-75 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Hospital / Institution
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={hospital}
                      onChange={(e) => setHospital(e.target.value)}
                      className="neu-input w-full px-4 py-3 rounded-xl text-sm font-bold text-slate-900 disabled:opacity-75 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Medical License / NPI Number
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="neu-input w-full px-4 py-3 rounded-xl text-sm font-bold text-slate-900 disabled:opacity-75 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Trainee Fields */}
              {role === "trainee" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="neu-input w-full px-4 py-3 rounded-xl text-sm font-bold text-slate-900 disabled:opacity-75 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Medical School / University
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={medicalSchool}
                      onChange={(e) => setMedicalSchool(e.target.value)}
                      className="neu-input w-full px-4 py-3 rounded-xl text-sm font-bold text-slate-900 disabled:opacity-75 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Training Level
                    </label>
                    <select
                      disabled={!isEditing}
                      value={trainingLevel}
                      onChange={(e) => setTrainingLevel(e.target.value)}
                      className="neu-input w-full px-4 py-3 rounded-xl text-sm font-bold text-slate-900 disabled:opacity-75 transition-all"
                    >
                      <option value="Pre-Med / Undergraduate">Pre-Med / Undergraduate</option>
                      <option value="MS1-MS2 Pre-Clinical">MS1-MS2 Pre-Clinical</option>
                      <option value="MS3 - Clinical Rotations">MS3 - Clinical Rotations</option>
                      <option value="MS4 - Advanced Sub-Internship">MS4 - Advanced Sub-Internship</option>
                      <option value="Internal Medicine Resident">Internal Medicine Resident</option>
                      <option value="Cardiology Fellow">Cardiology Fellow</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Primary Academic Focus
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={academicFocus}
                      onChange={(e) => setAcademicFocus(e.target.value)}
                      className="neu-input w-full px-4 py-3 rounded-xl text-sm font-bold text-slate-900 disabled:opacity-75 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Patient Fields */}
              {role === "patient" && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Your Name or Preferred Alias
                    </label>
                    <input
                      type="text"
                      disabled={!isEditing}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="neu-input w-full px-4 py-3 rounded-xl text-sm font-bold text-slate-900 disabled:opacity-75 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                        Age (Years)
                      </label>
                      <input
                        type="number"
                        disabled={!isEditing}
                        value={patientAge}
                        onChange={(e) => setPatientAge(e.target.value)}
                        className="neu-input w-full px-4 py-3 rounded-xl text-sm font-bold text-slate-900 disabled:opacity-75 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                        Biological Sex
                      </label>
                      <select
                        disabled={!isEditing}
                        value={patientSex}
                        onChange={(e) => setPatientSex(e.target.value as "Male" | "Female")}
                        className="neu-input w-full px-4 py-3 rounded-xl text-sm font-bold text-slate-900 disabled:opacity-75 transition-all"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                      Primary Health Goal
                    </label>
                    <select
                      disabled={!isEditing}
                      value={healthGoal}
                      onChange={(e) => setHealthGoal(e.target.value)}
                      className="neu-input w-full px-4 py-3 rounded-xl text-sm font-bold text-slate-900 disabled:opacity-75 transition-all"
                    >
                      <option value="Routine Cardiovascular Assessment">Routine Cardiovascular Assessment</option>
                      <option value="Monitoring Blood Pressure Trends">Monitoring Blood Pressure Trends</option>
                      <option value="Diet & Physical Activity Advice">Diet &amp; Physical Activity Advice</option>
                      <option value="Family History Risk Check">Family History Risk Check</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Action Footer */}
            <div className="pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <Activity className="w-4 h-4 text-blue-700 shrink-0" />
                <span>All risk metrics and reports are calibrated to this persona.</span>
              </div>

              <Link
                href={`/assessment?role=${role}`}
                className="neu-button-3d w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider"
              >
                <span>Launch Assessment Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
