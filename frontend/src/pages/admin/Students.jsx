import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import API from "../../api/axiosConfig";
import { getImageUrl } from "../../api/apiConfig";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useSidebar } from "../../context/SidebarContext";
import { HiUsers, HiSearch, HiTrash, HiUserCircle, HiSortAscending, HiSortDescending } from "react-icons/hi";

const Students = () => {
  const { isOpen } = useSidebar();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [totalStudents, setTotalStudents] = useState(0);

  const fetchStudents = useCallback(async (search = "", field = sortField, direction = sortDirection) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.append("search", search.trim());
      }
      params.append("sortField", field);
      params.append("sortDirection", direction);
      const query = params.toString();
      const res = await API.get(query ? `/admin/students?${query}` : "/admin/students");
      const payload = res.data?.data;
      const items = payload?.items ?? [];
      setStudents(items);
      setTotalStudents(payload?.total ?? items.length);
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
      setTotalStudents(0);
    } finally {
      setLoading(false);
    }
  }, [sortDirection, sortField]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchStudents(searchTerm, sortField, sortDirection);
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchStudents, searchTerm, sortField, sortDirection]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        await API.delete(`/admin/students/${id}`);
        toast.success("Student deleted successfully!");
        fetchStudents(searchTerm, sortField, sortDirection);
      } catch (error) {
        toast.error("Error deleting student. Please try again.");
        console.error("Error deleting student:", error);
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
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">Students</h2>
              <p className="text-gray-600 text-base sm:text-lg">Manage all students in the system</p>
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
                  Showing {students.length} of {totalStudents} students
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading students...</p>
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                <HiUsers className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No students found</h3>
                <p className="text-gray-600">{searchTerm ? "Try adjusting your search." : "No students registered yet."}</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-blue-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left">
                          <button
                            onClick={() => handleSort("name")}
                            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600"
                          >
                            Student Name
                            {sortField === "name" && (
                              sortDirection === "asc" ? <HiSortAscending /> : <HiSortDescending />
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left">
                          <button
                            onClick={() => handleSort("email")}
                            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600"
                          >
                            Email
                            {sortField === "email" && (
                              sortDirection === "asc" ? <HiSortAscending /> : <HiSortDescending />
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left">
                          <button
                            onClick={() => handleSort("phoneNumber")}
                            className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-blue-600"
                          >
                            Phone
                            {sortField === "phoneNumber" && (
                              sortDirection === "asc" ? <HiSortAscending /> : <HiSortDescending />
                            )}
                          </button>
                        </th>
                        <th className="px-6 py-4 text-left">
                          <span className="text-sm font-semibold text-gray-700">Role</span>
                        </th>
                        <th className="px-6 py-4 text-left">
                          <span className="text-sm font-semibold text-gray-700">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr key={student.id} className="hover:bg-blue-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {student.profilePhoto ? (
                                <img
                                  src={getImageUrl(student.profilePhoto)}
                                  alt={student.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                                  {getInitials(student.name)}
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => setSelectedStudent(student)}
                                className="font-medium text-gray-800 text-left hover:text-blue-700 focus:outline-none"
                                title="View student details"
                              >
                                {student.name || "N/A"}
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{student.email || "N/A"}</td>
                          <td className="px-6 py-4 text-gray-600">{student.phoneNumber || "N/A"}</td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full">
                              {student.role || "STUDENT"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleDelete(student.id)}
                              className="text-red-600 hover:text-red-700 transition-colors p-2 hover:bg-red-50 rounded-lg"
                              title="Delete Student"
                            >
                              <HiTrash className="text-xl" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
  
      {/* ✅ Student Details Modal INSIDE return */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-800">Student Details</h3>
              <button
                onClick={() => setSelectedStudent(null)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
  
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {selectedStudent.profilePhoto ? (
                  <img
                    src={getImageUrl(selectedStudent.profilePhoto)}
                    alt={selectedStudent.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                    {getInitials(selectedStudent.name)}
                  </div>
                )}
                <div>
                  <div className="text-lg font-semibold text-gray-900">{selectedStudent.name || "N/A"}</div>
                  <div className="text-sm text-gray-500">{selectedStudent.role || "STUDENT"}</div>
                </div>
              </div>
  
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                <div>
                  <div className="text-xs text-gray-500">Email</div>
                  <div className="text-sm font-medium text-gray-800 break-all">{selectedStudent.email || "N/A"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Phone</div>
                  <div className="text-sm font-medium text-gray-800">{selectedStudent.phoneNumber || "N/A"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Address</div>
                  <div className="text-sm font-medium text-gray-800">{selectedStudent.address || "N/A"}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Joined</div>
                  <div className="text-sm font-medium text-gray-800">
                    {selectedStudent.createdAt ? new Date(selectedStudent.createdAt).toLocaleString() : "N/A"}
                  </div>
                </div>
              </div>
  
              <div className="pt-4 flex justify-end">
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-blue-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
};

export default Students;

