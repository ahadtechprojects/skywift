import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { getFlightById } from "../data/flightStore";
import { dollar } from "../utils/format";
import { FaPlaneDeparture, FaPlaneArrival, FaClock, FaSuitcase, FaMoneyBillWave, FaExclamationCircle } from "react-icons/fa";
import { useSearch } from "../context/SearchContext";

export default function FlightDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { criteria, searchResults } = useSearch();
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        let selectedFlights = [];
        if (criteria.tripType === "one-way" && id) {
          const flight = await getFlightById(id);
          if (flight) {
            selectedFlights = [{
              ...flight,
              flightType: flight.flightType || "one-way",
              fromCoords: flight.fromCoords || { lat: 0, lng: 0 },
              toCoords: flight.toCoords || { lat: 0, lng: 0 },
              baggage: flight.baggage || "20kg",
              refundable: flight.refundable ?? false,
              changeFeeUSD: flight.changeFeeUSD || 0,
              fromTerminal: flight.fromTerminal || "N/A",
              toTerminal: flight.toTerminal || "N/A",
            }];
          }
        } else if (criteria.tripType === "round-trip" && searchResults) {
          const outbound = searchResults.outbound.find((f) => f.id === id) || searchResults.outbound[0];
          const returnFlight = searchResults.return[0];
          selectedFlights = [outbound, returnFlight].filter(Boolean).map((f) => ({
            ...f,
            flightType: f.flightType || "round-trip",
            fromCoords: f.fromCoords || { lat: 0, lng: 0 },
            toCoords: f.toCoords || { lat: 0, lng: 0 },
            baggage: f.baggage || "20kg",
            refundable: f.refundable ?? false,
            changeFeeUSD: f.changeFeeUSD || 0,
            fromTerminal: f.fromTerminal || "N/A",
            toTerminal: f.toTerminal || "N/A",
          }));
        } else if (criteria.tripType === "multi-city" && searchResults) {
          const outbound = searchResults.outbound.find((f) => f.id === id) || searchResults.outbound[0];
          selectedFlights = [outbound, ...searchResults.legs.flat()].filter(Boolean).map((f) => ({
            ...f,
            flightType: f.flightType || "multi-city",
            fromCoords: f.fromCoords || { lat: 0, lng: 0 },
            toCoords: f.toCoords || { lat: 0, lng: 0 },
            baggage: f.baggage || "20kg",
            refundable: f.refundable ?? false,
            changeFeeUSD: f.changeFeeUSD || 0,
            fromTerminal: f.fromTerminal || "N/A",
            toTerminal: f.toTerminal || "N/A",
          }));
        }

        if (!selectedFlights.length) {
          throw new Error("No flights found for the selected itinerary.");
        }

        setFlights(selectedFlights);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching flights:", err);
        setError(err.message || "Failed to load flight details. Please try again.");
        setLoading(false);
      }
    })();
  }, [id, criteria.tripType, searchResults]);

  if (loading) return <div className="text-center py-10 text-gray-600 dark:text-gray-300">Loading flights...</div>;

  if (error || !flights.length) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
        <p className="text-gray-600 dark:text-gray-300 mb-4 flex items-center justify-center gap-2">
          <FaExclamationCircle className="text-red-500 dark:text-red-400" /> {error || "Flights not found."}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="bg-indigo-600 text-white dark:bg-indigo-700 dark:text-gray-200 px-4 py-2 rounded hover:bg-indigo-700 dark:hover:bg-indigo-800 transition"
        >
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 bg-gradient-to-b from-cyan-100 to-blue-200 dark:from-gray-900 dark:to-gray-800">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-200">Flight Details: {criteria.tripType || "Flight"} Itinerary</h1>

      {flights.map((flight, index) => (
        <div key={flight.id || index} className="bg-white/10 dark:bg-gray-800/90 shadow-md rounded-xl p-6 mb-6 border border-white/30 dark:border-gray-700/20">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">
            {flights.length === 1 ? "Flight" : criteria.tripType === "round-trip" ? (index === 0 ? "Outbound" : "Return") : `Leg ${index + 1}`}
          </h2>
          <div className="flex flex-col sm:flex-row justify-between gap-6">
            <div className="flex flex-col gap-3">
              <p className="font-semibold text-lg flex items-center gap-2 text-gray-800 dark:text-gray-200">
                <FaPlaneDeparture className="text-green-600 dark:text-green-400" /> Departure: {flight.from} {flight.fromTerminal ? `(${flight.fromTerminal})` : ""}
              </p>
              <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <FaPlaneArrival className="text-red-600 dark:text-red-400" /> Arrival: {flight.to} {flight.toTerminal ? `(${flight.toTerminal})` : ""}
              </p>
              <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <FaClock className="text-orange-500 dark:text-orange-400" /> {flight.departTime} - {flight.arrivalTime || "N/A"} ({flight.durationMins || "N/A"} mins)
              </p>
              <p className="text-gray-600 dark:text-gray-300"><strong>Airline:</strong> {flight.airline || "Unknown"}</p>
              <p className="text-gray-600 dark:text-gray-300"><strong>Flight Number:</strong> {flight.flightNo || "N/A"}</p>
              <p className="text-gray-600 dark:text-gray-300"><strong>Fare Class:</strong> {flight.fareClass || "Economy"}</p>
              <p className="text-gray-600 dark:text-gray-300"><strong>Coordinates:</strong> From ({flight.fromCoords.lat}, {flight.fromCoords.lng}) to ({flight.toCoords.lat}, {flight.toCoords.lng})</p>
            </div>
            <div className="flex flex-col gap-2">
              <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{dollar(flight.priceUSD || 0)}</p>
              {index === 0 && (
                <Link
                  to={`/flight/${flight.id}/checkout`}
                  className="bg-indigo-600 text-white dark:bg-indigo-700 dark:text-gray-200 px-4 py-2 rounded hover:bg-indigo-700 dark:hover:bg-indigo-800 transition text-center"
                >
                  Book Now
                </Link>
              )}
            </div>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-200">Fare Rules</h3>
            <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <FaMoneyBillWave className="text-green-600 dark:text-green-400" /> Refundable: {flight.refundable ? "Yes" : "No"}
            </p>
            <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <FaMoneyBillWave className="text-green-600 dark:text-green-400" /> Change Fee: {dollar(flight.changeFeeUSD || 0)}
            </p>
          </div>

          <div className="mt-4">
            <h3 className="text-lg font-bold mb-2 text-gray-800 dark:text-gray-200">Baggage Info</h3>
            <p className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
              <FaSuitcase className="text-blue-600 dark:text-blue-400" /> {flight.baggage || "20kg"}
            </p>
          </div>
        </div>
      ))}

      <div className="mt-8 text-center">
        <p className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
          Total Price: {dollar(flights.reduce((sum, f) => sum + (f.priceUSD || 0), 0))} for {criteria.passengers?.adults + criteria.passengers?.children + criteria.passengers?.infants || 1} passenger(s)
        </p>
        <button
          onClick={() => navigate(-1)}
          className="text-gray-600 dark:text-gray-300 underline hover:text-gray-800 dark:hover:text-gray-200"
        >
          Back to Results
        </button>
      </div>
    </div>
  );
}