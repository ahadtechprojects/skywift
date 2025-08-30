import React, { useState, useRef, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaUser, FaSignOutAlt, FaTicketAlt, FaChevronDown, FaSearch, FaBars, FaTimes, FaMapMarkerAlt, FaSun, FaMoon } from "react-icons/fa";
import { auth } from "../firebase";
import MergedAuthModal from "./MergedAuthModal";
import { ThemeContext } from "../context/ThemeContext";

export default function Navbar() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [trackingRef, setTrackingRef] = useState("");
  const [trackingError, setTrackingError] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const dropdownRef = useRef();
  const searchRef = useRef();
  const trackingModalRef = useRef();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchOpen(false);
      }
      if (trackingModalRef.current && !trackingModalRef.current.contains(event.target)) {
        setTrackingOpen(false);
        setTrackingError("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setUserMenuOpen(false);
      setMobileMenuOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handleUserClick = () => {
    if (!user) {
      setShowAuthModal(true);
    } else {
      setUserMenuOpen(!userMenuOpen);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleTrackingSubmit = (e) => {
    e.preventDefault();
    if (!trackingRef.trim()) {
      setTrackingError("Please enter a booking reference number.");
      return;
    }
    console.log("Tracking ref submitted:", trackingRef);
    navigate(`/track/${encodeURIComponent(trackingRef.trim())}`);
    setTrackingOpen(false);
    setTrackingRef("");
    setTrackingError("");
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      <nav className="bg-white/10 dark:bg-gray-800/90 backdrop-blur-lg border border-white/20 dark:border-gray-700/20 shadow-lg sticky top-0 z-50 px-4 sm:px-6 py-3 flex justify-between items-center">
        <Link to="/" className="font-bold tracking-tight text-lg text-blue-500 dark:text-blue-400 flex items-center gap-2">
          <span className="text-cyan-300 dark:text-cyan-200">✈️</span> SkySwift
        </Link>

        <div className="flex items-center gap-4">
          {/* Always Visible Icons (Desktop and Mobile) */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 rounded-full bg-cyan-600/50 hover:bg-cyan-700/50 dark:bg-cyan-700/50 dark:hover:bg-cyan-800/50 transition text-white dark:text-gray-200"
            >
              <FaSearch />
            </button>
            <button
              onClick={() => setTrackingOpen(!trackingOpen)}
              className="p-2 rounded-full bg-cyan-600/50 hover:bg-cyan-700/50 dark:bg-cyan-700/50 dark:hover:bg-cyan-800/50 transition text-white dark:text-gray-200"
            >
              <FaMapMarkerAlt />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full bg-cyan-600/50 hover:bg-cyan-700/50 dark:bg-cyan-700/50 dark:hover:bg-cyan-800/50 transition text-white dark:text-gray-200"
            >
              {theme === "light" ? <FaMoon /> : <FaSun />}
            </button>
            {/* User Dropdown (Desktop Only) */}
            <div className="hidden sm:block relative" ref={dropdownRef}>
              <button
                onClick={handleUserClick}
                className="p-2 rounded-full bg-cyan-600/50 hover:bg-cyan-700/50 dark:bg-cyan-700/50 dark:hover:bg-cyan-800/50 transition text-white dark:text-gray-200 flex items-center gap-2"
              >
                <FaUser />
                <span>{user ? user.displayName || user.email : "Guest"}</span>
                <FaChevronDown className={`transition-transform ${userMenuOpen ? "rotate-180" : "rotate-0"}`} />
              </button>
              {user && userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white/10 dark:bg-gray-800/90 backdrop-blur-lg border border-white/20 dark:border-gray-700/20 rounded-xl shadow-lg overflow-hidden z-50 animate-slide-in">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 hover:bg-indigo-600/30 dark:hover:bg-indigo-700/30 text-blue-700 dark:text-blue-300 transition flex items-center gap-2"
                  >
                    Profile
                  </Link>
                  <Link
                    to="/manage-bookings"
                    className="block px-4 py-2 hover:bg-indigo-600/30 dark:hover:bg-indigo-700/30 text-blue-700 dark:text-blue-300 transition flex items-center gap-2"
                  >
                    <FaTicketAlt /> Manage Bookings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-red-600/30 dark:hover:bg-red-700/30 text-blue-700 dark:text-blue-300 transition flex items-center gap-2"
                  >
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="sm:hidden p-2 rounded-full bg-cyan-600/50 hover:bg-cyan-700/50 dark:bg-cyan-700/50 dark:hover:bg-cyan-800/50 transition text-white dark:text-gray-200"
          >
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Search Popup */}
        {searchOpen && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
            <div ref={searchRef} className="bg-white/10 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-6 w-full max-w-md border border-white/20 dark:border-gray-700/20">
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Search flights, tracking, or destinations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 p-3 rounded-lg bg-white/20 dark:bg-gray-700/20 text-white dark:text-gray-200 placeholder-white/70 dark:placeholder-gray-300 border border-white/30 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:focus:ring-cyan-400"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-cyan-600 text-white px-4 py-3 rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-800 transition"
                >
                  <FaSearch />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tracking Popup */}
        {trackingOpen && (
          <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
            <div ref={trackingModalRef} className="bg-white/10 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl p-6 w-full max-w-md border border-white/20 dark:border-gray-700/20">
              <h2 className="text-lg font-semibold text-white dark:text-gray-200 mb-4">Track Your Flight</h2>
              {trackingError && (
                <p className="text-red-500 dark:text-red-400 mb-4">{trackingError}</p>
              )}
              <form onSubmit={handleTrackingSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter booking reference (e.g., ABC123)"
                  value={trackingRef}
                  onChange={(e) => {
                    setTrackingRef(e.target.value);
                    setTrackingError("");
                  }}
                  className="flex-1 p-3 rounded-lg bg-white/20 dark:bg-gray-700/20 text-white dark:text-gray-200 placeholder-white/70 dark:placeholder-gray-300 border border-white/30 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:focus:ring-cyan-400"
                  autoFocus
                />
                <button
                  type="submit"
                  className="bg-cyan-600 text-white px-4 py-3 rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-800 transition"
                >
                  <FaSearch />
                </button>
              </form>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden fixed inset-0 bg-white/10 dark:bg-gray-800/90 backdrop-blur-lg border border-white/20 dark:border-gray-700/20 z-40 animate-slide-in">
          <div className="flex flex-col items-center justify-center h-full gap-6￼
6
items-center gap-2">
            <Link to="/" onClick={toggleMobileMenu} className="text-lg hover:text-cyan-300 dark:hover:text-cyan-200 transition">
              Home
            </Link>
            {user ? (
              <>
                <Link to="/profile" onClick={toggleMobileMenu} className="text-lg hover:text-cyan-300 dark:hover:text-cyan-200 transition">
                  Profile
                </Link>
                <Link
                  to="/manage-bookings"
                  onClick={toggleMobileMenu}
                  className="text-lg hover:text-cyan-300 dark:hover:text-cyan-200 transition flex items-center gap-2"
                >
                  <FaTicketAlt /> Manage Bookings
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-lg hover:text-red-300 dark:hover:text-red-400 transition flex items-center gap-2"
                >
                  <FaSignOutAlt /> Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setShowAuthModal(true);
                  setMobileMenuOpen(false);
                }}
                className="text-lg hover:text-cyan-300 dark:hover:text-cyan-200 transition flex items-center gap-2"
              >
                <FaUser /> Sign In
              </button>
            )}
            <button
              onClick={toggleMobileMenu}
              className="absolute top-4 right-4 p-2 rounded-full bg-cyan-600/50 hover:bg-cyan-700/50 dark:bg-cyan-700/50 dark:hover:bg-cyan-800/50 transition text-white dark:text-gray-200"
            >
              <FaTimes />
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && <MergedAuthModal onClose={() => setShowAuthModal(false)} />}
    </>
  );
}