import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { FaUser, FaEnvelope, FaPhone, FaCog, FaTimes } from "react-icons/fa";

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        const docRef = doc(db, "users", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);
          setFormData({ name: data.name, email: data.email, phone: data.phone });
        }
      }
      setLoading(false);
    };
    fetchUserData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      const docRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(docRef, { ...formData });
      setUserData({ ...userData, ...formData });
      setShowSettings(false);
    } catch (err) {
      console.error("Error updating profile:", err);
    } finally {
      setSaving(false);
    }
  };

  if (!auth.currentUser) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center text-gray-600 dark:text-gray-300">
        Please sign in to view your profile.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center text-gray-600 dark:text-gray-300">
        Loading profile...
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-gray-600 dark:text-gray-300">
        <p className="text-xl font-semibold">No profile data found.</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto bg-gradient-to-b from-cyan-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 p-6 min-h-[100vh]">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold mb-6 text-center flex-1 text-gray-800 dark:text-gray-200">My Profile</h1>
          <button
            onClick={() => setShowSettings(true)}
            className="bg-indigo-600 text-white dark:bg-indigo-700 dark:text-gray-200 p-2 rounded-full hover:bg-indigo-700 dark:hover:bg-indigo-800 transition flex items-center gap-2"
          >
            <FaCog /> Settings
          </button>
        </div>

        <div className="bg-white/10 dark:bg-gray-800/90 border border-white/30 dark:border-gray-700/20 shadow-lg rounded-xl p-6 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <FaUser className="text-indigo-600 dark:text-indigo-400 text-xl" />
            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">{userData.name}</p>
          </div>

          <div className="flex items-center gap-3">
            <FaEnvelope className="text-indigo-600 dark:text-indigo-400 text-xl" />
            <p className="text-gray-600 dark:text-gray-300">{userData.email}</p>
          </div>

          <div className="flex items-center gap-3">
            <FaPhone className="text-indigo-600 dark:text-indigo-400 text-xl" />
            <p className="text-gray-600 dark:text-gray-300">{userData.phone}</p>
          </div>

          {userData.passengers && (
            <div className="flex items-center gap-3">
              <FaUser className="text-indigo-600 dark:text-indigo-400 text-xl" />
              <p className="text-gray-600 dark:text-gray-300">{userData.passengers} Passenger(s)</p>
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white/10 dark:bg-gray-800/90 border border-white/30 dark:border-gray-700/20 shadow-lg rounded-xl p-6 w-full max-w-md relative animate-fade-in">
            <button
              onClick={() => setShowSettings(false)}
              className="absolute top-3 right-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <FaTimes />
            </button>
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-800 dark:text-gray-200">Edit Profile</h2>

            <div className="flex flex-col gap-4">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full Name"
                className="border rounded px-3 py-2 bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400"
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="border rounded px-3 py-2 bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400"
              />
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Phone"
                className="border rounded px-3 py-2 bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400"
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 text-white dark:bg-indigo-700 dark:text-gray-200 px-4 py-2 rounded hover:bg-indigo-700 dark:hover:bg-indigo-800 transition mt-2 disabled:opacity-50 dark:disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}