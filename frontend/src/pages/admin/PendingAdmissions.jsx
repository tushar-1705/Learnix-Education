import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../api/axiosConfig";
import { getImageUrl } from "../../api/apiConfig";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useSidebar } from "../../context/SidebarContext";

const PendingAdmissions = () => {
  const { isOpen } = useSidebar();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [totalPending, setTotalPending] = useState(0);

  const fetchPending = useCallback(async (searchTerm = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }
      const query = params.toString();
      const res = await API.get(query ? `/admin/pending-admissions?${query}` : "/admin/pending-admissions");
      const payload = res.data?.data;
      const items = payload?.items ?? (Array.isArray(payload) ? payload : []);
      setStudents(items);
      setTotalPending(payload?.total ?? items.length);
    } catch (e) {
      setStudents([]);
      setTotalPending(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPending(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchPending, search]);

  const handleApprove = async (id) => {
    try {
      await API.post(`/admin/approve-admission/${id}`);
      await fetchPending(search);
      toast.success("Admission approved successfully!");
    } catch (e) {
      toast.error("Failed to approve admission. Please try again.");
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-28'}`}>
        <Navbar />
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-8 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-800">Pending Admissions</h1>
              <input
                placeholder="Search by name or email"
                value={search}
                onChange={(e)=>setSearch(e.target.value)}
                className="border rounded-lg px-3 py-2 w-64"
              />
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              {loading ? (
                <div className="text-center py-12">Loading...</div>
              ) : students.length === 0 ? (
                <div className="text-center text-gray-600">No pending admissions</div>
              ) : (
                <div className="space-y-3">
                  {students.map(s => (
                    <div key={s.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {s.profilePhoto ? (
                          <img src={getImageUrl(s.profilePhoto)} alt={s.name} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                            {(s.name || "").split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-gray-800">{s.name}</div>
                          <div className="text-sm text-gray-600">{s.email}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleApprove(s.id)}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Approve
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingAdmissions;


