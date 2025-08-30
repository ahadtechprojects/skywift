import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { FaSearch, FaPlaneDeparture, FaPlaneArrival, FaTrash } from "react-icons/fa";

export default function Flights() {
  const [flights, setFlights] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        const flightsSnap = await getDocs(collection(db, "flights"));
        setFlights(flightsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching flights:", error);
      }
    };
    fetchFlights();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this flight?")) return;
    try {
      await deleteDoc(doc(db, "flights", id));
      setFlights(prev => prev.filter(f => f.id !== id));
      alert("Flight deleted successfully.");
    } catch (error) {
      console.error("Error deleting flight:", error);
      alert("Failed to delete flight.");
    }
  };

  const filteredFlights = flights.filter(f =>
    f.airline.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.flightNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.to.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">Flights</h1>
      <div className="relative w-full max-w-md mb-6">
        <input
          type="text"
          placeholder="Search by airline, flight number, or route..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full border rounded-full px-4 py-3 pl-12 bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
        />
        <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-300" />
      </div>
      <div className="bg-white/10 dark:bg-gray-800/90 rounded-xl shadow border border-white/30 dark:border-gray-700/20 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="border border-gray-300 dark:border-gray-600 p-3 text-gray-800 dark:text-gray-200">Flight No</th>
              <th className="border border-gray-300 dark:border-gray-600 p-3 text-gray-800 dark:text-gray-200">Airline</th>
              <th className="border border-gray-300 dark:border-gray-600 p-3 text-gray-800 dark:text-gray-200">Route</th>
              <th className="border border-gray-300 dark:border-gray-600 p-3 text-gray-800 dark:text-gray-200">Price</th>
              <th className="border border-gray-300 dark:border-gray-600 p-3 text-gray-800 dark:text-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredFlights.map(flight => (
              <tr key={flight.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="border border-gray-300 dark:border-gray-600 p-3 text-gray-600 dark:text-gray-300">{flight.flightNo}</td>
                <td className="border border-gray-300 dark:border-gray-600 p-3 text-gray-600 dark:text-gray-300">{flight.airline}</td>
                <td className="border border-gray-300 dark:border-gray-600 p-3 text-gray-600 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <FaPlaneDeparture className="text-indigo-600 dark:text-indigo-400" />
                    {flight.from} → <FaPlaneArrival className="text-indigo-600 dark:text-indigo-400" /> {flight.to}
                  </div>
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-3 text-gray-600 dark:text-gray-300">${flight.priceUSD}</td>
                <td className="border border-gray-300 dark:border-gray-600 p-3">
                  <button
                    onClick={() => handleDelete(flight.id)}
                    className="bg-red-600 text-white dark:bg-red-700 dark:text-gray-200 px-3 py-1 rounded hover:bg-red-700 dark:hover:bg-red-800"
                  >
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}