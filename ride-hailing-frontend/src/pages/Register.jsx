import { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");

  const nav = useNavigate();

  const register = async () => {
    try {
      if (role === "user") {
        const res = await api.post("/auth/register", {
          name,
          phone,
          password,
        });

        // store user id + role + token if returned (defensive)
        if (res.data?.userId) localStorage.setItem("userId", res.data.userId);
        if (res.data?.token) localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", "user");
      } else {
        const res = await api.post("/auth/driver/register", {
          name,
          phone,
          password,
          vehicle: {
            model: vehicleModel,
            plate: vehiclePlate,
          },
        });

        // store driver id + role + token if returned
        if (res.data?.driverId) localStorage.setItem("userId", res.data.driverId);
        if (res.data?.token) localStorage.setItem("token", res.data.token);
        localStorage.setItem("role", "driver");
      }

      alert("Registration successful!");
      nav("/");
    } catch (err) {
      console.error("Register error:", err.response || err);
      alert(err.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="p-5 max-w-sm mx-auto">
      <p className="text-red-500">REGISTER PAGE LOADED</p>
      <h1 className="text-xl font-bold mb-4">Register</h1>

      <select
        className="border p-2 mb-3 w-full"
        value={role}
        onChange={(e) => setRole(e.target.value)}
      >
        <option value="user">Rider</option>
        <option value="driver">Driver</option>
      </select>

      <input
        className="border p-2 w-full mb-3"
        placeholder="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        className="border p-2 w-full mb-3"
        placeholder="Phone Number"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <input
        type="password"
        className="border p-2 w-full mb-3"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {role === "driver" && (
        <>
          <input
            className="border p-2 w-full mb-3"
            placeholder="Vehicle Model"
            value={vehicleModel}
            onChange={(e) => setVehicleModel(e.target.value)}
          />

          <input
            className="border p-2 w-full mb-3"
            placeholder="Vehicle Plate"
            value={vehiclePlate}
            onChange={(e) => setVehiclePlate(e.target.value)}
          />
        </>
      )}

      <button
        type="button"
        onClick={register}
        className="bg-green-600 text-white px-4 py-2 mt-3 rounded w-full"
      >
        Register
      </button>
    </div>
  );
}
