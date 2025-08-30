import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Link } from "react-router-dom";
import { FaUsers, FaTicketAlt, FaExclamationCircle } from "react-icons/fa";

export default function DashboardOverview() {
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [pendingBookings, setPendingBookings] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        setTotalUsers(usersSnap.size);

        const bookingsSnap = await getDocs(collection(db, "bookings"));
        setTotalBookings(bookingsSnap.size);

        const pendingSnap = await getDocs(query(collection(db, "bookings"), where("status", "==", "Pending")));
        setPendingBookings(pendingSnap.size);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Admin Dashboard</h1>
      <div className="grid sm:grid-cols-3 gap-6">
        <div className="bg-white/10 dark:bg-gray-800/90 p-6 rounded-xl shadow border border-white/30 dark:border-gray-700/20">
          <div className="flex items-center gap-3 mb-2">
            <FaUsers className="text-indigo-600 dark:text-indigo-400 text-xl" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Total Users</h2>
          </div>
          <p className="text-4xl text-gray-800 dark:text-gray-200">{totalUsers}</p>
          <Link to="/admin/users" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mt-2 inline-block">
            View Users
          </Link>
        </div>
        <div className="bg-white/10 dark:bg-gray-800/90 p-6 rounded-xl shadow border border-white/30 dark:border-gray-700/20">
          <div className="flex items-center gap-3 mb-2">
            <FaTicketAlt className="text-indigo-600 dark:text-indigo-400 text-xl" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Total Bookings</h2>
          </div>
          <p className="text-4xl text-gray-800 dark:text-gray-200">{totalBookings}</p>
          <Link to="/admin/bookings" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mt-2 inline-block">
            View Bookings
          </Link>
        </div>
        <div className="bg-white/10 dark:bg-gray-800/90 p-6 rounded-xl shadow border border-white/30 dark:border-gray-700/20">
          <div className="flex items-center gap-3 mb-2">
            <FaExclamationCircle className="text-yellow-600 dark:text-yellow-400 text-xl" />
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Pending Bookings</h2>
          </div>
          <p className="text-4xl text-gray-800 dark:text-gray-200">{pendingBookings}</p>
          <Link to="/admin/bookings" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 mt-2 inline-block">
            Review Pending
          </Link>
        </div>
      </div>
    </div>
  );
}