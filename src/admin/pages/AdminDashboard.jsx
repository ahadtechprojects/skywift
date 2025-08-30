// src/admin/components/AdminDashboard.jsx
import { useState, useEffect } from 'react'; // Add this import
import { Outlet, Navigate } from 'react-router-dom';
import { auth, db } from '../../firebase.js'; // Adjust path if needed
import { getDoc, doc } from 'firebase/firestore'; // Import Firestore functions
import Sidebar from '../components/Sidebar';
import Users from './Users.jsx';

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists() && userDoc.data().role === 'admin') {
          setIsAdmin(true);
        }
      }
      setLoading(false);
    };
    checkAdmin();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!isAdmin) return <Navigate to="/" />;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <div className="flex-1 p-6 overflow-auto">
        <Outlet />
        
      </div>
    </div>
  );
}