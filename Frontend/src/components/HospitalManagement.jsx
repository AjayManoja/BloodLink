import React, { useState, useEffect } from 'react';
import axios from 'axios';

const HospitalManagement = ({ user }) => {
  const [hospitals, setHospitals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingHospital, setEditingHospital] = useState(null);
  const [formData, setFormData] = useState({
    Name: '',
    Location: ''
  });

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      const response = await axios.get('/api/hospitals');
      setHospitals(response.data);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingHospital) {
        // Update existing hospital
        await axios.put(`/api/hospitals/${editingHospital.HospitalID}`, formData);
        alert('Hospital updated successfully!');
      } else {
        // Add new hospital
        await axios.post('/api/hospitals', formData);
        alert('Hospital added successfully!');
      }
      setShowForm(false);
      setEditingHospital(null);
      setFormData({ Name: '', Location: '' });
      fetchHospitals();
    } catch (error) {
      alert('Error: ' + error.response?.data?.error);
    }
  };

  const handleEdit = (hospital) => {
    setEditingHospital(hospital);
    setFormData({
      Name: hospital.Name,
      Location: hospital.Location
    });
    setShowForm(true);
  };

  const handleDelete = async (hospitalId) => {
    if (window.confirm('Are you sure you want to delete this hospital?')) {
      try {
        await axios.delete(`/api/hospitals/${hospitalId}`);
        alert('Hospital deleted successfully!');
        fetchHospitals();
      } catch (error) {
        alert('Error deleting hospital: ' + error.response?.data?.error);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingHospital(null);
    setFormData({ Name: '', Location: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Hospital Management</h2>
        {user.role === 'admin' && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-blood-red text-white px-6 py-3 rounded-lg hover:bg-blood-dark transition-colors"
          >
            Add New Hospital
          </button>
        )}
      </div>

      {/* Add/Edit Hospital Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {editingHospital ? 'Edit Hospital' : 'Add New Hospital'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="Name"
                placeholder="Hospital Name"
                value={formData.Name}
                onChange={(e) => setFormData({...formData, Name: e.target.value})}
                className="w-full border rounded-lg p-3"
                required
              />
              <input
                type="text"
                name="Location"
                placeholder="Location"
                value={formData.Location}
                onChange={(e) => setFormData({...formData, Location: e.target.value})}
                className="w-full border rounded-lg p-3"
                required
              />
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blood-red text-white px-6 py-3 rounded-lg hover:bg-blood-dark"
                >
                  {editingHospital ? 'Update Hospital' : 'Add Hospital'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Hospitals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hospitals.map(hospital => (
          <div key={hospital.HospitalID} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
            <h3 className="text-lg font-semibold text-gray-800">{hospital.Name}</h3>
            <p className="text-gray-600 mt-2">{hospital.Location}</p>
            <div className="mt-4 flex justify-between items-center">
              <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                {hospital.HospitalID}
              </span>
              {user.role === 'admin' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(hospital)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(hospital.HospitalID)}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Hospitals Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hospital ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
              {user.role === 'admin' && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {hospitals.map(hospital => (
              <tr key={hospital.HospitalID} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{hospital.HospitalID}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{hospital.Name}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{hospital.Location}</td>
                {user.role === 'admin' && (
                  <td className="px-6 py-4 text-sm">
                    <div className="flex space-x-4">
                      <button
                        onClick={() => handleEdit(hospital)}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(hospital.HospitalID)}
                        className="text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HospitalManagement;