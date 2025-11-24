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
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black opacity-10 pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Welcome Back! 👋</h1>
            <p className="text-white/80">Where would you like to go today?</p>
          </div>
          <button
            onClick={logout}
            className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-xl hover:bg-white/30 transition-all duration-300 font-semibold"
          >
            Logout
          </button>
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 mb-5">
          <div className="mb-6">
            <label className="flex items-center text-gray-700 font-semibold mb-2">
              📍 Pickup Location
            </label>
            <input
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg"
              placeholder="Enter pickup location"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label className="flex items-center text-gray-700 font-semibold mb-2">
              🎯 Destination
            </label>
            <input
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-colors text-lg"
              placeholder="Where are you going?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={requestRide}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              🚗 Request Ride
            </button>

            <button
              onClick={cancelRide}
              className="bg-gradient-to-r from-red-500 to-pink-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              ❌ Cancel
            </button>
          </div>
        </div>

        {rideId && (
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-semibold mb-1">Current Status</p>
                <p className="text-2xl font-bold text-gray-800">{status}</p>
              </div>
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 rounded-full">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">Ride ID: <span className="font-mono text-gray-800">{rideId}</span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
