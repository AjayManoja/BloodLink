import React, { useState } from 'react';
import axios from 'axios';

const Reports = ({ user }) => {
  const [loading, setLoading] = useState(false);

  const handleExportCSV = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/export/donors/csv', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `donors_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      alert('CSV exported successfully!');
    } catch (error) {
      alert('Error exporting CSV: ' + error.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/export/inventory/pdf', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `blood_inventory_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      alert('PDF exported successfully!');
    } catch (error) {
      alert('Error exporting PDF: ' + error.response?.data?.error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Reports & Exports</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CSV Export Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Export Donors Data</h3>
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-gray-600 mb-4">
            Export all donor information to CSV format for analysis and reporting.
          </p>
          <button
            onClick={handleExportCSV}
            disabled={loading}
            className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Exporting...' : 'Export to CSV'}
          </button>
        </div>

        {/* PDF Export Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Export Inventory Report</h3>
            <span className="text-2xl">📄</span>
          </div>
          <p className="text-gray-600 mb-4">
            Generate a PDF report of current blood inventory levels by blood group.
          </p>
          <button
            onClick={handleExportPDF}
            disabled={loading}
            className="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Export to PDF'}
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Report Types Available</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">📋</div>
            <p className="font-medium">Donor Lists</p>
            <p className="text-sm text-gray-600">Complete donor information</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">🩸</div>
            <p className="font-medium">Inventory Reports</p>
            <p className="text-sm text-gray-600">Blood stock levels</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">📈</div>
            <p className="font-medium">Analytics</p>
            <p className="text-sm text-gray-600">Usage and donation trends</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;