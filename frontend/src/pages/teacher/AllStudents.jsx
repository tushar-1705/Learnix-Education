import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axiosConfig";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useSidebar } from "../../context/SidebarContext";

const AllStudents = () => {
  const { isOpen } = useSidebar();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const API_BASE_URL = "http://localhost:8082/api";

  const fetchStudents = useCallback(async (searchTerm = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }
      const query = params.toString();
      const res = await API.get(query ? `/teacher/students?${query}` : "/teacher/students");
      const payload = res.data?.data;
      const items = payload?.items ?? res.data?.data ?? [];
      setStudents(Array.isArray(items) ? items : []);
    } catch {
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchStudents(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchStudents, search]);

  const getInitials = (name = "") => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-28'}`}>
        <Navbar />
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-8 max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-800">All Students</h1>
              <input
                placeholder="Search by name or email"
                value={search}
                onChange={(e)=>setSearch(e.target.value)}
                className="border rounded-lg px-3 py-2 w-64"
              />
            </div>

            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : students.length === 0 ? (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center text-gray-600">No students found.</div>
            ) : (
              <div className="space-y-3">
                {students.map(student => (
                  <button
                    key={student.id}
                    onClick={() => navigate(`/teacher/students/${student.id}`)}
                    className="w-full text-left p-4 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:bg-blue-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      {student.profilePhoto ? (
                        <img
                          src={`${API_BASE_URL}/uploads/${student.profilePhoto}`}
                          alt={student.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {getInitials(student.name || '')}
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-800">{student.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-600">{student.email || ''}</div>
                        <div className="text-xs text-gray-500">{student.createdAt ? new Date(student.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : ''}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllStudents;
