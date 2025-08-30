import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { searchFlights as searchFromFirestore, addFlights } from "../data/flightStore";
import { generateFlightsForRoute } from "../data/flights";

const SearchContext = createContext();

export function SearchProvider({ children }) {
  const [criteria, setCriteria] = useState({
    searchType: "flights",
    tripType: "one-way",
    legs: [{ from: "", to: "", departureDate: "" }],
    returnDate: "",
    passengers: { adults: 1, children: 0, infants: 0 },
    cabin: "economy",
  });
  const [ready, setReady] = useState(false);
  const [searchResults, setSearchResults] = useState({ outbound: [], return: [], legs: [] });
  const [flights, setFlights] = useState([]); // Added for homepage carousel

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      setReady(true);
    });
    return () => unsubscribe();
  }, []);

  const searchFlights = async (filters = {}) => {
    console.log("Search criteria:", criteria);
    if (!criteria.legs || !Array.isArray(criteria.legs) || criteria.legs.length === 0) {
      console.warn("Invalid legs in criteria");
      setSearchResults({ outbound: [], return: [], legs: [] });
      throw new Error("Please fill in at least one flight leg.");
    }

    const totalPassengers = criteria.passengers.adults + criteria.passengers.children + criteria.passengers.infants;
    let results = { outbound: [], return: [], legs: [] };

    try {
      if (auth.currentUser) {
        await addDoc(collection(db, "searches"), {
          userId: auth.currentUser.uid,
          timestamp: serverTimestamp(),
          searchType: criteria.searchType,
          tripType: criteria.tripType,
          legs: criteria.legs,
          returnDate: criteria.returnDate || null,
          passengers: criteria.passengers,
          cabin: criteria.cabin,
        });
      }

      const fareClassMap = {
        economy: "Economy",
        premium: "Premium Economy",
        business: "Business",
        first: "First",
      };
      const fareClass = fareClassMap[criteria.cabin] || "Economy";

      const firstLeg = criteria.legs[0];
      if (firstLeg.from && firstLeg.to && firstLeg.departureDate) {
        console.log("Searching outbound:", { from: firstLeg.from, to: firstLeg.to, departDate: firstLeg.departureDate, seats: totalPassengers, fareClass });
        let outboundFlights = await searchFromFirestore({
          from: firstLeg.from,
          to: firstLeg.to,
          departDate: firstLeg.departureDate,
          seats: totalPassengers,
          fareClass,
        });

        if (outboundFlights.length === 0) {
          console.log("No outbound flights found, generating...");
          const generated = await generateFlightsForRoute(
            firstLeg.from,
            firstLeg.to,
            firstLeg.departureDate,
            5
          );
          outboundFlights = await addFlights(generated.map(flight => ({
            ...flight,
            fareClass,
            seats: Math.max(flight.seats, totalPassengers),
            from: firstLeg.from.toUpperCase(),
            to: firstLeg.to.toUpperCase(),
            departDate: new Date(firstLeg.departureDate).toISOString().split("T")[0],
          })));
        }
        results.outbound = outboundFlights;
      } else {
        console.warn("Invalid first leg:", firstLeg);
        throw new Error("Please fill in all fields for the first flight leg.");
      }

      if (criteria.tripType === "round-trip" && criteria.returnDate && firstLeg.from && firstLeg.to) {
        console.log("Searching return:", { from: firstLeg.to, to: firstLeg.from, departDate: criteria.returnDate, seats: totalPassengers, fareClass });
        let returnFlights = await searchFromFirestore({
          from: firstLeg.to,
          to: firstLeg.from,
          departDate: criteria.returnDate,
          seats: totalPassengers,
          fareClass,
        });

        if (returnFlights.length === 0) {
          console.log("No return flights found, generating...");
          const generated = await generateFlightsForRoute(
            firstLeg.to,
            firstLeg.from,
            criteria.returnDate,
            5
          );
          returnFlights = await addFlights(generated.map(flight => ({
            ...flight,
            fareClass,
            seats: Math.max(flight.seats, totalPassengers),
            from: firstLeg.to.toUpperCase(),
            to: firstLeg.from.toUpperCase(),
            departDate: new Date(criteria.returnDate).toISOString().split("T")[0],
            flightType: "round-trip",
          })));
        }
        results.return = returnFlights;
      } else if (criteria.tripType === "round-trip") {
        console.warn("Missing returnDate or invalid first leg for round-trip");
        throw new Error("Please select a return date for round-trip.");
      }

      if (criteria.tripType === "multi-city" && criteria.legs.length > 1) {
        for (let i = 1; i < criteria.legs.length; i++) {
          const leg = criteria.legs[i];
          if (leg.from && leg.to && leg.departureDate) {
            console.log(`Searching leg ${i + 1}:`, { from: leg.from, to: leg.to, departDate: leg.departureDate, seats: totalPassengers, fareClass });
            let legFlights = await searchFromFirestore({
              from: leg.from,
              to: leg.to,
              departDate: leg.departureDate,
              seats: totalPassengers,
              fareClass,
            });

            if (legFlights.length === 0) {
              console.log(`No flights found for leg ${i + 1}, generating...`);
              const generated = await generateFlightsForRoute(
                leg.from,
                leg.to,
                leg.departureDate,
                5
              );
              legFlights = await addFlights(generated.map(flight => ({
                ...flight,
                fareClass,
                seats: Math.max(flight.seats, totalPassengers),
                from: leg.from.toUpperCase(),
                to: leg.to.toUpperCase(),
                departDate: new Date(leg.departureDate).toISOString().split("T")[0],
              })));
            }
            results.legs.push(legFlights);
          } else {
            console.warn(`Invalid leg ${i + 1}:`, leg);
            results.legs.push([]);
            throw new Error(`Please fill in all fields for flight leg ${i + 1}.`);
          }
        }
      }

      if (filters.airlines?.length) {
        results.outbound = results.outbound.filter(f => filters.airlines.includes(f.airline));
        results.return = results.return.filter(f => f.airline && filters.airlines.includes(f.airline));
        results.legs = results.legs.map(leg => leg.filter(f => f.airline && filters.airlines.includes(f.airline)));
      }
      if (filters.priceMin != null) {
        results.outbound = results.outbound.filter(f => f.priceUSD >= filters.priceMin);
        results.return = results.return.filter(f => f.priceUSD >= filters.priceMin);
        results.legs = results.legs.map(leg => leg.filter(f => f.priceUSD >= filters.priceMin));
      }
      if (filters.priceMax != null) {
        results.outbound = results.outbound.filter(f => f.priceUSD <= filters.priceMax);
        results.return = results.return.filter(f => f.priceUSD <= filters.priceMax);
        results.legs = results.legs.map(leg => leg.filter(f => f.priceUSD <= filters.priceMax));
      }
      if (filters.durationMax != null) {
        results.outbound = results.outbound.filter(f => f.durationMins <= filters.durationMax);
        results.return = results.return.filter(f => f.durationMins <= filters.durationMax);
        results.legs = results.legs.map(leg => leg.filter(f => f.durationMins <= filters.durationMax));
      }

      console.log("Final search results:", results);
      setSearchResults(results);
      return results;
    } catch (error) {
      console.error("Error in searchFlights:", error);
      setSearchResults({ outbound: [], return: [], legs: [] });
      throw error;
    }
  };

  return (
    <SearchContext.Provider value={{ criteria, setCriteria, searchFlights, ready, searchResults, setSearchResults, flights, setFlights }}>
      {children}
    </SearchContext.Provider>
  );
}

export const useSearch = () => useContext(SearchContext);