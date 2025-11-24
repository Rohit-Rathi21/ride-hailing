import { useState, useRef } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const nav = useNavigate();
  
  const containerRef = useRef(null);
  const formRef = useRef(null);
  const titleRef = useRef(null);
  const vehicleRef = useRef(null);

  const validateField = (fieldName, value) => {
    let error = "";
    
    switch (fieldName) {
      case "name":
        if (!value.trim()) {
          error = "Name is required";
        } else if (value.trim().length < 2) {
          error = "Name must be at least 2 characters";
        } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          error = "Name can only contain letters and spaces";
        }
        break;
      
      case "phone":
        if (!value.trim()) {
          error = "Phone number is required";
        } else if (!/^[0-9]{10}$/.test(value.trim())) {
          error = "Phone number must be exactly 10 digits";
        }
        break;
      
      case "password":
        if (!value) {
          error = "Password is required";
        } else {
          const issues = [];
          if (value.length < 6) issues.push("at least 6 characters");
          if (!/(?=.*[a-z])/.test(value)) issues.push("one lowercase letter");
          if (!/(?=.*[A-Z])/.test(value)) issues.push("one uppercase letter");
          if (!/(?=.*[0-9])/.test(value)) issues.push("one number");
          
          if (issues.length > 0) {
            error = `Password must contain: ${issues.join(", ")}`;
          }
        }
        break;
      
      case "vehicleModel":
        if (role === "driver" && !value.trim()) {
          error = "Vehicle model is required for drivers";
        } else if (role === "driver" && value.trim().length < 2) {
          error = "Vehicle model must be at least 2 characters";
        }
        break;
      
      case "vehiclePlate":
        if (role === "driver" && !value.trim()) {
          error = "License plate is required for drivers";
        } else if (role === "driver" && value.trim().length < 3) {
          error = "License plate must be at least 3 characters";
        }
        break;
      
      default:
        break;
    }
    
    return error;
  };

  const validateForm = () => {
    const newErrors = {};
    
    newErrors.name = validateField("name", name);
    newErrors.phone = validateField("phone", phone);
    newErrors.password = validateField("password", password);
    
    if (role === "driver") {
      newErrors.vehicleModel = validateField("vehicleModel", vehicleModel);
      newErrors.vehiclePlate = validateField("vehiclePlate", vehiclePlate);
    }
    
    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== "");
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, eval(field));
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    if (touched.name) {
      const error = validateField("name", value);
      setErrors(prev => ({ ...prev, name: error }));
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(value);
    if (touched.phone) {
      const error = validateField("phone", value);
      setErrors(prev => ({ ...prev, phone: error }));
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    if (touched.password) {
      const error = validateField("password", value);
      setErrors(prev => ({ ...prev, password: error }));
    }
  };

  const handleVehicleModelChange = (e) => {
    const value = e.target.value;
    setVehicleModel(value);
    if (touched.vehicleModel) {
      const error = validateField("vehicleModel", value);
      setErrors(prev => ({ ...prev, vehicleModel: error }));
    }
  };

  const handleVehiclePlateChange = (e) => {
    const value = e.target.value.toUpperCase();
    setVehiclePlate(value);
    if (touched.vehiclePlate) {
      const error = validateField("vehiclePlate", value);
      setErrors(prev => ({ ...prev, vehiclePlate: error }));
    }
  };

  const register = async () => {
    const fieldsToTouch = { name: true, phone: true, password: true };
    if (role === "driver") {
      fieldsToTouch.vehicleModel = true;
      fieldsToTouch.vehiclePlate = true;
    }
    setTouched(fieldsToTouch);
    
    if (!validateForm()) {
      return;
    }
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
    <div ref={containerRef} className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <div ref={titleRef} className="text-center mb-8">
          <div className="inline-block p-4 bg-slate-900 border border-slate-800 mb-4">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-slate-50 mb-2">Join Us Today</h1>
          <p className="text-slate-400 text-lg">Create your account and start riding</p>
        </div>

        <div ref={formRef} className="bg-slate-900 border border-slate-800 shadow-xl p-8">
          <div className="mb-6">
            <label className="block text-slate-200 font-semibold mb-2 text-sm uppercase tracking-wide">I want to be a</label>
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
            <label className="block text-slate-200 font-semibold mb-2 text-sm">Full Name</label>
            <div className="relative">
              <input
                className={`w-full px-4 py-3 bg-slate-950 border text-slate-50 focus:outline-none transition-colors placeholder:text-slate-600 ${
                  touched.name && errors.name
                    ? "border-red-500 focus:border-red-400"
                    : "border-slate-800 focus:border-slate-400"
                }`}
                placeholder="Enter your name"
                value={name}
                onChange={handleNameChange}
                onBlur={() => handleBlur("name")}
                type="text"
              />
            </div>
            {touched.name && errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name}</p>
            )}
          </div>

          <div className="mb-5">
            <label className="block text-slate-200 font-semibold mb-2 text-sm">Phone Number</label>
            <div className="relative">
              <input
                className={`w-full px-4 py-3 bg-slate-950 border text-slate-50 focus:outline-none transition-colors placeholder:text-slate-600 ${
                  touched.phone && errors.phone
                    ? "border-red-500 focus:border-red-400"
                    : "border-slate-800 focus:border-slate-400"
                }`}
                placeholder="Enter your phone (10 digits)"
                value={phone}
                onChange={handlePhoneChange}
                onBlur={() => handleBlur("phone")}
                type="tel"
                maxLength={10}
              />
            </div>
            {touched.phone && errors.phone && (
              <p className="mt-1 text-sm text-red-400">{errors.phone}</p>
            )}
          </div>

          <div className="mb-5">
            <label className="block text-slate-200 font-semibold mb-2 text-sm">Password</label>
            <div className="relative">
              <input
                type="password"
                className={`w-full px-4 py-3 bg-slate-950 border text-slate-50 focus:outline-none transition-colors placeholder:text-slate-600 ${
                  touched.password && errors.password
                    ? "border-red-500 focus:border-red-400"
                    : "border-slate-800 focus:border-slate-400"
                }`}
                placeholder="Create a password"
                value={password}
                onChange={handlePasswordChange}
                onBlur={() => handleBlur("password")}
              />
            </div>
            {touched.password && errors.password && (
              <p className="mt-1 text-sm text-red-400">{errors.password}</p>
            )}
            <p className="mt-1 text-xs text-slate-500">Must contain uppercase, lowercase, and number (min 6 chars)</p>
          </div>

          {role === "driver" && (
            <div ref={vehicleRef} className="mb-5 p-4 bg-slate-950 border border-slate-800">
              <h3 className="text-slate-200 font-bold mb-3 flex items-center">
                Vehicle Information
              </h3>
              <div className="mb-4">
                <label className="block text-slate-400 font-semibold mb-2 text-sm">Vehicle Model</label>
                <input
                  className={`w-full px-4 py-3 bg-slate-900 border text-slate-50 focus:outline-none transition-colors placeholder:text-slate-600 ${
                    touched.vehicleModel && errors.vehicleModel
                      ? "border-red-500 focus:border-red-400"
                      : "border-slate-800 focus:border-slate-400"
                  }`}
                  placeholder="e.g., Toyota Camry"
                  value={vehicleModel}
                  onChange={handleVehicleModelChange}
                  onBlur={() => handleBlur("vehicleModel")}
                  type="text"
                />
                {touched.vehicleModel && errors.vehicleModel && (
                  <p className="mt-1 text-sm text-red-400">{errors.vehicleModel}</p>
                )}
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-2 text-sm">License Plate</label>
                <input
                  className={`w-full px-4 py-3 bg-slate-900 border text-slate-50 focus:outline-none transition-colors placeholder:text-slate-600 ${
                    touched.vehiclePlate && errors.vehiclePlate
                      ? "border-red-500 focus:border-red-400"
                      : "border-slate-800 focus:border-slate-400"
                  }`}
                  placeholder="e.g., ABC-1234"
                  value={vehiclePlate}
                  onChange={handleVehiclePlateChange}
                  onBlur={() => handleBlur("vehiclePlate")}
                  type="text"
                />
                {touched.vehiclePlate && errors.vehiclePlate && (
                  <p className="mt-1 text-sm text-red-400">{errors.vehiclePlate}</p>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={register}
            className="w-full bg-slate-50 text-slate-900 font-bold py-4 px-6 hover:bg-slate-200 transition-all duration-300"
          >
            Create Account
          </button>

          <p className="mt-6 text-center text-slate-400">
            Already have an account?{" "}
            <a href="/" className="text-slate-50 font-semibold hover:underline transition-colors">
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
