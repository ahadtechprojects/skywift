import { db, auth } from "../firebase";
import { collection, doc, setDoc, getDocs, getDoc, deleteDoc, query, where, orderBy } from "firebase/firestore";

const flightsCollection = collection(db, "flights");

export async function isAdmin() {
  try {
    const user = auth.currentUser;
    if (!user) return false;
    const token = await user.getIdTokenResult();
    return !!token.claims.admin;
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

export function isLoggedIn() {
  return !!auth.currentUser;
}

export async function addFlights(flights) {
  try {
    if (!isLoggedIn()) throw new Error("User must be logged in to add flights");

    const addedFlights = [];
    for (const f of flights) {
      const flightRef = doc(flightsCollection);
      await setDoc(flightRef, f);
      addedFlights.push({ ...f, id: flightRef.id });
    }
    return addedFlights;
  } catch (error) {
    console.error("Error adding flights:", error);
    throw error;
  }
}

export async function getAllFlights() {
  try {
    const snapshot = await getDocs(flightsCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching all flights:", error);
    return [];
  }
}

export async function getFlightById(id) {
  try {
    const snapshot = await getDoc(doc(db, "flights", id));
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() };
  } catch (error) {
    console.error("Error fetching flight by ID:", error);
    return null;
  }
}

export async function updateFlight(id, updatedData) {
  try {
    if (!(await isAdmin())) throw new Error("Only admin can update flights");
    await setDoc(doc(db, "flights", id), updatedData, { merge: true });
  } catch (error) {
    console.error("Error updating flight:", error);
    throw error;
  }
}

export async function deleteFlightById(id) {
  try {
    if (!(await isAdmin())) throw new Error("Only admin can delete flights");
    await deleteDoc(doc(db, "flights", id));
  } catch (error) {
    console.error("Error deleting flight:", error);
    throw error;
  }
}

export async function searchFlights(criteria) {
  try {
    const { from, to, departDate, seats, fareClass } = criteria;
    console.log("Firestore query criteria:", { from, to, departDate, seats, fareClass }); // Debug log

    // Validate inputs
    if (!from || !to || !departDate || typeof from !== "string" || typeof to !== "string" || typeof departDate !== "string") {
      console.warn("Invalid query inputs:", { from, to, departDate });
      throw new Error("Invalid search criteria. Please ensure all fields are filled correctly.");
    }

    // Normalize date to YYYY-MM-DD format
    const normalizedDepartDate = new Date(departDate).toISOString().split("T")[0];
    console.log("Normalized departDate:", normalizedDepartDate); // Debug log

    // Build query to match new index order: fareClass, from, to, departDate, seats
    let q = query(
      flightsCollection,
      where("fareClass", "==", fareClass || "Economy"), // Default to Economy if fareClass is undefined
      where("from", "==", from.trim().toUpperCase()),
      where("to", "==", to.trim().toUpperCase()),
      where("departDate", ">=", normalizedDepartDate),
      where("seats", ">=", seats || 1),
      orderBy("departDate")
    );

    const snapshot = await getDocs(q);
    const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("Firestore query results:", results); // Debug log

    if (results.length === 0) {
      console.warn("No flights found for criteria:", criteria);
    }

    return results;
  } catch (error) {
    console.error("Error searching flights:", error);
    throw new Error("Failed to fetch flights. Please check your search criteria or try again later.");
  }
}