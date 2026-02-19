
import React, { useState, useEffect, useRef, memo, useMemo } from 'react';
import { Employee, TimeLog, LogType } from '../types';
import Clock from '../components/Clock';
import { audioService } from '../services/audioService';

interface DashboardProps {
  user: Employee;
  logs: TimeLog[];
  onClockIn: (location?: { latitude: number, longitude: number }) => void;
  onClockOut: (location?: { latitude: number, longitude: number }) => void;
  onTimeout: () => void;
}

const INACTIVITY_LIMIT = 5 * 60 * 1000;

const LogItem = memo(({ log }: { log: TimeLog }) => (
  <div className="flex items-start space-x-3 p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
    <div className={`mt-1 p-1.5 rounded-lg ${log.type === LogType.IN ? 'bg-green-50 text-green-600' : 'bg-rose-50 text-rose-600'}`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {log.type === LogType.IN ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7" />
        )}
      </svg>
    </div>
    <div>
      <p className="text-sm font-semibold text-slate-800">
        Clocked {log.type === LogType.IN ? 'In' : 'Out'}
      </p>
      <p className="text-xs text-slate-500">
        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
      </p>
    </div>
  </div>
));

const Dashboard: React.FC<DashboardProps> = ({ user, logs, onClockIn, onClockOut, onTimeout }) => {
  const [isLocating, setIsLocating] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const userLogs = useMemo(() => logs.filter(l => l.employeeId === user.id), [logs, user.id]);
  const isClockedIn = userLogs[0]?.type === LogType.IN;

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
    return `Good ${timeOfDay}, ${user.name}`;
  }, [user.name]);

  useEffect(() => {
    const resetTimeout = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(onTimeout, INACTIVITY_LIMIT);
    };

    resetTimeout();
    const events = ['mousedown', 'keydown', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimeout, { passive: true }));
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      events.forEach(e => window.removeEventListener(e, resetTimeout));
    };
  }, [onTimeout]);

  const handleAction = async () => {
    audioService.playClick();
    setIsLocating(true);
    let location = undefined;

    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
        });
        location = { latitude: position.coords.latitude, longitude: position.coords.longitude };
      } catch (err) { console.warn('Geo failed'); }
    }

    if (isClockedIn) {
      onClockOut(location);
      audioService.playClockOut();
    } else {
      onClockIn(location);
      audioService.playClockIn();
    }
    setIsLocating(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <section className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-center relative overflow-hidden">
          <div className="absolute top-4 left-4">
             <div className="flex items-center space-x-1 px-2 py-1 bg-green-50 rounded-lg border border-green-100">
               <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse-gpu"></span>
               <span className="text-[10px] font-bold text-green-700 uppercase tracking-tighter">Audio Enabled</span>
             </div>
          </div>
          
          <div className="relative z-10 pt-4">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{greeting}</h1>
            <p className="text-slate-500 mb-8 max-w-md mx-auto">
              Ready for your next session? Make sure to record your location for accurate reporting.
            </p>
            
            <Clock />

            <div className="mt-10 flex flex-col items-center">
              <button
                onClick={handleAction}
                disabled={isLocating}
                className={`w-48 h-48 rounded-full flex flex-col items-center justify-center text-white font-bold text-xl shadow-2xl transition-all active:scale-95
                  ${isClockedIn ? 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-200' : 'bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-indigo-200'}
                  ${isLocating ? 'opacity-70 animate-pulse' : ''}`}
              >
                <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isClockedIn ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14" />
                  )}
                </svg>
                {isLocating ? 'Locating...' : (isClockedIn ? 'Clock Out' : 'Clock In')}
              </button>
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {userLogs.length > 0 ? (
              userLogs.slice(0, 5).map((log) => <LogItem key={log.id} log={log} />)
            ) : (
              <p className="text-center py-8 text-xs text-slate-400 uppercase font-bold tracking-widest">No recent logs</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
