import { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const nav = useNavigate();

  const login = async () => {
    try {
      const res = await api.post("/auth/login", {
        phone,
        password,
        role
      });

      console.log("Login response:", res.data);

      // token
      if (res.data?.token) localStorage.setItem("token", res.data.token);
      // role
      localStorage.setItem("role", role);

      // server might return user under res.data.user or res.data.userId/res.data.id
      const userId =
        res.data?.user?.id ||
        res.data?.userId ||
        res.data?.id ||
        (res.data?.user && (res.data.user.id || res.data.user._id)) ||
        null;

      if (userId) {
        localStorage.setItem("userId", userId);
      } else {
        console.warn("Login did not return a userId. Response:", res.data);
      }

      if (role === "user") nav("/rider");
      else nav("/driver");
    } catch (err) {
      console.error("Login error:", err.response || err);
      alert(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="p-5 max-w-sm mx-auto">
      <h1 className="text-xl font-bold mb-4">Login</h1>

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
        placeholder="Phone"
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

      <button
        onClick={login}
        className="bg-blue-500 text-white px-4 py-2 rounded w-full"
      >
        Login
      </button>

      <p className="mt-4 text-center">
        Don’t have an account?{" "}
        <a href="/register" className="text-blue-600 underline">
          Register
        </a>
      </p>
    </div>
  );
}
