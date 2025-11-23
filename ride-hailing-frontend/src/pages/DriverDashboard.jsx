import { useEffect, useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function DriverDashboard() {
  const [online, setOnline] = useState(false);
  const [ride, setRide] = useState(null);
  const [status, setStatus] = useState("Offline");
  const nav = useNavigate();

  // safer retrieval: try both keys if anything odd
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
          setStatus("Ride Assigned");
        } else {
          // keep checking
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
  // DEBUG (quick manual tests)
  // -----------------------------
  const debug = async () => {
    console.log("DEBUG DRIVER:", { driverId, ride });
    try {
      console.log("Online:", await api.post("/driver/online", { driverId }));
    } catch (e) {
      console.log("Online Error:", e.response?.data || e.message);
    }
    try {
      console.log("Assigned:", await api.get(`/driver/assigned/${driverId}`));
    } catch (e) {
      console.log("Assigned Error:", e.response?.data || e.message);
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
    <div className="p-5 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">Driver Dashboard</h1>

      <button
        onClick={toggleOnline}
        className={`px-4 py-2 rounded text-white w-full ${
          online ? "bg-red-600" : "bg-green-600"
        }`}
      >
        {online ? "Go Offline" : "Go Online"}
      </button>

      <p className="mt-4 text-lg font-semibold">Status: {status}</p>

      {ride ? (
        <div className="mt-5 p-4 border rounded bg-gray-100">
          <h2 className="text-lg font-bold mb-2">Assigned Ride</h2>
          <p><strong>Pickup:</strong> {ride.pickup}</p>
          <p><strong>Destination:</strong> {ride.dropoff}</p>
          <p className="text-sm text-gray-600 mt-2">RideId: {rideIdFor(ride)}</p>

          <div className="mt-4 space-y-2">
            <button
              onClick={acceptRide}
              className="bg-blue-600 text-white px-4 py-2 rounded w-full"
            >
              Accept Ride
            </button>

            <button
              onClick={startRide}
              className="bg-yellow-600 text-white px-4 py-2 rounded w-full"
            >
              Start Ride
            </button>

            <button
              onClick={completeRide}
              className="bg-green-600 text-white px-4 py-2 rounded w-full"
            >
              Complete Ride
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-4 text-gray-600">No assigned ride yet</p>
      )}

      <button
        onClick={debug}
        className="bg-gray-600 text-white px-4 py-2 rounded w-full mt-4"
      >
        Debug Driver API
      </button>

      <button
        onClick={logout}
        className="bg-black text-white px-4 py-2 mt-6 rounded w-full"
      >
        Logout
      </button>
    </div>
  );
}
