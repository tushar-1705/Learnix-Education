import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import API from "../../api/axiosConfig";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useSidebar } from "../../context/SidebarContext";

const ManageStudents = () => {
  const { isOpen } = useSidebar();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [attendanceByStudent, setAttendanceByStudent] = useState({});
  const [date, setDate] = useState(() => new Date().toISOString().slice(0,10));
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStudents = useCallback(async (searchTerm = "", sortField = sortKey, direction = sortDir) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }
      params.append("sortField", sortField);
      params.append("sortDirection", direction);
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
  }, [sortDir, sortKey]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchStudents(search, sortKey, sortDir);
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchStudents, search, sortKey, sortDir]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceByStudent((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const entries = students.map((s) => ({
        studentId: s.id,
        status: (attendanceByStudent[s.id] || "ABSENT").toUpperCase(),
      }));

      await API.post("/teacher/attendance/mark", { date, entries });
      toast.success("Attendance submitted successfully.");
      // Reset selections so buttons return to normal state
      setAttendanceByStudent({});
    } catch (e) {
      toast.error("Failed to submit attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-28'}`}>
        <Navbar />
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Manage Students</h1>
              <div className="flex gap-3">
                <input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="border rounded-lg px-3 py-2" />
                <input
                  placeholder="Search by name or email"
                  value={search}
                  onChange={(e)=>setSearch(e.target.value)}
                  className="border rounded-lg px-3 py-2 w-64"
                />
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={`px-4 py-2 rounded-lg text-white ${submitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {submitting ? 'Submitting...' : 'Submit Attendance'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="text-left text-gray-600">
                      <th className="p-3 cursor-pointer" onClick={()=>toggleSort('name')}>Name</th>
                      <th className="p-3 cursor-pointer" onClick={()=>toggleSort('email')}>Email</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td className="p-6 text-center text-gray-500" colSpan="4">Loading...</td>
                      </tr>
                    ) : students.length === 0 ? (
                      <tr>
                        <td className="p-6 text-center text-gray-500" colSpan="4">No students found</td>
                      </tr>
                    ) : (
                      students.map((s) => (
                        <tr key={s.id} className="border-t">
                          <td className="p-3">{s.name}</td>
                          <td className="p-3">{s.email}</td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className={`px-3 py-1 rounded ${attendanceByStudent[s.id] === 'PRESENT' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700'}`}
                                onClick={()=>handleStatusChange(s.id, 'PRESENT')}
                              >Present</button>
                              <button
                                type="button"
                                className={`px-3 py-1 rounded ${attendanceByStudent[s.id] === 'ABSENT' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'}`}
                                onClick={()=>handleStatusChange(s.id, 'ABSENT')}
                              >Absent</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageStudents;


