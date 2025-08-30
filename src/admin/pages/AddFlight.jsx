import { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../firebase";
import { FaPlus } from "react-icons/fa";

export default function AddFlight() {
  const [formData, setFormData] = useState({
    airline: "",
    flightNo: "",
    from: "",
    to: "",
    departDate: "",
    departTime: "",
    arrivalTime: "",
    durationMins: "",
    priceUSD: "",
    seats: "",
    baggage: "20kg",
    refundable: false,
    changeFeeUSD: "",
    fromTerminal: "",
    toTerminal: "",
    fromCoords: { lat: 0, lng: 0 },
    toCoords: { lat: 0, lng: 0 },
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "number" ? parseFloat(value) || "" : value,
    }));
  };

  const handleCoordChange = (e, field, coord) => {
    setFormData(prev => ({
      ...prev,
      [field]: { ...prev[field], [coord]: parseFloat(e.target.value) || 0 },
    }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.airline) errs.airline = "Airline is required";
    if (!formData.flightNo) errs.flightNo = "Flight number is required";
    if (!formData.from) errs.from = "Departure airport is required";
    if (!formData.to) errs.to = "Arrival airport is required";
    if (!formData.departDate) errs.departDate = "Departure date is required";
    if (!formData.departTime) errs.departTime = "Departure time is required";
    if (!formData.priceUSD) errs.priceUSD = "Price is required";
    if (!formData.seats) errs.seats = "Seats are required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await addDoc(collection(db, "flights"), {
        ...formData,
        durationMins: parseInt(formData.durationMins) || 0,
        priceUSD: parseFloat(formData.priceUSD) || 0,
        seats: parseInt(formData.seats) || 0,
        changeFeeUSD: parseFloat(formData.changeFeeUSD) || 0,
      });
      alert("Flight added successfully.");
      setFormData({
        airline: "",
        flightNo: "",
        from: "",
        to: "",
        departDate: "",
        departTime: "",
        arrivalTime: "",
        durationMins: "",
        priceUSD: "",
        seats: "",
        baggage: "20kg",
        refundable: false,
        changeFeeUSD: "",
        fromTerminal: "",
        toTerminal: "",
        fromCoords: { lat: 0, lng: 0 },
        toCoords: { lat: 0, lng: 0 },
      });
    } catch (error) {
      console.error("Error adding flight:", error);
      alert("Failed to add flight.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">Add New Flight</h1>
      <form onSubmit={handleSubmit} className="bg-white/10 dark:bg-gray-800/90 p-6 rounded-xl shadow border border-white/30 dark:border-gray-700/20 grid gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">Airline</label>
          <input
            name="airline"
            value={formData.airline}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400 ${errors.airline ? "border-red-500 dark:border-red-400" : ""}`}
          />
          {errors.airline && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.airline}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">Flight Number</label>
          <input
            name="flightNo"
            value={formData.flightNo}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400 ${errors.flightNo ? "border-red-500 dark:border-red-400" : ""}`}
          />
          {errors.flightNo && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.flightNo}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">From</label>
          <input
            name="from"
            value={formData.from}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400 ${errors.from ? "border-red-500 dark:border-red-400" : ""}`}
          />
          {errors.from && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.from}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">To</label>
          <input
            name="to"
            value={formData.to}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400 ${errors.to ? "border-red-500 dark:border-red-400" : ""}`}
          />
          {errors.to && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.to}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">Departure Date</label>
          <input
            name="departDate"
            type="date"
            value={formData.departDate}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400 ${errors.departDate ? "border-red-500 dark:border-red-400" : ""}`}
          />
          {errors.departDate && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.departDate}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">Departure Time</label>
          <input
            name="departTime"
            type="time"
            value={formData.departTime}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400 ${errors.departTime ? "border-red-500 dark:border-red-400" : ""}`}
          />
          {errors.departTime && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.departTime}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">Arrival Time</label>
          <input
            name="arrivalTime"
            type="time"
            value={formData.arrivalTime}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">Duration (minutes)</label>
          <input
            name="durationMins"
            type="number"
            value={formData.durationMins}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">Price (USD)</label>
          <input
            name="priceUSD"
            type="number"
            value={formData.priceUSD}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400 ${errors.priceUSD ? "border-red-500 dark:border-red-400" : ""}`}
          />
          {errors.priceUSD && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.priceUSD}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">Seats</label>
          <input
            name="seats"
            type="number"
            value={formData.seats}
            onChange={handleChange}
            className={`w-full border rounded px-3 py-2 bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400 ${errors.seats ? "border-red-500 dark:border-red-400" : ""}`}
          />
          {errors.seats && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{errors.seats}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">Baggage</label>
          <input
            name="baggage"
            value={formData.baggage}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200">
            <input
              name="refundable"
              type="checkbox"
              checked={formData.refundable}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 dark:text-indigo-400 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-300 dark:focus:ring-indigo-400"
            />
            Refundable
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">Change Fee (USD)</label>
          <input
            name="changeFeeUSD"
            type="number"
            value={formData.changeFeeUSD}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">From Terminal</label>
          <input
            name="fromTerminal"
            value={formData.fromTerminal}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">To Terminal</label>
          <input
            name="toTerminal"
            value={formData.toTerminal}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">From Coordinates</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Latitude"
              value={formData.fromCoords.lat}
              onChange={e => handleCoordChange(e, "fromCoords", "lat")}
              className="w-full border rounded px-3 py-2 bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400"
            />
            <input
              type="number"
              placeholder="Longitude"
              value={formData.fromCoords.lng}
              onChange={e => handleCoordChange(e, "fromCoords", "lng")}
              className="w-full border rounded px-3 py-2 bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-800 dark:text-gray-200">To Coordinates</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Latitude"
              value={formData.toCoords.lat}
              onChange={e => handleCoordChange(e, "toCoords", "lat")}
              className="w-full border rounded px-3 py-2 bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400"
            />
            <input
              type="number"
              placeholder="Longitude"
              value={formData.toCoords.lng}
              onChange={e => handleCoordChange(e, "toCoords", "lng")}
              className="w-full border rounded px-3 py-2 bg-white/20 dark:bg-gray-700/20 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600/30 focus:outline-none focus:ring-2 focus:ring-indigo-300 dark:focus:ring-indigo-400"
            />
          </div>
        </div>
        <button
          type="submit"
          className="bg-indigo-600 text-white dark:bg-indigo-700 dark:text-gray-200 px-4 py-2 rounded hover:bg-indigo-700 dark:hover:bg-indigo-800 flex items-center gap-2"
        >
          <FaPlus /> Add Flight
        </button>
      </form>
    </div>
  );
}