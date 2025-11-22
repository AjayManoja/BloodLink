import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StaffManagement = ({ user }) => {
  const [staff, setStaff] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    Name: '',
    Role: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/staff');
      setStaff(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching staff:', error);
      setError('Failed to load staff data. Please check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (editingStaff) {
        // Update existing staff
        console.log('Updating staff:', editingStaff.StaffID, formData);
        await axios.put(`/api/staff/${editingStaff.StaffID}`, formData);
        alert('Staff updated successfully!');
      } else {
        // Add new staff
        console.log('Adding staff:', formData);
        await axios.post('/api/staff', formData);
        alert('Staff added successfully!');
      }
      
      setShowForm(false);
      setEditingStaff(null);
      setFormData({ Name: '', Role: '' });
      fetchStaff();
    } catch (error) {
      console.error('Error saving staff:', error);
      setError(error.response?.data?.error || 'Failed to save staff. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      Name: staffMember.Name,
      Role: staffMember.Role
    });
    setShowForm(true);
  };

  const handleDelete = async (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      try {
        setLoading(true);
        await axios.delete(`/api/staff/${staffId}`);
        alert('Staff deleted successfully!');
        fetchStaff();
      } catch (error) {
        console.error('Error deleting staff:', error);
        alert('Error deleting staff: ' + (error.response?.data?.error || error.message));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingStaff(null);
    setFormData({ Name: '', Role: '' });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Manager': return 'bg-purple-100 text-purple-800';
      case 'Clinical Analyst': return 'bg-blue-100 text-blue-800';
      case 'Registration Team': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && staff.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blood-red"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Staff Management</h2>
        {user.role === 'admin' && (
          <button
            onClick={() => setShowForm(true)}
            disabled={loading}
            className="bg-blood-red text-white px-6 py-3 rounded-lg hover:bg-blood-dark transition-colors disabled:opacity-50"
          >
            Add New Staff
          </button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            {error}
          </div>
          {error.includes('backend') && (
            <button
              onClick={fetchStaff}
              className="mt-2 text-red-600 hover:text-red-800 text-sm font-medium"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Staff Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">
              {editingStaff ? `Edit Staff: ${editingStaff.StaffID}` : 'Add New Staff'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="Name"
                  placeholder="Enter full name"
                  value={formData.Name}
                  onChange={(e) => setFormData({...formData, Name: e.target.value})}
                  className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blood-red"
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  name="Role"
                  value={formData.Role}
                  onChange={(e) => setFormData({...formData, Role: e.target.value})}
                  className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blood-red"
                  required
                  disabled={loading}
                >
                  <option value="">Select Role</option>
                  <option value="Manager">Manager</option>
                  <option value="Clinical Analyst">Clinical Analyst</option>
                  <option value="Registration Team">Registration Team</option>
                </select>
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blood-red text-white px-6 py-3 rounded-lg hover:bg-blood-dark transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (editingStaff ? 'Update Staff' : 'Add Staff')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-blood-red">{staff.length}</div>
          <div className="text-sm text-gray-600">Total Staff</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {staff.filter(s => s.Role === 'Manager').length}
          </div>
          <div className="text-sm text-gray-600">Managers</div>
        </div>
        <div className="bg-white rounded-lg shadow-md p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {staff.filter(s => s.Role === 'Clinical Analyst').length}
          </div>
          <div className="text-sm text-gray-600">Clinical Analysts</div>
        </div>
      </div>

      {/* Staff Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">Staff Members</h3>
        </div>
        {staff.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No staff members found. Add your first staff member above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  {user.role === 'admin' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staff.map(staffMember => (
                  <tr key={staffMember.StaffID} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {staffMember.StaffID}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {staffMember.Name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${getRoleColor(staffMember.Role)}`}>
                        {staffMember.Role}
                      </span>
                    </td>
                    {user.role === 'admin' && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                        <button
                          onClick={() => handleEdit(staffMember)}
                          disabled={loading}
                          className="text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(staffMember.StaffID)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <button
          onClick={fetchStaff}
          disabled={loading}
          className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh Staff List'}
        </button>
      </div>
    </div>
  );
};

export default StaffManagement;