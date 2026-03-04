'use client';

import { useState } from 'react';

type Task = {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  progress: number;
  status: 'pending' | 'in-progress' | 'completed';
};

const TASKS: Task[] = [
  { id: 1, title: 'Landing Page', description: 'Create landing page with info about the audio guide', startDate: '2026-01-19', endDate: '2026-02-01', progress: 100, status: 'completed' },
  { id: 2, title: 'Interactive Map', description: 'Add Mapbox map with Sofia landmarks', startDate: '2026-02-01', endDate: '2026-02-10', progress: 100, status: 'completed' },
  { id: 3, title: 'Audio Guide', description: 'Implement ElevenLabs TTS for each landmark', startDate: '2026-02-10', endDate: '2026-02-20', progress: 90, status: 'in-progress' },
  { id: 4, title: 'Chat Bot', description: 'Add AI chat feature powered by OpenAI', startDate: '2026-02-20', endDate: '2026-02-28', progress: 50, status: 'in-progress' },
  { id: 5, title: 'Fix Coordinates', description: 'Verify and fix GPS coordinates for all landmarks', startDate: '2026-02-25', endDate: '2026-02-27', progress: 100, status: 'completed' },
  { id: 6, title: 'Multi-language', description: 'Add Spanish, Italian, Greek, Turkish languages', startDate: '2026-03-01', endDate: '2026-03-15', progress: 0, status: 'pending' },
  { id: 7, title: 'User Auth', description: 'Add Supabase auth for user login', startDate: '2026-03-15', endDate: '2026-04-01', progress: 0, status: 'pending' },
  { id: 8, title: 'Payments', description: 'Add Stripe checkout for paid tours', startDate: '2026-04-01', endDate: '2026-04-15', progress: 0, status: 'pending' },
  { id: 9, title: 'Deploy', description: 'Deploy the app to production', startDate: '2026-04-15', endDate: '2026-04-20', progress: 0, status: 'pending' },
];

export default function MissionControl() {
  const [tasks, setTasks] = useState(TASKS);

  const completed = tasks.filter(t => t.status === 'completed').length;
  const inProgress = tasks.filter(t => t.status === 'in-progress').length;
  const overall = Math.round(tasks.reduce((a, t) => a + t.progress, 0) / tasks.length);

  const updateProgress = (id: number, progress: number) => {
    setTasks(tasks.map(t => t.id === id ? { 
      ...t, 
      progress, 
      status: progress === 100 ? 'completed' : progress > 0 ? 'in-progress' : 'pending' 
    } : t));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-3">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-3">🎯 Mission Control</h1>
        
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-slate-800 p-2 rounded text-center">
            <p className="text-xl font-bold text-green-400">{overall}%</p>
            <p className="text-xs text-slate-400">Overall</p>
          </div>
          <div className="bg-slate-800 p-2 rounded text-center">
            <p className="text-xl font-bold text-green-400">{completed}</p>
            <p className="text-xs text-slate-400">Done</p>
          </div>
          <div className="bg-slate-800 p-2 rounded text-center">
            <p className="text-xl font-bold text-amber-400">{inProgress}</p>
            <p className="text-xs text-slate-400">Active</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {tasks.map((task) => {
            const days = Math.ceil((new Date(task.endDate).getTime() - Date.now()) / (1000*60*60*24));
            const isOverdue = days < 0 && task.status !== 'completed';
            
            return (
              <div key={task.id} className="bg-slate-800 rounded p-2 text-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold truncate">{task.title}</span>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    task.status === 'completed' ? 'bg-green-500' : 
                    task.status === 'in-progress' ? 'bg-amber-500' : 'bg-slate-500'
                  }`}></span>
                </div>
                
                <div className="flex items-center gap-1 mb-1">
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={task.progress}
                    onChange={(e) => updateProgress(task.id, parseInt(e.target.value))}
                    className="flex-1 h-1 bg-slate-600 rounded"
                  />
                  <span className="w-8 text-right">{task.progress}%</span>
                </div>
                
                <div className="flex justify-between text-slate-500">
                  <span>{task.endDate}</span>
                  <span className={isOverdue ? 'text-red-400' : days <= 3 ? 'text-amber-400' : ''}>
                    {isOverdue ? `${Math.abs(days)}d late` : `${days}d`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
