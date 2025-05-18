"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { FaSpinner } from "react-icons/fa";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface PaymentData {
  totalRevenue: number;
  revenueByMonth: { month: string; amount: number }[];
  revenueByService: { service: string; amount: number }[];
  paymentStatusDistribution: { status: string; count: number }[];
}

export default function PaymentAnalytics() {
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"monthly" | "services" | "status">("monthly");

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No authentication token found");
        return;
      }

      // In a real implementation, you would fetch from your API
      // const response = await fetch("/api/admin/analytics/payments", {
      //   headers: {
      //     Authorization: `Bearer ${token}`,
      //   },
      // });

      // if (!response.ok) {
      //   throw new Error("Failed to fetch payment data");
      // }

      // const data = await response.json();
      // setPaymentData(data);

      // For demonstration, use mock data
      setTimeout(() => {
        setPaymentData(generateMockPaymentData());
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching payment data:", error);
      // Use mock data for demonstration
      setPaymentData(generateMockPaymentData());
      setLoading(false);
    }
  };

  const monthlyRevenueOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Monthly Revenue",
      },
    },
  };

  const serviceRevenueOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Revenue by Service",
      },
    },
  };

  const paymentStatusOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Payment Status Distribution",
      },
    },
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin h-8 w-8 text-blue-500" />
        </div>
      </div>
    );
  }

  if (!paymentData) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center p-8 text-gray-500">No payment data available</div>
      </div>
    );
  }

  const monthlyRevenueData = {
    labels: paymentData.revenueByMonth.map((item) => item.month),
    datasets: [
      {
        label: "Revenue",
        data: paymentData.revenueByMonth.map((item) => item.amount),
        borderColor: "rgb(53, 162, 235)",
        backgroundColor: "rgba(53, 162, 235, 0.5)",
      },
    ],
  };

  const serviceRevenueData = {
    labels: paymentData.revenueByService.map((item) => item.service),
    datasets: [
      {
        label: "Revenue",
        data: paymentData.revenueByService.map((item) => item.amount),
        backgroundColor: [
          "rgba(255, 99, 132, 0.5)",
          "rgba(54, 162, 235, 0.5)",
          "rgba(255, 206, 86, 0.5)",
          "rgba(75, 192, 192, 0.5)",
          "rgba(153, 102, 255, 0.5)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const paymentStatusData = {
    labels: paymentData.paymentStatusDistribution.map((item) => item.status),
    datasets: [
      {
        label: "Count",
        data: paymentData.paymentStatusDistribution.map((item) => item.count),
        backgroundColor: [
          "rgba(75, 192, 192, 0.5)",
          "rgba(255, 206, 86, 0.5)",
          "rgba(255, 99, 132, 0.5)",
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(255, 99, 132, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Payment Analytics</h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Financial insights and payment trends
        </p>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="text-2xl font-bold text-gray-900">
            Total Revenue: ₹{paymentData.totalRevenue.toLocaleString()}
          </div>
          <div className="flex space-x-2">
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === "monthly"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => setActiveTab("monthly")}
            >
              Monthly
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === "services"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => setActiveTab("services")}
            >
              Services
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === "status"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => setActiveTab("status")}
            >
              Status
            </button>
          </div>
        </div>

        <div className="h-80">
          {activeTab === "monthly" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="h-full"
            >
              <Line options={monthlyRevenueOptions} data={monthlyRevenueData} />
            </motion.div>
          )}

          {activeTab === "services" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="h-full"
            >
              <Bar options={serviceRevenueOptions} data={serviceRevenueData} />
            </motion.div>
          )}

          {activeTab === "status" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="h-full flex justify-center"
            >
              <div className="w-1/2 h-full">
                <Doughnut options={paymentStatusOptions} data={paymentStatusData} />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

// Mock data generator for testing
function generateMockPaymentData(): PaymentData {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const services = ["AC Repair", "AC Installation", "Washing Machine Repair", "Refrigerator Service"];
  const statuses = ["Paid", "Pending", "Failed"];

  const revenueByMonth = months.map((month) => ({
    month,
    amount: Math.floor(Math.random() * 50000) + 10000,
  }));

  const revenueByService = services.map((service) => ({
    service,
    amount: Math.floor(Math.random() * 100000) + 20000,
  }));

  const paymentStatusDistribution = statuses.map((status) => ({
    status,
    count: Math.floor(Math.random() * 100) + 10,
  }));

  const totalRevenue = revenueByMonth.reduce((sum, item) => sum + item.amount, 0);

  return {
    totalRevenue,
    revenueByMonth,
    revenueByService,
    paymentStatusDistribution,
  };
}
