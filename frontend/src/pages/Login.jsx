import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import API from "../api/axiosConfig";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { FiMail } from "react-icons/fi";

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const { login } = useAuth();
  const navigate = useNavigate();
  const email = watch("email");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  // ---------------- GOOGLE RESPONSE HANDLER ----------------
  const handleGoogleResponse = async (response) => {
    try {
      const res = await API.post("/auth/google/login", {
        idToken: response.credential,
        email: email || null
      });

      const token = res.data?.data?.token;
      const user = res.data?.data?.user;

      login(token, user);

      const userRole = user.role || "STUDENT";
      if (userRole === "ADMIN") navigate("/admin/dashboard");
      else if (userRole === "TEACHER") navigate("/teacher/dashboard");
      else navigate("/student/dashboard");

    } catch (err) {
      console.error("Google login failed:", err);
      toast.error("Google login failed. Please try again.");
    }
  };

  // ---------------- LOAD GOOGLE SDK ----------------
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
  
    /* Load Google script */
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
  
    script.onload = () => {
      /* Initialize Google */
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
  
      /* Render Google button */
      window.google.accounts.id.renderButton(
        document.getElementById("googleLoginBtn"),
        {
          theme: "outline",
          size: "large",
          width: "100%",
        }
      );
    };
  
    document.body.appendChild(script);
  }, []);
  

  // ---------------- NORMAL EMAIL PASSWORD LOGIN ----------------
  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const res = await API.post("/auth/login", {
        email: data.email,
        password: data.password,
      });

      const token = res.data?.data?.token;
      const user = res.data?.data?.user;

      login(token, user);

      const userRole = user.role || "STUDENT";
      if (userRole === "ADMIN") navigate("/admin/dashboard");
      else if (userRole === "TEACHER") navigate("/teacher/dashboard");
      else navigate("/student/dashboard");

    } catch (err) {
      console.error("Login error:", err);

      const errorStatus = err.response?.status;
      const errorMessage = err.response?.data?.message || "";

      if (errorStatus === 403 && errorMessage.includes("pending approval")) {
        toast.error("Your admission is pending approval.", { autoClose: 5000 });
      } else {
        toast.error(errorMessage || "Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- GOOGLE BUTTON CLICK ----------------
  const startGoogleLogin = () => {
    if (!window.google || !window.google.accounts) {
      toast.error("Google SDK not loaded yet. Please try again.");
      return;
    }
  
    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "email profile openid",
      ux_mode: "popup",
      callback: async (response) => {
        try {
          // Exchange auth code on backend
          const res = await API.post("/auth/google/login", {
            code: response.code
          });
  
          const token = res.data?.data?.token;
          const user = res.data?.data?.user;
  
          login(token, user);
  
          const userRole = user.role || "STUDENT";
          if (userRole === "ADMIN") navigate("/admin/dashboard");
          else if (userRole === "TEACHER") navigate("/teacher/dashboard");
          else navigate("/student/dashboard");
  
        } catch (err) {
          console.error(err);
          toast.error("Google login failed.");
        }
      },
    });
  
    client.requestCode();
  };
  

  // ---------------- UI ----------------

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl border border-blue-200 bg-white p-10 shadow-2xl backdrop-blur-sm"
        >
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-blue-600">Sign in</h2>
            <p className="mt-2 text-sm text-gray-600">
              Welcome back! Please enter your details.
            </p>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <input
                type="email"
                placeholder="Enter email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                className={`w-full border-b border-blue-300 pb-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none transition-colors ${
                  errors.email ? "border-red-500 focus:border-red-500" : ""
                }`}
              />
              <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-blue-400">
                <FiMail className="h-5 w-5" />
              </span>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                {...register("password", {
                  required: "Password is required",
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                    message: "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character",
                  },
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
                className={`w-full border-b border-blue-300 pb-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none transition-colors ${
                  errors.password ? "border-red-500 focus:border-red-500" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-700"
              >
                {showPassword ? (
                  <HiEyeOff className="h-5 w-5" />
                ) : (
                  <HiEye className="h-5 w-5" />
                )}
              </button>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600">
                <input
                  type="checkbox"
                  {...register("rememberMe")}
                  className="h-4 w-4 rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                />
                Remember me
              </label>
              <Link
                to="/forgot-password"
                className="font-semibold text-blue-600 hover:text-blue-700"
              >
                Forgot Password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`mt-8 w-full rounded-md py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transform ${
              isLoading
                ? "bg-blue-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 hover:scale-105"
            }`}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account{" "}
            <Link
              to="/register"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              Register here
            </Link>
          </p>

          {/* GOOGLE LOGIN BUTTON */}
          <div className="mt-6 border-t border-blue-200 pt-6">
            <p className="text-center text-xs uppercase tracking-[0.25em] text-gray-400">
              OR
            </p>

            <div className="mt-4 flex justify-center">
            <div id="googleLoginBtn" className="w-full flex justify-center mt-4"></div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
