import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Toaster, toast } from 'sonner';

// ... (Supabase config remains same)
// Supabase Configuration (Env vars or placeholders)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "YOUR_SUPABASE_URL";
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || "YOUR_SUPABASE_KEY";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function App() {
  // ... (State remains same)
  const [minSalary, setMinSalary] = useState(2500);
  const [currency, setCurrency] = useState('USD');
  const [searchQuery, setSearchQuery] = useState("");
  const [applicationCount, setApplicationCount] = useState(0);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);

  // ... (Matches state remains same)
  const [matches, setMatches] = useState([
    {
      title: "Senior UX Designer",
      company: "Somewhere.com",
      salary: "$4,000 - $6,000 / month",
      contract: "6 Months",
      match_score: 95,
      reason: "Matches your experience in fintech",
      apply_url: "https://somewhere.com/jobs/apply?slug=17484142712420072484oBV"
    },
    {
      title: "Frontend Developer",
      company: "Somewhere.com",
      salary: "$4,000 - $6,000 / month",
      contract: "6 Months",
      match_score: 92,
      reason: "Strong proficiency in React",
      apply_url: "https://somewhere.com/jobs/apply?slug=17704032787810075711wAl"
    }
  ]);

  const API_URL = '/api';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
        toast.success("Welcome back to Somewhere Scout!");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId) => {
    const { data } = await supabase.from('profiles').select('application_count').eq('id', userId).single();
    if (data) setApplicationCount(data.application_count || 0);
  }

  const handleLogin = async () => {
    const email = prompt("Enter your email for magic link:");
    if (email) {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) toast.error(error.message);
      else toast.success("Magic link sent! Check your email.");
    }
  }

  // ... (handleScout remains same)
  const handleScout = async () => {
    setLoading(true);
    try {
      // ... fetch logic
      const response = await fetch(`${API_URL}/scout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          min_salary: minSalary,
          query: searchQuery,
          currency: currency
        })
      });
      const data = await response.json();
      setMatches(data.matches);
      toast.success(`Scouted ${data.matches.length} new opportunities!`);
    } catch (error) {
      console.error("Error scouting jobs:", error);
      toast.error("Failed to scout jobs. Check backend.");
    }
    setLoading(false);
  };

  const handleApply = async (url) => {
    window.open(url, '_blank');

    // Optimistic UI update
    setApplicationCount(prev => {
      const newCount = prev + 1;
      if (newCount === 3) toast.success("Agentic Mode Unlocked! 🚀");
      return newCount;
    });

    toast.info("Application tracked!");

    // Track in backend (Fire and forget)
    try {
      const formData = new FormData();
      formData.append('job_url', url);
      await fetch(`${API_URL}/track`, {
        method: 'POST',
        body: formData
      });

      if (session) {
        const { data } = await supabase.from('profiles').select('application_count').eq('id', session.user.id).single();
        const newCount = (data?.application_count || 0) + 1;
        await supabase.from('profiles').update({ application_count: newCount }).eq('id', session.user.id);
      }
    } catch (e) {
      console.error("Tracking failed", e);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const loadToast = toast.loading("Analyzing CV...");

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      toast.dismiss(loadToast);
      toast.success(data.message);
    } catch (error) {
      toast.dismiss(loadToast);
      console.error("Error uploading CV:", error);
      toast.error("Failed to upload CV.");
    }
  };

  const currencySymbol = currency === 'USD' ? '$' : '€';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white p-4 md:p-8">
      <Toaster position="top-right" richColors />
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">

        {/* Sidebar */}
        <aside className="w-full md:w-80 space-y-6">
          <div className="glass-light dark:glass-dark p-6 rounded-2xl relative">
            <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-slate-400">Your Profile</h2>

            {!session ? (
              <button
                onClick={handleLogin}
                className="w-full mb-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors"
              >
                Login / Sign Up
              </button>
            ) : (
              <div className="mb-4 text-xs font-medium text-emerald-500 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Logged in
              </div>
            )}

            <label className="w-full cursor-pointer py-3 px-4 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 rounded-xl text-sm font-medium transition-colors mb-6 flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm">upload_file</span>
              Upload Master CV
              <input type="file" className="hidden" onChange={handleUpload} />
            </label>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase">
                <span>Profile Completion</span>
                <span>65%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[65%] rounded-full" style={{ backgroundColor: 'var(--primary)' }}></div>
              </div>
            </div>
          </div>

          <div className="glass-light dark:glass-dark p-6 rounded-2xl flex-grow">
            <h2 className="text-sm font-semibold mb-6 uppercase tracking-wider text-slate-400">Filters</h2>

            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <label className="text-sm font-medium">Monthly Salary ({currencySymbol})</label>
                <div className="flex bg-slate-200 dark:bg-white/5 rounded-lg p-1">
                  <button
                    onClick={() => setCurrency('USD')}
                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${currency === 'USD' ? 'bg-primary text-white shadow-sm' : 'text-slate-500'}`}
                  >USD</button>
                  <button
                    onClick={() => setCurrency('EUR')}
                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all ${currency === 'EUR' ? 'bg-primary text-white shadow-sm' : 'text-slate-500'}`}
                  >EUR</button>
                </div>
              </div>
              <div className="relative pt-6">
                <div className="absolute top-0 left-1/2 -translate-x-1/2">
                  <input
                    type="number"
                    value={minSalary}
                    onChange={(e) => setMinSalary(parseInt(e.target.value) || 0)}
                    className="w-24 text-center px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold shadow-sm focus:ring-2 focus:ring-primary outline-none transition-all"
                  />
                </div>
                <input
                  type="range"
                  min="30"
                  max="5000"
                  value={minSalary}
                  onChange={(e) => setMinSalary(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between mt-3 text-xs text-slate-400">
                  <span>{currencySymbol}30</span>
                  <span>{currencySymbol}5,000</span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium mb-2">Search Jobs</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. React, Design..."
                  className="w-full bg-slate-200 dark:bg-white/5 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-primary outline-none placeholder:text-slate-400"
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">search</span>
              </div>
            </div>

            <button
              onClick={handleScout}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-[#4913ec] text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98]"
            >
              Scout Jobs
            </button>
          </div>

          <div className="glass-light dark:glass-dark p-6 rounded-2xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Agentic Mode</h2>
              <span className="material-symbols-outlined text-sm text-primary">smart_toy</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
              Apply to 3 jobs to unlock automated agentic applications for Johannesburg, Manila, and EST timezones.
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase">
                <span>Unlock Progress</span>
                <span>{applicationCount}/3</span>
              </div>
              <div className="h-2 w-full bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 rounded-full"
                  style={{ width: `${(applicationCount / 3) * 100}%`, backgroundColor: applicationCount === 3 ? '#10b981' : 'var(--primary)' }}
                ></div>
              </div>
            </div>
            {applicationCount === 3 && (
              <button className="w-full mt-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">bolt</span>
                Enable Agentic Mode
              </button>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1">
          <header className="mb-8">
            <h2 className="text-3xl font-bold mb-1">Scouted Opportunities</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">{matches.length} Matches Found</p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {matches.map((job, index) => (
              <div key={index} className="glass-light dark:glass-dark p-6 rounded-2xl border border-primary/20 hover:border-primary/50 transition-all group hover:-translate-y-1">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">{job.title}</h3>
                    <p className="text-sm text-slate-400">{job.company}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold match-badge-glow">
                      {job.match_score}% Match
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      <span className="material-symbols-outlined text-[12px]">verified</span>
                      {job.reason}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <span className="material-symbols-outlined text-slate-400">payments</span>
                      {job.salary}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                      <span className="material-symbols-outlined text-slate-400">schedule</span>
                      {job.contract}
                    </div>
                  </div>

                  <button
                    onClick={() => handleApply(job.apply_url)}
                    className="w-full py-3 bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                  >
                    View & Apply
                    <span className="material-symbols-outlined text-xs">open_in_new</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>

      {/* External CSS for icons */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" />
    </div>
  );
}

export default App;
