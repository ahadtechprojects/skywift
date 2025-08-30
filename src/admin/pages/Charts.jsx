import { useEffect, useState, useContext } from "react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import { FaSpinner, FaExclamationTriangle, FaChartBar } from "react-icons/fa";
import { ThemeContext } from "../../context/ThemeContext";

// Register Chart.js components
ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function Charts() {
  const { theme } = useContext(ThemeContext); // Access theme for dynamic colors
  const [dailyBookings, setDailyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(30); // Default to 30 days

  useEffect(() => {
    const fetchDailyBookings = async () => {
      try {
        setLoading(true);
        setError(null);
        const bookingsSnap = await getDocs(collection(db, "bookings"));
        const bookings = bookingsSnap.docs.map(doc => {
          const data = doc.data();
          let createdAt = new Date(); // Default to current date if invalid

          if (data.createdAt) {
            if (typeof data.createdAt.toDate === "function") {
              // Firestore Timestamp
              createdAt = data.createdAt.toDate();
            } else if (data.createdAt instanceof Date) {
              // Already a Date object
              createdAt = data.createdAt;
            } else if (typeof data.createdAt === "string") {
              // String date, attempt to parse
              createdAt = new Date(data.createdAt);
              if (isNaN(createdAt)) createdAt = new Date(); // Fallback if parsing fails
            }
          }

          return {
            ...data,
            id: doc.id,
            createdAt,
          };
        });

        const grouped = bookings.reduce((acc, booking) => {
          const date = booking.createdAt.toISOString().split("T")[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - timeRange);

        const data = Object.keys(grouped)
          .map(date => ({ date, bookings: grouped[date] }))
          .filter(item => new Date(item.date) >= cutoffDate)
          .sort((a, b) => new Date(a.date) - new Date(b.date));

        setDailyBookings(data);
      } catch (error) {
        console.error("Error fetching booking data:", error);
        setError("Failed to load booking data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchDailyBookings();
  }, [timeRange]);

  // Chart configuration
  const chartData = {
    labels: dailyBookings.map(item => item.date),
    datasets: [
      {
        label: "Bookings per Day",
        data: dailyBookings.map(item => item.bookings),
        backgroundColor: theme === "dark" ? "rgba(129, 140, 248, 0.6)" : "rgba(79, 70, 229, 0.6)", // indigo-400 for dark, indigo-600 for light
        borderColor: theme === "dark" ? "rgba(129, 140, 248, 1)" : "rgba(79, 70, 229, 1)",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Number of Bookings",
          color: theme === "dark" ? "#e5e7eb" : "#1f2937", // gray-200 for dark, gray-800 for light
          font: { size: 14 },
        },
        ticks: {
          color: theme === "dark" ? "#e5e7eb" : "#1f2937",
          callback: function(value) {
            return Number.isInteger(value) ? value : null;
          },
        },
      },
      x: {
        title: {
          display: true,
          text: "Date",
          color: theme === "dark" ? "#e5e7eb" : "#1f2937",
          font: { size: 14 },
        },
        ticks: {
          color: theme === "dark" ? "#e5e7eb" : "#1f2937",
          maxRotation: 45,
          minRotation: 45,
        },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: theme === "dark" ? "#e5e7eb" : "#1f2937",
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Bookings: ${context.raw}`;
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 text-gray-600 dark:text-gray-300">
        <div className="text-center">
          <FaSpinner className="text-4xl mb-4 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p>Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 text-gray-600 dark:text-gray-300">
        <div className="text-center">
          <FaExclamationTriangle className="text-4xl mb-4 text-red-600 dark:text-red-400" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (dailyBookings.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 text-gray-600 dark:text-gray-300">
        <div className="text-center">
          <FaChartBar className="text-4xl mb-4 text-indigo-600 dark:text-indigo-400" />
          <p>No booking data available for the selected time range.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Booking Rates</h1>
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTimeRange(7)}
          className={`px-4 py-2 rounded-lg ${timeRange === 7 ? "bg-indigo-600 text-white dark:bg-indigo-700 dark:text-gray-200" : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"} hover:bg-indigo-500 dark:hover:bg-indigo-600 transition`}
        >
          Last 7 Days
        </button>
        <button
          onClick={() => setTimeRange(30)}
          className={`px-4 py-2 rounded-lg ${timeRange === 30 ? "bg-indigo-600 text-white dark:bg-indigo-700 dark:text-gray-200" : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"} hover:bg-indigo-500 dark:hover:bg-indigo-600 transition`}
        >
          Last 30 Days
        </button>
        <button
          onClick={() => setTimeRange(90)}
          className={`px-4 py-2 rounded-lg ${timeRange === 90 ? "bg-indigo-600 text-white dark:bg-indigo-700 dark:text-gray-200" : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"} hover:bg-indigo-500 dark:hover:bg-indigo-600 transition`}
        >
          Last 90 Days
        </button>
      </div>
      <div className="bg-white/10 dark:bg-gray-800/90 p-6 rounded-xl shadow border border-white/30 dark:border-gray-700/20 h-96">
        <Bar data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}