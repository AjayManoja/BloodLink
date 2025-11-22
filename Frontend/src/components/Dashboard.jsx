import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = ({ user, setActiveTab }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/api/dashboard/analytics');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blood-red"></div>
      </div>
    );
  }

  if (!analytics) {
    return <div>Error loading dashboard data</div>;
  }

  const { overview, bloodInventory, topDonors } = analytics;

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome back, {user.name}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's what's happening with your blood bank today.
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stats-card blood-group-Aplus">
          <h3 className="text-lg font-semibold text-gray-800">Total Donors</h3>
          <p className="text-3xl font-bold text-blood-red">{overview.donors}</p>
        </div>
        <div className="stats-card blood-group-Bplus">
          <h3 className="text-lg font-semibold text-gray-800">Total Patients</h3>
          <p className="text-3xl font-bold text-blood-red">{overview.patients}</p>
        </div>
        <div className="stats-card blood-group-Oplus">
          <h3 className="text-lg font-semibold text-gray-800">Available Units</h3>
          <p className="text-3xl font-bold text-blood-red">{overview.availableBloodUnits}</p>
        </div>
        <div className="stats-card blood-group-ABplus">
          <h3 className="text-lg font-semibold text-gray-800">Near Expiry</h3>
          <p className="text-3xl font-bold text-blood-red">{overview.nearExpiryUnits}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blood Inventory */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Blood Inventory</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {bloodInventory.map(item => (
              <div key={item.BloodGroup} className="text-center p-4 bg-blood-light rounded-lg">
                <div className={`text-2xl font-bold ${
                  item.TotalQuantity > 0 ? 'text-blood-red' : 'text-gray-400'
                }`}>
                  {item.TotalQuantity}
                </div>
                <div className="text-sm text-gray-600">{item.BloodGroup}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Donors */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Top Donors</h2>
          <div className="space-y-3">
            {topDonors.map((donor, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div>
                  <p className="font-medium">{donor.Name}</p>
                  <p className="text-sm text-gray-600">{donor.BloodGroup}</p>
                </div>
                <span className="bg-blood-red text-white px-2 py-1 rounded text-sm">
                  {donor.donations} donations
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button 
            onClick={() => setActiveTab('donors')}
            className="p-4 bg-blood-light rounded-lg hover:bg-blood-red hover:text-white transition-colors text-center"
          >
            <span className="text-2xl">🩸</span>
            <p className="font-medium mt-2">Add Donor</p>
          </button>
          <button 
            onClick={() => setActiveTab('patients')}
            className="p-4 bg-blood-light rounded-lg hover:bg-blood-red hover:text-white transition-colors text-center"
          >
            <span className="text-2xl">👥</span>
            <p className="font-medium mt-2">Add Patient</p>
          </button>
          <button 
            onClick={() => setActiveTab('blood-units')}
            className="p-4 bg-blood-light rounded-lg hover:bg-blood-red hover:text-white transition-colors text-center"
          >
            <span className="text-2xl">💉</span>
            <p className="font-medium mt-2">Record Donation</p>
          </button>
          <button 
            onClick={() => setActiveTab('hospitals')}
            className="p-4 bg-blood-light rounded-lg hover:bg-blood-red hover:text-white transition-colors text-center"
          >
            <span className="text-2xl">🏥</span>
            <p className="font-medium mt-2">Add Hospital</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;