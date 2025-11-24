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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-50 mb-1">Welcome Back!</h1>
            <p className="text-slate-400">Where would you like to go today?</p>
          </div>
          <button
            onClick={logout}
            className="bg-slate-900 border border-slate-800 text-slate-200 px-4 py-2 hover:bg-slate-800 transition-all duration-300 font-semibold"
          >
            Logout
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 shadow-xl p-8 mb-5">
          <div className="mb-6">
            <label className="flex items-center text-slate-200 font-semibold mb-2">
              Pickup Location
            </label>
            <input
              className="w-full px-4 py-4 bg-slate-950 border border-slate-800 text-slate-50 focus:border-slate-400 focus:outline-none transition-colors text-lg placeholder:text-slate-600"
              placeholder="Enter pickup location"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <label className="flex items-center text-slate-200 font-semibold mb-2">
              Destination
            </label>
            <input
              className="w-full px-4 py-4 bg-slate-950 border border-slate-800 text-slate-50 focus:border-slate-400 focus:outline-none transition-colors text-lg placeholder:text-slate-600"
              placeholder="Where are you going?"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={requestRide}
              className="bg-slate-50 text-slate-900 font-bold py-4 px-6 hover:bg-slate-200 transition-all duration-300"
            >
              Request Ride
            </button>

            <button
              onClick={cancelRide}
              className="bg-slate-900 border border-slate-800 text-slate-200 font-bold py-4 px-6 hover:bg-slate-800 transition-all duration-300"
            >
              Cancel
            </button>
          </div>
        </div>

        {rideId && (
          <div className="bg-slate-900 border border-slate-800 shadow-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-semibold mb-1">Current Status</p>
                <p className="text-2xl font-bold text-slate-50">{status}</p>
              </div>
              <div className="bg-slate-800 p-4">
                <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-slate-800">
              <p className="text-sm text-slate-400">Ride ID: <span className="font-mono text-slate-200">{rideId}</span></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
