// src/data/nearbyAirports.js
export const nearbyAirports = {
  LHR: ["LGW", "STN", "LCY"], // London area
  LGW: ["LHR", "STN", "LCY"],
  JFK: ["EWR", "LGA"], // New York area
  EWR: ["JFK", "LGA"],
  LGA: ["JFK", "EWR"],
  CDG: ["ORY"], // Paris
  ORY: ["CDG"],
  FRA: ["MUC", "DUS"], // Germany
  MUC: ["FRA", "DUS"],
  SYD: ["MEL", "BNE"], // Australia
  MEL: ["SYD", "BNE"],
  BNE: ["SYD", "MEL"],
};
