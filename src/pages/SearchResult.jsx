import { useEffect, useState } from "react";
import { useSearch } from "../context/SearchContext";
import { Link } from "react-router-dom";
import { FaPlaneDeparture, FaPlaneArrival, FaClock, FaCheckCircle } from "react-icons/fa";
import { dollar } from "../utils/format";
import { getNearbyAirports } from "../data/airport";

export default function SearchResults() {
  const { criteria, ready, searchResults, searchFlights } = useSearch();
  const [sortOption, setSortOption] = useState("priceUSD");
  const [filters, setFilters] = useState({ airlines: [], priceMin: null, priceMax: null, durationMax: null });
  const [airlines, setAirlines] = useState([]);
  const [nearbySuggestions, setNearbySuggestions] = useState([]);
  const passengers = (criteria.passengers?.adults || 1) + (criteria.passengers?.children || 0) + (criteria.passengers?.infants || 0);

  useEffect(() => {
    if (!ready) return;
    if (!criteria.legs?.[0]?.from || !criteria.legs?.[0]?.to || !criteria.legs?.[0]?.departureDate) {
      setNearbySuggestions([]);
      return;
    }

    (async () => {
      try {
        if (!searchResults && criteria.legs.every(leg => leg.from && leg.to && leg.departureDate)) {
          console.log("Triggering searchFlights with criteria:", criteria);
          await searchFlights(filters);
        }

        const allFlights = [
          ...(searchResults?.outbound || []),
          ...(searchResults?.return || []),
          ...((searchResults?.legs || []).flat()),
        ];
        setAirlines([...new Set(allFlights.map((f) => f.airline).filter(Boolean))]);

        if (
          (searchResults?.outbound?.length || 0) === 0 &&
          (searchResults?.return?.length || 0) === 0 &&
          (searchResults?.legs || []).every((leg) => leg.length === 0)
        ) {
          const fromNearby = getNearbyAirports(criteria.legs[0].from);
          const toNearby = getNearbyAirports(criteria.legs[0].to);
          const suggestions = [];
          for (const nearbyFrom of fromNearby) {
            for (const nearbyTo of toNearby) {
              suggestions.push({ from: nearbyFrom, to: nearbyTo });
            }
          }
          setNearbySuggestions(suggestions);
        } else {
          setNearbySuggestions([]);
        }
      } catch (err) {
        console.error("Error fetching flights:", err);
        setNearbySuggestions([]);
      }
    })();
  }, [ready, criteria, searchResults, filters, searchFlights]);

  const allFlights = [
    ...(searchResults?.outbound?.map((f) => ({ ...f, type: "outbound" })) || []),
    ...(searchResults?.return?.map((f) => ({ ...f, type: "return" })) || []),
    ...((searchResults?.legs || []).flatMap((leg, index) =>
      leg.map((f) => ({ ...f, type: `leg-${index + 1}` }))
    )),
  ];

  const sortedResults = allFlights.sort((a, b) => {
    if (sortOption === "priceUSD") return (a.priceUSD || 0) - (b.priceUSD || 0);
    if (sortOption === "departTime") return (a.departTime || "").localeCompare(b.departTime || "");
    if (sortOption === "arrivalTime") return (a.arrivalTime || "").localeCompare(b.arrivalTime || "");
    return 0;
  });

  if (!ready) return <p className="text-center mt-10 text-gray-600 dark:text-gray-300">Loading flights...</p>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 bg-gradient-to-b from-cyan-100 to-blue-200 dark:from-gray-900 dark:to-gray-800">
      <h1 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">
        {criteria.tripType === "multi-city"
          ? "Multi-City Flight Results"
          : `Flights from ${criteria.legs?.[0]?.from || "—"} → ${criteria.legs?.[0]?.to || "—"} on ${criteria.legs?.[0]?.departureDate || "—"} ${
              criteria.tripType === "round-trip" ? `(Return on ${criteria.returnDate || "—"})` : ""
            }`}
      </h1>

      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <label className="text-sm font-medium text-gray-800 dark:text-gray-200">Airline:</label>
        <select
          multiple
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
            setFilters((f) => ({ ...f, airlines: selected }));
          }}
          className="border rounded-md w-full bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400"
        >
          {airlines.map((a) => (
            <option key={a} value={a} className="text-gray-800 dark:text-gray-200">{a}</option>
          ))}
        </select>
      </div>

      <div className="mb-6 flex justify-end items-center gap-2">
        <label className="text-sm font-medium text-gray-800 dark:text-gray-200">Sort by:</label>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="border rounded-md px-3 py-2 bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400"
        >
          <option value="priceUSD" className="text-gray-800 dark:text-gray-200">Price</option>
          <option value="departTime" className="text-gray-800 dark:text-gray-200">Departure</option>
          <option value="arrivalTime" className="text-gray-800 dark:text-gray-200">Arrival</option>
        </select>
      </div>

      {sortedResults.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-300">
          {!criteria.legs?.[0]?.from || !criteria.legs?.[0]?.to || !criteria.legs?.[0]?.departureDate
            ? "Please complete the search form to find flights."
            : "No flights found. Try adjusting your filters or search criteria."}
        </p>
      ) : (
        <div className="grid gap-6">
          {sortedResults.map((flight) => (
            <div
              key={flight.id || `temp-${flight.flightNo || flight.from}-${flight.departTime || "no-time"}-${flight.type}`}
              className="bg-white/10 dark:bg-gray-800/90 shadow-md rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-lg transition border border-white/30 dark:border-gray-700/20"
            >
              <div className="flex flex-col sm:flex-row gap-6 sm:items-center">
                <p className="font-bold flex items-center gap-2 text-gray-800 dark:text-gray-200">
                  {flight.airline || "Unknown Airline"} ({flight.type})
                  <span className="text-xs bg-green-200/50 dark:bg-green-700/50 text-green-800 dark:text-green-200 px-2 py-0.5 rounded flex items-center gap-1">
                    <FaCheckCircle /> Available
                  </span>
                </p>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <FaPlaneDeparture className="text-green-600 dark:text-green-400" /> {flight.from || "N/A"}
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <FaPlaneArrival className="text-red-600 dark:text-red-400" /> {flight.to || "N/A"}
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                  <FaClock className="text-orange-500 dark:text-orange-400" /> {flight.departTime || "N/A"} - {flight.arrivalTime || "N/A"} (
                  {flight.durationMins || "N/A"} mins)
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-4 sm:mt-0">
                <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                  {dollar((flight.priceUSD || 0) * passengers)} ({passengers} passenger{passengers > 1 ? "s" : ""})
                </div>
                {flight.id ? (
                  <Link
                    to={`/flight/${flight.id}`}
                    className="bg-indigo-600 text-white dark:bg-indigo-700 dark:text-gray-200 px-4 py-2 rounded hover:bg-indigo-700 dark:hover:bg-indigo-800 transition"
                  >
                    View
                  </Link>
                ) : (
                  <span className="text-gray-600 dark:text-gray-300 px-4 py-2">Flight ID not available</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {nearbySuggestions.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800 dark:text-gray-200">Nearby Airport Suggestions</h2>
          <div className="grid gap-4">
            {nearbySuggestions.map((suggestion, index) => (
              <div key={index} className="bg-white/10 dark:bg-gray-800/90 shadow-md rounded-xl p-6 border border-white/30 dark:border-gray-700/20">
                <p className="text-gray-800 dark:text-gray-200"><strong>From:</strong> {suggestion.from}</p>
                <p className="text-gray-800 dark:text-gray-200"><strong>To:</strong> {suggestion.to}</p>
                <Link
                  to="/results"
                  onClick={() => {
                    setCriteria({
                      ...criteria,
                      legs: [{ from: suggestion.from, to: suggestion.to, departureDate: criteria.legs?.[0]?.departureDate || "" }],
                    });
                  }}
                  className="bg-indigo-600 text-white dark:bg-indigo-700 dark:text-gray-200 px-4 py-2 rounded hover:bg-indigo-700 dark:hover:bg-indigo-800 transition mt-2 block text-center"
                >
                  Search This Route
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}