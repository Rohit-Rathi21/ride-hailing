import { useState, useRef } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const nav = useNavigate();
  
  const containerRef = useRef(null);
  const formRef = useRef(null);
  const titleRef = useRef(null);

  const login = async () => {
    try {
      const res = await api.post("/auth/login", {
        phone,
        password,
        role
      });

      console.log("Login response:", res.data);

      if (res.data?.token) localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", role);

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
    <div ref={containerRef} className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <div ref={titleRef} className="text-center mb-8">
          <div className="inline-block p-4 bg-slate-900 border border-slate-800 mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-slate-50 mb-2">Welcome Back</h1>
          <p className="text-slate-400 text-lg">Sign in to continue your journey</p>
        </div>

        <div ref={formRef} className="bg-slate-900 border border-slate-800 shadow-xl p-8">
          <div className="mb-6">
            <label className="block text-slate-200 font-semibold mb-2 text-sm uppercase tracking-wide">I am a</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setRole("user")}
                className={`py-3 px-4 font-semibold transition-all duration-300 border ${
                  role === "user"
                    ? "bg-slate-50 text-slate-900 border-slate-50"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900"
                }`}
              >
                Rider
              </button>
              <button
                onClick={() => setRole("driver")}
                className={`py-3 px-4 font-semibold transition-all duration-300 border ${
                  role === "driver"
                    ? "bg-slate-50 text-slate-900 border-slate-50"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-900"
                }`}
              >
                Driver
              </button>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-slate-200 font-semibold mb-2 text-sm">Phone Number</label>
            <div className="relative">
              <input
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 text-slate-50 focus:border-slate-400 focus:outline-none transition-colors placeholder:text-slate-600"
                placeholder="Enter your phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-slate-200 font-semibold mb-2 text-sm">Password</label>
            <div className="relative">
              <input
                type="password"
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 text-slate-50 focus:border-slate-400 focus:outline-none transition-colors placeholder:text-slate-600"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={login}
            className="w-full bg-slate-50 text-slate-900 font-bold py-4 px-6 hover:bg-slate-200 transition-all duration-300"
          >
            Sign In
          </button>

          <p className="mt-6 text-center text-slate-400">
            Don't have an account?{" "}
            <a href="/register" className="text-slate-50 font-semibold hover:underline transition-colors">
              Create Account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
