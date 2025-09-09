import React, { useState } from "react";
import { downloadFlightsCSV } from "../data/flights";

const DownloadFlightsButton = () => {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => {
      downloadFlightsCSV();
      setLoading(false);
    }, 800); // simulate small delay
  };

  return (
    <button
      onClick={handleClick}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      disabled={loading}
    >
      {loading ? "Preparing..." : "Download Flights CSV"}
    </button>
  );
};

export default DownloadFlightsButton;
