import { Routes, Route } from "react-router-dom";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import DashboardOverview from "./pages/DashboardOverview";
import Users from "./pages/Users";
import Bookings from "./pages/Bookings";
import Flights from "./pages/Flights";
import AddFlight from "./pages/AddFlight";
import Charts from "./pages/Charts";
import PrivateAdminRoute from "./pages/PrivateAdminRoute";

export default function AdminApp() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-100 to-blue-200 dark:from-gray-900 dark:to-gray-800">
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route element={<PrivateAdminRoute />}>
          <Route element={<AdminDashboard />}>
            <Route path="dashboard" element={<DashboardOverview />} />
            <Route path="users" element={<Users />} />
            <Route path="bookings" element={<Bookings />} />
            <Route path="flights" element={<Flights />} />
            <Route path="add-flight" element={<AddFlight />} />
            <Route path="charts" element={<Charts />} />
            <Route path="*" element={<div className="text-center mt-10 text-gray-800 dark:text-gray-200">Admin page not found</div>} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}