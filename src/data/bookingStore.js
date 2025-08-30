import { db, auth } from "../firebase";
import { collection, addDoc, getDocs, doc, deleteDoc, setDoc, query, where } from "firebase/firestore";
import { getFlightById } from "./flightStore";

const bookingsCollection = collection(db, "bookings");

function generateBookingRef() {
  return "REF-" + Math.random().toString(36).substr(2, 9).toUpperCase();
}

export async function addBookingToFirestore(booking) {
  try {
    if (!auth.currentUser) {
      console.error("No authenticated user found. Current auth state:", auth.currentUser);
      throw new Error("User must be logged in to create a booking");
    }

    // Validate flightIds and fetch flight details
    const { flightIds, flightDetails } = booking;
    if (!Array.isArray(flightIds) || !Array.isArray(flightDetails) || flightIds.length !== flightDetails.length) {
      console.error("Invalid flight data: flightIds =", flightIds, "flightDetails =", flightDetails);
      throw new Error("Invalid flight data: flightIds and flightDetails must be arrays of equal length");
    }

    // Verify flights exist and have seats
    for (const flightId of flightIds) {
      const flight = await getFlightById(flightId);
      if (!flight) {
        console.error(`Flight ${flightId} not found in flightStore`);
        throw new Error(`Flight ${flightId} not found`);
      }
      if (flight.seats < booking.customer.passengers) {
        console.error(`Not enough seats for flight ${flightId}. Available: ${flight.seats}, Requested: ${booking.customer.passengers}`);
        throw new Error(`Not enough seats available for flight ${flightId}`);
      }
    }

    // Validate or set default flightType for each flight
    const validFlightTypes = ["one-way", "round-trip", "multi-city"];
    const validatedFlightDetails = flightDetails.map((flight) => ({
      ...flight,
      flightType: flight.flightType && validFlightTypes.includes(flight.flightType) ? flight.flightType : "one-way",
      airline: flight.airline || "Unknown",
      flightNo: flight.flightNo || `SKYSWIFT${Math.floor(Math.random() * 10000)}`,
      arrivalTime: flight.arrivalTime || "N/A",
      durationMins: flight.durationMins || 0,
      priceUSD: flight.priceUSD || 0,
      fromCoords: flight.fromCoords || { lat: 0, lng: 0 },
      toCoords: flight.toCoords || { lat: 0, lng: 0 },
      baggage: flight.baggage || "20kg",
      refundable: flight.refundable ?? false,
      changeFeeUSD: flight.changeFeeUSD || 0,
      fromTerminal: flight.fromTerminal || "N/A",
      toTerminal: flight.toTerminal || "N/A",
    }));

    const bookingWithFlights = {
      ...booking,
      flightIds,
      flightDetails: validatedFlightDetails,
      userId: auth.currentUser.uid,
      ref: generateBookingRef(),
      status: booking.status || "Pending",
      createdAt: new Date().toISOString(),
    };

    console.log("Attempting to add booking to Firestore. Booking data:", JSON.stringify(bookingWithFlights, null, 2));
    const docRef = await addDoc(bookingsCollection, bookingWithFlights);
    console.log("Booking added successfully with ID:", docRef.id);
    return { id: docRef.id, ...bookingWithFlights };
  } catch (error) {
    console.error("Error adding booking:", error, {
      code: error.code,
      message: error.message,
      bookingData: JSON.stringify(booking, null, 2),
      userId: auth.currentUser?.uid,
    });
    throw error;
  }
}

export async function getBookingsByUser(userId) {
  try {
    if (!userId) {
      console.error("No userId provided for fetching bookings");
      throw new Error("User ID is required");
    }
    const q = query(bookingsCollection, where("userId", "==", userId));
    const snapshot = await getDocs(q);
    const bookings = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    console.log(`Fetched ${bookings.length} bookings for user ${userId}`);
    return bookings;
  } catch (error) {
    console.error("Error fetching user bookings:", error, { userId });
    return [];
  }
}

export async function getBookingByRef(ref) {
  try {
    if (!auth.currentUser) {
      console.error("No authenticated user found for fetching booking by ref:", ref);
      throw new Error("User must be logged in to fetch bookings");
    }
    if (!ref || typeof ref !== "string" || ref.trim() === "") {
      console.error("Invalid booking reference provided:", ref);
      throw new Error("Invalid or missing booking reference");
    }
    const q = query(
      bookingsCollection,
      where("ref", "==", ref.trim()),
      where("userId", "==", auth.currentUser.uid)
    );
    const snapshot = await getDocs(q);
    const found = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))[0];
    console.log(`Booking ${ref} ${found ? "found" : "not found"} for user ${auth.currentUser.uid}`);
    return found || null;
  } catch (error) {
    console.error("Error fetching booking by ref:", error, { ref, userId: auth.currentUser?.uid });
    throw error;
  }
}

export async function deleteBookingById(id) {
  try {
    console.log(`Attempting to delete booking ${id}`);
    await deleteDoc(doc(db, "bookings", id));
    console.log(`Booking ${id} deleted successfully`);
  } catch (error) {
    console.error("Error deleting booking:", error, { bookingId: id });
    throw error;
  }
}

export async function updateBooking(id, updatedData) {
  try {
    console.log(`Attempting to update booking ${id} with data:`, updatedData);
    await setDoc(doc(db, "bookings", id), updatedData, { merge: true });
    console.log(`Booking ${id} updated successfully`);
  } catch (error) {
    console.error("Error updating booking:", error, { bookingId: id, updatedData });
    throw error;
  }
}