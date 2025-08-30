// src/pages/FlightsPage.jsx
import React, { useEffect, useState } from "react";
import { getAllFlights } from "../stores/flightStore";
import { auth } from "../firebase";

const FlightsPage = () => {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const allFlights = await getAllFlights();
          setFlights(allFlights);
          setError("");
        } catch (err) {
          setError(err.message);
        }
      } else {
        setError("You must be logged in to view flights.");
        setFlights([]);
      }
      setLoading(false);
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []);

  if (loading) return <p>Loading flights...</p>;

  return (
    <div>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {flights.length > 0 ? (
        <ul>
          {flights.map((flight, i) => (
            <li key={i}>
              {flight.name} — {flight.destination}
            </li>
          ))}
        </ul>
      ) : (
        !error && <p>No flights available.</p>
      )}
    </div>
  );
};

export default FlightsPage;
