import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { FaExclamationTriangle } from "react-icons/fa";

export default function PrivateAdminRoute() {
  const [isAdmin, setIsAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      console.log("Checking auth:", auth.currentUser);
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        console.log("User doc:", userDoc.exists(), userDoc.data());
        setIsAdmin(userDoc.exists() && userDoc.data().role === "admin");
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    };
    checkAdmin().catch(error => {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 text-gray-600 dark:text-gray-300">
        <div className="text-center">
          <FaExclamationTriangle className="text-4xl mb-4 animate-spin text-indigo-600 dark:text-indigo-400" />
          <p>Checking admin access...</p>
        </div>
      </div>
    );
  }

  return isAdmin ? <Outlet /> : <Navigate to="/admin/login" />;
}