import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSearch } from "../context/SearchContext";
import { FaPlaneDeparture, FaPlaneArrival, FaClock } from "react-icons/fa";
import { dollar } from "../utils/format";

export default function ResultsPage() {
  const { criteria, searchFlights } = useSearch();
  const [results, setResults] = useState({ outbound: [], return: [], legs: [] });
  const totalPassengers =
    (criteria.passengers?.adults || 0) +
    (criteria.passengers?.children || 0) +
    (criteria.passengers?.infants || 0);

  useEffect(() => {
    (async () => {
      try {
        const flights = await searchFlights();
        setResults(flights);
      } catch (error) {
        console.error("Error fetching flights:", error);
        setResults({ outbound: [], return: [], legs: [] });
      }
    })();
  }, [criteria, searchFlights]);

  const renderFlightCard = (flight, legIndex = null) => (
    <div
      key={flight.id}
      className="p-4 border rounded-md mb-4 bg-white shadow flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
    >
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
        <p className="font-bold">
          {flight.airline} ({flight.flightNumber || flight.id})
          {legIndex !== null && ` (Leg ${legIndex + 1})`}
        </p>
        <p className="flex items-center gap-1">
          <FaPlaneDeparture className="text-green-600" /> {flight.from} →{" "}
          <FaPlaneArrival className="text-red-600" /> {flight.to}
        </p>
        <p className="flex items-center gap-1">
          <FaClock className="text-orange-500" /> {flight.departTime} - {flight.arrivalTime} (
          {flight.durationMins || 0} mins)
        </p>
        {flight.fareRules && (
          <p>
            Fare: {flight.fareRules.refundability}, Change Fee: {flight.fareRules.changeFee}
          </p>
        )}
      </div>
      <div className="mt-2 sm:mt-0 text-lg font-semibold">
        {dollar(flight.priceUSD * totalPassengers)} ({totalPassengers} passenger
        {totalPassengers > 1 ? "s" : ""})
        <div className="mt-2">
          <Link
            to={`/flight/${flight.id}`}
            className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition mt-1 inline-block"
          >
            View
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">
        {criteria.tripType === "multi-city"
          ? "Multi-City Flight Results"
          : `Flights from ${criteria.legs[0]?.from || "N/A"} → ${criteria.legs[0]?.to || "N/A"} on ${
              criteria.legs[0]?.departureDate || "N/A"
            }${criteria.tripType === "round-trip" ? ` (Return on ${criteria.returnDate || "N/A"})` : ""}`}
      </h1>

      {results.outbound.length > 0 || results.return.length > 0 || results.legs.length > 0 ? (
        <>
          {results.outbound.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Outbound Flights</h2>
              {results.outbound.map((flight) => renderFlightCard(flight))}
            </div>
          )}
          {criteria.tripType === "round-trip" && results.return.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Return Flights</h2>
              {results.return.map((flight) => renderFlightCard(flight))}
            </div>
          )}
          {criteria.tripType === "multi-city" && results.legs.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Multi-City Flights</h2>
              {results.legs.map((leg, index) =>
                leg.map((flight) => renderFlightCard(flight, index))
              )}
            </div>
          )}
        </>
      ) : (
        <p className="text-gray-500">No flights found for this route & date.</p>
      )}

      <div className="mt-8 text-center">
        <Link to="/search" className="text-blue-600 underline">
          Back to Search
        </Link>
      </div>
    </div>
  );
}