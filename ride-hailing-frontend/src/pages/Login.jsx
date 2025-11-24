import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const nav = useNavigate();
  
  const containerRef = useRef(null);
  const formRef = useRef(null);
  const titleRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(titleRef.current, {
        y: -50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
      });
      
      gsap.from(formRef.current.children, {
        y: 30,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power2.out",
        delay: 0.3
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

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
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black opacity-20 pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <div ref={titleRef} className="text-center mb-8">
          <div className="inline-block p-4 bg-white/10 backdrop-blur-sm rounded-full mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-white/80 text-lg">Sign in to continue your journey</p>
        </div>

        <div ref={formRef} className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8">
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2 text-sm uppercase tracking-wide">I am a</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setRole("user")}
                className={`py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                  role === "user"
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                🚗 Rider
              </button>
              <button
                onClick={() => setRole("driver")}
                className={`py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                  role === "driver"
                    ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                🚕 Driver
              </button>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-2 text-sm">Phone Number</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">📱</span>
              <input
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                placeholder="Enter your phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2 text-sm">Password</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">🔒</span>
              <input
                type="password"
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={login}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Sign In
          </button>

          <p className="mt-6 text-center text-gray-600">
            Don't have an account?{" "}
            <a href="/register" className="text-purple-600 font-semibold hover:text-purple-700 transition-colors">
              Create Account
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
