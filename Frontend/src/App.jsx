import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import DonorManagement from './components/DonorManagement';
import PatientManagement from './components/PatientManagement';
import BloodInventory from './components/BloodInventory';
import BloodUnits from './components/BloodUnits';
import StaffManagement from './components/StaffManagement';
import HospitalManagement from './components/HospitalManagement';
import Reports from './components/Reports';
import Alerts from './components/Alerts';

// Configure axios
axios.defaults.baseURL = 'http://localhost:5000';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    checkAuth();
    loadAlerts();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get('/api/auth/me');
        setUser(response.data.user);
      }
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await axios.get('/api/alerts/expiry');
      setAlerts(response.data.nearExpiry.slice(0, 5));
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const handleLogin = (userData) => {
    setUser(userData.user);
    localStorage.setItem('token', userData.token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${userData.token}`;
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setActiveTab('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blood-red mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="blood-gradient text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold">BloodLink Management System</h1>
              <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                {user.role === 'admin' ? 'Administrator' : 'Staff'}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span>Welcome, {user.name}</span>
              <button
                onClick={handleLogout}
                className="bg-white text-blood-red px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex space-x-1 overflow-x-auto">
            {[
              { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
              { id: 'donors', label: '🩸 Donors', icon: '🩸' },
              { id: 'patients', label: '👥 Patients', icon: '👥' },
              { id: 'blood-units', label: '💉 Blood Units', icon: '💉' },
              { id: 'inventory', label: '📦 Inventory', icon: '📦' },
              { id: 'hospitals', label: '🏥 Hospitals', icon: '🏥' },
              { id: 'staff', label: '👨‍💼 Staff', icon: '👨‍💼' },
              { id: 'reports', label: '📄 Reports', icon: '📄' },
              { id: 'alerts', label: '🚨 Alerts', icon: '🚨' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-3 px-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blood-red text-blood-red'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Alert Banner */}
      {alerts.length > 0 && activeTab !== 'alerts' && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="container mx-auto">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-yellow-400">⚠️</span>
                <p className="ml-3 text-yellow-700">
                  {alerts.length} blood unit{alerts.length > 1 ? 's' : ''} expiring soon
                </p>
              </div>
              <button
                onClick={() => setActiveTab('alerts')}
                className="text-yellow-700 hover:text-yellow-600 font-medium"
              >
                View Details →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {activeTab === 'dashboard' && <Dashboard user={user} />}
        {activeTab === 'donors' && <DonorManagement user={user} />}
        {activeTab === 'patients' && <PatientManagement user={user} />}
        {activeTab === 'blood-units' && <BloodUnits user={user} />}
        {activeTab === 'inventory' && <BloodInventory user={user} />}
        {activeTab === 'hospitals' && <HospitalManagement user={user} />}
        {activeTab === 'staff' && <StaffManagement user={user} />}
        {activeTab === 'reports' && <Reports user={user} />}
        {activeTab === 'alerts' && <Alerts user={user} />}
      </main>
    </div>
  );
}

export default App;