import { useState } from "react";
import { useSearch } from "../context/SearchContext";
import { airports } from "../data/airport";

export default function SearchForm({ onSubmit }) {
  const { criteria, setCriteria } = useSearch();
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!criteria.from) errs.from = "Required";
    if (!criteria.to) errs.to = "Required";
    if (criteria.from === criteria.to) errs.to = "Choose a different destination";
    if (!criteria.date) errs.date = "Pick a date";

    setErrors(errs);

    if (Object.keys(errs).length === 0 && onSubmit) {
      onSubmit();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white text-gray-900 rounded-xl p-4 shadow-md grid gap-3 sm:grid-cols-5"
    >
      {/* FROM */}
      <div className="sm:col-span-2">
        <label className="text-xs text-gray-600">From</label>
        <select
          value={criteria.from}
          onChange={(e) =>
            setCriteria((c) => ({ ...c, from: e.target.value }))
          }
          className="mt-1 w-full border rounded-md px-3 py-2"
        >
          <option value="">Select departure</option>
          {airports.map((a) => (
            <option key={`from-${a.code}`} value={a.code}>
              {a.city} — {a.name} ({a.code})
            </option>
          ))}
        </select>
        {errors.from && <p className="text-xs text-red-600 mt-1">{errors.from}</p>}
      </div>

      {/* TO */}
      <div className="sm:col-span-2">
        <label className="text-xs text-gray-600">To</label>
        <select
          value={criteria.to}
          onChange={(e) =>
            setCriteria((c) => ({ ...c, to: e.target.value }))
          }
          className="mt-1 w-full border rounded-md px-3 py-2"
        >
          <option value="">Select destination</option>
          {airports.map((a) => (
            <option key={`to-${a.code}`} value={a.code}>
              {a.city} — {a.name} ({a.code})
            </option>
          ))}
        </select>
        {errors.to && <p className="text-xs text-red-600 mt-1">{errors.to}</p>}
      </div>

      {/* DATE */}
      <div>
        <label className="text-xs text-gray-600">Date</label>
        <input
          type="date"
          value={criteria.date}
          onChange={(e) =>
            setCriteria((c) => ({ ...c, date: e.target.value }))
          }
          className="mt-1 w-full border rounded-md px-3 py-2"
        />
        {errors.date && <p className="text-xs text-red-600 mt-1">{errors.date}</p>}
      </div>

      {/* PASSENGERS */}
      <div>
        <label className="text-xs text-gray-600">Passengers</label>
        <input
          type="number"
          min="1"
          value={criteria.passengers}
          onChange={(e) =>
            setCriteria((c) => ({ ...c, passengers: parseInt(e.target.value) }))
          }
          className="mt-1 w-full border rounded-md px-3 py-2"
        />
      </div>

      {/* CABIN */}
      <div>
        <label className="text-xs text-gray-600">Cabin</label>
        <select
          value={criteria.cabin}
          onChange={(e) =>
            setCriteria((c) => ({ ...c, cabin: e.target.value }))
          }
          className="mt-1 w-full border rounded-md px-3 py-2"
        >
          <option value="ECONOMY">Economy</option>
          <option value="BUSINESS">Business</option>
          <option value="FIRST">First Class</option>
        </select>
      </div>

      {/* SUBMIT */}
      <button
        type="submit"
        className="sm:col-span-5 sm:justify-self-end rounded-md bg-indigo-600 text-white px-6 py-3 hover:bg-indigo-700"
      >
        Search flights
      </button>
    </form>
  );
}
