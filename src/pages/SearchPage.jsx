import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { useSearch } from "../context/SearchContext";
import { useLoading } from "../context/LoadingContext";
import { ThemeContext } from "../context/ThemeContext";
import { searchAirports } from "../data/airport";
import { FaPlaneDeparture, FaPlaneArrival, FaCalendar, FaUsers, FaPlus, FaTrash, FaExchangeAlt } from "react-icons/fa";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function SearchPage() {
  const { theme } = useContext(ThemeContext);
  const searchContext = useSearch();
  console.log("SearchContext value:", searchContext); // Debug log
  const { criteria, setCriteria } = searchContext || {};
  const { showLoading, hideLoading } = useLoading() || { showLoading: () => {}, hideLoading: () => {} };
  const navigate = useNavigate();
  const defaultCriteria = {
    tripType: "one-way",
    legs: [{ from: "", to: "", departureDate: "" }],
    returnDate: "",
    passengers: { adults: 1, children: 0, infants: 0 },
    cabin: "economy",
  };
  const [localCriteria, setLocalCriteria] = useState({
    searchType: "flights",
    tripType: criteria?.tripType || defaultCriteria.tripType,
    legs: criteria?.legs?.length > 0 ? criteria.legs : defaultCriteria.legs,
    returnDate: criteria?.returnDate || defaultCriteria.returnDate,
    passengers: criteria?.passengers || defaultCriteria.passengers,
    cabin: criteria?.cabin || defaultCriteria.cabin,
  });
  const [errors, setErrors] = useState({});
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [activeLegIndex, setActiveLegIndex] = useState(null);
  const [activeField, setActiveField] = useState(null);
  const [passengerModalOpen, setPassengerModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const passengerModalRef = useRef();
  const fromInputRefs = useRef([]);
  const toInputRefs = useRef([]);
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    if (!searchContext) {
      console.error("SearchContext is undefined. Ensure SearchPage is wrapped in SearchProvider.");
      setErrorMessage("Search functionality is unavailable. Please try again later.");
    }
  }, [searchContext]);

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

  const handleLegChange = async (index, field, value) => {
    const newLegs = [...localCriteria.legs];
    newLegs[index] = { ...newLegs[index], [field]: value };
    setLocalCriteria({ ...localCriteria, legs: newLegs });

    if (field === "from" || field === "to") {
      if (value.length >= 3) {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(async () => {
          try {
            showLoading();
            const suggestions = await searchAirports(value);
            if (field === "from") {
              setFromSuggestions(suggestions);
              setActiveLegIndex(index);
              setActiveField("from");
            } else {
              setToSuggestions(suggestions);
              setActiveLegIndex(index);
              setActiveField("to");
            }
          } catch (error) {
            console.error("Error fetching airport suggestions:", error);
            setErrorMessage("Failed to load airport suggestions.");
          } finally {
            hideLoading();
          }
        }, 500);
      } else {
        setFromSuggestions([]);
        setToSuggestions([]);
        clearTimeout(searchTimeoutRef.current);
      }
    }
  };

  const handleSuggestionSelect = (index, field, airport) => {
    const newLegs = [...localCriteria.legs];
    newLegs[index] = { ...newLegs[index], [field]: airport.code };
    setLocalCriteria({ ...localCriteria, legs: newLegs });
    setFromSuggestions([]);
    setToSuggestions([]);
    setActiveLegIndex(null);
    setActiveField(null);
  };

  const handleSwapFromTo = (index) => {
    const newLegs = [...localCriteria.legs];
    const temp = newLegs[index].from;
    newLegs[index].from = newLegs[index].to;
    newLegs[index].to = temp;
    setLocalCriteria({ ...localCriteria, legs: newLegs });
  };

  const handleAddLeg = () => {
    setLocalCriteria({
      ...localCriteria,
      legs: [...localCriteria.legs, { from: "", to: "", departureDate: "" }],
    });
  };

  const handleRemoveLeg = (index) => {
    setLocalCriteria({
      ...localCriteria,
      legs: localCriteria.legs.filter((_, i) => i !== index),
    });
  };

  const handlePassengerChange = (type, delta) => {
    setLocalCriteria({
      ...localCriteria,
      passengers: {
        ...localCriteria.passengers,
        [type]: Math.max(0, (localCriteria.passengers[type] || 0) + delta),
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    const errs = {};

    if (!auth.currentUser) {
      navigate("/login");
      return;
    }

    if (localCriteria.legs.length === 0) {
      errs.legs = "At least one flight leg is required.";
    } else {
      localCriteria.legs.forEach((leg, index) => {
        if (!leg.from) errs[`from${index}`] = "Required";
        if (!leg.to) errs[`to${index}`] = "Required";
        if (!leg.departureDate) errs[`date${index}`] = "Pick a date";
        if (leg.from && leg.to && leg.from === leg.to) {
          errs[`to${index}`] = "Choose a different destination";
        }
      });
    }

    if (localCriteria.tripType === "multi-city" && localCriteria.legs.length < 2) {
      errs.legs = "Multi-city requires at least two flight legs.";
    }

    if (localCriteria.tripType === "round-trip" && !localCriteria.returnDate) {
      errs.returnDate = "Pick a return date";
    }

    if (localCriteria.passengers.adults < 1) {
      errs.passengers = "At least one adult passenger is required.";
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setErrorMessage("Please complete the search form to find flights.");
      return;
    }

    if (!setCriteria) {
      console.error("setCriteria is undefined. Cannot save search criteria.");
      setErrorMessage("Search functionality is unavailable. Please try again later.");
      return;
    }

    try {
      showLoading();
      console.log("Saving search with criteria:", localCriteria);
      await addDoc(collection(db, "searches"), {
        userId: auth.currentUser.uid,
        timestamp: serverTimestamp(),
        searchType: localCriteria.searchType,
        tripType: localCriteria.tripType,
        legs: localCriteria.legs,
        returnDate: localCriteria.returnDate || null,
        passengers: localCriteria.passengers,
        cabin: localCriteria.cabin,
      });

      setCriteria(localCriteria);
      navigate("/results");
    } catch (error) {
      console.error("Error saving search:", error);
      setErrorMessage("Failed to save search. Please try again.");
    } finally {
      hideLoading();
    }
  };

  if (!searchContext) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cyan-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 px-4 py-10">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-8 text-gray-800 dark:text-gray-200">Search Flights</h1>
          <p className="text-red-600 dark:text-red-400">Error: Search functionality is unavailable. Please ensure the app is properly configured.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-100 to-blue-200 dark:from-gray-900 dark:to-gray-800 px-4 py-10">
      <div className="max-w-6xl mx-auto">
        {errorMessage && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 dark:bg-red-700 text-white dark:text-gray-200 px-4 py-2 rounded-lg shadow-lg z-50">
            {errorMessage}
            <button
              className="ml-4 text-white dark:text-gray-200 hover:text-gray-300 dark:hover:text-gray-300"
              onClick={() => setErrorMessage(null)}
            >
              ×
            </button>
          </div>
        )}
        <h1 className="text-3xl font-bold mb-8 text-center text-gray-800 dark:text-gray-200">Search Flights</h1>
        <form onSubmit={handleSubmit} className="bg-white/10 dark:bg-gray-800/10 backdrop-blur-md rounded-xl p-6 sm:p-8 shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="mb-6 flex justify-center gap-4">
            <label className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <input
                type="radio"
                name="tripType"
                value="one-way"
                checked={localCriteria.tripType === "one-way"}
                onChange={() =>
                  setLocalCriteria({
                    ...localCriteria,
                    tripType: "one-way",
                    legs: [{ from: localCriteria.legs[0]?.from || "", to: localCriteria.legs[0]?.to || "", departureDate: localCriteria.legs[0]?.departureDate || "" }],
                    returnDate: "",
                  })
                }
                className="text-indigo-600 dark:text-indigo-400 focus:ring-indigo-300 dark:focus:ring-indigo-400"
              />
              One Way
            </label>
            <label className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <input
                type="radio"
                name="tripType"
                value="round-trip"
                checked={localCriteria.tripType === "round-trip"}
                onChange={() =>
                  setLocalCriteria({
                    ...localCriteria,
                    tripType: "round-trip",
                    legs: [{ from: localCriteria.legs[0]?.from || "", to: localCriteria.legs[0]?.to || "", departureDate: localCriteria.legs[0]?.departureDate || "" }],
                  })
                }
                className="text-indigo-600 dark:text-indigo-400 focus:ring-indigo-300 dark:focus:ring-indigo-400"
              />
              Round Trip
            </label>
            <label className="flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <input
                type="radio"
                name="tripType"
                value="multi-city"
                checked={localCriteria.tripType === "multi-city"}
                onChange={() =>
                  setLocalCriteria({
                    ...localCriteria,
                    tripType: "multi-city",
                    legs: localCriteria.legs.length > 1 ? localCriteria.legs : [
                      { from: localCriteria.legs[0]?.from || "", to: "", departureDate: "" },
                      { from: "", to: "", departureDate: "" },
                    ],
                  })
                }
                className="text-indigo-600 dark:text-indigo-400 focus:ring-indigo-300 dark:focus:ring-indigo-400"
              />
              Multi City
            </label>
          </div>

          <div className="grid gap-6">
            {localCriteria.tripType === "multi-city" ? (
              localCriteria.legs.map((leg, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-6 gap-4 items-center">
                  <div className="col-span-2 relative" ref={(el) => (fromInputRefs.current[index] = el)}>
                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700">
                      <FaPlaneDeparture className="text-indigo-600 dark:text-indigo-400 ml-3" />
                      <input
                        type="text"
                        placeholder="From (e.g., Lagos)"
                        value={leg.from || ""}
                        onChange={(e) => handleLegChange(index, "from", e.target.value)}
                        className={`w-full p-3 rounded-lg bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400 ${errors[`from${index}`] ? "border-red-500 dark:border-red-400" : ""}`}
                      />
                    </div>
                    {fromSuggestions.length > 0 && activeLegIndex === index && activeField === "from" && (
                      <ul className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                        {fromSuggestions.map((airport) => (
                          <li
                            key={airport.code}
                            onClick={() => handleSuggestionSelect(index, "from", airport)}
                            className="p-2 text-gray-800 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-700 cursor-pointer"
                          >
                            {airport.city} ({airport.code})
                          </li>
                        ))}
                      </ul>
                    )}
                    {errors[`from${index}`] && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors[`from${index}`]}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSwapFromTo(index)}
                    className="col-span-1 p-2 rounded-full bg-indigo-600/50 dark:bg-indigo-700/50 text-white dark:text-gray-200 hover:bg-indigo-700/50 dark:hover:bg-indigo-600/50 transition"
                  >
                    <FaExchangeAlt />
                  </button>
                  <div className="col-span-2 relative" ref={(el) => (toInputRefs.current[index] = el)}>
                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700">
                      <FaPlaneArrival className="text-indigo-600 dark:text-indigo-400 ml-3" />
                      <input
                        type="text"
                        placeholder="To (e.g., New York)"
                        value={leg.to || ""}
                        onChange={(e) => handleLegChange(index, "to", e.target.value)}
                        className={`w-full p-3 rounded-lg bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400 ${errors[`to${index}`] ? "border-red-500 dark:border-red-400" : ""}`}
                      />
                    </div>
                    {toSuggestions.length > 0 && activeLegIndex === index && activeField === "to" && (
                      <ul className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                        {toSuggestions.map((airport) => (
                          <li
                            key={airport.code}
                            onClick={() => handleSuggestionSelect(index, "to", airport)}
                            className="p-2 text-gray-800 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-700 cursor-pointer"
                          >
                            {airport.city} ({airport.code})
                          </li>
                        ))}
                      </ul>
                    )}
                    {errors[`to${index}`] && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors[`to${index}`]}</p>}
                  </div>
                  <div className="col-span-1">
                    <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700">
                      <FaCalendar className="text-indigo-600 dark:text-indigo-400 ml-3" />
                      <input
                        type="date"
                        value={leg.departureDate || ""}
                        onChange={(e) => handleLegChange(index, "departureDate", e.target.value)}
                        className={`w-full p-3 rounded-lg bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400 ${errors[`date${index}`] ? "border-red-500 dark:border-red-400" : ""}`}
                      />
                    </div>
                    {errors[`date${index}`] && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors[`date${index}`]}</p>}
                  </div>
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLeg(index)}
                      className="col-span-1 p-2 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 items-center">
                <div className="col-span-2 relative" ref={(el) => (fromInputRefs.current[0] = el)}>
                  <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <FaPlaneDeparture className="text-indigo-600 dark:text-indigo-400 ml-3" />
                    <input
                      type="text"
                      placeholder="From (e.g., Lagos)"
                      value={localCriteria.legs[0]?.from || ""}
                      onChange={(e) => handleLegChange(0, "from", e.target.value)}
                      className={`w-full p-3 rounded-lg bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400 ${errors.from0 ? "border-red-500 dark:border-red-400" : ""}`}
                    />
                  </div>
                  {fromSuggestions.length > 0 && activeLegIndex === 0 && activeField === "from" && (
                    <ul className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                      {fromSuggestions.map((airport) => (
                        <li
                          key={airport.code}
                          onClick={() => handleSuggestionSelect(0, "from", airport)}
                          className="p-2 text-gray-800 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-700 cursor-pointer"
                        >
                          {airport.city} ({airport.code})
                        </li>
                      ))}
                    </ul>
                  )}
                  {errors.from0 && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.from0}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => handleSwapFromTo(0)}
                  className="col-span-1 p-2 rounded-full bg-indigo-600/50 dark:bg-indigo-700/50 text-white dark:text-gray-200 hover:bg-indigo-700/50 dark:hover:bg-indigo-600/50 transition"
                >
                  <FaExchangeAlt />
                </button>
                <div className="col-span-2 relative" ref={(el) => (toInputRefs.current[0] = el)}>
                  <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <FaPlaneArrival className="text-indigo-600 dark:text-indigo-400 ml-3" />
                    <input
                      type="text"
                      placeholder="To (e.g., New York)"
                      value={localCriteria.legs[0]?.to || ""}
                      onChange={(e) => handleLegChange(0, "to", e.target.value)}
                      className={`w-full p-3 rounded-lg bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400 ${errors.to0 ? "border-red-500 dark:border-red-400" : ""}`}
                    />
                  </div>
                  {toSuggestions.length > 0 && activeLegIndex === 0 && activeField === "to" && (
                    <ul className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto">
                      {toSuggestions.map((airport) => (
                        <li
                          key={airport.code}
                          onClick={() => handleSuggestionSelect(0, "to", airport)}
                          className="p-2 text-gray-800 dark:text-gray-200 hover:bg-indigo-100 dark:hover:bg-indigo-700 cursor-pointer"
                        >
                          {airport.city} ({airport.code})
                        </li>
                      ))}
                    </ul>
                  )}
                  {errors.to0 && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.to0}</p>}
                </div>
                <div className="col-span-1">
                  <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <FaCalendar className="text-indigo-600 dark:text-indigo-400 ml-3" />
                    <input
                      type="date"
                      value={localCriteria.legs[0]?.departureDate || ""}
                      onChange={(e) => handleLegChange(0, "departureDate", e.target.value)}
                      className={`w-full p-3 rounded-lg bg-transparent text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400 ${errors.date0 ? "border-red-500 dark:border-red-400" : ""}`}
                    />
                  </div>
                  {errors.date0 && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.date0}</p>}
                </div>
              </div>
            )}
            {localCriteria.tripType === "round-trip" && (
              <div className="grid grid-cols-1 sm:grid-cols-6 gap-4">
                <div className="col-span-2">
                  <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700">
                    <FaCalendar className="text-indigo-600 dark:text-indigo-400 ml-3" />
                    <input
                      type="date"
                      placeholder="Return Date"
                      value={localCriteria.returnDate || ""}
                      onChange={(e) => setLocalCriteria({ ...localCriteria, returnDate: e.target.value })}
                      className={`w-full p-3 rounded-lg bg-transparent text-gray-800 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400 ${errors.returnDate ? "border-red-500 dark:border-red-400" : ""}`}
                    />
                  </div>
                  {errors.returnDate && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.returnDate}</p>}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 items-center">
              <div className="col-span-2 relative">
                <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700">
                  <FaUsers className="text-indigo-600 dark:text-indigo-400 ml-3" />
                  <button
                    type="button"
                    onClick={() => setPassengerModalOpen(true)}
                    className="w-full p-3 text-gray-800 dark:text-gray-200 text-left bg-transparent focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400"
                  >
                    {`Adults: ${localCriteria.passengers.adults}, Children: ${localCriteria.passengers.children}, Infants: ${localCriteria.passengers.infants}`}
                  </button>
                </div>
                {passengerModalOpen && (
                  <div ref={passengerModalRef} className="absolute z-50 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-800 dark:text-gray-200">Adults (12+ years)</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handlePassengerChange("adults", -1)}
                          className="p-1 bg-indigo-600/50 dark:bg-indigo-700/50 text-white dark:text-gray-200 rounded hover:bg-indigo-700/50 dark:hover:bg-indigo-600/50"
                        >
                          -
                        </button>
                        <span className="text-gray-800 dark:text-gray-200">{localCriteria.passengers.adults}</span>
                        <button
                          type="button"
                          onClick={() => handlePassengerChange("adults", 1)}
                          className="p-1 bg-indigo-600/50 dark:bg-indigo-700/50 text-white dark:text-gray-200 rounded hover:bg-indigo-700/50 dark:hover:bg-indigo-600/50"
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
                          className="p-1 bg-indigo-600/50 dark:bg-indigo-700/50 text-white dark:text-gray-200 rounded hover:bg-indigo-700/50 dark:hover:bg-indigo-600/50"
                        >
                          -
                        </button>
                        <span className="text-gray-800 dark:text-gray-200">{localCriteria.passengers.children}</span>
                        <button
                          type="button"
                          onClick={() => handlePassengerChange("children", 1)}
                          className="p-1 bg-indigo-600/50 dark:bg-indigo-700/50 text-white dark:text-gray-200 rounded hover:bg-indigo-700/50 dark:hover:bg-indigo-600/50"
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
                          className="p-1 bg-indigo-600/50 dark:bg-indigo-700/50 text-white dark:text-gray-200 rounded hover:bg-indigo-700/50 dark:hover:bg-indigo-600/50"
                        >
                          -
                        </button>
                        <span className="text-gray-800 dark:text-gray-200">{localCriteria.passengers.infants}</span>
                        <button
                          type="button"
                          onClick={() => handlePassengerChange("infants", 1)}
                          className="p-1 bg-indigo-600/50 dark:bg-indigo-700/50 text-white dark:text-gray-200 rounded hover:bg-indigo-700/50 dark:hover:bg-indigo-600/50"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => setPassengerModalOpen(false)}
                      className="w-full mt-2 p-2 bg-indigo-600 dark:bg-indigo-700 text-white dark:text-gray-200 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition"
                    >
                      Done
                    </button>
                  </div>
                )}
                {errors.passengers && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.passengers}</p>}
              </div>
              <select
                value={localCriteria.cabin}
                onChange={(e) => setLocalCriteria({ ...localCriteria, cabin: e.target.value })}
                className="col-span-2 p-3 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400"
              >
                <option value="economy">Economy</option>
                <option value="premium">Premium Economy</option>
                <option value="business">Business</option>
                <option value="first">First Class</option>
              </select>
              <button
                type="submit"
                className="col-span-2 bg-indigo-600 dark:bg-indigo-700 text-white dark:text-gray-200 px-6 py-3 rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition flex items-center justify-center gap-2"
              >
                Search Flights
              </button>
              {localCriteria.tripType === "multi-city" && (
                <button
                  type="button"
                  onClick={handleAddLeg}
                  className="col-span-2 bg-indigo-600/50 dark:bg-indigo-700/50 text-white dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-indigo-700/50 dark:hover:bg-indigo-600/50 transition flex items-center gap-2"
                >
                  <FaPlus /> Add Flight
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}