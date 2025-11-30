import { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import API from "../../api/axiosConfig";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";
import { 
  HiClipboardCheck, 
  HiCheckCircle, 
  HiXCircle,
  HiCalendar,
  HiUser,
  HiBookOpen,
  HiChartBar,
  HiFilter
} from "react-icons/hi";

const MyAttendance = () => {
  const { isOpen } = useSidebar();
  const { user } = useAuth();
  const [attendanceData, setAttendanceData] = useState({
    records: [],
    total: 0,
    present: 0,
    absent: 0,
    attendancePercent: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, PRESENT, ABSENT
  const [dateFilter, setDateFilter] = useState(""); // Filter by date

  useEffect(() => {
    const email = user?.email || localStorage.getItem("email");
    if (email) {
      fetchAttendance(email);
    }
  }, [user?.email]);

  const fetchAttendance = async (email) => {
    setLoading(true);
    try {
      const res = await API.get("/student/attendance", { params: { email } });
      if (res.data?.data) {
        setAttendanceData(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = useMemo(() => {
    let filtered = attendanceData.records || [];

    // Filter by status
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(record => record.status === statusFilter);
    }

    // Filter by search term (teacher name or class name)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(record =>
        (record.teacherName || "").toLowerCase().includes(term) ||
        (record.className || "").toLowerCase().includes(term)
      );
    }

    // Filter by date
    if (dateFilter) {
      filtered = filtered.filter(record => record.date === dateFilter);
    }

    return filtered;
  }, [attendanceData.records, statusFilter, searchTerm, dateFilter]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (status) => {
    if (status === "PRESENT") {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
          <HiCheckCircle className="text-base" />
          Present
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold bg-red-100 text-red-700">
          <HiXCircle className="text-base" />
          Absent
        </span>
      );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-28'}`}>
        <Navbar />
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-blue-600 mb-2">My Attendance</h2>
              <p className="text-gray-600 text-lg">Track your attendance records and statistics</p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading attendance data...</p>
              </div>
            ) : (
              <>
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {/* Total Attendance */}
                  <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shadow-md">
                        <HiClipboardCheck className="text-2xl text-blue-600" />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Classes</h3>
                    <p className="text-3xl font-bold text-blue-600">{attendanceData.total}</p>
                  </div>

                  {/* Present */}
                  <div className="bg-white rounded-xl p-6 shadow-lg border border-green-200 hover:shadow-xl hover:border-green-300 transition-all duration-300 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center shadow-md">
                        <HiCheckCircle className="text-2xl text-green-600" />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Present</h3>
                    <p className="text-3xl font-bold text-green-600">{attendanceData.present}</p>
                  </div>

                  {/* Absent */}
                  <div className="bg-white rounded-xl p-6 shadow-lg border border-red-200 hover:shadow-xl hover:border-red-300 transition-all duration-300 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center shadow-md">
                        <HiXCircle className="text-2xl text-red-600" />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Absent</h3>
                    <p className="text-3xl font-bold text-red-600">{attendanceData.absent}</p>
                  </div>

                  {/* Attendance Percentage */}
                  <div className={`bg-white rounded-xl p-6 shadow-lg border transition-all duration-300 backdrop-blur-sm ${
                    attendanceData.attendancePercent >= 80 
                      ? 'border-green-200 hover:border-green-300' 
                      : attendanceData.attendancePercent >= 50 
                      ? 'border-amber-200 hover:border-amber-300' 
                      : 'border-red-200 hover:border-red-300'
                  } hover:shadow-xl`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-md ${
                        attendanceData.attendancePercent >= 80 
                          ? 'bg-green-100' 
                          : attendanceData.attendancePercent >= 50 
                          ? 'bg-amber-100' 
                          : 'bg-red-100'
                      }`}>
                        <HiChartBar className={`text-2xl ${
                          attendanceData.attendancePercent >= 80 
                            ? 'text-green-600' 
                            : attendanceData.attendancePercent >= 50 
                            ? 'text-amber-600' 
                            : 'text-red-600'
                        }`} />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Attendance %</h3>
                    <p className={`text-3xl font-bold ${
                      attendanceData.attendancePercent >= 80 
                        ? 'text-green-600' 
                        : attendanceData.attendancePercent >= 50 
                        ? 'text-amber-600' 
                        : 'text-red-600'
                    }`}>{attendanceData.attendancePercent}%</p>
                  </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-200 mb-6 backdrop-blur-sm">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search by teacher or class..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-4 py-2 pl-10 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <HiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div className="md:w-48">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ALL">All Status</option>
                        <option value="PRESENT">Present</option>
                        <option value="ABSENT">Absent</option>
                      </select>
                    </div>

                    {/* Date Filter */}
                    <div className="md:w-48">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                      <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Attendance Records Table */}
                <div className="bg-white rounded-xl shadow-lg border border-blue-200 overflow-hidden backdrop-blur-sm">
                  <div className="p-6 border-b border-blue-200 bg-blue-50">
                    <h3 className="text-lg font-semibold text-blue-600">
                      Attendance Records ({filteredRecords.length})
                    </h3>
                  </div>
                  
                  {filteredRecords.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                        <HiClipboardCheck className="text-4xl text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">No attendance records found</h3>
                      <p className="text-gray-600">
                        {attendanceData.records.length === 0 
                          ? "You don't have any attendance records yet."
                          : "Try adjusting your filters to see more results."}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Teacher
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Class
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredRecords.map((record) => (
                            <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <HiCalendar className="text-gray-400" />
                                  <span className="text-sm font-medium text-gray-900">
                                    {formatDate(record.date)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(record.status)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <HiUser className="text-gray-400" />
                                  <span className="text-sm text-gray-900">{record.teacherName || "Unknown"}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <HiBookOpen className="text-gray-400" />
                                  <span className="text-sm text-gray-900">{record.className || "General"}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyAttendance;

