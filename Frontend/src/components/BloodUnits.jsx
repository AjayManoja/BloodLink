import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BloodUnits = ({ user }) => {
  const [bloodUnits, setBloodUnits] = useState([]);
  const [donors, setDonors] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [patients, setPatients] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [formData, setFormData] = useState({
    BloodGroup: '',
    DonationDate: '',
    ExpiryDate: '',
    DonorID: ''
  });

  useEffect(() => {
    fetchBloodUnits();
    fetchDonors();
    fetchPatients();
  }, []);

  const fetchBloodUnits = async () => {
    try {
      const response = await axios.get('/api/blood-units');
      setBloodUnits(response.data);
    } catch (error) {
      console.error('Error fetching blood units:', error);
    }
  };

  const fetchDonors = async () => {
    try {
      const response = await axios.get('/api/donors');
      setDonors(response.data);
    } catch (error) {
      console.error('Error fetching donors:', error);
    }
  };

  const fetchPatients = async () => {
    try {
      const response = await axios.get('/api/patients');
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  const handleAddUnit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/blood-units', formData);
      setShowForm(false);
      setFormData({
        BloodGroup: '', DonationDate: '', ExpiryDate: '', DonorID: ''
      });
      fetchBloodUnits();
      alert('Blood unit added successfully!');
    } catch (error) {
      alert('Error adding blood unit: ' + error.response?.data?.error);
    }
  };

  const handleIssueBlood = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/issue-blood', {
        BloodUnitID: selectedUnit,
        PatientID: selectedPatient
      });
      setShowIssueForm(false);
      setSelectedUnit(null);
      setSelectedPatient('');
      fetchBloodUnits();
      alert('Blood unit issued successfully!');
    } catch (error) {
      alert('Error issuing blood: ' + error.response?.data?.error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Available': return 'bg-green-100 text-green-800';
      case 'Issued': return 'bg-blue-100 text-blue-800';
      case 'Expired': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysUntilExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Blood Units Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blood-red text-white px-6 py-3 rounded-lg hover:bg-blood-dark transition-colors"
        >
          Add Blood Unit
        </button>
      </div>

      {/* Add Blood Unit Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Add New Blood Unit</h3>
            <form onSubmit={handleAddUnit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <select
                name="BloodGroup"
                value={formData.BloodGroup}
                onChange={(e) => setFormData({...formData, BloodGroup: e.target.value})}
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
              <select
                name="DonorID"
                value={formData.DonorID}
                onChange={(e) => setFormData({...formData, DonorID: e.target.value})}
                className="border rounded-lg p-3"
                required
              >
                <option value="">Select Donor</option>
                {donors.map(donor => (
                  <option key={donor.DonorID} value={donor.DonorID}>
                    {donor.Name} ({donor.BloodGroup})
                  </option>
                ))}
              </select>
              <input
                type="date"
                name="DonationDate"
                value={formData.DonationDate}
                onChange={(e) => setFormData({...formData, DonationDate: e.target.value})}
                className="border rounded-lg p-3"
                required
              />
              <input
                type="date"
                name="ExpiryDate"
                value={formData.ExpiryDate}
                onChange={(e) => setFormData({...formData, ExpiryDate: e.target.value})}
                className="border rounded-lg p-3"
                required
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
                  Add Blood Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Blood Form */}
      {showIssueForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Issue Blood Unit</h3>
            <form onSubmit={handleIssueBlood}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Unit ID
                  </label>
                  <input
                    type="text"
                    value={selectedUnit}
                    disabled
                    className="w-full border rounded-lg p-3 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Patient
                  </label>
                  <select
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    className="w-full border rounded-lg p-3"
                    required
                  >
                    <option value="">Select a patient</option>
                    {patients.map(patient => (
                      <option key={patient.PatientID} value={patient.PatientID}>
                        {patient.Name} ({patient.BloodGroup}) - {patient.PatientID}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowIssueForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blood-red text-white px-4 py-2 rounded-lg hover:bg-blood-dark"
                >
                  Issue Blood
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Blood Units Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Blood Group</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donation Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Left</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Donor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {bloodUnits.map(unit => {
              const daysLeft = getDaysUntilExpiry(unit.ExpiryDate);
              
              return (
                <tr key={unit.BloodUnitID} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{unit.BloodUnitID}</td>
                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 text-xs font-medium bg-blood-light text-blood-red rounded-full">
                      {unit.BloodGroup}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(unit.DonationDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(unit.ExpiryDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      daysLeft < 0 ? 'bg-red-100 text-red-800' :
                      daysLeft < 7 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {daysLeft} days
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(unit.Status)}`}>
                      {unit.Status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{unit.DonorName}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{unit.PatientName || '-'}</td>
                  <td className="px-6 py-4 text-sm">
                    {unit.Status === 'Available' && (
                      <button
                        onClick={() => {
                          setSelectedUnit(unit.BloodUnitID);
                          setShowIssueForm(true);
                        }}
                        className="text-blood-red hover:text-blood-dark font-medium"
                      >
                        Issue
                      </button>
                    )}
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

export default BloodUnits;