"use client";

import { useState } from "react";
import { useForm, useFieldArray, type UseFormRegisterReturn } from "react-hook-form";
import {
  GraduationCap, Briefcase, Code2, Plus, Trash2, Target,
  User, FileText, Sparkles, CheckCircle2, XCircle,
  TrendingUp, Zap, Award
} from "lucide-react";

// Shape of one education item in the form.
type Education = {
  institution: string;
  degree: string;
  field: string;
  startYear: string;
  endYear: string;
};

// Shape of one work experience item in the form.
type Experience = {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  responsibilities: string;
};

// Full form data model used by react-hook-form.
type FormData = {
  fullName: string;
  dob: string;
  skills: { value: string }[];
  education: Education[];
  experience: Experience[];
  jobDescription: string;
};

// Result model displayed in the result cards after backend analysis.
type AnalysisResult = {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  feedback: string;
};

// Spring Boot backend URL.
const API_URL = "https://offerfit-backend.azurewebsites.net/";

export default function Home() {
  // YYYY-MM-DD format is required for <input type="date" /> max validation.
  const today = new Date().toISOString().split("T")[0];

  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // react-hook-form controls all inputs and dynamic field arrays.
  const { register, control, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      fullName: "",
      dob: "",
      skills: [{ value: "" }],
      education: [],
      experience: [],
      jobDescription: ""
    }
  });

  // Dynamic arrays for skills, education, and experience sections.
  const { fields: skillFields, append: addSkill, remove: removeSkill } = useFieldArray({ control, name: "skills" });
  const { fields: eduFields, append: addEdu, remove: removeEdu } = useFieldArray({ control, name: "education" });
  const { fields: expFields, append: addExp, remove: removeExp } = useFieldArray({ control, name: "experience" });

  // Converts numeric score into a human-readable label and matching visual style.
  const getScoreLabel = (score: number) => {
    if (score >= 80) {
      return {
        text: "Strong Match 🎉",
        color: "#34d399",
        bg: "rgba(16,185,129,0.15)",
        border: "rgba(16,185,129,0.3)"
      };
    }

    if (score >= 60) {
      return {
        text: "Good Match 👍",
        color: "#60a5fa",
        bg: "rgba(96,165,250,0.15)",
        border: "rgba(96,165,250,0.3)"
      };
    }

    if (score >= 40) {
      return {
        text: "Partial Match ⚠️",
        color: "#fbbf24",
        bg: "rgba(251,191,36,0.15)",
        border: "rgba(251,191,36,0.3)"
      };
    }

    return {
      text: "Weak Match ❌",
      color: "#f87171",
      bg: "rgba(248,113,113,0.15)",
      border: "rgba(248,113,113,0.3)"
    };
  };

  // Calculates total years of experience from all experience entries.
  // Empty end date means the user currently works there, so it uses today's date.
  const calculateExperienceYears = (experience: Experience[]) => {
    if (!experience || experience.length === 0) return 0;

    const todayDate = new Date();

    // Converts a string date into a Date object and safely handles invalid values.
    const normalizeDate = (value: string) => {
      if (!value) return null;
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? null : new Date(parsed);
    };

    const dates = experience
      .map((entry) => {
        const start = normalizeDate(entry.startDate);
        const rawEnd = normalizeDate(entry.endDate) || todayDate;

        // Protects the calculation from accidentally using future dates.
        const end = rawEnd > todayDate ? todayDate : rawEnd;
        return { start, end };
      })
      // Type guard: after this filter, TypeScript knows start is not null.
      .filter((item): item is { start: Date; end: Date } => item.start !== null);

    if (dates.length === 0) return 0;

    const years = dates
      .map(({ start, end }) => {
        const diff = end.getTime() - start.getTime();
        return diff > 0 ? diff / (1000 * 60 * 60 * 24 * 365.25) : 0;
      })
      .reduce((sum, value) => sum + value, 0);

    // Keeps one decimal place, for example 2.4 years.
    return Math.round(years * 10) / 10;
  };

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setFormError(null);

    // Removes empty skill chips before sending data to the backend.
    const filledSkills = data.skills.map((s) => s.value.trim()).filter(Boolean);

    // Frontend protection: date of birth cannot be in the future.
    if (data.dob && data.dob > today) {
      setFormError("Date of birth cannot be in the future.");
      setLoading(false);
      return;
    }

    // Checks every experience record for invalid future dates or reversed date ranges.
    const invalidExperience = data.experience.find((entry) => {
      if (entry.startDate && entry.startDate >= today) return true;
      if (entry.endDate && entry.endDate >= today) return true;
      if (entry.startDate && entry.endDate && entry.startDate > entry.endDate) return true;
      return false;
    });

    if (invalidExperience) {
      setFormError("Experience dates are invalid. Start date and end date cannot be in the future, and start date must be before end date.");
      setLoading(false);
      return;
    }

    if (filledSkills.length === 0) {
      setFormError("Please add at least one skill before running the analysis.");
      setLoading(false);
      return;
    }

    // Extracts the most useful requirement-like lines from a pasted job description.
    const extractJobRequirements = (description: string) => {
      const text = description.trim();
      if (!text) {
        return filledSkills;
      }

      // Splits pasted text into clean non-empty lines.
      const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      if (lines.length > 0) {
        // Keeps lines that look like requirements, responsibilities, skills, or experience.
        const requirementLines = lines.filter((line) =>
          /requirement|responsibilit|must|should|experience|skill|knowledge|accounting|finance/i.test(line)
        );

        // Sends only the first 8 useful lines to keep the backend prompt smaller.
        return requirementLines.length > 0
          ? requirementLines.slice(0, 8)
          : lines.slice(0, Math.min(lines.length, 8));
      }

      // Fallback for single-paragraph job descriptions.
      const sentences = text.split(/[.?!]/).map((sentence) => sentence.trim()).filter(Boolean);
      return sentences.length > 0 ? sentences.slice(0, Math.min(sentences.length, 8)) : [text];
    };

    const jobRequirements = extractJobRequirements(data.jobDescription);

    // Builds keyword list from job requirements and candidate skills, removing duplicates with Set.
    const jobKeywords = Array.from(new Set([
      ...jobRequirements.flatMap((item) => item.split(/[,;:\-]/).map((token) => token.trim()).filter(Boolean)),
      ...filledSkills,
    ]));

    try {
      // Payload format expected by the Spring Boot matching endpoint.
      const payload = {
        jobTitle: data.jobDescription.split("\n")[0].trim() || "General Position",
        jobRequirements,
        jobDescription: data.jobDescription,
        jobKeywords,
        candidateName: data.fullName || "Candidate",
        candidateSkills: filledSkills,
        candidateExperience: data.experience
          .map((entry) => [entry.role, entry.company, entry.startDate, entry.endDate, entry.responsibilities].filter(Boolean).join(" | "))
          .filter(Boolean)
          .join("; "),
        candidateExperienceYears: calculateExperienceYears(data.experience),
        candidateEducation: data.education
          .map((entry) => [entry.degree, entry.field, entry.institution, entry.startYear, entry.endYear].filter(Boolean).join(" | "))
          .filter(Boolean)
          .join("; "),
        candidateCertifications: [],
        candidateKeywords: filledSkills,
      };

      const response = await fetch(`${API_URL}/api/v1/matching/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Backend request failed with status ${response.status}`);
      }

      const backendResult = await response.json();

      // Backend may return duplicate matches, so Set keeps each requirement only once.
      const matchedSkills = [...new Set<string>(
        backendResult.aiAnalysis?.matches?.map((item: { requirement: string }) => item.requirement) || []
      )];

      const missingSkills = [...new Set<string>(
        backendResult.aiAnalysis?.missingRequirements || []
      )];

      setResult({
        score: Math.round((backendResult.finalScore ?? 0) * 100),
        matchedSkills,
        missingSkills,
        feedback: backendResult.aiAnalysis?.summary || backendResult.recommendation || "Analysis completed.",
      });
    } catch (error) {
      console.error(error);

      // Show backend/API errors in the result card instead of crashing the page.
      setResult({
        score: 0,
        matchedSkills: [],
        missingSkills: [],
        feedback: error instanceof Error ? error.message : "Failed to analyze candidate",
      });
    } finally {
      setLoading(false);

      // Small delay allows the results block to render before scrolling to it.
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #0d0d2b 40%, #0a0f1e 100%)" }}>
      {/* Decorative blurred background lights. */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #6d28d9, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #2563eb, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      <header className="relative z-50 border-b sticky top-0"
        style={{ background: "rgba(10,10,26,0.8)", backdropFilter: "blur(20px)", borderColor: "rgba(109,40,217,0.2)" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)", boxShadow: "0 0 20px rgba(124,58,237,0.4)" }}>
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Job Match Analyzer</h1>
            <p className="text-xs" style={{ color: "#6d7aad" }}>AI-powered candidate & vacancy compatibility</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-medium" style={{ color: "#a78bfa" }}>ATS Engine Active</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-4 border"
            style={{ background: "rgba(124,58,237,0.1)", borderColor: "rgba(124,58,237,0.3)" }}>
            <Zap className="w-3.5 h-3.5" style={{ color: "#a78bfa" }} />
            <span className="text-xs font-medium" style={{ color: "#a78bfa" }}>Powered by AI · Instant Analysis</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-3">
            Find Your Perfect <span style={{ background: "linear-gradient(90deg, #a78bfa, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Job Match</span>
          </h2>
          <p className="text-base" style={{ color: "#6d7aad" }}>Fill in your profile and paste a job description to get your ATS compatibility score</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-5">
              <SectionLabel icon={<User className="w-4 h-4" />} title="Candidate Information" />

              <GlassCard>
                <CardTitle icon={<User className="w-4 h-4" />} title="Personal Information" />
                <div className="space-y-4 mt-5">
                  <DarkInput label="Full Name" required placeholder="John Doe" register={register("fullName", { required: true })} error={!!errors.fullName} />
                  <DarkInput label="Date of Birth" type="date" max={today} register={register("dob", { max: today })} />
                </div>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center justify-between">
                  <CardTitle icon={<Code2 className="w-4 h-4" />} title="Skills" required />
                  <GlowButton type="button" onClick={() => addSkill({ value: "" })}>
                    <Plus className="w-3.5 h-3.5" /> Add Skill
                  </GlowButton>
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  {skillFields.map((field, i) => (
                    <div key={field.id} className="flex items-center gap-1 rounded-full px-1 py-1 border"
                      style={{ background: "rgba(124,58,237,0.15)", borderColor: "rgba(124,58,237,0.35)" }}>
                      <input {...register(`skills.${i}.value`)} placeholder="Skill"
                        className="bg-transparent text-sm outline-none w-20 px-2"
                        style={{ color: "#c4b5fd" }} />
                      <button type="button" onClick={() => removeSkill(i)}
                        className="transition hover:scale-110" style={{ color: "#7c3aed" }}>
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  {skillFields.length === 0 && <p className="text-sm" style={{ color: "#4a5380" }}>No skills added yet.</p>}
                </div>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center justify-between">
                  <CardTitle icon={<GraduationCap className="w-4 h-4" />} title="Education" />
                  <GlowButton type="button" onClick={() => addEdu({ institution: "", degree: "", field: "", startYear: "", endYear: "" })}>
                    <Plus className="w-3.5 h-3.5" /> Add Education
                  </GlowButton>
                </div>
                {eduFields.length === 0 && <p className="text-sm mt-4" style={{ color: "#4a5380" }}>No education added yet.</p>}
                <div className="space-y-4 mt-4">
                  {eduFields.map((field, i) => (
                    <div key={field.id} className="rounded-xl p-4 border relative space-y-3"
                      style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
                      <button type="button" onClick={() => removeEdu(i)} className="absolute top-3 right-3 transition hover:text-red-400" style={{ color: "#4a5380" }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-2 gap-3">
                        <DarkInput label="Institution" placeholder="MIT" register={register(`education.${i}.institution`)} />
                        <DarkInput label="Degree" placeholder="Bachelor's" register={register(`education.${i}.degree`)} />
                        <DarkInput label="Field of Study" placeholder="Computer Science" register={register(`education.${i}.field`)} />
                        <div className="grid grid-cols-2 gap-2">
                          <DarkInput label="From" placeholder="2020" register={register(`education.${i}.startYear`)} />
                          <DarkInput label="To" placeholder="2024" register={register(`education.${i}.endYear`)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center justify-between">
                  <CardTitle icon={<Briefcase className="w-4 h-4" />} title="Work Experience" />
                  <GlowButton type="button" onClick={() => addExp({ company: "", role: "", startDate: "", endDate: "", responsibilities: "" })}>
                    <Plus className="w-3.5 h-3.5" /> Add Experience
                  </GlowButton>
                </div>
                {expFields.length === 0 && <p className="text-sm mt-4" style={{ color: "#4a5380" }}>No experience added yet.</p>}
                <div className="space-y-4 mt-4">
                  {expFields.map((field, i) => (
                    <div key={field.id} className="rounded-xl p-4 border relative space-y-3"
                      style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
                      <button type="button" onClick={() => removeExp(i)} className="absolute top-3 right-3 transition hover:text-red-400" style={{ color: "#4a5380" }}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-2 gap-3">
                        <DarkInput label="Company" placeholder="Google" register={register(`experience.${i}.company`)} />
                        <DarkInput label="Role" placeholder="Software Engineer" register={register(`experience.${i}.role`)} />
                        <DarkInput label="Start Date" type="date" max={today} register={register(`experience.${i}.startDate`, { max: today })} />
                        <DarkInput label="End Date" type="date" max={today} register={register(`experience.${i}.endDate`, { max: today })} />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1.5 block" style={{ color: "#6d7aad" }}>Responsibilities & Achievements</label>
                        <textarea {...register(`experience.${i}.responsibilities`)} rows={3}
                          placeholder="Describe your key responsibilities..."
                          className="w-full px-3 py-2.5 rounded-xl border text-sm resize-none outline-none transition"
                          style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "#e2e8f0" }}
                          onFocus={e => { e.target.style.borderColor = "rgba(124,58,237,0.6)"; e.target.style.background = "rgba(124,58,237,0.08)"; }}
                          onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.05)"; }} />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>

            <div className="space-y-5">
              <SectionLabel icon={<TrendingUp className="w-4 h-4" />} title="Job Description" />
              <GlassCard className="lg:sticky lg:top-24">
                <CardTitle icon={<FileText className="w-4 h-4" />} title="Job Description" required />
                <textarea {...register("jobDescription", { required: true })} rows={17}
                  placeholder="Paste the full job description here — requirements, responsibilities, skills, working conditions..."
                  className="w-full mt-3 px-4 py-3 rounded-xl border text-sm resize-none outline-none transition"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: errors.jobDescription ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)", color: "#e2e8f0" }}
                  onFocus={e => { e.target.style.borderColor = "rgba(124,58,237,0.6)"; e.target.style.background = "rgba(124,58,237,0.08)"; }}
                  onBlur={e => { e.target.style.borderColor = errors.jobDescription ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.05)"; }} />
                {errors.jobDescription && <p className="text-red-400 text-xs mt-1">Job description is required</p>}

                <div className="mt-6 grid grid-cols-3 gap-3">
                  {[["⚡", "Instant", "Results"], ["🎯", "AI-Powered", "Analysis"], ["📊", "Detailed", "Breakdown"]].map(([icon, l1, l2]) => (
                    <div key={l1} className="rounded-xl p-3 text-center border"
                      style={{ background: "rgba(124,58,237,0.08)", borderColor: "rgba(124,58,237,0.2)" }}>
                      <div className="text-lg">{icon}</div>
                      <div className="text-xs font-semibold text-white mt-1">{l1}</div>
                      <div className="text-xs" style={{ color: "#6d7aad" }}>{l2}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </div>

          {formError && (
            <div className="mt-6 text-center text-sm text-red-300">
              {formError}
            </div>
          )}

          <div className="flex justify-center mt-4">
            <button type="submit" disabled={loading}
              className="relative flex items-center gap-3 px-12 py-4 rounded-2xl text-white font-bold text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed overflow-hidden group"
              style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)", boxShadow: "0 0 40px rgba(124,58,237,0.4), 0 8px 32px rgba(0,0,0,0.3)" }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: "linear-gradient(135deg, #6d28d9, #1d4ed8)" }} />
              <span className="relative flex items-center gap-3">
                {loading ? (
                  <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyzing your profile...</>
                ) : (
                  <><Sparkles className="w-5 h-5" /> Analyze Compatibility</>
                )}
              </span>
            </button>
          </div>
        </form>

        {result && (
          <div id="results" className="mt-16">
            <SectionLabel icon={<Award className="w-4 h-4" />} title="Your Compatibility Results" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5">
              <GlassCard className="flex flex-col items-center justify-center py-10">
                <div className="relative w-36 h-36">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(124,58,237,0.2)" strokeWidth="2.5" />
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="url(#scoreGrad)" strokeWidth="2.5"
                      strokeDasharray={`${result.score} ${100 - result.score}`} strokeLinecap="round" />
                    <defs>
                      <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#a78bfa" />
                        <stop offset="100%" stopColor="#60a5fa" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black" style={{ background: "linear-gradient(90deg,#a78bfa,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                      {result.score}%
                    </span>
                    <span className="text-xs mt-0.5" style={{ color: "#6d7aad" }}>Match Score</span>
                  </div>
                </div>
                <p className="mt-5 text-sm font-semibold text-white">Compatibility Score</p>
                <div className="w-full px-4 mt-3">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(124,58,237,0.2)" }}>
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${result.score}%`, background: "linear-gradient(90deg, #a78bfa, #60a5fa)" }} />
                  </div>
                </div>

                {(() => {
                  const label = getScoreLabel(result.score);
                  return (
                    <div className="mt-4 px-4 py-2 rounded-full text-xs font-medium"
                      style={{ background: label.bg, color: label.color, border: `1px solid ${label.border}` }}>
                      {label.text}
                    </div>
                  );
                })()}
              </GlassCard>

              <GlassCard>
                <CardTitle icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} title="Matched Skills" />
                <div className="flex flex-wrap gap-2 mt-3">
                  {result.matchedSkills.length > 0
                    ? result.matchedSkills.map(s => (
                      <span key={s} className="px-3 py-1 rounded-full text-xs font-medium border"
                        style={{ background: "rgba(16,185,129,0.12)", color: "#34d399", borderColor: "rgba(16,185,129,0.3)" }}>✓ {s}</span>
                    ))
                    : <p className="text-xs" style={{ color: "#4a5380" }}>Add skills to see matches</p>
                  }
                </div>
                <div className="mt-5">
                  <CardTitle icon={<XCircle className="w-4 h-4 text-red-400" />} title="Missing Skills" />
                  <div className="flex flex-wrap gap-2 mt-3">
                    {result.missingSkills.length > 0
                      ? result.missingSkills.map(s => (
                        <span key={s} className="px-3 py-1 rounded-full text-xs font-medium border"
                          style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", borderColor: "rgba(239,68,68,0.25)" }}>✕ {s}</span>
                      ))
                      : <p className="text-xs" style={{ color: "#4a5380" }}>No missing skills detected</p>
                    }
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="flex flex-col">
                <CardTitle icon={<Sparkles className="w-4 h-4" />} title="AI Feedback" />
                <p className="text-sm mt-3 leading-relaxed" style={{ color: "#94a3b8" }}>{result.feedback}</p>
              </GlassCard>
            </div>
          </div>
        )}
      </main>

      <footer className="relative z-10 mt-20 border-t py-6 text-center"
        style={{ borderColor: "rgba(124,58,237,0.15)", color: "#4a5380" }}>
        <p className="text-xs">Offer Fit</p>
      </footer>
    </div>
  );
}

// Reusable glass-style container used across cards.
function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-6 border ${className}`}
      style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", borderColor: "rgba(255,255,255,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
      {children}
    </div>
  );
}

// Small uppercase section heading with icon.
function SectionLabel({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span style={{ color: "#a78bfa" }}>{icon}</span>
      <span className="text-sm font-bold text-white tracking-wide uppercase" style={{ letterSpacing: "0.08em" }}>{title}</span>
    </div>
  );
}

// Card heading with optional required asterisk.
function CardTitle({ icon, title, required = false }: { icon: React.ReactNode; title: string; required?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: "#7c3aed" }}>{icon}</span>
      <span className="text-sm font-semibold text-white">{title}</span>
      {required && <span style={{ color: "#a78bfa" }} className="text-sm">*</span>}
    </div>
  );
}

// Purple-blue gradient button used for adding dynamic form rows.
function GlowButton({ children, onClick, type = "button" }: { children: React.ReactNode; onClick?: () => void; type?: "button" | "submit" }) {
  return (
    <button type={type} onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105"
      style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)", boxShadow: "0 0 16px rgba(124,58,237,0.35)" }}>
      {children}
    </button>
  );
}

// Shared input component. It supports text and date inputs, plus min/max for date validation.
function DarkInput({ label, placeholder, register, required = false, type = "text", error = false, max, min }:
  { label?: string; placeholder?: string; register: UseFormRegisterReturn<string>; required?: boolean; type?: string; error?: boolean; max?: string; min?: string }) {
  return (
    <div>
      {label && (
        <label className="text-xs font-medium mb-1.5 block" style={{ color: "#6d7aad" }}>
          {label}{required && <span style={{ color: "#a78bfa" }}> *</span>}
        </label>
      )}
      <input {...register} type={type} placeholder={placeholder} max={max} min={min}
        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition"
        style={{ background: "rgba(255,255,255,0.05)", borderColor: error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)", color: "#e2e8f0" }}
        onFocus={(e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "rgba(124,58,237,0.6)"; e.target.style.background = "rgba(124,58,237,0.08)"; }}
        onBlur={(e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.05)"; }} />
    </div>
  );
}
