import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext";
import API from "../api/axiosConfig";
import { getImageUrl } from "../api/apiConfig";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useSidebar } from "../context/SidebarContext";
import { HiUser, HiMail, HiPhone, HiPencil, HiX, HiCamera, HiCheck, HiTrash, HiLogout, HiLocationMarker, HiIdentification } from "react-icons/hi";

const MyProfile = () => {
  const { user, login, logout } = useAuth();
  const { isOpen } = useSidebar();
  const [isEditMode, setIsEditMode] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm();
  
  const formValues = watch();

  useEffect(() => {
    if (user) {
      reset({
        name: user.name || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        address: "",
        qualification: "",
      });
      if (user.profilePhoto) {
        setPhotoPreview(getImageUrl(user.profilePhoto));
      } else {
        setPhotoPreview(null);
      }
      
      // Fetch student profile data if user is a student
      if (user.role === "STUDENT" && user.email) {
        API.get(`/student/profile`, { params: { email: user.email } })
          .then((res) => {
            if (res.data?.data) {
              setValue("address", res.data.data.address || "");
            }
          })
          .catch(() => {});
      }
      
      // Fetch teacher profile data if user is a teacher
      if (user.role === "TEACHER") {
        API.get(`/teacher/profile`)
          .then((res) => {
            if (res.data?.data) {
              setValue("qualification", res.data.data.qualification || "");
              setValue("address", res.data.data.address || "");
            }
          })
          .catch(() => {});
      }
    }
  }, [user, reset, setValue]);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({
          type: "error",
          text: "File size must be less than 5MB",
        });
        return;
      }
      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoUpload = async () => {
    if (!profilePhoto || !user || !user.id) return;

    setUploadingPhoto(true);
    setMessage({ type: "", text: "" });

    try {
      const formData = new FormData();
      formData.append("file", profilePhoto);

      const response = await API.post(`/users/${user.id}/upload-photo`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data && response.data.data) {
        const updatedUser = response.data.data;
        const storedUser = { ...user, ...updatedUser };
        localStorage.setItem("user", JSON.stringify(storedUser));

        const token = localStorage.getItem("token");
        if (token) {
          login(token, storedUser);
        }

        setProfilePhoto(null);
        setMessage({
          type: "success",
          text: "Profile photo updated successfully!",
        });
      }
    } catch (error) {
      console.error("Error uploading photo:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to upload photo. Please try again.",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user || !user.id) return;

    if (!window.confirm("Are you sure you want to remove your profile photo?")) {
      return;
    }

    setUploadingPhoto(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await API.delete(`/users/${user.id}/remove-photo`);

      if (response.data && response.data.data) {
        const updatedUser = response.data.data;
        const storedUser = { ...user, ...updatedUser };
        localStorage.setItem("user", JSON.stringify(storedUser));

        const token = localStorage.getItem("token");
        if (token) {
          login(token, storedUser);
        }

        setPhotoPreview(null);
        setProfilePhoto(null);
        setMessage({
          type: "success",
          text: "Profile photo removed successfully!",
        });
      }
    } catch (error) {
      console.error("Error removing photo:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to remove photo. Please try again.",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onSubmit = async (data) => {
    if (!user || !user.id) {
      setMessage({
        type: "error",
        text: "User information not available. Please login again.",
      });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // Update user profile
      const response = await API.put(`/users/${user.id}`, {
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
      });

      // Update student profile if user is a student
      if (user.role === "STUDENT") {
        try {
          await API.put(`/student/profile/${user.id}`, {
            address: data.address,
          });
        } catch (studentError) {
          console.error("Error updating student profile:", studentError);
        }
      }

      // Update teacher profile if user is a teacher
      if (user.role === "TEACHER") {
        try {
          await API.post(`/teacher/profile`, null, {
            params: {
              qualification: data.qualification || "",
              address: data.address || "",
            },
          });
        } catch (teacherError) {
          console.error("Error updating teacher profile:", teacherError);
        }
      }

      if (response.data && response.data.data) {
        const updatedUser = response.data.data;
        const storedUser = { ...user, ...updatedUser };
        localStorage.setItem("user", JSON.stringify(storedUser));

        const token = localStorage.getItem("token");
        if (token) {
          login(token, storedUser);
        }

        setMessage({
          type: "success",
          text: response.data.message || "Profile updated successfully!",
        });
        setIsEditMode(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to update profile. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      reset({
        name: user.name || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
        address: "",
        qualification: "",
      });
      if (user.profilePhoto) {
        setPhotoPreview(getImageUrl(user.profilePhoto));
      } else {
        setPhotoPreview(null);
      }
      
      // Re-fetch profile data
      if (user.role === "STUDENT" && user.email) {
        API.get(`/student/profile`, { params: { email: user.email } })
          .then((res) => {
            if (res.data?.data) {
              setValue("address", res.data.data.address || "");
            }
          })
          .catch(() => {});
      }
      
      if (user.role === "TEACHER") {
        API.get(`/teacher/profile`)
          .then((res) => {
            if (res.data?.data) {
              setValue("qualification", res.data.data.qualification || "");
              setValue("address", res.data.data.address || "");
            }
          })
          .catch(() => {});
      }
    }
    setProfilePhoto(null);
    setIsEditMode(false);
    setMessage({ type: "", text: "" });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-28'}`}>
        <Navbar />
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 sm:p-6 lg:p-8 w-full">
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <HiUser className="text-2xl sm:text-3xl text-blue-600" />
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600">My Profile</h2>
            </div>
            <p className="text-gray-600 text-sm sm:text-base lg:text-lg ml-0 sm:ml-8 lg:ml-11">
              {isEditMode ? "Edit your profile information" : "View your profile information"}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-blue-200 p-4 sm:p-6 lg:p-8 w-full max-w-6xl mx-auto">
            {!isEditMode ? (
              // Display Mode
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 lg:gap-8">
                  {/* Profile Photo */}
                  <div className="flex-shrink-0 mx-auto sm:mx-0">
                    <div className="relative">
                      <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border-4 border-blue-500">
                        {photoPreview ? (
                          <img
                            src={photoPreview}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <HiUser className="text-5xl sm:text-6xl text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 w-full min-w-0 space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-500 mb-1">
                        Full Name
                      </label>
                      <p className="text-lg sm:text-xl font-semibold text-gray-800 break-words">{user?.name || "N/A"}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-500 mb-1">
                        Email Address
                      </label>
                      <p className="text-base sm:text-lg text-gray-700 break-words break-all">{user?.email || "N/A"}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-500 mb-1">
                        Phone Number
                      </label>
                      <p className="text-base sm:text-lg text-gray-700">{user?.phoneNumber || "N/A"}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-500 mb-1">
                        Role
                      </label>
                      <span className="inline-block px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-700 rounded-full border border-blue-200">
                        {user?.role || "N/A"}
                      </span>
                    </div>

                    {user?.role === "STUDENT" && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-gray-500 mb-1">
                            Address
                          </label>
                          <p className="text-base sm:text-lg text-gray-700 break-words">{formValues.address || "N/A"}</p>
                        </div>
                      </>
                    )}

                    {user?.role === "TEACHER" && (
                      <>
                        <div>
                          <label className="block text-sm font-semibold text-gray-500 mb-1">
                            Qualification
                          </label>
                          <p className="text-base sm:text-lg text-gray-700 break-words">{formValues.qualification || "N/A"}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-500 mb-1">
                            Address
                          </label>
                          <p className="text-base sm:text-lg text-gray-700 break-words">{formValues.address || "N/A"}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Edit and Logout Buttons */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <HiPencil className="text-base" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors shadow-sm hover:shadow-md"
                  >
                    <HiLogout className="text-base" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            ) : (
              // Edit Mode
              <div className="space-y-6">
                <div className="flex items-start gap-8">
                  {/* Profile Photo Upload */}
                  <div className="flex-shrink-0">
                    <div className="relative">
                      <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center border-4 border-blue-500">
                        {photoPreview ? (
                          <img
                            src={photoPreview}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <HiUser className="text-6xl text-gray-400" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
                      >
                        <HiCamera className="text-xl" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                    </div>
                    <div className="mt-2 space-y-2">
                      {profilePhoto && (
                        <button
                          type="button"
                          onClick={handlePhotoUpload}
                          disabled={uploadingPhoto}
                          className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors disabled:bg-green-400"
                        >
                          {uploadingPhoto ? (
                            <>Uploading...</>
                          ) : (
                            <>
                              <HiCheck className="text-lg" />
                              <span>Save Photo</span>
                            </>
                          )}
                        </button>
                      )}
                      {(user?.profilePhoto || photoPreview) && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          disabled={uploadingPhoto}
                          className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:bg-red-400"
                        >
                          <HiTrash className="text-lg" />
                          <span>Remove Photo</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Form Fields */}
                  <div className="flex-1">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                      {/* Name Field */}
                      <div>
                        <label
                          htmlFor="name"
                          className="block text-sm font-semibold text-gray-700 mb-2"
                        >
                          <div className="flex items-center gap-2">
                            <HiUser className="text-lg" />
                            Full Name
                          </div>
                        </label>
                        <input
                          type="text"
                          id="name"
                          {...register("name", {
                            required: "Full name is required",
                            minLength: {
                              value: 2,
                              message: "Name must be at least 2 characters"
                            }
                          })}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${
                            errors.name ? "border-red-500" : "border-blue-300"
                          }`}
                          placeholder="Enter your full name"
                        />
                        {errors.name && (
                          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                        )}
                      </div>

                      {/* Email Field */}
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-semibold text-gray-700 mb-2"
                        >
                          <div className="flex items-center gap-2">
                            <HiMail className="text-lg" />
                            Email Address
                          </div>
                        </label>
                        <input
                          type="email"
                          id="email"
                          {...register("email", {
                            required: "Email is required",
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: "Invalid email address"
                            }
                          })}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${
                            errors.email ? "border-red-500" : "border-blue-300"
                          }`}
                          placeholder="Enter your email address"
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                        )}
                      </div>

                      {/* Phone Number Field */}
                      <div>
                        <label
                          htmlFor="phoneNumber"
                          className="block text-sm font-semibold text-gray-700 mb-2"
                        >
                          <div className="flex items-center gap-2">
                            <HiPhone className="text-lg" />
                            Phone Number
                          </div>
                        </label>
                        <input
                          type="tel"
                          id="phoneNumber"
                          {...register("phoneNumber", {
                            pattern: {
                              value: /^[0-9]{10,15}$/,
                              message: "Please enter a valid phone number (10-15 digits)"
                            }
                          })}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${
                            errors.phoneNumber ? "border-red-500" : "border-blue-300"
                          }`}
                          placeholder="Enter your phone number"
                        />
                        {errors.phoneNumber && (
                          <p className="mt-1 text-sm text-red-600">{errors.phoneNumber.message}</p>
                        )}
                      </div>

                      {/* Role Display (Read-only) */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Role
                        </label>
                        <input
                          type="text"
                          value={user?.role || ""}
                          disabled
                          className="w-full px-4 py-3 border border-blue-300 rounded-lg bg-blue-50 text-gray-600 cursor-not-allowed"
                        />
                      </div>

                      {/* Student-specific fields */}
                      {user?.role === "STUDENT" && (
                        <>
                          {/* Address Field */}
                          <div>
                            <label
                              htmlFor="address"
                              className="block text-sm font-semibold text-gray-700 mb-2"
                            >
                              <div className="flex items-center gap-2">
                                <HiLocationMarker className="text-lg" />
                                Address
                              </div>
                            </label>
                            <textarea
                              id="address"
                              {...register("address")}
                              rows={3}
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${
                                errors.address ? "border-red-500" : "border-blue-300"
                              }`}
                              placeholder="Enter your address"
                            />
                            {errors.address && (
                              <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                            )}
                          </div>
                        </>
                      )}

                      {/* Teacher-specific fields */}
                      {user?.role === "TEACHER" && (
                        <>
                          {/* Qualification Field */}
                          <div>
                            <label
                              htmlFor="qualification"
                              className="block text-sm font-semibold text-gray-700 mb-2"
                            >
                              <div className="flex items-center gap-2">
                                <HiIdentification className="text-lg" />
                                Qualification
                              </div>
                            </label>
                            <input
                              type="text"
                              id="qualification"
                              {...register("qualification")}
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${
                                errors.qualification ? "border-red-500" : "border-blue-300"
                              }`}
                              placeholder="e.g., M.Sc, B.Ed, Ph.D"
                            />
                            {errors.qualification && (
                              <p className="mt-1 text-sm text-red-600">{errors.qualification.message}</p>
                            )}
                          </div>
                          {/* Address Field */}
                          <div>
                            <label
                              htmlFor="address"
                              className="block text-sm font-semibold text-gray-700 mb-2"
                            >
                              <div className="flex items-center gap-2">
                                <HiLocationMarker className="text-lg" />
                                Address
                              </div>
                            </label>
                            <textarea
                              id="address"
                              {...register("address")}
                              rows={3}
                              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${
                                errors.address ? "border-red-500" : "border-blue-300"
                              }`}
                              placeholder="Enter your address"
                            />
                            {errors.address && (
                              <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                            )}
                          </div>
                        </>
                      )}

                      {/* Message Display */}
                      {message.text && (
                        <div
                          className={`p-4 rounded-lg ${
                            message.type === "success"
                              ? "bg-green-50 text-green-800 border border-green-200"
                              : "bg-red-50 text-red-800 border border-red-200"
                          }`}
                        >
                          {message.text}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-4 pt-4 border-t">
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-all duration-300"
                        >
                          <HiX className="text-lg" />
                          <span>Cancel</span>
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                        >
                          {loading ? "Updating..." : "Update Profile"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyProfile;
