import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BloodInventory = ({ user }) => {
  const [inventory, setInventory] = useState([]);

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const response = await axios.get('/api/blood-inventory');
      setInventory(response.data);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const getInventoryLevel = (quantity) => {
    if (quantity === 0) return { color: 'text-red-600', label: 'Out of Stock' };
    if (quantity <= 2) return { color: 'text-orange-600', label: 'Low' };
    if (quantity <= 5) return { color: 'text-yellow-600', label: 'Medium' };
    return { color: 'text-green-600', label: 'Good' };
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Blood Inventory</h2>

      {/* Inventory Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {inventory.map(item => {
          const level = getInventoryLevel(item.TotalQuantity);
          return (
            <div key={item.BloodGroup} className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className={`text-2xl font-bold ${level.color}`}>
                {item.TotalQuantity}
              </div>
              <div className="text-sm font-medium text-gray-600">{item.BloodGroup}</div>
              <div className={`text-xs mt-1 ${level.color}`}>
                {level.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Inventory Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Blood Group</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {inventory.map(item => {
              const level = getInventoryLevel(item.TotalQuantity);
              return (
                <tr key={item.BloodGroup} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    <span className="px-2 py-1 text-xs font-medium bg-blood-light text-blood-red rounded-full">
                      {item.BloodGroup}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.TotalQuantity} units</td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${level.color.replace('text', 'bg').replace('-600', '-100')} ${level.color}`}>
                      {level.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {item.TotalQuantity === 0 && <span className="text-red-600 font-medium">URGENT</span>}
                    {item.TotalQuantity <= 2 && item.TotalQuantity > 0 && <span className="text-orange-600 font-medium">HIGH</span>}
                    {item.TotalQuantity > 2 && <span className="text-green-600 font-medium">NORMAL</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BloodInventory;