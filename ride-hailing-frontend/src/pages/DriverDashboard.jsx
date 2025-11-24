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
    <div className="min-h-screen bg-slate-950 relative">
      <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none"></div>
      
      <div className="relative z-10 min-h-screen overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-50 mb-2">Driver Dashboard</h1>
            <p className="text-slate-400 text-sm sm:text-base">Ready to earn some money?</p>
          </div>
          <button
            onClick={logout}
            className="bg-slate-900 border border-slate-800 text-slate-200 px-6 py-2.5 hover:bg-slate-800 transition-all duration-300 font-semibold shadow-lg"
          >
            Logout
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex-1">
              <p className="text-slate-400 text-sm font-semibold mb-2">Current Status</p>
              <p className="text-2xl sm:text-3xl font-bold text-slate-50">{status}</p>
            </div>
            <button
              onClick={toggleOnline}
              className={`w-full sm:w-auto px-8 py-4 font-bold text-slate-900 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 ${
                online
                  ? "bg-slate-50 hover:bg-slate-200"
                  : "bg-slate-50 hover:bg-slate-200"
              }`}
            >
              {online ? "Go Offline" : "Go Online"}
            </button>
          </div>

          {!online && (
            <div className="bg-slate-950 border border-slate-800 p-4">
              <p className="text-slate-400 font-semibold text-center text-sm sm:text-base">
                You are currently offline. Go online to receive ride requests.
              </p>
            </div>
          )}
        </div>

        {ride ? (
          <div className="bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-50">New Ride Request</h2>
              <span className="bg-slate-800 text-slate-200 px-4 py-2 text-xs sm:text-sm font-bold shadow-md border border-slate-700">
                {ride.status?.toUpperCase() || 'ACTIVE'}
              </span>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start space-x-3 bg-slate-950 p-4 border border-slate-800">
                <div className="bg-slate-900 p-2.5 flex-shrink-0 border border-slate-800">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-slate-400 font-semibold mb-1">Pickup Location</p>
                  <p className="text-base sm:text-lg font-bold text-slate-50 break-words">{ride.pickup}</p>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-slate-950 p-4 border border-slate-800">
                <div className="bg-slate-900 p-2.5 flex-shrink-0 border border-slate-800">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm text-slate-400 font-semibold mb-1">Drop-off Location</p>
                  <p className="text-base sm:text-lg font-bold text-slate-50 break-words">{ride.dropoff}</p>
                </div>
              </div>

              <div className="bg-slate-950 p-4 border border-slate-800">
                <p className="text-xs text-slate-400 mb-1">Ride ID</p>
                <p className="text-xs sm:text-sm font-mono text-slate-200 break-all">{rideIdFor(ride)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={acceptRide}
                className="bg-slate-50 text-slate-900 font-bold py-3.5 px-6 shadow-lg hover:bg-slate-200 transform hover:scale-105 transition-all duration-300 text-sm sm:text-base"
              >
                Accept
              </button>

              <button
                onClick={startRide}
                className="bg-slate-900 border border-slate-800 text-slate-200 font-bold py-3.5 px-6 shadow-lg hover:bg-slate-800 transform hover:scale-105 transition-all duration-300 text-sm sm:text-base"
              >
                Start
              </button>

              <button
                onClick={completeRide}
                className="bg-slate-900 border border-slate-800 text-slate-200 font-bold py-3.5 px-6 shadow-lg hover:bg-slate-800 transform hover:scale-105 transition-all duration-300 text-sm sm:text-base"
              >
                Complete
              </button>
            </div>
          </div>
        ) : online ? (
          <div className="bg-slate-900 border border-slate-800 shadow-xl p-8 sm:p-12 text-center">
            <div className="inline-block p-6 bg-slate-950 border border-slate-800 mb-6">
              <svg className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-50 mb-3">Waiting for Rides...</h3>
            <p className="text-slate-400 text-sm sm:text-base">You'll be notified when a new ride request comes in</p>
          </div>
        ) : null}
        </div>
      </div>
    </div>
  );
}
