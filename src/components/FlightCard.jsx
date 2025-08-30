import { useSearch } from "../context/SearchContext";
import { Link } from "react-router-dom";
import { FaPlaneDeparture, FaPlaneArrival, FaClock } from "react-icons/fa";
import { dollar } from "../utils/format";
import { useState } from "react";

export default function SearchResults() {
  const { searchFlights, criteria } = useSearch();
  const [sortOption, setSortOption] = useState("price");

  let results = searchFlights()?.filter(f => !f.id.startsWith("GEN-")) || [];

  results = results.slice().sort((a, b) => {
    if (sortOption === "price") return a.price - b.price;
    if (sortOption === "departure") return a.departure.localeCompare(b.departure);
    if (sortOption === "arrival") return a.arrival.localeCompare(b.arrival);
    return 0;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold mb-4">
        Available flights from {criteria.from} → {criteria.to} on {criteria.date || "—"}
      </h1>

      <div className="mb-6 flex justify-end items-center gap-2">
        <label className="font-semibold text-gray-700">Sort by:</label>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="price">Price</option>
          <option value="departure">Departure Time</option>
          <option value="arrival">Arrival Time</option>
        </select>
      </div>

      {results.length === 0 ? (
        <p className="mt-6 text-gray-500">No flights found for this selection. Try another date or route.</p>
      ) : (
        <div className="grid gap-6">
          {results.map((flight) => (
            <div
              key={flight.id}
              className="bg-white shadow-md rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-lg transition"
            >
              <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
                <div className="flex items-center gap-2">
                  <FaPlaneDeparture className="text-green-600" />
                  <span className="font-semibold">{flight.from}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaPlaneArrival className="text-red-600" />
                  <span className="font-semibold">{flight.to}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FaClock className="text-orange-500" />
                  <span>{flight.departure} - {flight.arrival}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4 sm:mt-0">
                <div className="text-lg font-semibold">{dollar(flight.price)}</div>
                <Link
                  to={`/flight/${flight.id}`}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
                >
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link to="/" className="text-blue-600 underline">Back to Search</Link>
      </div>
    </div>
  );
}
