import { useState, useEffect } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function RiderDashboard() {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [rideId, setRideId] = useState(null);
  const [status, setStatus] = useState("No active ride");
  const nav = useNavigate();

  const riderId = localStorage.getItem("userId");

  // -------------------------
  // REQUEST RIDE
  // -------------------------
  const requestRide = async () => {
    try {
      const res = await api.post("/ride/request", {
        riderId,
        pickup,
        destination,
      });

      alert("Ride request sent!");

      setStatus("Searching for driver...");

      // Backend does NOT return rideId yet — WAIT for assignment
      // Poll ride list to find newest ride
      setTimeout(fetchLatestRide, 1000);

    } catch (err) {
      console.error(err);
      alert("Failed to request ride");
    }
  };

  // -------------------------
  // GET MOST RECENT RIDE FOR RIDER
  // -------------------------
  const fetchLatestRide = async () => {
    try {
      const res = await api.get(`/ride/history/rider/${riderId}`);
      if (res.data.length > 0) {
        const latest = res.data[0];
        setRideId(latest._id);
        setStatus(latest.status);
      }
    } catch (err) {
      console.error("History fetch failed", err);
    }
  };

  // -------------------------
  // POLL RIDE STATUS
  // -------------------------
  useEffect(() => {
    if (!rideId) return;

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/ride/${rideId}`);
        setStatus(res.data.status);
      } catch (err) {
        console.log("Polling error", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [rideId]);

  // -------------------------
  // CANCEL RIDE
  // -------------------------
  const cancelRide = async () => {
    if (!rideId) return alert("No active ride");

    try {
      await api.post("/ride/cancel", { rideId });
      setStatus("Ride cancelled");
      setRideId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to cancel ride");
    }
  };

  // -------------------------
  // LOGOUT
  // -------------------------
  const logout = () => {
    localStorage.clear();
    nav("/");
  };

  return (
    <div className="p-5 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Rider Dashboard</h1>

      <input
        className="border p-2 w-full mb-3"
        placeholder="Pickup Location"
        value={pickup}
        onChange={(e) => setPickup(e.target.value)}
      />

      <input
        className="border p-2 w-full mb-3"
        placeholder="Destination"
        value={destination}
        onChange={(e) => setDestination(e.target.value)}
      />

      <button
        onClick={requestRide}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full mb-3"
      >
        Request Ride
      </button>

      <button
        onClick={cancelRide}
        className="bg-red-600 text-white px-4 py-2 rounded w-full"
      >
        Cancel Ride
      </button>

      <p className="mt-4 text-lg font-semibold">Status: {status}</p>

      <button
        onClick={logout}
        className="bg-gray-700 text-white px-4 py-2 mt-6 rounded w-full"
      >
        Logout
      </button>
    </div>
  );
}
