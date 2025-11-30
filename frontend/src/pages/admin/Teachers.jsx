import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import API from "../../api/axiosConfig";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useSidebar } from "../../context/SidebarContext";
import { HiUsers, HiSearch, HiTrash, HiPlus, HiSortAscending, HiSortDescending, HiX, HiEye, HiEyeOff } from "react-icons/hi";

const Teachers = () => {
  const { isOpen } = useSidebar();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [showSubjectsModal, setShowSubjectsModal] = useState(false);
  const [teacherSubjects, setTeacherSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const API_BASE_URL = "http://localhost:8082/api";

  // Form for adding teacher
  const {
    register: registerTeacher,
    handleSubmit: handleSubmitTeacher,
    formState: { errors: teacherErrors },
    reset: resetTeacher
  } = useForm();

  // Form for assigning subject
  const {
    register: registerSubject,
    handleSubmit: handleSubmitSubject,
    formState: { errors: subjectErrors },
    reset: resetSubject
  } = useForm();

  const [totalTeachers, setTotalTeachers] = useState(0);

  const fetchTeachers = useCallback(async (search = "", field = sortField, direction = sortDirection) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.append("search", search.trim());
      }
      params.append("sortField", field);
      params.append("sortDirection", direction);
      const query = params.toString();
      const res = await API.get(query ? `/admin/teachers?${query}` : "/admin/teachers");
      const payload = res.data?.data;
      const items = payload?.items ?? [];
      setTeachers(items);
      setTotalTeachers(payload?.total ?? items.length);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      setTeachers([]);
      setTotalTeachers(0);
    } finally {
      setLoading(false);
    }
  }, [sortDirection, sortField]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchTeachers(searchTerm, sortField, sortDirection);
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchTeachers, searchTerm, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const onSubmitTeacher = async (data) => {
    setSubmitting(true);
    try {
      const res = await API.post("/admin/teachers", { ...data, role: "TEACHER" });
      if (res.data?.message) {
        toast.success(res.data.message || "Teacher added successfully!");
      }
      setShowAddModal(false);
      resetTeacher();
      fetchTeachers(searchTerm, sortField, sortDirection);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Error adding teacher. Please try again.";
      toast.error(errorMsg);
      console.error("Error adding teacher:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const openAssignModal = (teacher) => {
    setSelectedTeacher(teacher);
    resetSubject();
    setShowAssignModal(true);
  };

  const onSubmitSubject = async (data) => {
    if (!selectedTeacher) return;
    setAssigning(true);
    try {
      const res = await API.post(`/admin/assign-subject`, null, {
        params: { teacherId: selectedTeacher.id, subject: data.subject.trim() },
      });
      toast.success(res.data?.message || "Subject assigned successfully");
      setShowAssignModal(false);
      resetSubject();
    } catch (error) {
      const msg = error.response?.data?.message || "Error assigning subject";
      toast.error(msg);
    } finally {
      setAssigning(false);
    }
  };

  const openSubjectsModal = async (teacher) => {
    setSelectedTeacher(teacher);
    setShowSubjectsModal(true);
    setLoadingSubjects(true);
    try {
      const res = await API.get(`/admin/teachers/${teacher.id}/subjects`);
      setTeacherSubjects(res.data?.data || []);
    } catch (error) {
      console.error("Error fetching teacher subjects:", error);
      setTeacherSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const handleUnassignSubject = async (assignmentId) => {
    if (!window.confirm("Unassign this subject from the teacher?")) return;
    try {
      const res = await API.delete(`/admin/assign-subject/${assignmentId}`);
      toast.success(res.data?.message || "Subject unassigned successfully");
      if (selectedTeacher) {
        const refresh = await API.get(`/admin/teachers/${selectedTeacher.id}/subjects`);
        setTeacherSubjects(refresh.data?.data || []);
      }
    } catch (error) {
      const msg = error.response?.data?.message || "Error unassigning subject";
      toast.error(msg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this teacher?")) {
      try {
        await API.delete(`/admin/teachers/${id}`);
        toast.success("Teacher deleted successfully!");
        fetchTeachers(searchTerm, sortField, sortDirection);
      } catch (error) {
        toast.error("Error deleting teacher. Please try again.");
        console.error("Error deleting teacher:", error);
      }
    }
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-28'}`}>
        <Navbar />
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">Teachers</h2>
                <p className="text-gray-600 text-base sm:text-lg">Manage all teachers in the system</p>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base w-full sm:w-auto justify-center"
              >
                <HiPlus className="text-lg" />
                Add Teacher
              </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <div className="flex-1 relative">
                  <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                  <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                  />
                </div>
                <div className="text-sm text-gray-600 text-center sm:text-left">
                  Showing {teachers.length} of {totalTeachers} teachers
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading teachers...</p>
              </div>
            ) : teachers.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                <HiUsers className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No teachers found</h3>
                <p className="text-gray-600">{searchTerm ? "Try adjusting your search." : "No teachers registered yet."}</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full min-w-[640px]">
                    <thead className="bg-blue-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm">
                          <button
                            onClick={() => handleSort("name")}
                            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600"
                          >
                            Teacher Name
                            {sortField === "name" && (
                              sortDirection === "asc" ? <HiSortAscending /> : <HiSortDescending />
                            )}
                          </button>
                        </th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm">
                          <button
                            onClick={() => handleSort("email")}
                            className="flex items-center gap-2 font-semibold text-gray-700 hover:text-blue-600"
                          >
                            Email
                            {sortField === "email" && (
                              sortDirection === "asc" ? <HiSortAscending /> : <HiSortDescending />
                            )}
                          </button>
                        </th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm">
                          <button
                            onClick={() => handleSort("phoneNumber")}
                            className="flex items-center gap-2 font-semibold text-gray-700 hover:text-blue-600"
                          >
                            Phone
                            {sortField === "phoneNumber" && (
                              sortDirection === "asc" ? <HiSortAscending /> : <HiSortDescending />
                            )}
                          </button>
                        </th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm">
                          <span className="font-semibold text-gray-700">Role</span>
                        </th>
                        <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs sm:text-sm">
                          <span className="font-semibold text-gray-700">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {teachers.map((teacher) => (
                        <tr key={teacher.id} className="hover:bg-blue-50 transition-colors">
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                              {teacher.profilePhoto ? (
                                <img
                                  src={`${API_BASE_URL}/uploads/${teacher.profilePhoto}`}
                                  alt={teacher.name}
                                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                                  {getInitials(teacher.name)}
                                </div>
                              )}
                              <span className="font-medium text-gray-800 text-sm sm:text-base">{teacher.name || "N/A"}</span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-600 text-sm sm:text-base">{teacher.email || "N/A"}</td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-600 text-sm sm:text-base">{teacher.phoneNumber || "N/A"}</td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                              {teacher.role || "TEACHER"}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => openAssignModal(teacher)}
                                className="text-blue-600 hover:text-blue-700 transition-colors px-2 sm:px-3 py-1 border border-blue-200 rounded-lg hover:bg-blue-50 text-xs sm:text-sm"
                                title="Assign Subject"
                              >
                                <span className="hidden sm:inline">Assign Subject</span>
                                <span className="sm:hidden">Assign</span>
                              </button>
                              <button
                                onClick={() => openSubjectsModal(teacher)}
                                className="text-blue-600 hover:text-blue-700 transition-colors px-2 sm:px-3 py-1 border border-blue-200 rounded-lg hover:bg-blue-50 text-xs sm:text-sm"
                                title="View Subjects"
                              >
                                <span className="hidden sm:inline">View Subjects</span>
                                <span className="sm:hidden">View</span>
                              </button>
                              <button
                                onClick={() => handleDelete(teacher.id)}
                                className="text-red-600 hover:text-red-700 transition-colors p-1.5 sm:p-2 hover:bg-red-50 rounded-lg"
                                title="Delete Teacher"
                              >
                                <HiTrash className="text-lg sm:text-xl" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Add Teacher Modal */}
            {showAddModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Add New Teacher</h3>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <HiX className="text-2xl" />
                    </button>
                  </div>
                  <form onSubmit={handleSubmitTeacher(onSubmitTeacher)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        {...registerTeacher("name", {
                          required: "Full name is required",
                          minLength: {
                            value: 2,
                            message: "Name must be at least 2 characters"
                          }
                        })}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          teacherErrors.name ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {teacherErrors.name && (
                        <p className="mt-1 text-sm text-red-600">{teacherErrors.name.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        {...registerTeacher("email", {
                          required: "Email is required",
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address"
                          }
                        })}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          teacherErrors.email ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {teacherErrors.email && (
                        <p className="mt-1 text-sm text-red-600">{teacherErrors.email.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Password *
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          {...registerTeacher("password", {
                            required: "Password is required",
                            minLength: {
                              value: 6,
                              message: "Password must be at least 6 characters"
                            }
                          })}
                          className={`w-full px-4 py-2 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            teacherErrors.password ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <HiEyeOff className="w-5 h-5" />
                          ) : (
                            <HiEye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      {teacherErrors.password && (
                        <p className="mt-1 text-sm text-red-600">{teacherErrors.password.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        {...registerTeacher("phoneNumber", {
                          pattern: {
                            value: /^[0-9]{10,15}$/,
                            message: "Please enter a valid phone number (10-15 digits)"
                          }
                        })}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          teacherErrors.phoneNumber ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {teacherErrors.phoneNumber && (
                        <p className="mt-1 text-sm text-red-600">{teacherErrors.phoneNumber.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Address
                      </label>
                      <textarea
                        rows={3}
                        {...registerTeacher("address")}
                        placeholder="Enter address (optional)"
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          teacherErrors.address ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {teacherErrors.address && (
                        <p className="mt-1 text-sm text-red-600">{teacherErrors.address.message}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Qualification
                      </label>
                      <input
                        type="text"
                        {...registerTeacher("qualification")}
                        placeholder="e.g., M.Sc, B.Ed, Ph.D"
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          teacherErrors.qualification ? "border-red-500" : "border-gray-300"
                        }`}
                      />
                      {teacherErrors.qualification && (
                        <p className="mt-1 text-sm text-red-600">{teacherErrors.qualification.message}</p>
                      )}
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-blue-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {submitting ? "Adding..." : "Add Teacher"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Assign Subject Modal */}
            {showAssignModal && selectedTeacher && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Assign Subject to {selectedTeacher.name}</h3>
                    <button onClick={() => setShowAssignModal(false)} className="text-gray-400 hover:text-gray-600">
                      <HiX className="text-2xl" />
                    </button>
                  </div>
                  <form onSubmit={handleSubmitSubject(onSubmitSubject)} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subject Name</label>
                      <input
                        type="text"
                        {...registerSubject("subject", {
                          required: "Subject name is required",
                          minLength: {
                            value: 2,
                            message: "Subject name must be at least 2 characters"
                          }
                        })}
                        className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          subjectErrors.subject ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="e.g., Mathematics, Physics, Class 10-A English"
                      />
                      {subjectErrors.subject && (
                        <p className="mt-1 text-sm text-red-600">{subjectErrors.subject.message}</p>
                      )}
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowAssignModal(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-blue-50 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={assigning}
                        className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {assigning ? "Assigning..." : "Assign"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Teacher Subjects Modal */}
            {showSubjectsModal && selectedTeacher && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">{selectedTeacher.name}'s Subjects</h3>
                    <button onClick={() => setShowSubjectsModal(false)} className="text-gray-400 hover:text-gray-600">
                      <HiX className="text-2xl" />
                    </button>
                  </div>
                  {loadingSubjects ? (
                    <p className="text-gray-600">Loading...</p>
                  ) : teacherSubjects.length === 0 ? (
                    <p className="text-gray-600">No subjects assigned.</p>
                  ) : (
                    <ul className="divide-y divide-gray-200">
                      {teacherSubjects.map((s) => (
                        <li key={s.id} className="py-3 flex items-center justify-between">
                          <div className="font-medium text-gray-800">{s.subject}</div>
                          <button
                            onClick={() => handleUnassignSubject(s.id)}
                            className="text-red-600 hover:text-red-700 transition-colors px-3 py-1 border border-red-200 rounded-lg hover:bg-red-50"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Teachers;

