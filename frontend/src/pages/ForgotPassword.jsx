import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import API from "../api/axiosConfig";
import { Link, useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await API.post("/auth/forgot-password", { email: data.email });
      setUserEmail(data.email);
      // Reset form to clear email field before showing OTP input
      reset();
      setOtpSent(true);
      toast.success("OTP has been sent to your email!");
    } catch (err) {
      console.error("Forgot password error:", err);
      toast.error(err.response?.data?.message || "Failed to send OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onVerifyOtp = async (data) => {
    setIsVerifying(true);
    try {
      await API.post("/auth/verify-otp", { 
        email: userEmail, 
        otp: data.otp 
      });
      toast.success("OTP verified successfully! Redirecting to reset password...");
      // Redirect to reset password page with email
      setTimeout(() => {
        navigate(`/reset-password?email=${encodeURIComponent(userEmail)}`);
      }, 1500);
    } catch (err) {
      console.error("OTP verification error:", err);
      toast.error(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md mx-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl border border-blue-200 backdrop-blur-sm">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-blue-600 mb-2">
              Forgot Password
            </h2>
            <p className="text-gray-600">
              {otpSent
                ? "Enter the OTP sent to your email"
                : "Enter your email to receive OTP"}
            </p>
          </div>

          {!otpSent ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.email ? "border-red-500" : "border-blue-300"
                  }`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? "Sending..." : "Send OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit(onVerifyOtp)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  {...register("otp", {
                    required: "OTP is required",
                    pattern: {
                      value: /^[0-9]{6}$/,
                      message: "OTP must be 6 digits",
                    },
                  })}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-2xl tracking-widest ${
                    errors.otp ? "border-red-500" : "border-blue-300"
                  }`}
                />
                {errors.otp && (
                  <p className="mt-1 text-sm text-red-600">{errors.otp.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isVerifying ? "Verifying..." : "Verify OTP"}
              </button>

              <div className="text-center mt-4">
                <button
                  type="button"
                  onClick={async () => {
                    setIsLoading(true);
                    try {
                      await API.post("/auth/forgot-password", { email: userEmail });
                      reset({ otp: "" });
                      toast.success("OTP has been resent to your email!");
                    } catch (err) {
                      console.error("Resend OTP error:", err);
                      toast.error(err.response?.data?.message || "Failed to resend OTP. Please try again.");
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  disabled={isLoading}
                  className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Resending..." : "Resend OTP"}
                </button>
              </div>
            </form>
          )}

          <div className="text-center mt-6">
            <Link
              to="/"
              className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-all"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

