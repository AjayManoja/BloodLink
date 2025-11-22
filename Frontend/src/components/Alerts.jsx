import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Alerts = ({ user }) => {
  const [alerts, setAlerts] = useState({ nearExpiry: [], criticalInventory: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get('/api/alerts/expiry');
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExpiryColor = (days) => {
    if (days <= 2) return 'text-red-600 bg-red-50';
    if (days <= 5) return 'text-orange-600 bg-orange-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blood-red"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Alerts & Notifications</h2>
        <button
          onClick={fetchAlerts}
          className="bg-blood-red text-white px-4 py-2 rounded-lg hover:bg-blood-dark transition-colors"
        >
          Refresh Alerts
        </button>
      </div>

      {/* Near Expiry Alerts */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-yellow-500 px-6 py-3">
          <h3 className="text-lg font-semibold text-white flex items-center">
            ⚠️ Blood Units Expiring Soon ({alerts.nearExpiry.length})
          </h3>
        </div>
        <div className="p-6">
          {alerts.nearExpiry.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No near-expiry alerts</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Blood Group</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Left</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {alerts.nearExpiry.map(unit => (
                    <tr key={unit.BloodUnitID} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{unit.BloodUnitID}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className="px-2 py-1 text-xs font-medium bg-blood-light text-blood-red rounded-full">
                          {unit.BloodGroup}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{unit.DonorName}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(unit.ExpiryDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getExpiryColor(unit.days_until_expiry)}`}>
                          {unit.days_until_expiry} days
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Critical Inventory Alerts */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="bg-red-500 px-6 py-3">
          <h3 className="text-lg font-semibold text-white flex items-center">
            🔴 Critical Inventory Levels ({alerts.criticalInventory.length})
          </h3>
        </div>
        <div className="p-6">
          {alerts.criticalInventory.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No critical inventory alerts</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {alerts.criticalInventory.map(item => (
                <div key={item.BloodGroup} className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-600">{item.TotalQuantity}</div>
                  <div className="text-sm text-red-700 font-medium">{item.BloodGroup}</div>
                  <div className="text-xs text-red-600 mt-1">CRITICALLY LOW</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Alerts;