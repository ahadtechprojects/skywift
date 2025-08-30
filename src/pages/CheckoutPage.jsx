import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getFlightById } from "../data/flightStore";
import { addBookingToFirestore } from "../data/bookingStore";
import { dollar } from "../utils/format";
import { FaUser, FaPlaneDeparture, FaClock, FaEnvelope, FaPhone, FaPlaneArrival } from "react-icons/fa";
import { auth } from "../firebase";
import { useSearch } from "../context/SearchContext";
import MergedAuthModal from "../components/MergedAuthModal";

export default function CheckoutPage() {
  const { id } = useParams();
  const { criteria, searchResults } = useSearch();
  const navigate = useNavigate();
  const [flights, setFlights] = useState([]);
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", passengers: 1 });
  const [errors, setErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentInstruction, setPaymentInstruction] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [tempPaymentMethod, setTempPaymentMethod] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const totalPassengers = (criteria.passengers?.adults || 0) + (criteria.passengers?.children || 0) + (criteria.passengers?.infants || 0) || 1;
    setCustomer((prev) => ({ ...prev, passengers: totalPassengers }));
  }, [criteria.passengers]);

  useEffect(() => {
    (async () => {
      try {
        let selectedFlights = [];
        if (criteria.tripType === "one-way" && id) {
          const flight = await getFlightById(id);
          if (flight) selectedFlights = [flight];
        } else if (criteria.tripType === "round-trip" && searchResults) {
          const outbound = searchResults.outbound.find((f) => f.id === id) || searchResults.outbound[0];
          const returnFlight = searchResults.return[0];
          selectedFlights = [outbound, returnFlight].filter(Boolean);
        } else if (criteria.tripType === "multi-city" && searchResults) {
          const outbound = searchResults.outbound.find((f) => f.id === id) || searchResults.outbound[0];
          selectedFlights = [outbound, ...searchResults.legs.flat()].filter(Boolean);
        }
        console.log("Fetched flights for checkout:", JSON.stringify(selectedFlights, null, 2));
        setFlights(selectedFlights);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching flights:", error, { flightId: id, tripType: criteria.tripType });
        setErrors({ fetch: "Failed to load flight details. Please try again." });
        setLoading(false);
      }
    })();
  }, [id, criteria.tripType, searchResults]);

  if (loading) return <div className="text-center py-10 text-gray-600 dark:text-gray-300">Loading flights...</div>;

  if (!flights.length) return (
    <div className="max-w-3xl mx-auto py-10 px-4 text-center bg-gradient-to-b from-cyan-100 to-blue-200 dark:from-gray-900 dark:to-gray-800">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">No flights selected</h2>
      <Link to="/results" className="text-indigo-600 dark:text-indigo-400 underline hover:text-indigo-700 dark:hover:text-indigo-300">Back to Results</Link>
    </div>
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const handlePaymentSelect = (method) => {
    setPaymentMethod(method);
    setTempPaymentMethod(method);
    switch (method) {
      case "Bitcoin":
        setPaymentInstruction("Send Bitcoin to wallet: 1SkySwiftBitcoinWallet123");
        break;
      case "USDT":
        setPaymentInstruction("Send USDT to address: 0xSkySwiftUSDTWallet456");
        break;
      case "Apple Gift Card":
      case "Amazon Gift Card":
      case "Sephora Gift Card":
      case "Google Play Gift Card":
      case "American Express":
        setPaymentInstruction("Send payment to payments@skyswift.com (gift card)");
        break;
      default:
        setPaymentInstruction("");
    }
  };

  const handleConfirmPayment = () => {
    if (tempPaymentMethod) {
      handlePaymentSelect(tempPaymentMethod);
    }
    setShowPaymentModal(false);
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) {
      console.log("No authenticated user, showing auth modal. Auth state:", auth.currentUser);
      setShowAuthModal(true);
      return;
    }

    const errs = {};
    if (!customer.name) errs.name = "Name is required";
    if (!customer.email) errs.email = "Email is required";
    if (!customer.phone) errs.phone = "Phone is required";
    if (!paymentMethod) errs.payment = "Please select a payment method";
    if (!flights.every((f) => f.id && f.from && f.to && f.departDate && f.departTime && f.priceUSD)) {
      errs.flights = "One or more flights are missing required details.";
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      console.log("Validation errors:", JSON.stringify(errs, null, 2));
      return;
    }

    try {
      const totalPrice = flights.reduce((sum, f) => sum + f.priceUSD * customer.passengers, 0);
      const booking = {
        customer,
        totalPrice,
        userId: auth.currentUser.uid,
        status: "Pending",
        paymentMethod,
        flightIds: flights.map((f) => f.id),
        flightDetails: flights.map((f) => ({
          id: f.id,
          from: f.from,
          to: f.to,
          departDate: f.departDate,
          departTime: f.departTime,
          arrivalTime: f.arrivalTime || "N/A",
          durationMins: f.durationMins || 0,
          airline: f.airline || "Unknown",
          flightNo: f.flightNo || `SKYSWIFT${Math.floor(Math.random() * 10000)}`,
          fareClass: f.fareClass || "Economy",
          flightType: f.flightType || criteria.tripType || "one-way",
          fromCoords: f.fromCoords || { lat: 0, lng: 0 },
          toCoords: f.toCoords || { lat: 0, lng: 0 },
          baggage: f.baggage || "20kg",
          refundable: f.refundable ?? false,
          changeFeeUSD: f.changeFeeUSD || 0,
          fromTerminal: f.fromTerminal || "N/A",
          toTerminal: f.toTerminal || "N/A",
        })),
      };
      console.log("Submitting booking to Firestore:", JSON.stringify(booking, null, 2));
      const newBooking = await addBookingToFirestore(booking);
      console.log("New Booking created:", JSON.stringify(newBooking, null, 2));
      if (!newBooking.ref || typeof newBooking.ref !== "string" || newBooking.ref.trim() === "") {
        throw new Error("Invalid booking reference generated");
      }
      navigate(`/confirmation/${newBooking.ref}`);
    } catch (error) {
      console.error("Error creating booking:", error, {
        code: error.code,
        message: error.message,
        userId: auth.currentUser.uid,
      });
      setErrors({ submit: error.message || "Failed to create booking. Please try again." });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 bg-gradient-to-b from-cyan-100 to-blue-200 dark:from-gray-900 dark:to-gray-800">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">Checkout: {criteria.tripType || "Flight"} Booking</h1>

      <div className="bg-white/10 dark:bg-gray-800/90 shadow-md rounded-xl p-6 mb-6 border border-white/30 dark:border-gray-700/20">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Flight Details</h2>
        {flights.map((flight, index) => (
          <div key={flight.id || index} className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{criteria.tripType === "one-way" ? "Flight" : criteria.tripType === "round-trip" ? (index === 0 ? "Outbound" : "Return") : `Leg ${index + 1}`}</h3>
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
            <p className="text-gray-600 dark:text-gray-300"><strong>Price:</strong> {dollar(flight.priceUSD)} per passenger</p>
            <p className="text-gray-600 dark:text-gray-300"><strong>Baggage:</strong> {flight.baggage || "20kg"}</p>
            <p className="text-gray-600 dark:text-gray-300"><strong>Refundable:</strong> {flight.refundable ? "Yes" : "No"}</p>
            <p className="text-gray-600 dark:text-gray-300"><strong>Change Fee:</strong> {dollar(flight.changeFeeUSD || 0)}</p>
          </div>
        ))}
        <p className="text-lg font-semibold mt-2 text-gray-800 dark:text-gray-200">
          Total: {dollar(flights.reduce((sum, f) => sum + f.priceUSD * customer.passengers, 0))} ({customer.passengers} passenger{customer.passengers > 1 ? "s" : ""})
        </p>
      </div>

      <div className="bg-white/10 dark:bg-gray-800/90 shadow-md rounded-xl p-6 mb-6 border border-white/30 dark:border-gray-700/20">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Passenger Information</h2>
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
              <FaUser className="inline mr-2 text-gray-600 dark:text-gray-300" /> Full Name
            </label>
            <input
              type="text"
              name="name"
              value={customer.name}
              onChange={handleChange}
              className={`w-full border rounded-md px-3 py-2 bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400 ${errors.name ? "border-red-500 dark:border-red-400" : ""}`}
            />
            {errors.name && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
              <FaEnvelope className="inline mr-2 text-gray-600 dark:text-gray-300" /> Email
            </label>
            <input
              type="email"
              name="email"
              value={customer.email}
              onChange={handleChange}
              className={`w-full border rounded-md px-3 py-2 bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400 ${errors.email ? "border-red-500 dark:border-red-400" : ""}`}
            />
            {errors.email && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
              <FaPhone className="inline mr-2 text-gray-600 dark:text-gray-300" /> Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={customer.phone}
              onChange={handleChange}
              className={`w-full border rounded-md px-3 py-2 bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400 ${errors.phone ? "border-red-500 dark:border-red-400" : ""}`}
            />
            {errors.phone && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.phone}</p>}
          </div>
        </div>
      </div>

      <div className="bg-white/10 dark:bg-gray-800/90 shadow-md rounded-xl p-6 mb-6 border border-white/30 dark:border-gray-700/20">
        <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Payment Method</h2>
        <button
          type="button"
          onClick={() => setShowPaymentModal(true)}
          className="w-full p-3 bg-indigo-600 text-white dark:bg-indigo-700 dark:text-gray-200 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-800 transition"
        >
          {paymentMethod ? `Selected: ${paymentMethod}` : "Choose Payment Method"}
        </button>
        {paymentInstruction && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{paymentInstruction}</p>
        )}
        {errors.payment && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.payment}</p>}
        {errors.flights && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.flights}</p>}
      </div>

      {errors.submit && <p className="text-red-600 dark:text-red-400 text-sm mb-4">{errors.submit}</p>}

      <div className="flex justify-end gap-4">
        <Link to="/results" className="text-gray-600 dark:text-gray-300 underline hover:text-gray-800 dark:hover:text-gray-200">
          Back
        </Link>
        <button
          onClick={handleSubmit}
          className="bg-indigo-600 text-white dark:bg-indigo-700 dark:text-gray-200 px-6 py-3 rounded hover:bg-indigo-700 dark:hover:bg-indigo-800 transition"
        >
          Confirm Booking
        </button>
      </div>

      {showAuthModal && (
        <MergedAuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            handleSubmit();
          }}
        />
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center">
          <div className="bg-white/10 dark:bg-gray-800/90 rounded-xl p-6 w-80 border border-white/30 dark:border-gray-700/20">
            <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-gray-200">Select Payment Method</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                Payment Method
              </label>
              <select
                value={tempPaymentMethod}
                onChange={(e) => setTempPaymentMethod(e.target.value)}
                className="w-full p-3 border rounded-md bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400"
              >
                <option value="" disabled className="text-gray-800 dark:text-gray-200">Select a payment method</option>
                {["Bitcoin", "USDT", "Apple Gift Card", "Amazon Gift Card", "Sephora Gift Card", "Google Play Gift Card", "American Express"].map((method) => (
                  <option key={method} value={method} className="text-gray-800 dark:text-gray-200">
                    {method}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="flex-1 p-3 bg-indigo-600 text-white dark:bg-indigo-700 dark:text-gray-200 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-800 transition disabled:opacity-50"
                disabled={!tempPaymentMethod}
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 p-3 bg-red-600 text-white dark:bg-red-700 dark:text-gray-200 rounded-md hover:bg-red-700 dark:hover:bg-red-800 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}