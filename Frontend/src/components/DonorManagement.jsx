import React, { useState, useEffect } from 'react';
import axios from 'axios';

const DonorManagement = () => {
  const [donors, setDonors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    Name: '',
    Age: '',
    Gender: '',
    Contact: '',
    Address: '',
    BloodGroup: '',
    MedicalHistory: ''
  });

  useEffect(() => {
    fetchDonors();
  }, []);

  const fetchDonors = async () => {
    try {
      const response = await axios.get('/api/donors');
      setDonors(response.data);
    } catch (error) {
      console.error('Error fetching donors:', error);
      alert('Error fetching donors: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/donors', formData);
      setShowForm(false);
      setFormData({
        Name: '', Age: '', Gender: '', Contact: '', Address: '', BloodGroup: '', MedicalHistory: ''
      });
      fetchDonors();
      alert('Donor added successfully!');
    } catch (error) {
      alert('Error adding donor: ' + error.response?.data?.error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Donor Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blood-red text-white px-6 py-3 rounded-lg hover:bg-blood-dark transition-colors"
        >
          Add New Donor
        </button>
      </div>

      {/* Add Donor Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Add New Donor</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="Name"
                placeholder="Full Name"
                value={formData.Name}
                onChange={handleChange}
                className="border rounded-lg p-3"
                required
              />
              <input
                type="number"
                name="Age"
                placeholder="Age"
                value={formData.Age}
                onChange={handleChange}
                className="border rounded-lg p-3"
                min="18"
                max="65"
                required
              />
              <select
                name="Gender"
                value={formData.Gender}
                onChange={handleChange}
                className="border rounded-lg p-3"
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              <input
                type="tel"
                name="Contact"
                placeholder="Contact Number"
                value={formData.Contact}
                onChange={handleChange}
                className="border rounded-lg p-3"
                required
              />
              <input
                type="text"
                name="Address"
                placeholder="Address"
                value={formData.Address}
                onChange={handleChange}
                className="border rounded-lg p-3 md:col-span-2"
              />
              <select
                name="BloodGroup"
                value={formData.BloodGroup}
                onChange={handleChange}
                className="border rounded-lg p-3"
                required
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
              <textarea
                name="MedicalHistory"
                placeholder="Medical History"
                value={formData.MedicalHistory}
                onChange={handleChange}
                className="border rounded-lg p-3 md:col-span-2"
                rows="3"
              />
              <div className="md:col-span-2 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blood-red text-white px-6 py-3 rounded-lg hover:bg-blood-dark"
                >
                  Add Donor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Donors Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donor ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Blood Group</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {donors.map(donor => (
              <tr key={donor.DonorID} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {donor.DonorID}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {donor.Name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-medium bg-blood-light text-blood-red rounded-full">
                    {donor.BloodGroup}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {donor.Contact}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {donor.Age}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DonorManagement;