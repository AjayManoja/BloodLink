import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PatientManagement = ({ user }) => {
  const [patients, setPatients] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    Name: '',
    BloodGroup: '',
    Gender: '',
    Contact: '',
    HospitalID: ''
  });

  useEffect(() => {
    fetchPatients();
    fetchHospitals();
  }, []);

  const fetchPatients = async () => {
    try {
      const response = await axios.get('/api/patients');
      setPatients(response.data);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

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
      await axios.post('/api/patients', formData);
      setShowForm(false);
      setFormData({
        Name: '', BloodGroup: '', Gender: '', Contact: '', HospitalID: ''
      });
      fetchPatients();
      alert('Patient added successfully!');
    } catch (error) {
      alert('Error adding patient: ' + error.response?.data?.error);
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
        <h2 className="text-2xl font-bold text-gray-800">Patient Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blood-red text-white px-6 py-3 rounded-lg hover:bg-blood-dark transition-colors"
        >
          Add New Patient
        </button>
      </div>

      {/* Add Patient Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">Add New Patient</h3>
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
              <select
                name="HospitalID"
                value={formData.HospitalID}
                onChange={handleChange}
                className="border rounded-lg p-3 md:col-span-2"
                required
              >
                <option value="">Select Hospital</option>
                {hospitals.map(hospital => (
                  <option key={hospital.HospitalID} value={hospital.HospitalID}>
                    {hospital.Name} - {hospital.Location}
                  </option>
                ))}
              </select>
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
                  Add Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patients Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Blood Group</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hospital</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {patients.map(patient => (
              <tr key={patient.PatientID} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{patient.PatientID}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{patient.Name}</td>
                <td className="px-6 py-4 text-sm">
                  <span className="px-2 py-1 text-xs font-medium bg-blood-light text-blood-red rounded-full">
                    {patient.BloodGroup}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">{patient.Gender}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{patient.Contact}</td>
                <td className="px-6 py-4 text-sm text-gray-900">{patient.HospitalName}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PatientManagement;