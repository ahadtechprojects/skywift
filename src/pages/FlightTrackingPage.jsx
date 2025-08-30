import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useContext } from "react";
import { getBookingByRef } from "../data/bookingStore";
import { dollar } from "../utils/format";
import { FaPlaneDeparture, FaPlaneArrival, FaClock, FaUser, FaEnvelope, FaPhone, FaTicketAlt, FaPlane } from "react-icons/fa";
import { auth } from "../firebase";
import { ThemeContext } from "../context/ThemeContext";

export default function FlightTrackingPage() {
  const { theme } = useContext(ThemeContext);
  const { bookingRef } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState([]); // Array to track progress for each flight
  const [remainingTime, setRemainingTime] = useState([]); // Array for remaining time per flight

  useEffect(() => {
    (async () => {
      try {
        console.log("Fetching booking with reference:", bookingRef, "User:", auth.currentUser ? auth.currentUser.uid : "Not logged in");

        if (!bookingRef || typeof bookingRef !== "string" || bookingRef.trim() === "") {
          setError("Invalid booking reference. Please check your booking details or try again.");
          setLoading(false);
          return;
        }
        if (!auth.currentUser) {
          setError("Please log in to track your flight.");
          navigate("/login");
          setLoading(false);
          return;
        }
        const fetchedBooking = await getBookingByRef(bookingRef);
        if (!fetchedBooking) {
          setError("Booking not found or you do not have access to it. Please verify the reference or check your bookings.");
        } else if (!fetchedBooking.flightDetails || !Array.isArray(fetchedBooking.flightDetails)) {
          setError("Invalid booking data: flightDetails must be a non-empty array.");
        } else {
          setBooking(fetchedBooking);
          console.log("Fetched booking:", JSON.stringify(fetchedBooking, null, 2));
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching booking:", err, {
          bookingRef,
          userId: auth.currentUser?.uid,
          code: err.code,
          message: err.message
        });
        setError(err.message || "Failed to load booking details. Please try again.");
        setLoading(false);
      }
    })();
  }, [bookingRef, navigate]);

  useEffect(() => {
    if (!booking || !booking.flightDetails || !Array.isArray(booking.flightDetails)) return;

    const updateProgress = () => {
      const now = new Date();
      const newProgress = booking.flightDetails.map((flight, index) => {
        if (!flight.departDate || !flight.departTime || !flight.arrivalTime) {
          console.warn(`Flight ${index} missing required fields:`, flight);
          return 0;
        }

        const [depHour, depMin] = flight.departTime.split(":").map(Number);
        const [arrHour, arrMin] = flight.arrivalTime.split(":").map(Number);
        const departDateTime = new Date(flight.departDate);
        departDateTime.setHours(depHour, depMin, 0, 0);
        const arrivalDateTime = new Date(flight.departDate);
        arrivalDateTime.setHours(arrHour, arrMin, 0, 0);

        if (arrivalDateTime < departDateTime) {
          arrivalDateTime.setDate(arrivalDateTime.getDate() + 1);
        }

        const totalDurationMs = arrivalDateTime - departDateTime;
        const elapsedMs = now - departDateTime;
        const progressPercent = Math.min(Math.max((elapsedMs / totalDurationMs) * 100, 0), 100);

        const remainingMs = Math.max(arrivalDateTime - now, 0);
        const hours = Math.floor(remainingMs / (1000 * 60 * 60));
        const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);
        const remainingTimeStr = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

        return { progressPercent, remainingTimeStr };
      });

      setProgress(newProgress.map(p => p.progressPercent));
      setRemainingTime(newProgress.map(p => p.remainingTimeStr));
    };

    updateProgress();
    const interval = setInterval(updateProgress, 1000);
    return () => clearInterval(interval);
  }, [booking]);

  if (loading) return (
    <div className="text-center py-10 text-gray-800 dark:text-gray-200">
      Loading booking...
    </div>
  );

  if (error) return (
    <div className="max-w-3xl mx-auto py-10 px-4 text-center text-gray-800 dark:text-gray-200">
      <h2 className="text-2xl font-bold mb-4">{error}</h2>
      <div className="space-y-2">
        <Link to="/manage-bookings" className="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800 dark:hover:text-indigo-300">
          Check Your Bookings
        </Link>
        <br />
        <Link to="/" className="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800 dark:hover:text-indigo-300">
          Back to Home
        </Link>
      </div>
    </div>
  );

  const { flightDetails, customer, totalPrice, ref, status, paymentMethod } = booking;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 bg-gradient-to-b from-cyan-100 to-blue-200 dark:from-gray-900 dark:to-gray-800">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">Flight Tracking: Booking Ref {ref}</h1>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
          <FaTicketAlt className="text-indigo-600 dark:text-indigo-400" /> Booking Reference: {ref}
        </h2>
        <p className="mb-4 text-gray-700 dark:text-gray-300">
          <strong>Status:</strong> <span className="text-yellow-600 dark:text-yellow-400">{status}</span>
        </p>
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Flight Details</h3>
        {flightDetails.map((flight, index) => (
          <div key={flight.id || index} className="mb-4">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200">
              {flightDetails.length === 1 ? "Flight" : flight.flightType === "round-trip" ? (index === 0 ? "Outbound" : "Return") : `Leg ${index + 1}`}
            </h4>
            <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <FaPlaneDeparture className="text-green-600 dark:text-green-400" /> {flight.from} {flight.fromTerminal ? `(${flight.fromTerminal})` : ""} → 
              <FaPlaneArrival className="text-red-600 dark:text-red-400" /> {flight.to} {flight.toTerminal ? `(${flight.toTerminal})` : ""}
            </p>
            <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <FaClock className="text-orange-500 dark:text-orange-400" /> {flight.departTime} - {flight.arrivalTime || "N/A"} ({flight.durationMins || "N/A"} mins)
            </p>
            <p className="text-gray-700 dark:text-gray-300"><strong>Airline:</strong> {flight.airline || "Unknown"}</p>
            <p className="text-gray-700 dark:text-gray-300"><strong>Flight Number:</strong> {flight.flightNo || "N/A"}</p>
            <p className="text-gray-700 dark:text-gray-300"><strong>Flight Type:</strong> {flight.flightType || "one-way"}</p>
            <p className="text-gray-700 dark:text-gray-300"><strong>Price:</strong> {dollar(flight.priceUSD || 0)}</p>
          </div>
        ))}
        <p className="text-gray-700 dark:text-gray-300"><strong>Payment Method:</strong> {paymentMethod || "Not specified"}</p>
        <p className="text-lg font-semibold mt-2 text-gray-800 dark:text-gray-200">Total Paid: {dollar(totalPrice)}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Passenger Information</h3>
        <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <FaUser className="text-gray-600 dark:text-gray-400" /> {customer.name}
        </p>
        <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <FaEnvelope className="text-gray-600 dark:text-gray-400" /> {customer.email}
        </p>
        <p className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <FaPhone className="text-gray-600 dark:text-gray-400" /> {customer.phone}
        </p>
        <p className="text-gray-700 dark:text-gray-300"><strong>Passengers:</strong> {customer.passengers}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Flight Progress</h3>
        {flightDetails.map((flight, index) => {
          const flightProgress = progress[index] || 0;
          const flightRemainingTime = remainingTime[index] || "00:00:00";
          const departDateTime = new Date(`${flight.departDate}T${flight.departTime}`);
          const now = new Date();

          return (
            <div key={flight.id || index} className="mb-6">
              <h4 className="font-semibold mb-2 text-gray-800 dark:text-gray-200">
                {flightDetails.length === 1 ? "Flight" : flight.flightType === "round-trip" ? (index === 0 ? "Outbound" : "Return") : `Leg ${index + 1}`}
              </h4>
              {flightProgress === 0 && now < departDateTime ? (
                <p className="text-gray-600 dark:text-gray-400">Flight has not yet departed. Progress will start at {flight.departTime} on {flight.departDate}.</p>
              ) : flightProgress >= 100 ? (
                <p className="text-green-600 dark:text-green-400 font-semibold">Flight has arrived!</p>
              ) : (
                <>
                  <div className="relative w-full h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500 transition-all duration-1000"
                      style={{ width: `${flightProgress}%` }}
                    ></div>
                    <FaPlane
                      className="absolute top-1/2 -translate-y-1/2 text-indigo-800 dark:text-indigo-300 text-xl transition-all duration-1000"
                      style={{ left: `calc(${flightProgress}% - 20px)` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>{flight.from} ({flight.fromCoords.lat}, {flight.fromCoords.lng})</span>
                    <span>{flight.to} ({flight.toCoords.lat}, {flight.toCoords.lng})</span>
                  </div>
                  <div className="mt-4 text-center">
                    <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">Time Remaining: {flightRemainingTime}</p>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-4">
        <Link to="/manage-bookings" className="bg-indigo-600 dark:bg-indigo-700 text-white dark:text-gray-200 px-4 py-2 rounded hover:bg-indigo-700 dark:hover:bg-indigo-600 transition">
          View Bookings
        </Link>
        <Link to="/" className="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-800 dark:hover:text-indigo-300">
          Back to Home
        </Link>
      </div>
    </div>
  );
}