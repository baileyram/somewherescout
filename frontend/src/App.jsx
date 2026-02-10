import React, { useState } from 'react';

function App() {
  const [minSalary, setMinSalary] = useState(2500);
  const [contractLength, setContractLength] = useState("6+ Months");
  const [matches, setMatches] = useState([
    {
      title: "Senior UX Designer",
      company: "Somewhere.com",
      salary: "$4,000 - $6,000 / month",
      contract: "6 Months",
      match_score: 95,
      reason: "Matches your experience in fintech"
    },
    {
      title: "Frontend Developer",
      company: "Somewhere.com",
      salary: "$4,000 - $6,000 / month",
      contract: "6 Months",
      match_score: 92,
      reason: "Strong proficiency in React"
    }
  ]);

  const API_URL = '/api';

  const handleScout = async () => {
    try {
      const response = await fetch(`${API_URL}/scout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ min_salary: minSalary, contract_length: contractLength })
      });
      const data = await response.json();
      setMatches(data.matches);
    } catch (error) {
      console.error("Error scouting jobs:", error);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      alert(data.message);
    } catch (error) {
      console.error("Error uploading CV:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">

        {/* Sidebar */}
        <aside className="w-full md:w-80 space-y-6">
          <div className="glass-light dark:glass-dark p-6 rounded-2xl">
            <h2 className="text-sm font-semibold mb-4 uppercase tracking-wider text-slate-400">Your Profile</h2>
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
              <label className="block text-sm font-medium mb-4">Minimum Monthly Salary ($)</label>
              <div className="relative pt-6">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 px-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold shadow-sm">
                  ${minSalary.toLocaleString()}
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
                  <span>$30</span>
                  <span>$5,000</span>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium mb-2">Minimum Contract Length</label>
              <div className="relative">
                <select
                  value={contractLength}
                  onChange={(e) => setContractLength(e.target.value)}
                  className="w-full bg-slate-200 dark:bg-white/5 border-none rounded-xl py-3 px-4 text-sm appearance-none focus:ring-2 focus:ring-primary"
                >
                  <option>6+ Months</option>
                  <option>12+ Months</option>
                  <option>Freelance / Project</option>
                </select>
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
              </div>
            </div>

            <button
              onClick={handleScout}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-[#4913ec] text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98]"
            >
              Scout Jobs
            </button>
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
              <div key={index} className="glass-light dark:glass-dark p-6 rounded-2xl border border-primary/20 hover:border-primary/50 transition-colors group">
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
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <span className="material-symbols-outlined text-slate-400">payments</span>
                    {job.salary}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                    <span className="material-symbols-outlined text-slate-400">schedule</span>
                    {job.contract}
                  </div>
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
