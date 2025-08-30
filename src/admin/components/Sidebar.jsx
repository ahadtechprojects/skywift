import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaBars, FaTimes, FaTachometerAlt, FaUsers, FaPlane, FaChartBar, FaPlus, FaTicketAlt, FaSignOutAlt } from "react-icons/fa";
import { auth } from "../../firebase";
import { signOut } from "firebase/auth";

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className={`bg-indigo-800 dark:bg-indigo-900 text-white w-${collapsed ? "16" : "64"} h-screen p-4 transition-all duration-300`}>
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => setCollapsed(!collapsed)} className="text-white">
          {collapsed ? <FaBars /> : <FaTimes />}
        </button>
        {!collapsed && <h1 className="text-xl font-bold">ADMIN</h1>}
      </div>
      {!collapsed && (
        <div className="flex flex-col items-center mb-6">
          <img
            src={auth.currentUser?.photoURL || "/ahadpic11.jpg"}
            alt="Admin"
            className="w-20 h-20 rounded-full mb-2"
          />
          <p className="font-semibold text-2xl">{auth.currentUser?.displayName || "Abdulahad Sheid"}</p>
          <p className="text-sm font-bold">CEO SKYSWIFT TRAVEL AGENCY</p>
        </div>
      )}
      <nav className="flex flex-col gap-4">
        <Link to="/admin/dashboard" className="flex items-center gap-2 text-white hover:bg-indigo-700 dark:hover:bg-indigo-700 p-2 rounded">
          <FaTachometerAlt /> {!collapsed && "Dashboard"}
        </Link>
        <Link to="/admin/users" className="flex items-center gap-2 text-white hover:bg-indigo-700 dark:hover:bg-indigo-700 p-2 rounded">
          <FaUsers /> {!collapsed && "Users"}
        </Link>
        <Link to="/admin/bookings" className="flex items-center gap-2 text-white hover:bg-indigo-700 dark:hover:bg-indigo-700 p-2 rounded">
          <FaTicketAlt /> {!collapsed && "Bookings"}
        </Link>
        <Link to="/admin/flights" className="flex items-center gap-2 text-white hover:bg-indigo-700 dark:hover:bg-indigo-700 p-2 rounded">
          <FaPlane /> {!collapsed && "Flights"}
        </Link>
        <Link to="/admin/add-flight" className="flex items-center gap-2 text-white hover:bg-indigo-700 dark:hover:bg-indigo-700 p-2 rounded">
          <FaPlus /> {!collapsed && "Add Flight"}
        </Link>
        <Link to="/admin/charts" className="flex items-center gap-2 text-white hover:bg-indigo-700 dark:hover:bg-indigo-700 p-2 rounded">
          <FaChartBar /> {!collapsed && "Charts"}
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-white hover:bg-indigo-700 dark:hover:bg-indigo-700 p-2 rounded text-left"
        >
          <FaSignOutAlt /> {!collapsed && "Logout"}
        </button>
      </nav>
    </div>
  );
}