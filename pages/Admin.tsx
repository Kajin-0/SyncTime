
import React, { useState, useMemo, memo, useCallback } from 'react';
import { TimeLog, LogType, SecurityLog, Employee } from '../types';
import { MOCK_EMPLOYEES } from '../constants';
import { Link } from 'react-router-dom';
import { audioService } from '../services/audioService';

// Memoized Table Row for high performance lists
const AuditRow = memo(({ log, emp }: { log: TimeLog, emp: Employee | undefined }) => (
  <tr className="hover:bg-slate-50 transition-colors">
    <td className="px-6 py-4">
      <p className="text-sm font-semibold text-slate-800">{emp?.name || 'Unknown'}</p>
      <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{log.employeeId}</p>
    </td>
    <td className="px-6 py-4">
      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${log.type === LogType.IN ? 'bg-green-100 text-green-700' : 'bg-rose-100 text-rose-700'}`}>
        {log.type}
      </span>
    </td>
    <td className="px-6 py-4 text-sm text-slate-600">
      {new Date(log.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
    </td>
    <td className="px-6 py-4 text-xs text-slate-500 font-mono">
      {log.location ? `${log.location.latitude.toFixed(4)}, ${log.location.longitude.toFixed(4)}` : 'N/A'}
    </td>
  </tr>
));

interface AdminProps {
  logs: TimeLog[];
  securityLogs: SecurityLog[];
  isAuthenticated: boolean;
  onAuthenticate: (success: boolean) => void;
}

const ADMIN_PASSWORD = 'management_secure';

const Admin: React.FC<AdminProps> = ({ logs, securityLogs, isAuthenticated, onAuthenticate }) => {
  const [activeTab, setActiveTab] = useState<'attendance' | 'security'>('attendance');
  const [adminPass, setAdminPass] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const filteredLogs = useMemo(() => {
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(23, 59, 59, 999);
    return logs.filter(l => l.timestamp >= start && l.timestamp <= end);
  }, [logs, startDate, endDate]);

  const exportCSV = useCallback(() => {
    audioService.playClick();
    const headers = ['Employee Name', 'Employee ID', 'Action', 'Timestamp', 'Date'];
    const rows = filteredLogs.map(log => {
      const emp = MOCK_EMPLOYEES.find(e => e.id === log.employeeId);
      const d = new Date(log.timestamp);
      return [emp?.name || '?', log.employeeId, log.type, d.toLocaleTimeString(), d.toLocaleDateString()];
    });
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "synctime_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredLogs]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const success = adminPass === ADMIN_PASSWORD;
    if (success) {
      audioService.playClockIn();
    } else {
      audioService.playError();
    }
    onAuthenticate(success);
  };

  const handleTabChange = (tab: 'attendance' | 'security') => {
    audioService.playClick();
    setActiveTab(tab);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200">
          <div className="p-8 text-center bg-slate-900 text-white">
            <h2 className="text-xl font-bold">Admin Terminal</h2>
            <p className="text-slate-400 text-sm">Restricted Access</p>
          </div>
          <form onSubmit={handleUnlock} className="p-8 space-y-6">
            <input
              type="password"
              autoFocus
              placeholder="Admin Password"
              value={adminPass}
              onChange={(e) => setAdminPass(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 transition-all"
            />
            <button className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl active:scale-[0.98] transition-all hover:bg-slate-800">
              Unlock System
            </button>
            <Link to="/" onClick={() => audioService.playClick()} className="block text-center text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors">
              Back to Main
            </Link>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
          <div className="flex mt-4 bg-slate-100 p-1 rounded-lg">
            {(['attendance', 'security'] as const).map(tab => (
              <button key={tab} onClick={() => handleTabChange(tab)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all uppercase tracking-widest ${activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex space-x-3 w-full md:w-auto">
          <button onClick={exportCSV} className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-lg hover:bg-indigo-700 active:scale-95 transition-all">
            Export Records
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50 border-b">
                <th className="px-6 py-4">Employee / Event</th>
                <th className="px-6 py-4">Status / Details</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Location / IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeTab === 'attendance' ? (
                filteredLogs.length > 0 ? (
                  filteredLogs.map(log => <AuditRow key={log.id} log={log} emp={MOCK_EMPLOYEES.find(e => e.id === log.employeeId)} />)
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                      No attendance records found
                    </td>
                  </tr>
                )
              ) : (
                securityLogs.length > 0 ? (
                  securityLogs.map(log => (
                    <tr key={log.id} className="text-xs hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                        {log.type}
                      </td>
                      <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={log.details}>
                        {log.details}
                      </td>
                      <td className="px-6 py-4 text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-400">
                        {log.ipPlaceholder || 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-slate-400 uppercase text-[10px] font-bold tracking-widest">
                      No security events logged
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;
