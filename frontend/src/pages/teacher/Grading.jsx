import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import API from "../../api/axiosConfig";
import { useSidebar } from "../../context/SidebarContext";

const Grading = () => {
  const { isOpen } = useSidebar();
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [gradeByStudent, setGradeByStudent] = useState({});
  const [remarksByStudent, setRemarksByStudent] = useState({});
  const [submittingId, setSubmittingId] = useState(null);

  const fetchStudents = useCallback(async (searchTerm = "") => {
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
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchStudents(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchStudents, search]);

  const assign = async (studentId) => {
    const grade = (gradeByStudent[studentId] || "").trim();
    const remarks = (remarksByStudent[studentId] || "").trim();
    if (!grade) {
      toast.warning("Please enter a grade");
      return;
    }
    setSubmittingId(studentId);
    try {
      const params = new URLSearchParams();
      params.append("studentId", studentId);
      params.append("grade", grade);
      if (remarks) params.append("remarks", remarks);
      await API.post(`/teacher/grading/assign?${params.toString()}`);
      toast.success("Grade assigned successfully");
      setGradeByStudent(prev => ({ ...prev, [studentId]: "" }));
      setRemarksByStudent(prev => ({ ...prev, [studentId]: "" }));
    } catch (e) {
      toast.error("Failed to assign grade");
    } finally {
      setSubmittingId(null);
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
              <h1 className="text-2xl font-bold text-gray-800">Grade Assignments</h1>
              <input
                placeholder="Search by name or email"
                value={search}
                onChange={(e)=>setSearch(e.target.value)}
                className="border rounded-lg px-3 py-2 w-64"
              />
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <table className="min-w-full">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Grade</th>
                    <th className="p-3">Remarks</th>
                    <th className="p-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s.id} className="border-t">
                      <td className="p-3">{s.name}</td>
                      <td className="p-3">{s.email}</td>
                      <td className="p-3">
                        <input
                          value={gradeByStudent[s.id] || ""}
                          onChange={(e)=>setGradeByStudent(prev => ({ ...prev, [s.id]: e.target.value }))}
                          placeholder="e.g. A+ or 85"
                          className="border rounded px-2 py-1 w-28"
                        />
                      </td>
                      <td className="p-3">
                        <input
                          value={remarksByStudent[s.id] || ""}
                          onChange={(e)=>setRemarksByStudent(prev => ({ ...prev, [s.id]: e.target.value }))}
                          placeholder="Optional remarks"
                          className="border rounded px-2 py-1 w-64"
                        />
                      </td>
                      <td className="p-3">
                        <button
                          onClick={()=>assign(s.id)}
                          disabled={submittingId === s.id}
                          className={`px-3 py-2 rounded text-white ${submittingId === s.id ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                        >
                          {submittingId === s.id ? 'Saving...' : 'Assign'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && (
                    <tr>
                      <td className="p-6 text-center text-gray-500" colSpan={5}>No students found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Grading;


