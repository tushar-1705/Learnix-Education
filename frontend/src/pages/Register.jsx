import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import API from "../api/axiosConfig";
import { useNavigate, Link } from "react-router-dom";
import { HiEye, HiEyeOff } from "react-icons/hi";
import { FiMail, FiUser, FiPhone } from "react-icons/fi";

const Register = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Watch password field to compare with confirm password
  const password = watch("password");

  // Initialize Google Sign-In on component mount
  useEffect(() => {
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    // Check if Client ID is configured
    if (GOOGLE_CLIENT_ID === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
      console.warn('Google Client ID not configured. Please set VITE_GOOGLE_CLIENT_ID in .env file');
      return;
    }

    const loadGoogleScript = async () => {
      if (!window.google) {
        // Check if script already exists in the DOM
        const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        if (existingScript) {
          // Script exists but not loaded yet, wait for it
          existingScript.addEventListener('load', initializeGoogleSignIn);
          existingScript.addEventListener('error', handleScriptError);
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        
        script.onload = initializeGoogleSignIn;
        script.onerror = handleScriptError;
        
        document.body.appendChild(script);
      } else {
        // Google script already loaded, just initialize
        initializeGoogleSignIn();
      }
    };

    const handleScriptError = () => {
      console.error("Failed to load Google Sign-In script. Please check your internet connection.");
      toast.error("Unable to load Google Sign-In. Please check your internet connection and try again.");
    };

    const initializeGoogleSignIn = () => {
      try {
        if (!window.google || !window.google.accounts) {
          console.error("Google Sign-In library not available");
          return;
        }

        // Initialize Google Sign-In
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          auto_select: false,
          cancel_on_tap_outside: true,
          callback: async (response) => {
            try {
              // Direct Google registration without requiring form input
              const res = await API.post('/auth/google/register', {
                idToken: response.credential,
                role: "STUDENT"
              });

              toast.success("Registration successful with Google! Please wait for admin approval.");
              navigate("/");
            } catch (err) {
              console.error("Google registration error:", err);
              toast.error(err.response?.data?.message || "Google registration failed. Please try again.");
            }
          }
        });

        // Render Google Sign-In button in hidden div for programmatic triggering
        const hiddenButtonDiv = document.getElementById('google-signup-button-hidden');
        if (hiddenButtonDiv) {
          window.google.accounts.id.renderButton(hiddenButtonDiv, {
            theme: 'outline',
            size: 'large',
            width: 300,
            text: 'signup_with',
            locale: 'en',
            type: 'standard'
          });
        }
        // Disable auto-select to prevent personalization
        window.google.accounts.id.disableAutoSelect();
      } catch (error) {
        console.error("Error initializing Google Sign-In:", error);
        toast.error("Failed to initialize Google Sign-In. Please refresh the page.");
      }
    };

    loadGoogleScript();
  }, [navigate]);

  const onSubmit = async (data) => {
    // Check if passwords match (additional validation)
    if (data.password !== data.confirmPassword) {
      toast.error("Passwords do not match. Please try again.");
      return;
    }

    try {
      // Remove confirmPassword from data before sending to API
      const { confirmPassword, ...registerData } = data;
      // Register student only
      await API.post("/auth/register", { ...registerData, role: "STUDENT" });
      toast.success("Registration successful! Please login.");
      reset();
      navigate("/");
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Error during registration. Please try again.";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="rounded-2xl border border-blue-200 bg-white p-10 shadow-2xl backdrop-blur-sm"
        >
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-blue-600">Create Account</h2>
            <p className="mt-2 text-sm text-gray-600">
              Join us today! Please enter your details.
            </p>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter full name"
                {...register("name", {
                  required: "Full name is required",
                  minLength: {
                    value: 2,
                    message: "Name must be at least 2 characters"
                  }
                })}
                className={`w-full border-b border-blue-300 pb-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none transition-colors ${
                  errors.name ? "border-red-500 focus:border-red-500" : ""
                }`}
              />
              <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-blue-400">
                <FiUser className="h-5 w-5" />
              </span>
              {errors.name && (
                <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="relative">
              <input
                type="tel"
                placeholder="Enter phone number"
                {...register("phoneNumber", {
                  required: "Phone number is required",
                  pattern: {
                    value: /^[0-9]{10,15}$/,
                    message: "Please enter a valid phone number (10-15 digits)"
                  }
                })}
                className={`w-full border-b border-purple-300 pb-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-cyan-500 focus:outline-none transition-colors ${
                  errors.phoneNumber ? "border-red-500 focus:border-red-500" : ""
                }`}
              />
              <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-blue-400">
                <FiPhone className="h-5 w-5" />
              </span>
              {errors.phoneNumber && (
                <p className="mt-1 text-xs text-red-500">{errors.phoneNumber.message}</p>
              )}
            </div>

            <div className="relative">
              <input
                type="email"
                placeholder="Enter email"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address"
                  }
                })}
                className={`w-full border-b border-purple-300 pb-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-cyan-500 focus:outline-none transition-colors ${
                  errors.email ? "border-red-500 focus:border-red-500" : ""
                }`}
              />
              <span className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-blue-400">
                <FiMail className="h-5 w-5" />
              </span>
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
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
                    message: "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character"
                  },
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters"
                  }
                })}
                className={`w-full border-b border-purple-300 pb-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-cyan-500 focus:outline-none transition-colors ${
                  errors.password ? "border-red-500 focus:border-red-500" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-blue-500 transition-colors hover:text-blue-700 focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
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

            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm password"
                {...register("confirmPassword", {
                  required: "Please confirm your password",
                  validate: (value) =>
                    value === password || "Passwords do not match"
                })}
                className={`w-full border-b border-purple-300 pb-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-cyan-500 focus:outline-none transition-colors ${
                  errors.confirmPassword ? "border-red-500 focus:border-red-500" : ""
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-blue-500 transition-colors hover:text-blue-700 focus:outline-none"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? (
                  <HiEyeOff className="h-5 w-5" />
                ) : (
                  <HiEye className="h-5 w-5" />
                )}
              </button>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="mt-8 w-full rounded-md bg-blue-600 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Create Account
          </button>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account{" "}
            <Link
              to="/"
              className="font-semibold text-blue-600 transition-all hover:text-blue-700"
            >
              Sign in here
            </Link>
          </p>

          <div className="mt-6 border-t border-blue-200 pt-6">
            <p className="text-center text-xs uppercase tracking-[0.25em] text-gray-400">
              OR
            </p>
            <div className="mt-4 flex justify-center">
              <div className="relative w-full max-w-xs" style={{ minHeight: '48px' }}>
                {/* Google button - positioned on top to receive clicks */}
                <div 
                  id="google-signup-button-hidden" 
                  className="absolute inset-0 flex items-center justify-center z-10"
                  style={{ minHeight: '48px' }}
                ></div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
