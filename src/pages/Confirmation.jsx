import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getBookingByRef } from "../data/bookingStore";
import { dollar } from "../utils/format";
import { FaPlaneDeparture, FaPlaneArrival, FaClock, FaUser, FaEnvelope, FaPhone, FaTicketAlt } from "react-icons/fa";
import { auth } from "../firebase";

export default function ConfirmationPage() {
  const { bookingRef } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        console.log("Booking Reference from URL:", bookingRef);
        console.log("Current User:", auth.currentUser ? auth.currentUser.uid : "Not logged in");

        if (!bookingRef || typeof bookingRef !== "string" || bookingRef.trim() === "") {
          setError("Invalid booking reference. Please check your booking details or try again.");
          setLoading(false);
          return;
        }
        if (!auth.currentUser) {
          setError("Please log in to view your booking.");
          navigate("/login");
          setLoading(false);
          return;
        }
        const fetchedBooking = await getBookingByRef(bookingRef);
        if (!fetchedBooking) {
          setError("Booking not found or you do not have access to it. Please verify the reference or check your bookings.");
        } else {
          setBooking(fetchedBooking);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching booking:", err);
        setError(err.message || "Failed to load booking details. Please try again.");
        setLoading(false);
      }
    })();
  }, [bookingRef, navigate]);

  if (loading) return <div className="text-center py-10 text-gray-600 dark:text-gray-300">Loading booking...</div>;

  if (error) return (
    <div className="max-w-3xl mx-auto py-10 px-4 text-center bg-gradient-to-b from-cyan-100 to-blue-200 dark:from-gray-900 dark:to-gray-800">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">{error}</h2>
      <div className="space-y-2">
        <Link to="/manage-bookings" className="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-700 dark:hover:text-indigo-300">Check Your Bookings</Link>
        <br />
        <Link to="/" className="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-700 dark:hover:text-indigo-300">Back to Home</Link>
      </div>
    </div>
  );

  const { flightDetails, customer, totalPrice, ref, status, paymentMethod } = booking;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 bg-gradient-to-b from-cyan-100 to-blue-200 dark:from-gray-900 dark:to-gray-800">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">Booking Confirmation</h1>
      <div className="bg-white/10 dark:bg-gray-800/90 shadow-md rounded-xl p-6 mb-6 border border-white/30 dark:border-gray-700/20">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
          <FaTicketAlt className="text-indigo-600 dark:text-indigo-400" /> Booking Reference: {ref}
        </h2>
        <p className="mb-4 text-gray-600 dark:text-gray-300">
          <strong>Status:</strong> <span className={`font-semibold ${status === "Pending" ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}`}>{status}</span>
        </p>
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Flight Details</h3>
        {Array.isArray(flightDetails) ? (
          flightDetails.map((flight, index) => (
            <div key={flight.id || index} className="mb-4">
              <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200">
                {flight.flightType === "round-trip" ? (index === 0 ? "Outbound" : "Return") : flight.flightType === "multi-city" ? `Leg ${index + 1}` : "Flight"}
              </h4>
              <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <FaPlaneDeparture className="text-green-600 dark:text-green-400" /> {flight.from} {flight.fromTerminal ? `(${flight.fromTerminal})` : ""} → 
                <FaPlaneArrival className="text-red-600 dark:text-red-400" /> {flight.to} {flight.toTerminal ? `(${flight.toTerminal})` : ""}
              </p>
              <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <FaClock className="text-orange-500 dark:text-orange-400" /> {flight.departTime} - {flight.arrivalTime || "N/A"} ({flight.durationMins || "N/A"} mins)
              </p>
              <p className="text-gray-600 dark:text-gray-300"><strong>Airline:</strong> {flight.airline || "Unknown"}</p>
              <p className="text-gray-600 dark:text-gray-300"><strong>Flight Number:</strong> {flight.flightNo || "N/A"}</p>
              <p className="text-gray-600 dark:text-gray-300"><strong>Fare Class:</strong> {flight.fareClass || "Economy"}</p>
              <p className="text-gray-600 dark:text-gray-300"><strong>Price:</strong> {dollar(flight.priceUSD || 0)} per passenger</p>
              <p className="text-gray-600 dark:text-gray-300"><strong>Baggage:</strong> {flight.baggage || "20kg"}</p>
              <p className="text-gray-600 dark:text-gray-300"><strong>Refundable:</strong> {flight.refundable ? "Yes" : "No"}</p>
              <p className="text-gray-600 dark:text-gray-300"><strong>Change Fee:</strong> {dollar(flight.changeFeeUSD || 0)}</p>
            </div>
          ))
        ) : (
          <p className="text-red-600 dark:text-red-400">No flight details available.</p>
        )}
        <p className="text-lg font-semibold mt-2 text-gray-800 dark:text-gray-200">Total Paid: {dollar(totalPrice)}</p>
        <p className="text-gray-600 dark:text-gray-300"><strong>Payment Method:</strong> {paymentMethod || "Not specified"}</p>
      </div>

      <div className="bg-white/10 dark:bg-gray-800/90 shadow-md rounded-xl p-6 mb-6 border border-white/30 dark:border-gray-700/20">
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-200">Passenger Information</h3>
        <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <FaUser className="text-gray-600 dark:text-gray-300" /> {customer.name}
        </p>
        <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <FaEnvelope className="text-gray-600 dark:text-gray-300" /> {customer.email}
        </p>
        <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <FaPhone className="text-gray-600 dark:text-gray-300" /> {customer.phone}
        </p>
        <p className="text-gray-600 dark:text-gray-300"><strong>Passengers:</strong> {customer.passengers}</p>
      </div>

      <div className="flex justify-end gap-4">
        <Link to="/manage-bookings" className="bg-indigo-600 text-white dark:bg-indigo-700 dark:text-gray-200 px-4 py-2 rounded hover:bg-indigo-700 dark:hover:bg-indigo-800 transition">
          View Bookings
        </Link>
        <Link to="/" className="text-gray-600 dark:text-gray-300 underline hover:text-gray-800 dark:hover:text-gray-200">
          Back to Home
        </Link>
      </div>
    </div>
  );
}