"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
  GraduationCap, Briefcase, Code2, Plus, Trash2, Target,
  User, FileText, Link2, Sparkles, CheckCircle2, XCircle,
  TrendingUp, Zap, Award
} from "lucide-react";

type Education = { institution: string; degree: string; field: string; startYear: string; endYear: string };
type Experience = { company: string; role: string; startDate: string; endDate: string; responsibilities: string };
type FormData = {
  fullName: string; dob: string;
  skills: { value: string }[];
  education: Education[];
  experience: Experience[];
  jobUrl: string; jobDescription: string;
};
type AnalysisResult = {
  score: number; matchedSkills: string[]; missingSkills: string[]; feedback: string;
};

export default function Home() {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);

  const { register, control, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      fullName: "", dob: "", skills: [{ value: "" }],
      education: [], experience: [], jobUrl: "", jobDescription: ""
    }
  });

  const { fields: skillFields, append: addSkill, remove: removeSkill } = useFieldArray({ control, name: "skills" });
  const { fields: eduFields, append: addEdu, remove: removeEdu } = useFieldArray({ control, name: "education" });
  const { fields: expFields, append: addExp, remove: removeExp } = useFieldArray({ control, name: "experience" });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setResult({
      score: 82,
      matchedSkills: data.skills.filter(s => s.value).map(s => s.value).slice(0, 5),
      missingSkills: ["Docker", "Kubernetes", "AWS"],
      feedback: "Excellent candidate profile! Your technical skills align strongly with the core requirements. Gaining cloud deployment experience would push your match above 95%."
    });
    setLoading(false);
    setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #0a0a1a 0%, #0d0d2b 40%, #0a0f1e 100%)" }}>

      {/* Ambient background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #6d28d9, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #2563eb, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #7c3aed, transparent 70%)", filter: "blur(80px)" }} />
      </div>

      {/* Header */}
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

        {/* Hero text */}
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

            {/* LEFT: Candidate Info */}
            <div className="space-y-5">
              <SectionLabel icon={<User className="w-4 h-4" />} title="Candidate Information" />

              {/* Personal Info */}
              <GlassCard>
                <CardTitle icon={<User className="w-4 h-4" />} title="Personal Information" />
                <div className="space-y-4 mt-5">
                  <DarkInput label="Full Name" required placeholder="John Doe" register={register("fullName", { required: true })} error={!!errors.fullName} />
                  <DarkInput label="Date of Birth" type="date" register={register("dob")} />
                </div>
              </GlassCard>

              {/* Skills */}
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

              {/* Education */}
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

              {/* Experience */}
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
                        <DarkInput label="Start Date" placeholder="Jan 2022" register={register(`experience.${i}.startDate`)} />
                        <DarkInput label="End Date" placeholder="Present" register={register(`experience.${i}.endDate`)} />
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

            {/* RIGHT: Job Description */}
            <div className="space-y-5">
              <SectionLabel icon={<TrendingUp className="w-4 h-4" />} title="Job Description" />
              <GlassCard className="lg:sticky lg:top-24">
                <CardTitle icon={<Link2 className="w-4 h-4" />} title="Job URL" />
                <input {...register("jobUrl")} placeholder="https://example.com/job/12345"
                  className="w-full mt-3 px-4 py-3 rounded-xl border text-sm outline-none transition"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "#e2e8f0" }}
                  onFocus={e => { e.target.style.borderColor = "rgba(124,58,237,0.6)"; e.target.style.background = "rgba(124,58,237,0.08)"; }}
                  onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.05)"; }} />

                <div className="mt-6">
                  <CardTitle icon={<FileText className="w-4 h-4" />} title="Job Description" required />
                  <textarea {...register("jobDescription", { required: true })} rows={14}
                    placeholder="Paste the full job description here — requirements, responsibilities, skills, working conditions..."
                    className="w-full mt-3 px-4 py-3 rounded-xl border text-sm resize-none outline-none transition"
                    style={{ background: "rgba(255,255,255,0.05)", borderColor: errors.jobDescription ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)", color: "#e2e8f0" }}
                    onFocus={e => { e.target.style.borderColor = "rgba(124,58,237,0.6)"; e.target.style.background = "rgba(124,58,237,0.08)"; }}
                    onBlur={e => { e.target.style.borderColor = "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.05)"; }} />
                  {errors.jobDescription && <p className="text-red-400 text-xs mt-1">Job description is required</p>}
                  <p className="text-xs mt-2" style={{ color: "#4a5380" }}>💡 The more detailed the description, the more accurate the analysis</p>
                </div>

                {/* Stats bar */}
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

          {/* Submit Button */}
          <div className="flex justify-center mt-12">
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

        {/* Results */}
        {result && (
          <div id="results" className="mt-16">
            <SectionLabel icon={<Award className="w-4 h-4" />} title="Your Compatibility Results" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5">

              {/* Score */}
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
                <div className="mt-4 px-4 py-2 rounded-full text-xs font-medium"
                  style={{ background: "rgba(16,185,129,0.15)", color: "#34d399", border: "1px solid rgba(16,185,129,0.3)" }}>
                  Strong Match 🎉
                </div>
              </GlassCard>

              {/* Skills */}
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
                    {result.missingSkills.map(s => (
                      <span key={s} className="px-3 py-1 rounded-full text-xs font-medium border"
                        style={{ background: "rgba(239,68,68,0.1)", color: "#f87171", borderColor: "rgba(239,68,68,0.25)" }}>✕ {s}</span>
                    ))}
                  </div>
                </div>
              </GlassCard>

              {/* Feedback */}
              <GlassCard className="flex flex-col">
                <CardTitle icon={<Sparkles className="w-4 h-4" />} title="AI Feedback" />
                <p className="text-sm mt-3 leading-relaxed" style={{ color: "#94a3b8" }}>{result.feedback}</p>
                <div className="mt-auto pt-4">
                  <div className="p-4 rounded-xl border"
                    style={{ background: "rgba(124,58,237,0.1)", borderColor: "rgba(124,58,237,0.25)" }}>
                    <p className="text-xs leading-relaxed" style={{ color: "#a78bfa" }}>
                      💡 <strong>Pro Tip:</strong> Adding Docker, Kubernetes & AWS to your profile could boost your score to ~95%
                    </p>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-20 border-t py-6 text-center"
        style={{ borderColor: "rgba(124,58,237,0.15)", color: "#4a5380" }}>
        <p className="text-xs">Job Match Analyzer · Powered by AI · Built with Next.js</p>
      </footer>
    </div>
  );
}

// ── Reusable Components ──────────────────────────────────────────────────────

function GlassCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-6 border ${className}`}
      style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", borderColor: "rgba(255,255,255,0.08)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}>
      {children}
    </div>
  );
}

function SectionLabel({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <span style={{ color: "#a78bfa" }}>{icon}</span>
      <span className="text-sm font-bold text-white tracking-wide uppercase" style={{ letterSpacing: "0.08em" }}>{title}</span>
    </div>
  );
}

function CardTitle({ icon, title, required = false }: { icon: React.ReactNode; title: string; required?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span style={{ color: "#7c3aed" }}>{icon}</span>
      <span className="text-sm font-semibold text-white">{title}</span>
      {required && <span style={{ color: "#a78bfa" }} className="text-sm">*</span>}
    </div>
  );
}

function GlowButton({ children, onClick, type = "button" }: { children: React.ReactNode; onClick?: () => void; type?: "button" | "submit" }) {
  return (
    <button type={type} onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105"
      style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)", boxShadow: "0 0 16px rgba(124,58,237,0.35)" }}>
      {children}
    </button>
  );
}

function DarkInput({ label, placeholder, register, required = false, type = "text", error = false }:
  { label?: string; placeholder?: string; register: any; required?: boolean; type?: string; error?: boolean }) {
  return (
    <div>
      {label && (
        <label className="text-xs font-medium mb-1.5 block" style={{ color: "#6d7aad" }}>
          {label}{required && <span style={{ color: "#a78bfa" }}> *</span>}
        </label>
      )}
      <input {...register} type={type} placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none transition"
        style={{ background: "rgba(255,255,255,0.05)", borderColor: error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)", color: "#e2e8f0" }}
        onFocus={(e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = "rgba(124,58,237,0.6)"; e.target.style.background = "rgba(124,58,237,0.08)"; }}
        onBlur={(e: React.FocusEvent<HTMLInputElement>) => { e.target.style.borderColor = error ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"; e.target.style.background = "rgba(255,255,255,0.05)"; }} />
    </div>
  );
}