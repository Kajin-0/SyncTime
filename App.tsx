
import React, { useState, useEffect, useCallback, Suspense, lazy, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Employee, TimeLog, AppState, LogType, SecurityLog, SecurityEventType } from './types';
import { APP_STORAGE_KEY } from './constants';
import Layout from './components/Layout';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Admin = lazy(() => import('./pages/Admin'));

const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
    <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
    <p className="text-slate-400 font-medium animate-pulse">Initializing SyncTime...</p>
  </div>
);

const App: React.FC = () => {
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const persistenceTimerRef = useRef<number | null>(null);
  
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem(APP_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse storage", e);
      }
    }
    return {
      currentUser: null,
      logs: [],
      securityLogs: []
    };
  });

  // Debounced persistence: Prevents blocking the main thread on every tiny update
  useEffect(() => {
    if (persistenceTimerRef.current) window.clearTimeout(persistenceTimerRef.current);
    
    persistenceTimerRef.current = window.setTimeout(() => {
      localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
    }, 1000); // 1 second debounce for storage I/O

    return () => {
      if (persistenceTimerRef.current) window.clearTimeout(persistenceTimerRef.current);
    };
  }, [state]);

  const addSecurityLog = useCallback((type: SecurityEventType, details: string, employeeId?: string) => {
    setState(prev => {
      const newLog: SecurityLog = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        timestamp: Date.now(),
        details,
        employeeId,
        ipPlaceholder: `192.168.1.${Math.floor(Math.random() * 255)}`
      };
      return {
        ...prev,
        securityLogs: [newLog, ...prev.securityLogs].slice(0, 50) // Reduced history size for mobile performance
      };
    });
  }, []);

  const handleLogin = useCallback((employee: Employee) => {
    addSecurityLog(SecurityEventType.LOGIN_SUCCESS, `User ${employee.name} logged in`, employee.id);
    setState(prev => ({ ...prev, currentUser: employee }));
  }, [addSecurityLog]);

  const handleLogout = useCallback((reason: string = 'User initiated') => {
    setState(prev => {
      if (prev.currentUser) {
        const type = reason === 'Timeout' ? SecurityEventType.SESSION_TIMEOUT : SecurityEventType.LOGIN_SUCCESS;
        const newLog: SecurityLog = {
          id: Math.random().toString(36).substr(2, 9),
          type,
          timestamp: Date.now(),
          details: `User logged out. Reason: ${reason}`,
          employeeId: prev.currentUser.id,
          ipPlaceholder: `127.0.0.1`
        };
        return {
          ...prev,
          currentUser: null,
          securityLogs: [newLog, ...prev.securityLogs].slice(0, 50)
        };
      }
      return { ...prev, currentUser: null };
    });
    setIsAdminAuth(false);
  }, []);

  const addLog = useCallback((type: LogType, location?: { latitude: number, longitude: number }) => {
    setState(prev => {
      if (!prev.currentUser) return prev;
      const newLog: TimeLog = {
        id: Math.random().toString(36).substr(2, 9),
        employeeId: prev.currentUser.id,
        type,
        timestamp: Date.now(),
        location
      };
      return {
        ...prev,
        logs: [newLog, ...prev.logs].slice(0, 500) // Caps total log history in memory
      };
    });
  }, []);

  return (
    <Router>
      <Layout user={state.currentUser} onLogout={handleLogout}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route 
              path="/" 
              element={
                state.currentUser ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Login onLogin={handleLogin} onSecurityEvent={addSecurityLog} />
                )
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                state.currentUser ? (
                  <Dashboard 
                    user={state.currentUser} 
                    logs={state.logs} 
                    onClockIn={(loc) => addLog(LogType.IN, loc)}
                    onClockOut={(loc) => addLog(LogType.OUT, loc)}
                    onTimeout={() => handleLogout('Timeout')}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            <Route 
              path="/admin" 
              element={
                <Admin 
                  logs={state.logs} 
                  securityLogs={state.securityLogs}
                  isAuthenticated={isAdminAuth}
                  onAuthenticate={(success) => {
                    setIsAdminAuth(success);
                    addSecurityLog(
                      success ? SecurityEventType.ADMIN_ACCESS_GRANTED : SecurityEventType.ADMIN_ACCESS_ATTEMPT,
                      success ? 'Admin panel unlocked' : 'Failed admin access attempt'
                    );
                  }}
                />
              } 
            />
          </Routes>
        </Suspense>
      </Layout>
    </Router>
  );
};

export default App;
