import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/NavBar";
import Home from "./pages/HomePage";
import SearchResults from "./pages/SearchResult";
import FlightDetails from "./pages/FlightDetails";
import Checkout from "./pages/CheckoutPage";
import Confirmation from "./pages/Confirmation";
import ManageBooking from "./pages/ManageBooking";
import ProfilePage from "./pages/ProfilePage";
import FlightTrackingPage from "./pages/FlightTrackingPage";
import SearchPage from "./pages/SearchPage";
import AdminApp from "./admin/AdminApp";
import { SearchProvider } from "./context/SearchContext";
import { ThemeProvider } from "./context/ThemeContext";
import { getAllFlights } from "./data/flightStore";

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-cyan-100 to-blue-200 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/results" element={<SearchResults />} />
          <Route path="/flight/:id" element={<FlightDetails />} />
          <Route path="/flight/:id/checkout" element={<Checkout />} />
          <Route path="/confirmation/:bookingRef" element={<Confirmation />} />
          <Route path="/manage-bookings" element={<ManageBooking />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/track/:bookingRef" element={<FlightTrackingPage />} />
          <Route path="*" element={<div className="text-center mt-10 text-gray-800 dark:text-gray-200">Page not found</div>} />
        </Routes>
      </main>
      <footer className="border-t bg-white dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-6 text-sm text-gray-500 dark:text-gray-300">
          © {new Date().getFullYear()} SkySwift
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    getAllFlights();
  }, []);

  return (
    <ThemeProvider>
      <SearchProvider>
        <Routes>
          <Route path="/*" element={<PublicLayout />} />
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </SearchProvider>
    </ThemeProvider>
  );
}