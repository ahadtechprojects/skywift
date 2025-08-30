import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { getBookingsByUser, deleteBookingById } from "../data/bookingStore";
import { dollar } from "../utils/format";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import { FaDownload, FaSearch, FaTicketAlt, FaTrash, FaMapMarkerAlt, FaExclamationTriangle, FaPlaneDeparture, FaPlaneArrival } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

export default function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Auth state changed:", user ? `User ${user.uid}` : "No user");
      if (user) {
        try {
          const fetchedBookings = await getBookingsByUser(user.uid);
          console.log("Fetched bookings:", JSON.stringify(fetchedBookings, null, 2));
          setBookings(fetchedBookings);
        } catch (error) {
          console.error("Error fetching bookings:", error, {
            userId: user.uid,
            code: error.code,
            message: error.message,
          });
          alert("Failed to load bookings. Please try again.");
        }
      } else {
        console.log("No authenticated user found");
      }
      setAuthLoading(false);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const downloadTicket = async (b) => {
    if (!b.flightDetails || !Array.isArray(b.flightDetails)) {
      alert("Cannot generate ticket: Flight details unavailable.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("SkySwift Boarding Pass", 20, 20);
    doc.setFontSize(12);
    doc.text(`Booking Ref: ${b.ref}`, 20, 35);
    doc.text(`Passenger: ${b.customer.name}`, 20, 45);
    doc.text(`Passengers: ${b.customer.passengers || 1}`, 20, 55);

    let yOffset = 65;
    b.flightDetails.forEach((flight, index) => {
      const flightLabel = b.flightDetails.length === 1 ? "Flight" : b.flightDetails[0].flightType === "round-trip" ? (index === 0 ? "Outbound" : "Return") : `Leg ${index + 1}`;
      doc.text(`${flightLabel}: ${flight.airline || "Unknown"} • ${flight.flightNo || "N/A"}`, 20, yOffset);
      doc.text(`Route: ${flight.from} ${flight.fromTerminal ? `(${flight.fromTerminal})` : ""} → ${flight.to} ${flight.toTerminal ? `(${flight.toTerminal})` : ""}`, 20, yOffset + 10);
      doc.text(`Departure: ${flight.departDate} ${flight.departTime}`, 20, yOffset + 20);
      doc.text(`Arrival: ${flight.departDate} ${flight.arrivalTime || "N/A"}`, 20, yOffset + 30);
      doc.text(`Duration: ${flight.durationMins || "N/A"} mins`, 20, yOffset + 40);
      doc.text(`Fare Class: ${flight.fareClass || "Economy"}`, 20, yOffset + 50);
      doc.text(`Price: ${dollar(flight.priceUSD || 0)} x ${b.customer.passengers || 1}`, 20, yOffset + 60);
      doc.text(`Baggage: ${flight.baggage || "20kg"}`, 20, yOffset + 70);
      doc.text(`Refundable: ${flight.refundable ? "Yes" : "No"}`, 20, yOffset + 80);
      doc.text(`Change Fee: ${dollar(flight.changeFeeUSD || 0)}`, 20, yOffset + 90);
      yOffset += 100;
    });

    const qrData = `Booking Ref: ${b.ref}\nPassenger: ${b.customer.name}\nFlights: ${b.flightDetails.map((f) => `${f.flightNo || "N/A"} (${f.from} → ${f.to})`).join(", ")}`;
    const qrUrl = await QRCode.toDataURL(qrData);
    doc.addImage(qrUrl, "PNG", 150, 20, 40, 40);

    doc.save(`BoardingPass_${b.ref}.pdf`);
  };

  const cancelBooking = async (b) => {
    if (!window.confirm(`Are you sure you want to cancel booking ${b.ref}?`)) return;

    try {
      console.log("Attempting to cancel booking:", b.id, "Ref:", b.ref);
      await deleteBookingById(b.id);
      setBookings((prev) => {
        const updatedBookings = prev.filter((booking) => booking.id !== b.id);
        console.log("Updated bookings after cancellation:", JSON.stringify(updatedBookings, null, 2));
        return updatedBookings;
      });
      alert("Booking cancelled successfully.");
    } catch (error) {
      console.error("Error cancelling booking:", error, {
        bookingId: b.id,
        ref: b.ref,
        userId: auth.currentUser?.uid,
        code: error.code,
        message: error.message,
      });
      alert("Failed to cancel booking. Please try again.");
    }
  };

  const trackFlight = (b) => {
    if (!b.flightDetails || !b.flightDetails.length) {
      alert("Cannot track flight: Flight details unavailable.");
      return;
    }
    console.log("Navigating to track flight with ref:", b.ref);
    navigate(`/track/${b.ref}`);
  };

  const filteredBookings = bookings.filter((b) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      b.ref.toLowerCase().includes(query) ||
      (b.flightDetails &&
        b.flightDetails.some(
          (f) =>
            f.from.toLowerCase().includes(query) ||
            f.to.toLowerCase().includes(query) ||
            f.airline.toLowerCase().includes(query)
        ))
    );
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 text-gray-600 dark:text-gray-300 text-lg">
        <div className="text-center">
          <FaTicketAlt className="text-4xl mb-4 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p>Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!auth.currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 text-gray-600 dark:text-gray-300 text-lg">
        <div className="text-center">
          <FaExclamationTriangle className="text-4xl mb-4 text-yellow-500 dark:text-yellow-400" />
          <p>Please sign in to view your bookings.</p>
          <Link to="/login" className="mt-4 inline-block bg-indigo-600 text-white dark:bg-indigo-700 dark:text-gray-200 px-6 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-800 transition">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 text-gray-600 dark:text-gray-300 text-lg">
        <div className="text-center">
          <FaTicketAlt className="text-4xl mb-4 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p>Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center text-gray-800 dark:text-gray-200">Manage Your Bookings</h1>

        <div className="relative w-full max-w-md mx-auto">
          <input
            type="text"
            placeholder="Search by booking ref, airline, or route..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full border rounded-full px-4 py-3 pl-12 text-sm sm:text-base bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition shadow-sm"
          />
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" />
        </div>

        {filteredBookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center mt-16 sm:mt-20 text-gray-600 dark:text-gray-300">
            <FaTicketAlt className="text-5xl sm:text-6xl mb-4 animate-pulse text-indigo-600 dark:text-indigo-400" />
            <p className="text-lg sm:text-xl font-semibold">
              {searchQuery ? "No bookings match your search." : "You have no bookings yet."}
            </p>
            <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-2">Start by searching for a flight!</p>
            <Link
              to="/search"
              className="mt-4 bg-indigo-600 text-white dark:bg-indigo-700 dark:text-gray-200 px-6 py-3 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-800 transition shadow-md"
            >
              Search Flights
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6">
            {filteredBookings.map((b) => (
              <div
                key={b.id}
                className="bg-white/10 dark:bg-gray-800/90 shadow-lg rounded-xl p-4 sm:p-6 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 transform hover:-translate-y-1 transition-all duration-300 border border-white/30 dark:border-gray-700/20"
              >
                <div className="space-y-2">
                  {b.flightDetails && Array.isArray(b.flightDetails) ? (
                    b.flightDetails.map((f, index) => (
                      <div key={f.id || index} className="mb-2">
                        <div className="font-semibold text-lg sm:text-xl text-gray-800 dark:text-gray-200">
                          {b.flightDetails.length === 1 ? "Flight" : b.flightDetails[0].flightType === "round-trip" ? (index === 0 ? "Outbound" : "Return") : `Leg ${index + 1}`}: {f.airline || "Unknown"} • {f.flightNo || "N/A"}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                          <FaPlaneDeparture className="text-indigo-600 dark:text-indigo-400" /> {f.from} {f.fromTerminal ? `(${f.fromTerminal})` : ""} → 
                          <FaPlaneArrival className="text-indigo-600 dark:text-indigo-400" /> {f.to} {f.toTerminal ? `(${f.toTerminal})` : ""} • {f.departDate}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                      <FaExclamationTriangle className="text-red-600 dark:text-red-400" />
                      Flight details unavailable
                    </div>
                  )}
                  <div className="text-xs text-gray-400 dark:text-gray-400">
                    Ref: <span className="font-mono">{b.ref}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Passengers: {b.customer.passengers || 1}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Total: {dollar(b.totalPrice)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Status: <span className={`font-semibold ${b.status === "Pending" ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}`}>{b.status}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <button
                    onClick={() => downloadTicket(b)}
                    className="bg-indigo-600 text-white dark:bg-indigo-700 dark:text-gray-200 px-3 sm:px-4 py-2 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-800 transition flex items-center gap-2 text-sm sm:text-base disabled:opacity-50 shadow-sm"
                    disabled={!b.flightDetails || !b.flightDetails.length}
                  >
                    <FaDownload /> Download
                  </button>
                  <button
                    onClick={() => cancelBooking(b)}
                    className="bg-red-600 text-white dark:bg-red-700 dark:text-gray-200 px-3 sm:px-4 py-2 rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition flex items-center gap-2 text-sm sm:text-base shadow-sm"
                  >
                    <FaTrash /> Cancel
                  </button>
                  <button
                    onClick={() => trackFlight(b)}
                    className="bg-green-600 text-white dark:bg-green-700 dark:text-gray-200 px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 dark:hover:bg-green-800 transition flex items-center gap-2 text-sm sm:text-base disabled:opacity-50 shadow-sm"
                    disabled={!b.flightDetails || !b.flightDetails.length}
                  >
                    <FaMapMarkerAlt /> Track
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}