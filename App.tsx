import React, { useState } from 'react';
import { AppView, AuthState, User, UserRole } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Registration from './components/Registration';
import AttendanceKiosk from './components/AttendanceKiosk';
import IDCardView from './components/IDCardView';
import Login from './components/Login';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
    currentUser: null
  });

  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);

  const handleLogin = (role: UserRole, user: User | null) => {
    setAuth({
      isAuthenticated: true,
      role,
      currentUser: user
    });
    // Default views after login
    if (role === 'TEACHER') {
      setCurrentView(AppView.DASHBOARD);
    } else {
      setCurrentView(AppView.KIOSK); // Students go straight to scan
    }
  };

  const handleLogout = () => {
    setAuth({
      isAuthenticated: false,
      role: null,
      currentUser: null
    });
    setCurrentView(AppView.DASHBOARD);
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard auth={auth} />;
      case AppView.REGISTER:
        return <Registration />;
      case AppView.KIOSK:
        return <AttendanceKiosk auth={auth} />;
      case AppView.ID_CARD:
        return <IDCardView />;
      default:
        return <Dashboard auth={auth} />;
    }
  };

  if (!auth.isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Layout currentView={currentView} onNavigate={setCurrentView} auth={auth} onLogout={handleLogout}>
      {renderView()}
    </Layout>
  );
};

export default App;
