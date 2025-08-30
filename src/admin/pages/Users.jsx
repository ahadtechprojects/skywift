import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { collection, getDocs } from "firebase/firestore";
import { FaSearch } from "react-icons/fa";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        setUsers(usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    // Ensure name and email are strings, default to empty string if undefined
    const name = user.name || "";
    const email = user.email || "";
    return (
      name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">Users</h1>
      <div className="relative w-full max-w-md mb-6">
        <input
          type="text"
          placeholder="Search by name or email..."
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
              <th className="border border-gray-300 dark:border-gray-600 p-3 text-gray-800 dark:text-gray-200">ID</th>
              <th className="border border-gray-300 dark:border-gray-600 p-3 text-gray-800 dark:text-gray-200">Name</th>
              <th className="border border-gray-300 dark:border-gray-600 p-3 text-gray-800 dark:text-gray-200">Email</th>
              <th className="border border-gray-300 dark:border-gray-600 p-3 text-gray-800 dark:text-gray-200">Phone</th>
              <th className="border border-gray-300 dark:border-gray-600 p-3 text-gray-800 dark:text-gray-200">Registered</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-600">
                <td className="border border-gray-300 dark:border-gray-600 p-3 text-gray-600 dark:text-gray-300">{user.id}</td>
                <td className="border border-gray-300 dark:border-gray-600 p-3 text-gray-600 dark:text-gray-300">{user.name || "N/A"}</td>
                <td className="border border-gray-300 dark:border-gray-600 p-3 text-gray-600 dark:text-gray-300">{user.email || "N/A"}</td>
                <td className="border border-gray-300 dark:border-gray-600 p-3 text-gray-600 dark:text-gray-300">{user.phone || "N/A"}</td>
                <td className="border border-gray-300 dark:border-gray-600 p-3 text-gray-600 dark:text-gray-300">
                  {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : "N/A"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}