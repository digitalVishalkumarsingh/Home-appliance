"use client";

import { useState, useEffect } from "react";
import {
  FaPercent,
  FaSave,
  FaSpinner,
  FaHistory,
  FaChartLine,
  FaExclamationTriangle,
  FaInfoCircle,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import { toast } from "react-hot-toast";

interface CommissionHistory {
  oldRate: number;
  newRate: number;
  updatedAt: string;
  adminId: string;
}

export default function CommissionSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [commissionRate, setCommissionRate] = useState(30);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<CommissionHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    fetchCommissionRate();
  }, []);

  const fetchCommissionRate = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/settings/commission");
      
      if (!response.ok) {
        throw new Error(`Failed to fetch commission rate: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCommissionRate(data.commissionRate);
        setLastUpdated(data.lastUpdated);
      } else {
        throw new Error(data.message || "Failed to fetch commission rate");
      }
    } catch (error) {
      console.error("Error fetching commission rate:", error);
      toast.error("Failed to load commission settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchCommissionHistory = async () => {
    if (history.length > 0 && showHistory) {
      // Already loaded history
      return;
    }
    
    try {
      setHistoryLoading(true);
      const response = await fetch("/api/admin/settings/commission", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch commission history: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setHistory(data.history);
      } else {
        throw new Error(data.message || "Failed to fetch commission history");
      }
    } catch (error) {
      console.error("Error fetching commission history:", error);
      toast.error("Failed to load commission history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCommissionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      setCommissionRate(value);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      const response = await fetch("/api/admin/settings/commission", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ commissionRate }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to update commission rate: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        toast.success("Commission rate updated successfully");
        setLastUpdated(data.updatedAt);
        
        // Refresh history if it's being shown
        if (showHistory) {
          fetchCommissionHistory();
        }
      } else {
        throw new Error(data.message || "Failed to update commission rate");
      }
    } catch (error) {
      console.error("Error updating commission rate:", error);
      toast.error("Failed to update commission rate");
    } finally {
      setSaving(false);
    }
  };

  const toggleHistory = () => {
    const newState = !showHistory;
    setShowHistory(newState);
    
    if (newState) {
      fetchCommissionHistory();
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    
    return new Date(dateString).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex justify-center items-center h-40">
          <FaSpinner className="animate-spin h-8 w-8 text-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Technician Commission Settings</h3>
        <p className="mt-1 text-sm text-gray-500">
          Configure the commission percentage that will be deducted from technician earnings
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="px-6 py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="commissionRate" className="block text-sm font-medium text-gray-700 mb-1">
              Admin Commission Rate (%)
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaPercent className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="number"
                id="commissionRate"
                name="commissionRate"
                min="0"
                max="100"
                value={commissionRate}
                onChange={handleCommissionChange}
                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
                placeholder="30"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">percent</span>
              </div>
            </div>
            {lastUpdated && (
              <p className="mt-2 text-xs text-gray-500">
                Last updated: {formatDate(lastUpdated)}
              </p>
            )}
          </div>
          
          <div className="flex items-end">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 w-full">
              <div className="flex items-center">
                <FaInfoCircle className="h-5 w-5 text-blue-500 mr-2" />
                <h4 className="text-sm font-medium text-blue-700">How Commission Works</h4>
              </div>
              <p className="mt-1 text-xs text-blue-600">
                For a job worth ₹1000 with {commissionRate}% commission:
              </p>
              <ul className="mt-2 text-xs text-blue-600 space-y-1">
                <li>• Admin commission: ₹{(1000 * commissionRate / 100).toFixed(0)}</li>
                <li>• Technician earnings: ₹{(1000 - (1000 * commissionRate / 100)).toFixed(0)}</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            onClick={toggleHistory}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaHistory className="mr-2 -ml-1 h-5 w-5 text-gray-500" />
            {showHistory ? "Hide History" : "View History"}
          </button>
          
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400"
          >
            {saving ? (
              <>
                <FaSpinner className="animate-spin mr-2 -ml-1 h-5 w-5" />
                Saving...
              </>
            ) : (
              <>
                <FaSave className="mr-2 -ml-1 h-5 w-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
      
      {/* Commission History */}
      {showHistory && (
        <div className="px-6 py-5 border-t border-gray-200">
          <h4 className="text-md font-medium text-gray-900 mb-4">Commission Rate History</h4>
          
          {historyLoading ? (
            <div className="flex justify-center items-center h-20">
              <FaSpinner className="animate-spin h-5 w-5 text-blue-500 mr-2" />
              <span className="text-sm text-gray-500">Loading history...</span>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-4">
              <FaExclamationTriangle className="mx-auto h-5 w-5 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">No commission rate changes found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Admin
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(item.updatedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900">{item.oldRate}% to {item.newRate}%</span>
                          {item.newRate > item.oldRate ? (
                            <FaArrowUp className="ml-2 h-3 w-3 text-red-500" />
                          ) : (
                            <FaArrowDown className="ml-2 h-3 w-3 text-green-500" />
                          )}
                          <span className={`ml-1 text-xs ${item.newRate > item.oldRate ? 'text-red-500' : 'text-green-500'}`}>
                            {Math.abs(item.newRate - item.oldRate)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.adminId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
