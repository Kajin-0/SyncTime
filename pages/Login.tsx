
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MOCK_EMPLOYEES } from '../constants';
import { Employee, SecurityEventType } from '../types';
import { audioService } from '../services/audioService';

interface LoginProps {
  onLogin: (employee: Employee) => void;
  onSecurityEvent: (type: SecurityEventType, details: string, employeeId?: string) => void;
}

const MAX_ATTEMPTS = 3;
const LOCKOUT_MS = 30000; // 30 seconds

const Login: React.FC<LoginProps> = ({ onLogin, onSecurityEvent }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockoutTime, setLockoutTime] = useState<number | null>(null);

  useEffect(() => {
    if (lockoutTime) {
      const timer = setTimeout(() => setLockoutTime(null), LOCKOUT_MS);
      return () => clearTimeout(timer);
    }
  }, [lockoutTime]);

  const filteredEmployees = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return MOCK_EMPLOYEES.filter(
      (e) => e.name.toLowerCase().includes(term) || e.id.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTime) return;

    if (selectedEmployee && password === selectedEmployee.password) {
      audioService.playClockIn();
      onLogin(selectedEmployee);
    } else {
      audioService.playError();
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      onSecurityEvent(SecurityEventType.LOGIN_FAILED, `Incorrect password attempt ${newAttempts}/${MAX_ATTEMPTS}`, selectedEmployee?.id);
      
      if (newAttempts >= MAX_ATTEMPTS) {
        setLockoutTime(Date.now() + LOCKOUT_MS);
        setAttempts(0);
        onSecurityEvent(SecurityEventType.LOCKOUT_TRIGGERED, `Terminal locked due to excessive failures`, selectedEmployee?.id);
        setError(`Too many failed attempts. Please wait 30 seconds.`);
      } else {
        setError(`Invalid password. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
      }
      setPassword('');
    }
  };

  const handleSelect = (employee: Employee) => {
    audioService.playClick();
    setSelectedEmployee(employee);
    setError('');
    setPassword('');
    setAttempts(0);
  };

  const handleBack = () => {
    audioService.playClick();
    setSelectedEmployee(null);
  };

  if (selectedEmployee) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
          <div className="p-8 text-center bg-slate-50 border-b border-slate-100 relative">
            <button 
              onClick={handleBack}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-slate-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-xl font-bold text-slate-800">Verify Identity</h2>
          </div>
          <div className="p-8 text-center">
            <img 
              src={selectedEmployee.avatar} 
              alt={selectedEmployee.name} 
              className="w-20 h-20 rounded-full ring-4 ring-indigo-50 shadow-md mx-auto mb-4"
            />
            <h3 className="text-lg font-bold text-slate-900">{selectedEmployee.name}</h3>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-6">{selectedEmployee.id}</p>

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="text-left">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 px-1">
                  Enter Password
                </label>
                <input
                  type="password"
                  autoFocus
                  required
                  disabled={!!lockoutTime}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl outline-none transition-all ${
                    lockoutTime ? 'border-rose-200 opacity-50 cursor-not-allowed' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500'
                  }`}
                />
              </div>

              {error && (
                <div className={`text-sm font-medium p-3 rounded-lg flex items-center space-x-2 ${
                  lockoutTime ? 'bg-rose-100 text-rose-700' : 'bg-rose-50 text-rose-600'
                }`}>
                  <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!!lockoutTime}
                className={`w-full py-3 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 ${
                  lockoutTime ? 'bg-slate-300 shadow-none' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
                }`}
              >
                {lockoutTime ? 'Terminal Locked' : 'Log In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
        <div className="p-8 text-center bg-slate-50 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-800">SyncTime <span className="text-indigo-600">Pro</span></h2>
          <p className="text-slate-500 mt-2">Find your profile to clock in</p>
        </div>
        
        <div className="p-6">
          <div className="relative mb-6">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Search by Name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee) => (
                <button
                  key={employee.id}
                  onClick={() => handleSelect(employee)}
                  className="w-full flex items-center p-4 rounded-xl border-2 border-slate-100 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all group text-left"
                >
                  <img 
                    src={employee.avatar} 
                    alt={employee.name} 
                    className="w-12 h-12 rounded-full ring-2 ring-white shadow-sm mr-4"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-800 group-hover:text-indigo-700">{employee.name}</h3>
                    <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">ID: {employee.id}</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-300 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-slate-400">
                <p>No employees found matching "{searchTerm}"</p>
              </div>
            )}
          </div>
        </div>

        <div className="px-8 pb-8">
          <div className="flex items-center space-x-2 text-xs text-slate-400 justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span>Verified Employee Network</span>
          </div>
        </div>
      </div>
      
      <div className="mt-8 text-center">
        <Link 
          to="/admin" 
          onClick={() => audioService.playClick()} 
          className="text-sm font-medium text-slate-400 hover:text-indigo-600 transition-colors underline decoration-slate-200 underline-offset-4"
        >
          Management Access
        </Link>
      </div>
    </div>
  );
};

export default Login;
