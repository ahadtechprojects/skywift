import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSearch } from "../context/SearchContext";
import { getAllFlights } from "../data/flightStore";
import { searchAirports } from "../data/airport";
import { dollar } from "../utils/format";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { FaSearch, FaPlane, FaUser, FaStar, FaGlobe, FaHeadset, FaTicketAlt, FaCommentDots, FaExchangeAlt, FaPhone, FaEnvelope } from "react-icons/fa";
import MergedAuthModal from "../components/MergedAuthModal";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

// Placeholder avatar SVG
const placeholderAvatar = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%239ca3af'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";

// Placeholder hero background SVG
const heroBackground = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath fill='%23ffffff33' d=%22M0 0h100v100H0z%22/%3E%3C/svg%3E";

export default function HomePage() {
  const { criteria, setCriteria, ready, searchFlights } = useSearch();
  const navigate = useNavigate();
  const [flights, setFlights] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [searchType, setSearchType] = useState("flights");
  const [passengerModalOpen, setPassengerModalOpen] = useState(false);
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [activeLegIndex, setActiveLegIndex] = useState(null);
  const [activeField, setActiveField] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const passengerModalRef = useRef();
  const fromInputRefs = useRef([]);
  const toInputRefs = useRef([]);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchFlights = async () => {
      try {
        if (!getAllFlights) {
          console.error("getAllFlights is undefined. Check import from flightStore.js");
          setErrorMessage("Unable to load flight deals. Please try again later.");
          return;
        }
        const allFlights = await getAllFlights();
        console.log("Fetched flights for carousel:", allFlights); // Debug log
        setFlights(allFlights.slice(0, 10)); // Show top 10 flights for carousel
      } catch (error) {
        console.error("Error fetching flights in useEffect:", error);
        setErrorMessage("Failed to load flight deals. Please ensure Firebase Emulator is running or check your network.");
        setFlights([]);
      }
    };
    fetchFlights();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (passengerModalRef.current && !passengerModalRef.current.contains(event.target)) {
        setPassengerModalOpen(false);
      }
      if (
        !fromInputRefs.current.some((ref) => ref && ref.contains(event.target)) &&
        !toInputRefs.current.some((ref) => ref && ref.contains(event.target))
      ) {
        setFromSuggestions([]);
        setToSuggestions([]);
        setActiveLegIndex(null);
        setActiveField(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!auth.currentUser) {
      setShowAuthModal(true);
      return;
    }
    if (searchType !== "flights") {
      setErrorMessage(`${searchType} search is coming soon!`);
      return;
    }

    // Validate criteria
    if (!criteria.legs || !Array.isArray(criteria.legs) || criteria.legs.length === 0) {
      setErrorMessage("Please fill in at least one flight leg.");
      return;
    }
    if (criteria.tripType === "multi-city" && criteria.legs.length < 2) {
      setErrorMessage("Multi-city requires at least two flight legs.");
      return;
    }
    for (const leg of criteria.legs) {
      if (!leg.from || !leg.to || !leg.departureDate) {
        setErrorMessage("Please fill in all fields for each flight leg.");
        return;
      }
    }
    if (criteria.tripType === "round-trip" && !criteria.returnDate) {
      setErrorMessage("Please select a return date for round-trip.");
      return;
    }

    // Store search in Firestore
    try {
      await addDoc(collection(db, "searches"), {
        userId: auth.currentUser.uid,
        timestamp: serverTimestamp(),
        searchType,
        tripType: criteria.tripType,
        legs: criteria.legs,
        returnDate: criteria.returnDate || null,
        passengers: criteria.passengers,
        cabin: criteria.cabin,
      });
    } catch (error) {
      console.error("Error saving search:", error);
      setErrorMessage("Failed to save search. Please ensure Firebase Emulator is running.");
      return;
    }

    // Fetch search results
    try {
      const results = await searchFlights();
      console.log("Search results:", results); // Debug log
      if (!results.outbound.length && !results.return.length && !results.legs.length) {
        setErrorMessage("No flights found. Try different dates or destinations.");
        return;
      }
      navigate("/results");
    } catch (error) {
      console.error("Error fetching flights:", error);
      setErrorMessage("Failed to fetch flights. Please ensure Firebase Emulator is running or check your network.");
    }
  };

  const handleAddLeg = () => {
    setCriteria({
      ...criteria,
      legs: [...criteria.legs, { from: "", to: "", departureDate: "" }],
    });
  };

  const handleRemoveLeg = (index) => {
    setCriteria({
      ...criteria,
      legs: criteria.legs.filter((_, i) => i !== index),
    });
  };

  const handleLegChange = async (index, field, value) => {
    const newLegs = [...criteria.legs];
    newLegs[index] = { ...newLegs[index], [field]: value };
    setCriteria({ ...criteria, legs: newLegs });

    // Debounce airport search
    if (value.length >= 3) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const suggestions = await searchAirports(value);
          console.log("Airport suggestions:", suggestions); // Debug log
          if (field === "from") {
            setFromSuggestions(suggestions);
            setActiveLegIndex(index);
            setActiveField("from");
          } else if (field === "to") {
            setToSuggestions(suggestions);
            setActiveLegIndex(index);
            setActiveField("to");
          }
        } catch (error) {
          console.error("Error fetching airport suggestions:", error);
          setErrorMessage("Failed to load airport suggestions. Please try again.");
          setFromSuggestions([]);
          setToSuggestions([]);
        }
      }, 500);
    } else {
      setFromSuggestions([]);
      setToSuggestions([]);
      clearTimeout(searchTimeoutRef.current);
    }
  };

  const handleSuggestionSelect = (index, field, airport) => {
    const newLegs = [...criteria.legs];
    newLegs[index] = { ...newLegs[index], [field]: airport.code };
    setCriteria({ ...criteria, legs: newLegs });
    setFromSuggestions([]);
    setToSuggestions([]);
    setActiveLegIndex(null);
    setActiveField(null);
  };

  const handleSwapFromTo = (index) => {
    const newLegs = [...criteria.legs];
    const temp = newLegs[index].from;
    newLegs[index].from = newLegs[index].to;
    newLegs[index].to = temp;
    setCriteria({ ...criteria, legs: newLegs });
  };

  const handlePassengerChange = (type, delta) => {
    setCriteria({
      ...criteria,
      passengers: {
        ...criteria.passengers,
        [type]: Math.max(0, (criteria.passengers[type] || 0) + delta),
      },
    });
  };

  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 2,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      { breakpoint: 1024, settings: { slidesToShow: 2 } },
      { breakpoint: 640, settings: { slidesToShow: 1 } },
    ],
  };

  if (!ready) return <p className="text-center mt-10 text-gray-600 dark:text-gray-300">Loading...</p>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-100 to-blue-200 dark:from-gray-900 dark:to-gray-800">
      {/* Error Message */}
      {errorMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          {errorMessage}
          <button
            className="ml-4 text-white hover:text-gray-200"
            onClick={() => setErrorMessage(null)}
          >
            ×
          </button>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-12 px-4 sm:px-6 bg-gradient-to-r from-indigo-600/90 to-cyan-500/90 dark:from-indigo-800/90 dark:to-cyan-700/90">
        <div className="absolute inset-0 bg-[url('')] bg-cover opacity-20"></div>
        <div className="relative max-w-6xl mx-auto text-center">
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white dark:text-gray-200 mb-2">Book Your Next Adventure</h1>
          <p className="text-lg text-white/90 dark:text-gray-300 mb-6">Cheap flights, seamless booking, and real-time tracking with SkySwift.</p>
          <div className="bg-white/10 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-6 shadow-lg border border-white/30 dark:border-gray-700/20">
            <div className="flex justify-center gap-4 mb-4">
              <button
                onClick={() => setSearchType("flights")}
                className={`px-4 py-2 rounded-md ${searchType === "flights" ? "bg-cyan-600 text-white dark:bg-cyan-700 dark:text-gray-200" : "bg-white/20 text-white/90 dark:bg-gray-700/20 dark:text-gray-300"}`}
              >
                Flights
              </button>
              <button
                onClick={() => setSearchType("hotels")}
                className={`px-4 py-2 rounded-md ${searchType === "hotels" ? "bg-cyan-600 text-white dark:bg-cyan-700 dark:text-gray-200" : "bg-white/20 text-white/90 dark:bg-gray-700/20 dark:text-gray-300"}`}
              >
                Hotels
              </button>
              <button
                onClick={() => setSearchType("packages")}
                className={`px-4 py-2 rounded-md ${searchType === "packages" ? "bg-cyan-600 text-white dark:bg-cyan-700 dark:text-gray-200" : "bg-white/20 text-white/90 dark:bg-gray-700/20 dark:text-gray-300"}`}
              >
                Packages
              </button>
            </div>
            <div className="flex justify-center gap-4 mb-4">
              <label className="flex items-center gap-2 text-white dark:text-gray-200">
                <input
                  type="radio"
                  name="tripType"
                  value="one-way"
                  checked={criteria.tripType === "one-way"}
                  onChange={() =>
                    setCriteria({
                      ...criteria,
                      tripType: "one-way",
                      legs: [
                        {
                          from: criteria.legs[0]?.from || "",
                          to: criteria.legs[0]?.to || "",
                          departureDate: criteria.legs[0]?.departureDate || "",
                        },
                      ],
                      returnDate: "",
                    })
                  }
                  className="text-cyan-600 focus:ring-cyan-300 dark:focus:ring-cyan-400"
                />
                One Way
              </label>
              <label className="flex items-center gap-2 text-white dark:text-gray-200">
                <input
                  type="radio"
                  name="tripType"
                  value="round-trip"
                  checked={criteria.tripType === "round-trip"}
                  onChange={() =>
                    setCriteria({
                      ...criteria,
                      tripType: "round-trip",
                      legs: [
                        {
                          from: criteria.legs[0]?.from || "",
                          to: criteria.legs[0]?.to || "",
                          departureDate: criteria.legs[0]?.departureDate || "",
                        },
                      ],
                    })
                  }
                  className="text-cyan-600 focus:ring-cyan-300 dark:focus:ring-cyan-400"
                />
                Round Trip
              </label>
              <label className="flex items-center gap-2 text-white dark:text-gray-200">
                <input
                  type="radio"
                  name="tripType"
                  value="multi-city"
                  checked={criteria.tripType === "multi-city"}
                  onChange={() =>
                    setCriteria({
                      ...criteria,
                      tripType: "multi-city",
                      legs: criteria.legs.length > 1 ? criteria.legs : [
                        { from: criteria.legs[0]?.from || "", to: "", departureDate: "" },
                        { from: "", to: "", departureDate: "" },
                      ],
                    })
                  }
                  className="text-cyan-600 focus:ring-cyan-300 dark:focus:ring-cyan-400"
                />
                Multi City
              </label>
            </div>
            <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-6 gap-4">
              {criteria.tripType === "multi-city" ? (
                criteria.legs.map((leg, index) => (
                  <div key={index} className="col-span-6 grid grid-cols-1 sm:grid-cols-6 gap-4 items-center">
                    <div className="col-span-2 relative" ref={(el) => (fromInputRefs.current[index] = el)}>
                      <input
                        type="text"
                        placeholder="From (e.g., Lagos)"
                        value={leg.from || ""}
                        onChange={(e) => handleLegChange(index, "from", e.target.value)}
                        className="w-full p-3 rounded-lg bg-white/20 dark:bg-gray-700/20 text-white dark:text-gray-200 placeholder-white/70 dark:placeholder-gray-300 border border-white/30 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:focus:ring-cyan-400"
                      />
                      {fromSuggestions.length > 0 && activeLegIndex === index && activeField === "from" && (
                        <ul className="absolute z-50 mt-1 w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg shadow-lg border border-white/30 dark:border-gray-700/20 max-h-60 overflow-y-auto">
                          {fromSuggestions.map((airport) => (
                            <li
                              key={airport.code}
                              onClick={() => handleSuggestionSelect(index, "from", airport)}
                              className="p-2 text-gray-800 dark:text-gray-200 hover:bg-cyan-100 dark:hover:bg-cyan-900 cursor-pointer"
                            >
                              {airport.city} ({airport.code})
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSwapFromTo(index)}
                      className="col-span-1 p-2 rounded-full bg-cyan-600/50 hover:bg-cyan-700/50 dark:bg-cyan-700/50 dark:hover:bg-cyan-800/50 text-white dark:text-gray-200 transition"
                    >
                      <FaExchangeAlt />
                    </button>
                    <div className="col-span-2 relative" ref={(el) => (toInputRefs.current[index] = el)}>
                      <input
                        type="text"
                        placeholder="To (e.g., New York)"
                        value={leg.to || ""}
                        onChange={(e) => handleLegChange(index, "to", e.target.value)}
                        className="w-full p-3 rounded-lg bg-white/20 dark:bg-gray-700/20 text-white dark:text-gray-200 placeholder-white/70 dark:placeholder-gray-300 border border-white/30 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:focus:ring-cyan-400"
                      />
                      {toSuggestions.length > 0 && activeLegIndex === index && activeField === "to" && (
                        <ul className="absolute z-50 mt-1 w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg shadow-lg border border-white/30 dark:border-gray-700/20 max-h-60 overflow-y-auto">
                          {toSuggestions.map((airport) => (
                            <li
                              key={airport.code}
                              onClick={() => handleSuggestionSelect(index, "to", airport)}
                              className="p-2 text-gray-800 dark:text-gray-200 hover:bg-cyan-100 dark:hover:bg-cyan-900 cursor-pointer"
                            >
                              {airport.city} ({airport.code})
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <input
                      type="date"
                      value={leg.departureDate || ""}
                      onChange={(e) => handleLegChange(index, "departureDate", e.target.value)}
                      className="col-span-1 p-3 rounded-lg bg-white/20 dark:bg-gray-700/20 text-white dark:text-gray-200 border border-white/30 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:focus:ring-cyan-400"
                    />
                    {index > 0 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLeg(index)}
                        className="col-span-1 p-2 text-red-400 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <>
                  <div className="col-span-2 relative" ref={(el) => (fromInputRefs.current[0] = el)}>
                    <input
                      type="text"
                      placeholder="From (e.g., Lagos)"
                      value={criteria.legs[0]?.from || ""}
                      onChange={(e) => handleLegChange(0, "from", e.target.value)}
                      className="w-full p-3 rounded-lg bg-white/20 dark:bg-gray-700/20 text-white dark:text-gray-200 placeholder-white/70 dark:placeholder-gray-300 border border-white/30 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:focus:ring-cyan-400"
                    />
                    {fromSuggestions.length > 0 && activeLegIndex === 0 && activeField === "from" && (
                      <ul className="absolute z-50 mt-1 w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg shadow-lg border border-white/30 dark:border-gray-700/20 max-h-60 overflow-y-auto">
                        {fromSuggestions.map((airport) => (
                          <li
                            key={airport.code}
                            onClick={() => handleSuggestionSelect(0, "from", airport)}
                            className="p-2 text-gray-800 dark:text-gray-200 hover:bg-cyan-100 dark:hover:bg-cyan-900 cursor-pointer"
                          >
                            {airport.city} ({airport.code})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSwapFromTo(0)}
                    className="col-span-1 p-2 rounded-full bg-cyan-600/50 hover:bg-cyan-700/50 dark:bg-cyan-700/50 dark:hover:bg-cyan-800/50 text-white dark:text-gray-200 transition"
                  >
                    <FaExchangeAlt />
                  </button>
                  <div className="col-span-2 relative" ref={(el) => (toInputRefs.current[0] = el)}>
                    <input
                      type="text"
                      placeholder="To (e.g., New York)"
                      value={criteria.legs[0]?.to || ""}
                      onChange={(e) => handleLegChange(0, "to", e.target.value)}
                      className="w-full p-3 rounded-lg bg-white/20 dark:bg-gray-700/20 text-white dark:text-gray-200 placeholder-white/70 dark:placeholder-gray-300 border border-white/30 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:focus:ring-cyan-400"
                    />
                    {toSuggestions.length > 0 && activeLegIndex === 0 && activeField === "to" && (
                      <ul className="absolute z-50 mt-1 w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg shadow-lg border border-white/30 dark:border-gray-700/20 max-h-60 overflow-y-auto">
                        {toSuggestions.map((airport) => (
                          <li
                            key={airport.code}
                            onClick={() => handleSuggestionSelect(0, "to", airport)}
                            className="p-2 text-gray-800 dark:text-gray-200 hover:bg-cyan-100 dark:hover:bg-cyan-900 cursor-pointer"
                          >
                            {airport.city} ({airport.code})
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <input
                    type="date"
                    value={criteria.legs[0]?.departureDate || ""}
                    onChange={(e) => handleLegChange(0, "departureDate", e.target.value)}
                    className="col-span-1 p-3 rounded-lg bg-white/20 dark:bg-gray-700/20 text-white dark:text-gray-200 border border-white/30 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:focus:ring-cyan-400"
                  />
                </>
              )}
              {criteria.tripType === "round-trip" && (
                <input
                  type="date"
                  placeholder="Return Date"
                  value={criteria.returnDate || ""}
                  onChange={(e) => setCriteria({ ...criteria, returnDate: e.target.value })}
                  className="col-span-2 p-3 rounded-lg bg-white/20 dark:bg-gray-700/20 text-white dark:text-gray-200 placeholder-white/70 dark:placeholder-gray-300 border border-white/30 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:focus:ring-cyan-400"
                />
              )}
              <div className="col-span-2 relative">
                <button
                  type="button"
                  onClick={() => setPassengerModalOpen(true)}
                  className="w-full p-3 rounded-lg bg-white/20 dark:bg-gray-700/20 text-white dark:text-gray-200 border border-white/30 dark:border-gray-600/30 hover:bg-white/30 dark:hover:bg-gray-600/30 transition text-left"
                >
                  {`Adults: ${criteria.passengers.adults}, Children: ${criteria.passengers.children}, Infants: ${criteria.passengers.infants}`}
                </button>
                {passengerModalOpen && (
                  <div ref={passengerModalRef} className="absolute z-50 mt-2 w-64 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-white/20 dark:border-gray-700/20 rounded-xl p-4 shadow-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-800 dark:text-gray-200">Adults (12+ years)</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handlePassengerChange("adults", -1)}
                          className="p-1 bg-cyan-600/50 text-white dark:bg-cyan-700/50 dark:text-gray-200 rounded"
                        >
                          -
                        </button>
                        <span className="text-gray-800 dark:text-gray-200">{criteria.passengers.adults}</span>
                        <button
                          type="button"
                          onClick={() => handlePassengerChange("adults", 1)}
                          className="p-1 bg-cyan-600/50 text-white dark:bg-cyan-700/50 dark:text-gray-200 rounded"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-800 dark:text-gray-200">Children (2-11 years)</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handlePassengerChange("children", -1)}
                          className="p-1 bg-cyan-600/50 text-white dark:bg-cyan-700/50 dark:text-gray-200 rounded"
                        >
                          -
                        </button>
                        <span className="text-gray-800 dark:text-gray-200">{criteria.passengers.children}</span>
                        <button
                          type="button"
                          onClick={() => handlePassengerChange("children", 1)}
                          className="p-1 bg-cyan-600/50 text-white dark:bg-cyan-700/50 dark:text-gray-200 rounded"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-800 dark:text-gray-200">Infants (0-23 months)</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handlePassengerChange("infants", -1)}
                          className="p-1 bg-cyan-600/50 text-white dark:bg-cyan-700/50 dark:text-gray-200 rounded"
                        >
                          -
                        </button>
                        <span className="text-gray-800 dark:text-gray-200">{criteria.passengers.infants}</span>
                        <button
                          type="button"
                          onClick={() => handlePassengerChange("infants", 1)}
                          className="p-1 bg-cyan-600/50 text-white dark:bg-cyan-700/50 dark:text-gray-200 rounded"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => setPassengerModalOpen(false)}
                      className="w-full mt-2 p-2 bg-cyan-600 text-white dark:bg-cyan-700 dark:text-gray-200 rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-800 transition"
                    >
                      Done
                    </button>
                  </div>
                )}
              </div>
              <select
                value={criteria.cabin}
                onChange={(e) => setCriteria({ ...criteria, cabin: e.target.value })}
                className="col-span-2 p-3 rounded-lg bg-white/20 dark:bg-gray-700/20 text-white dark:text-gray-200 border border-white/30 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-cyan-300 dark:focus:ring-cyan-400"
              >
                <option value="economy">Economy</option>
                <option value="premium">Premium Economy</option>
                <option value="business">Business</option>
                <option value="first">First Class</option>
              </select>
              <button
                type="submit"
                className="col-span-2 bg-cyan-600 text-white dark:bg-cyan-700 dark:text-gray-200 px-6 py-3 rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-800 transition flex items-center justify-center gap-2"
              >
                <FaSearch /> Search
              </button>
              {criteria.tripType === "multi-city" && (
                <button
                  type="button"
                  onClick={handleAddLeg}
                  className="col-span-2 bg-indigo-600/50 text-white dark:bg-indigo-700/50 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-indigo-700/50 dark:hover:bg-indigo-800/50 transition"
                >
                  Add Flight
                </button>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Promotional Carousel */}
      <section className="py-12 px-4 sm:px-6 bg-gradient-to-b from-cyan-100 to-blue-200 dark:from-gray-900 dark:to-gray-800">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">Exclusive Deals</h2>
        {flights.length > 0 ? (
          <Slider {...carouselSettings} className="max-w-5xl mx-auto">
            {flights.map((flight) => (
              <div key={flight.id} className="px-2">
                <div className="bg-white/10 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-4 shadow-lg border border-white/30 dark:border-gray-700/20">
                  <p className="font-semibold text-lg text-gray-800 dark:text-gray-200">{flight.airline}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                    <FaPlane className="text-cyan-600 dark:text-cyan-400" /> {flight.from} ↔ {flight.to}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{flight.departDate}</p>
                  <p className="text-lg font-semibold text-cyan-700 dark:text-cyan-400 mt-2">{dollar(flight.priceUSD)}</p>
                  <Link
                    to={`/flight/${flight.id}`}
                    className="mt-2 block bg-cyan-600 text-white dark:bg-cyan-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-800 transition text-center"
                  >
                    Book Now
                  </Link>
                </div>
              </div>
            ))}
          </Slider>
        ) : (
          <p className="text-center text-gray-600 dark:text-gray-300">No deals available at the moment. Please check back later.</p>
        )}
        <div className="text-center mt-6">
          <Link to="/results" className="text-cyan-600 dark:text-cyan-400 underline hover:text-cyan-700 dark:hover:text-cyan-300">See More Deals</Link>
        </div>
      </section>

      {/* Scorecards */}
      <section className="py-12 px-4 sm:px-6 bg-gradient-to-b from-blue-100/50 to-cyan-100/50 dark:from-gray-800/50 dark:to-gray-900/50">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">Why Choose SkySwift?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <div className="bg-white/10 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-6 text-center shadow-lg border border-white/30 dark:border-gray-700/20">
            <FaGlobe className="text-4xl text-cyan-600 dark:text-cyan-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">500+ Destinations</h3>
            <p className="text-gray-600 dark:text-gray-300">Explore cities worldwide.</p>
          </div>
          <div className="bg-white/10 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-6 text-center shadow-lg border border-white/30 dark:border-gray-700/20">
            <FaTicketAlt className="text-4xl text-cyan-600 dark:text-cyan-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">100,000+ Bookings</h3>
            <p className="text-gray-600 dark:text-gray-300">Trusted by travelers globally.</p>
          </div>
          <div className="bg-white/10 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-6 text-center shadow-lg border border-white/30 dark:border-gray-700/20">
            <FaHeadset className="text-4xl text-cyan-600 dark:text-cyan-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">24/7 Support</h3>
            <p className="text-gray-600 dark:text-gray-300">Assistance anytime, anywhere.</p>
          </div>
          <div className="bg-white/10 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-6 text-center shadow-lg border border-white/30 dark:border-gray-700/20">
            <FaStar className="text-4xl text-cyan-600 dark:text-cyan-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Top-Rated</h3>
            <p className="text-gray-600 dark:text-gray-300">4.8/5 from thousands of reviews.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 px-4 sm:px-6 bg-gradient-to-b from-cyan-100 to-blue-200 dark:from-gray-900 dark:to-gray-800">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-gray-800 dark:text-gray-200">What Our Customers Say</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <div className="bg-white/10 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-6 shadow-lg border border-white/30 dark:border-gray-700/20">
            <div className="flex items-center mb-4">
              <img src={placeholderAvatar} alt="User" className="w-12 h-12 rounded-full mr-4" />
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Sarah Johnson</h3>
                <div className="flex gap-1 text-yellow-400 dark:text-yellow-300">
                  {[...Array(5)].map((_, i) => <FaStar key={i} />)}
                </div>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300">"SkySwift’s deals are unbeatable! Booking was so easy."</p>
          </div>
          <div className="bg-white/10 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-6 shadow-lg border border-white/30 dark:border-gray-700/20">
            <div className="flex items-center mb-4">
              <img src={placeholderAvatar} alt="User" className="w-12 h-12 rounded-full mr-4" />
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Michael Chen</h3>
                <div className="flex gap-1 text-yellow-400 dark:text-yellow-300">
                  {[...Array(4)].map((_, i) => <FaStar key={i} />)}
                  <FaStar className="text-gray-300 dark:text-gray-500" />
                </div>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300">"Fast, reliable, and great customer support!"</p>
          </div>
          <div className="bg-white/10 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-6 shadow-lg border border-white/30 dark:border-gray-700/20">
            <div className="flex items-center mb-4">
              <img src={placeholderAvatar} alt="User" className="w-12 h-12 rounded-full mr-4" />
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Aisha Khan</h3>
                <div className="flex gap-1 text-yellow-400 dark:text-yellow-300">
                  {[...Array(5)].map((_, i) => <FaStar key={i} />)}
                </div>
              </div>
            </div>
            <p className="text-gray-600 dark:text-gray-300">"The platform is intuitive, and tracking is a game-changer!"</p>
          </div>
        </div>
      </section>

      {/* Review Card */}
      <section className="py-12 px-4 sm:px-6 bg-gradient-to-b from-cyan-100/50 to-blue-100/50 dark:from-gray-800/50 dark:to-gray-900/50">
        <div className="max-w-4xl mx-auto text-center bg-white/10 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-8 shadow-lg border border-white/30 dark:border-gray-700/20">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4">Trusted by Thousands</h2>
          <div className="flex justify-center gap-2 mb-4">
            {[...Array(4)].map((_, i) => <FaStar key={i} className="text-yellow-400 dark:text-yellow-300 text-2xl" />)}
            <FaStar className="text-yellow-400/50 dark:text-yellow-300/50 text-2xl" />
          </div>
          <p className="text-xl font-semibold text-gray-800 dark:text-gray-200">4.8/5 from 10,000+ reviews</p>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Join millions of travelers who trust SkySwift for affordable flights.</p>
          <Link
            to="/search"
            className="mt-4 inline-block bg-cyan-600 text-white dark:bg-cyan-700 dark:text-gray-200 px-6 py-3 rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-800 transition"
          >
            Book Now
          </Link>
        </div>
      </section>

      {/* Promotional Banner */}
      <section className="py-12 px-4 sm:px-6 text-center bg-gradient-to-r from-indigo-600/90 to-cyan-500/90 dark:from-indigo-800/90 dark:to-cyan-700/90">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-white dark:text-gray-200 mb-4">Save Big on Round-Trip Flights</h2>
          <p className="text-lg text-white/90 dark:text-gray-300 mb-6">Explore top destinations with exclusive deals!</p>
          <div className="flex justify-center gap-4">
            <Link
              to="/search"
              className="bg-white dark:bg-gray-800 text-cyan-600 dark:text-cyan-400 px-6 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition font-semibold"
            >
              Find Deals
            </Link>
            {!auth.currentUser && (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-cyan-600 text-white dark:bg-cyan-700 dark:text-gray-200 px-6 py-3 rounded-lg hover:bg-cyan-700 dark:hover:bg-cyan-800 transition flex items-center gap-2"
              >
                <FaUser /> Sign In
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Hovering Customer Care Button */}
      <button
        onClick={() => setShowSupportModal(true)}
        className="fixed bottom-6 right-6 bg-cyan-600 text-white dark:bg-cyan-700 dark:text-gray-200 p-4 rounded-full shadow-lg hover:bg-cyan-700 dark:hover:bg-cyan-800 transition-all duration-300 hover:scale-110"
      >
        <FaCommentDots className="text-2xl" />
      </button>

      {/* Support Modal */}
      {showSupportModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center">
          <div className="bg-white/10 dark:bg-gray-800/90 backdrop-blur-md rounded-xl p-6 w-80 border border-white/30 dark:border-gray-700/20">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Customer Support</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">Need help? Contact our 24/7 support team:</p>
            <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <FaPhone /> +1-800-SKY-SWIFT
            </p>
            <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
              <FaEnvelope /> support@skyswift.com
            </p>
            <button
              onClick={() => setShowSupportModal(false)}
              className="mt-4 w-full bg-red-600 text-white dark:bg-red-700 dark:text-gray-200 p-3 rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <MergedAuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            handleSearch({ preventDefault: () => {} });
          }}
        />
      )}
    </div>
  );
}