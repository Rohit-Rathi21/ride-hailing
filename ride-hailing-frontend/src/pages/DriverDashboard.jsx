import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function DriverDashboard() {
  const [online, setOnline] = useState(false);
  const [ride, setRide] = useState(null);
  const [status, setStatus] = useState("Offline");
  const nav = useNavigate();

  const driverId = localStorage.getItem("userId") || localStorage.getItem("id");

  // -----------------------------
  // TOGGLE ONLINE/OFFLINE
  // -----------------------------
  const toggleOnline = async () => {
    try {
      if (!driverId) {
        alert("Driver id missing — please login again");
        return;
      }

      if (!online) {
        await api.post("/driver/online", { driverId });
        setStatus("Online");
      } else {
        await api.post("/driver/offline", { driverId });
        setStatus("Offline");
      }
      setOnline(!online);
    } catch (err) {
      console.error(err);
      alert("Failed to update status");
    }
  };

  // -----------------------------
  // POLL FOR RIDE ASSIGNMENTS
  // -----------------------------
  useEffect(() => {
    if (!online) return;
    if (!driverId) {
      console.warn("Driver ID missing for polling");
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/driver/assigned/${driverId}`);
        // defensive: server returns { ride: null } or { ride: {...} }
        const r = res.data?.ride;
        if (r) {
          // normalize: assignment may contain rideId or _id
          const normalized = {
            _id: r._id || r.rideId || r.id,
            rideId: r.rideId || r._id || r.id,
            riderId: r.riderId,
            driverId: r.driverId,
            pickup: r.pickup,
            dropoff: r.dropoff,
            status: r.status || "assigned",
            createdAt: r.createdAt || null
          };
          setRide(normalized);
          setStatus(r.status === "accepted" ? "Ride Accepted" : r.status === "ongoing" ? "Ride Started" : "Ride Assigned");
        } else {
          // No ride assignment - clear if exists
          setRide(null);
          setStatus("Online");
        }
      } catch (err) {
        /* Ignore polling errors for now */
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [online, driverId]);

  // helper to pick a valid ride id
  const rideIdFor = (r) => {
    if (!r) return null;
    return r._id || r.rideId || r.id || null;
  };

  // -----------------------------
  // ACCEPT RIDE
  // -----------------------------
  const acceptRide = async () => {
    try {
      const driverId = localStorage.getItem("userId");
      await api.post("/driver/accept", { driverId, rideId: ride._id });
      setStatus("Ride Accepted");
    } catch (err) {
      console.error(err);
      alert("Failed to accept ride");
    }
};

const startRide = async () => {
  try {
    const driverId = localStorage.getItem("userId");
    await api.post("/driver/start", { driverId, rideId: ride._id });
    setStatus("Ride Started");
  } catch (err) {
    console.error(err);
    alert("Failed to start ride");
  }
};

const completeRide = async () => {
  try {
    const driverId = localStorage.getItem("userId");
    await api.post("/driver/complete", { driverId, rideId: ride._id });
    setStatus("Ride Completed");
    setRide(null);
  } catch (err) {
    console.error(err);
    alert("Failed to complete ride");
  }
};

  // -----------------------------
  // LOGOUT
  // -----------------------------
  const logout = () => {
    localStorage.clear();
    nav("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 relative">
      <div className="absolute inset-0 bg-black/10 pointer-events-none"></div>
      
      <div className="relative z-10 min-h-screen overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">Driver Dashboard 🚕</h1>
            <p className="text-white/90 text-sm sm:text-base">Ready to earn some money?</p>
          </div>
          <button
            onClick={logout}
            className="bg-white/20 backdrop-blur-sm text-white px-6 py-2.5 rounded-xl hover:bg-white/30 transition-all duration-300 font-semibold shadow-lg"
          >
            Logout
          </button>
        </div>

        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex-1">
              <p className="text-gray-600 text-sm font-semibold mb-2">Current Status</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800">{status}</p>
            </div>
            <button
              onClick={toggleOnline}
              className={`w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${
                online
                  ? "bg-gradient-to-r from-red-500 to-pink-600"
                  : "bg-gradient-to-r from-green-500 to-teal-600"
              }`}
            >
              {online ? "🔴 Go Offline" : "🟢 Go Online"}
            </button>
          </div>

          {!online && (
            <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-xl border-l-4 border-orange-500">
              <p className="text-orange-700 font-semibold text-center text-sm sm:text-base">
                ⚠️ You are currently offline. Go online to receive ride requests.
              </p>
            </div>
          )}
        </div>

        {ride ? (
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">🎯 New Ride Request</h2>
              <span className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-4 py-2 rounded-full text-xs sm:text-sm font-bold shadow-md">
                {ride.status?.toUpperCase() || 'ACTIVE'}
              </span>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start space-x-3 bg-green-50 p-4 rounded-xl border border-green-100">
                <div className="bg-green-100 p-2.5 rounded-lg flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 font-semibold mb-1">Pickup Location</p>
                  <p className="text-base sm:text-lg font-bold text-gray-800 break-words">{ride.pickup}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-red-50 p-4 rounded-xl border border-red-100">
                <div className="bg-red-100 p-2.5 rounded-lg flex-shrink-0">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600 font-semibold mb-1">Drop-off Location</p>
                  <p className="text-base sm:text-lg font-bold text-gray-800 break-words">{ride.dropoff}</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">Ride ID</p>
                <p className="text-xs sm:text-sm font-mono text-gray-800 break-all">{rideIdFor(ride)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={acceptRide}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm sm:text-base"
              >
                ✅ Accept
              </button>

              <button
                onClick={startRide}
                className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm sm:text-base"
              >
                🚗 Start
              </button>

              <button
                onClick={completeRide}
                className="bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold py-3.5 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-sm sm:text-base"
              >
                🏁 Complete
              </button>
            </div>
          </div>
        ) : online ? (
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-xl p-8 sm:p-12 text-center">
            <div className="inline-block p-6 bg-gradient-to-r from-orange-100 to-red-100 rounded-full mb-6">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 text-orange-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3">Waiting for Rides...</h3>
            <p className="text-gray-600 text-sm sm:text-base">You'll be notified when a new ride request comes in</p>
          </div>
        ) : null}
        </div>
      </div>
    </div>
  );
}
