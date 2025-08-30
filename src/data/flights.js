import { airports, getAirportByCode } from "./airport";

const AIRLINES = [
  // Europe
  "British Airways", "Lufthansa", "Air France", "KLM", "Iberia",
  "Turkish Airlines", "Swiss International Air Lines", "Alitalia",
  "Ryanair", "EasyJet", "Wizz Air", "Aeroflot", "Finnair",
  "Norwegian Air Shuttle", "SAS Scandinavian Airlines", "LOT Polish Airlines",
  "Austrian Airlines", "TAP Air Portugal", "Aegean Airlines",
  // Asia
  "Emirates", "Qatar Airways", "Etihad Airways", "Singapore Airlines",
  "Cathay Pacific", "Korean Air", "Asiana Airlines", "Japan Airlines",
  "All Nippon Airways", "China Southern Airlines", "China Eastern Airlines",
  "Air China", "Thai Airways", "Malaysia Airlines", "IndiGo",
  "AirAsia", "Vietnam Airlines", "Philippine Airlines",
  // Americas
  "Delta Air Lines", "United Airlines", "American Airlines",
  "Air Canada", "LATAM Airlines", "Avianca", "Copa Airlines",
  "Aeromexico", "JetBlue Airways", "Southwest Airlines", "Alaska Airlines",
  "Gol Linhas Aéreas", "Azul Brazilian Airlines",
  // Additional global airlines
  "Qantas", "Virgin Australia", "South African Airways", "Ethiopian Airlines",
  "EgyptAir", "Saudia", "Oman Air", "Kenya Airways", "Air India",
  // Note: Full list would include 100+ airlines, covering major and regional carriers
];

const FARE_CLASSES = [
  { class: "Economy", baggage: "1 x 23kg", refundable: false, changeFee: 50 },
  { class: "Premium Economy", baggage: "2 x 23kg", refundable: true, changeFee: 30 },
  { class: "Business", baggage: "2 x 32kg", refundable: true, changeFee: 0 },
  { class: "First", baggage: "3 x 32kg", refundable: true, changeFee: 0 }
];

function seededRandom(seed) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return function() {
    h += 0x6D2B79F5;
    let t = Math.imul(h ^ (h >>> 15), 1 | h);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function minutesToHHMM(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function estimateDurationMins(from, to) {
  const fromAirport = getAirportByCode(from);
  const toAirport = getAirportByCode(to);
  if (!fromAirport || !toAirport) return 120;

  const distance = Math.sqrt(
    Math.pow(toAirport.lat - fromAirport.lat, 2) +
    Math.pow(toAirport.lng - fromAirport.lng, 2)
  ) * 60;

  return Math.max(60, Math.floor(distance + Math.random() * 60));
}

function estimatePriceUSD(durationMins) {
  const hours = durationMins / 60;
  return Math.floor(50 + hours * 100 + Math.random() * 50);
}

export async function generateFlightsForRoute(from, to, departDate, count = 5) {
  const flights = [];
  const rnd = seededRandom(from + to + departDate);
  const fromAirport = getAirportByCode(from);
  const toAirport = getAirportByCode(to);
  if (!fromAirport || !toAirport) return flights;

  for (let i = 0; i < count; i++) {
    const departMins = Math.floor(rnd() * 1440);
    const duration = estimateDurationMins(from, to);
    const arrivalMins = (departMins + duration) % 1440;

    const airline = AIRLINES[Math.floor(rnd() * AIRLINES.length)];
    const flightNo = airline.slice(0, 2).toUpperCase() + Math.floor(1000 + rnd() * 9000);
    const priceUSD = estimatePriceUSD(duration);
    const seats = 50 + Math.floor(rnd() * 150);
    const fare = FARE_CLASSES[Math.floor(rnd() * FARE_CLASSES.length)];

    flights.push({
      airline,
      flightNo,
      from,
      to,
      departDate,
      departTime: minutesToHHMM(departMins),
      arrivalTime: minutesToHHMM(arrivalMins),
      durationMins: duration,
      priceUSD,
      currency: "USD",
      seats,
      fareClass: fare.class,
      baggage: fare.baggage,
      refundable: fare.refundable,
      changeFeeUSD: fare.changeFee,
      fromTerminal: fromAirport.terminals[0] || "Main",
      toTerminal: toAirport.terminals[0] || "Main",
      fromCoords: { lat: fromAirport.lat, lng: fromAirport.lng },
      toCoords: { lat: toAirport.lat, lng: toAirport.lng },
      flightType: "one-way",
    });
  }

  return flights;
}