import { useState, useEffect, useRef } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";

export default function Register() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");

  const nav = useNavigate();
  
  const containerRef = useRef(null);
  const formRef = useRef(null);
  const titleRef = useRef(null);
  const vehicleRef = useRef(null);

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

  useEffect(() => {
    if (role === "driver" && vehicleRef.current) {
      gsap.from(vehicleRef.current.children, {
        x: -30,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out"
      });
    }
  }, [role]);

  const register = async () => {
    try {
      if (role === "user") {
        const res = await api.post("/auth/register", {
          name,
          phone,
          password,
        });

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
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-green-500 via-teal-600 to-blue-600 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black opacity-20 pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <div ref={titleRef} className="text-center mb-8">
          <div className="inline-block p-4 bg-white/10 backdrop-blur-sm rounded-full mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Join Us Today</h1>
          <p className="text-white/80 text-lg">Create your account and start riding</p>
        </div>

        <div ref={formRef} className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8">
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2 text-sm uppercase tracking-wide">I want to be a</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setRole("user")}
                className={`py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                  role === "user"
                    ? "bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                🚗 Rider
              </button>
              <button
                onClick={() => setRole("driver")}
                className={`py-3 px-4 rounded-xl font-semibold transition-all duration-300 ${
                  role === "driver"
                    ? "bg-gradient-to-r from-green-500 to-teal-600 text-white shadow-lg scale-105"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                🚕 Driver
              </button>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-2 text-sm">Full Name</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">👤</span>
              <input
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-2 text-sm">Phone Number</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">📱</span>
              <input
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                placeholder="Enter your phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-gray-700 font-semibold mb-2 text-sm">Password</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">🔒</span>
              <input
                type="password"
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {role === "driver" && (
            <div ref={vehicleRef} className="mb-5 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-xl">
              <h3 className="text-gray-700 font-bold mb-3 flex items-center">
                🚗 Vehicle Information
              </h3>
              <div className="mb-4">
                <label className="block text-gray-600 font-semibold mb-2 text-sm">Vehicle Model</label>
                <input
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                  placeholder="e.g., Toyota Camry"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-gray-600 font-semibold mb-2 text-sm">License Plate</label>
                <input
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:outline-none transition-colors"
                  placeholder="e.g., ABC-1234"
                  value={vehiclePlate}
                  onChange={(e) => setVehiclePlate(e.target.value)}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={register}
            className="w-full bg-gradient-to-r from-green-500 to-teal-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Create Account
          </button>

          <p className="mt-6 text-center text-gray-600">
            Already have an account?{" "}
            <a href="/" className="text-green-600 font-semibold hover:text-green-700 transition-colors">
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
