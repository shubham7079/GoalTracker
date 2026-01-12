import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import { GoogleGenAI } from "@google/genai";

const Home: React.FC = () => {
  const { auth } = useAuth();
  const [simStreak, setSimStreak] = useState(0);
  const [simLevel, setSimLevel] = useState(1);
  const [isPopping, setIsPopping] = useState(false);
  const [showCombo, setShowCombo] = useState(false);
  const [dailySpark, setDailySpark] = useState<string | null>(null);
  const [isSparkLoading, setIsSparkLoading] = useState(false);

  // Simulated live feed data
  const feedItems = [
    { id: 1, user: "Aman.", action: "reached Level 5 in Fitness", time: "2m ago", icon: "🔥" },
    { id: 2, user: "Sarah K.", action: "started a 10-day streak in Learning", time: "5m ago", icon: "📚" },
    { id: 3, user: "Neha P.", action: "completed 'Morning Meditate'", time: "12m ago", icon: "🧘" },
    { id: 4, user: "Ranveer L.", action: "leveled up to Master in Work", time: "20m ago", icon: "⚡" },
  ];

  const handleSimulate = () => {
    const nextStreak = simStreak + 1;
    setSimStreak(nextStreak);
    setIsPopping(true);
    setShowCombo(true);
    
    if (nextStreak > 0 && nextStreak % 7 === 0) {
      setSimLevel(prev => prev + 1);
    }
    
    setTimeout(() => setIsPopping(false), 300);
    setTimeout(() => setShowCombo(false), 800);
  };

  const getDailySpark = async () => {
    setIsSparkLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: "Suggest one unique, specific daily habit or goal for someone looking to level up their life. Keep it under 12 words and make it punchy.",
      });
      setDailySpark(response.text?.trim() || "Drink 2L of water and track your energy.");
    } catch (err) {
      setDailySpark("Wake up 15 minutes earlier and stretch.");
    } finally {
      setIsSparkLoading(false);
    }
  };

  useEffect(() => {
    getDailySpark();
  }, []);

  return (
    <div className="space-y-20 pb-20 overflow-x-hidden">
      {/* Dynamic Hero Section */}
      <section className="relative pt-12 text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-primary-500/10 blur-[120px] rounded-full -z-10"></div>
        
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm text-primary-600 dark:text-primary-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
          </span>
          Live Productivity Ecosystem
        </div>

        {auth.isAuthenticated ? (
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-none">
              Welcome Back,<br />
              <span className="bg-gradient-to-r from-primary-600 to-indigo-500 bg-clip-text text-transparent">{auth.user?.name.split(' ')[0]}</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium">
              Ready to crush today? You've simulated {simStreak} wins. <br className="hidden md:block"/> Let's make the real ones count on your dashboard.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link to="/dashboard" className="px-10 py-5 bg-primary-600 text-white font-black rounded-3xl shadow-2xl shadow-primary-500/30 hover:scale-105 active:scale-95 transition-all text-lg flex items-center justify-center gap-3">
                Go to Dashboard
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
              <Link to="/profile" className="px-10 py-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black rounded-3xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-lg">
                View Profile
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h1 className="text-6xl md:text-8xl font-black tracking-tight text-slate-900 dark:text-white max-w-5xl mx-auto leading-[0.9]">
              Turn Habits Into <br />
              <span className="bg-gradient-to-r from-primary-600 via-primary-400 to-indigo-500 bg-clip-text text-transparent">Legendary Streaks.</span>
            </h1>
            <p className="text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
              Experience a gamified tracker that uses AI to architect your perfect daily routine and keep you focused.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
              <Link to="/register" className="px-10 py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-3xl shadow-2xl hover:scale-105 active:scale-95 transition-all text-lg flex items-center justify-center gap-3">
                Start Your Journey
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
              </Link>
              <button onClick={handleSimulate} className="px-10 py-5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-black rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-primary-500 transition-all text-lg">
                Try Simulator
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Feature Grid: AI Spark & Simulation */}
      <section className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Col: AI Daily Spark */}
        <div className="lg:col-span-5">
          <div className="p-8 md:p-10 bg-gradient-to-br from-indigo-600 to-primary-600 rounded-[3rem] text-white shadow-2xl relative overflow-hidden h-full flex flex-col justify-between group">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-2xl group-hover:animate-bounce">✨</span>
                <h3 className="text-[10px] font-black uppercase tracking-widest opacity-80">AI Daily Spark</h3>
              </div>
              <h2 className="text-3xl font-black leading-tight mb-4">
                {isSparkLoading ? "Architecting greatness..." : dailySpark || "Ready for your next challenge?"}
              </h2>
              <p className="text-white/70 text-sm font-medium">Unique habits suggested by Gemini AI to push your limits today.</p>
            </div>
            
            <button 
              onClick={getDailySpark}
              disabled={isSparkLoading}
              className="relative z-10 mt-8 w-full py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all disabled:opacity-50"
            >
              {isSparkLoading ? "Thinking..." : "Generate New Spark"}
            </button>

            <div className="absolute -bottom-10 -right-10 text-white/10 rotate-12 pointer-events-none transition-transform group-hover:scale-110">
              <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14H11V21L20 10H13Z" /></svg>
            </div>
          </div>
        </div>

        {/* Right Col: Mechanics & Simulator */}
        <div className="lg:col-span-7">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 md:p-10 border border-slate-200 dark:border-slate-800 shadow-xl h-full">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Game Progress</h3>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className={`text-4xl font-black ${isPopping ? 'text-primary-500 scale-110' : 'text-slate-900 dark:text-white'} transition-all`}>
                    {simStreak}
                  </div>
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Wins</div>
                </div>
                <div className="w-px h-8 bg-slate-100 dark:bg-slate-800"></div>
                <div className="text-center">
                  <div className="text-4xl font-black text-primary-500">Lv.{simLevel}</div>
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Rank</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-slate-50 dark:bg-slate-950 rounded-3xl border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Simulation Mastery</span>
                  <span className="text-xs font-black text-primary-600">{simStreak % 7}/7 to Level Up</span>
                </div>
                <div className="h-4 w-full bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 overflow-hidden p-1">
                  <div 
                    className="h-full bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${((simStreak % 7) || (simStreak > 0 ? 7 : 0)) / 7 * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {[...Array(7)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`aspect-square rounded-xl border-2 transition-all duration-500 ${
                      (i < (simStreak % 7)) || (simStreak > 0 && simStreak % 7 === 0)
                        ? 'bg-primary-500 border-primary-500 shadow-lg shadow-primary-500/20' 
                        : 'bg-transparent border-slate-100 dark:border-slate-800'
                    }`}
                  ></div>
                ))}
              </div>

              <button 
                onClick={handleSimulate}
                className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-3xl transition-all shadow-xl hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 relative overflow-hidden group"
              >
                <span className="text-xl group-hover:animate-bounce">🔥</span>
                <span>Simulate Completion</span>
                {showCombo && (
                   <span className="absolute right-8 top-1/2 -translate-y-1/2 bg-primary-600 text-white text-[10px] px-3 py-1 rounded-full animate-ping">+1</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Community Activity Feed */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Live Community Pulse</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Activity from fellow GoalTrackers around the globe.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {feedItems.map(item => (
            <div key={item.id} className="p-6 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group cursor-default">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-10 h-10 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center text-xl group-hover:rotate-12 transition-transform">
                  {item.icon}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">{item.user}</h4>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{item.time}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {item.action}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action for Guests */}
      {!auth.isAuthenticated && (
        <section className="bg-slate-900 dark:bg-slate-900 rounded-[4rem] mx-4 py-24 px-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-900/30 via-transparent to-transparent opacity-50"></div>
          
          <div className="max-w-4xl mx-auto relative z-10 space-y-12">
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight">
              Don't Just Track. <br />
              <span className="text-primary-400">Level Up Your Existence.</span>
            </h2>
            <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto">
              Join the elite productivity ecosystem and start building a life you're proud of, one streak at a time.
            </p>
            <div className="pt-8">
              <Link to="/register" className="inline-flex px-12 py-5 bg-white text-slate-900 font-black rounded-3xl text-xl hover:scale-105 active:scale-95 transition-all shadow-2xl">
                Get Started for Free
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;