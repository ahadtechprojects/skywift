import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { FaSearch, FaPlaneDeparture, FaPlaneArrival } from "react-icons/fa";

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const bookingsSnap = await getDocs(collection(db, "bookings"));
        setBookings(bookingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    };
    fetchBookings();
  }, []);

  const handleApprove = async (id) => {
    try {
      await updateDoc(doc(db, "bookings", id), { status: "Confirmed" });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "Confirmed" } : b));
      alert("Booking approved.");
    } catch (error) {
      console.error("Error approving booking:", error);
      alert("Failed to approve booking.");
    }
  };

  const handleReject = async (id) => {
    try {
      await updateDoc(doc(db, "bookings", id), { status: "Cancelled" });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: "Cancelled" } : b));
      alert("Booking rejected.");
    } catch (error) {
      console.error("Error rejecting booking:", error);
      alert("Failed to reject booking.");
    }
  };

  const filteredBookings = bookings.filter(b =>
    b.ref.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.customer.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">Booked Flights</h1>
      <div className="relative w-full max-w-md mb-6">
        <input
          type="text"
          placeholder="Search by ref or customer name..."
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
              <th className="border border-gray-300 dark:border-gray-600 p-3 text-gray-800 dark:text-gray-200">Ref</th>
              <th className="border border-gray-300 dark:border-gray-600 p-3 text-gray-800 dark:text-gray-200">Customer</th>
              <th className="border border-gray-300 dark:border-gray-600 p-3 text-gray-800 dark:text-gray-200">Flights</th>
              <th className="border border-gray-300 dark:border-gray-600 p-3 text-gray-800 dark:text-gray-200">Status</th>
              <th className="border border-gray-300 dark:border-gray-600 p-3 text-gray-800 dark:text-gray-200">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBookings.map(booking => (
              <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="border border-gray-300 dark:border-gray-600 p-3 text-gray-600 dark:text-gray-300">{booking.ref}</td>
                <td className="border border-gray-300 dark:border-gray-600 p-3 text-gray-600 dark:text-gray-300">{booking.customer.name}</td>
                <td className="border border-gray-300 dark:border-gray-600 p-3 text-gray-600 dark:text-gray-300">
                  {booking.flightDetails?.map((f, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <FaPlaneDeparture className="text-indigo-600 dark:text-indigo-400" />
                      {f.from} → <FaPlaneArrival className="text-indigo-600 dark:text-indigo-400" /> {f.to}
                    </div>
                  ))}
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-3 text-gray-600 dark:text-gray-300">
                  <span className={booking.status === "Pending" ? "text-yellow-600 dark:text-yellow-400" : "text-green-600 dark:text-green-400"}>
                    {booking.status}
                  </span>
                </td>
                <td className="border border-gray-300 dark:border-gray-600 p-3">
                  {booking.status === "Pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(booking.id)}
                        className="bg-green-600 text-white dark:bg-green-700 dark:text-gray-200 px-3 py-1 rounded hover:bg-green-700 dark:hover:bg-green-800"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(booking.id)}
                        className="bg-red-600 text-white dark:bg-red-700 dark:text-gray-200 px-3 py-1 rounded hover:bg-red-700 dark:hover:bg-red-800"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}