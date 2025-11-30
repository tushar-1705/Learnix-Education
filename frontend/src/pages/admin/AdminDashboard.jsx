import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import API from "../../api/axiosConfig";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useSidebar } from "../../context/SidebarContext";
import { 
  HiUsers, 
  HiBookOpen, 
  HiAcademicCap, 
  HiChartBar,
  HiClipboardList,
  HiCheckCircle,
  HiCurrencyRupee,
  HiTrendingUp
} from "react-icons/hi";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const { isOpen } = useSidebar();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalRevenue: 0,
    pendingAdmissions: 0,
    activeStudents: 0,
    avgAttendance: 0,
    monthlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Chart data from backend
  const [attendanceData, setAttendanceData] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [courseDistributionData, setCourseDistributionData] = useState([]);

  const [recentAdmissions, setRecentAdmissions] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats and analytics in parallel
        const [statsRes, analyticsRes] = await Promise.all([
          API.get("/admin/stats"),
          API.get("/admin/reports/analytics")
        ]);

        // Update stats
        if (statsRes.data?.data) {
          setStats({
            totalStudents: statsRes.data.data.totalStudents || 0,
            totalTeachers: statsRes.data.data.totalTeachers || 0,
            totalCourses: statsRes.data.data.totalCourses || 0,
            activeStudents: statsRes.data.data.activeStudents || 0,
            pendingAdmissions: statsRes.data.data.pendingAdmissions || 0,
            avgAttendance: statsRes.data.data.avgAttendance || 0,
            totalRevenue: statsRes.data.data.totalRevenue || 0,
            monthlyRevenue: statsRes.data.data.monthlyRevenue || 0
          });
        }

        // Update analytics data
        if (analyticsRes.data?.data) {
          const analytics = analyticsRes.data.data;

          // Set attendance trends
          if (analytics.attendanceTrends && Array.isArray(analytics.attendanceTrends)) {
            setAttendanceData(analytics.attendanceTrends);
          } else {
            setAttendanceData([]);
          }

          // Set revenue trends
          if (analytics.revenueTrends && Array.isArray(analytics.revenueTrends)) {
            setRevenueData(analytics.revenueTrends);
          } else {
            setRevenueData([]);
          }

          // Set course distribution
          if (analytics.courseDistribution) {
            const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6"];
            let colorIndex = 0;
            const totalCourses = analytics.totalCourses || 1;
            const distribution = Object.entries(analytics.courseDistribution).map(([name, count]) => ({
              name,
              value: Math.round((count / totalCourses) * 100),
              color: colors[colorIndex++ % colors.length]
            }));
            setCourseDistributionData(distribution);
          } else {
            setCourseDistributionData([]);
          }
        }

        // Fetch recent admissions
        try {
          const admissionsRes = await API.get("/admin/recent-admissions?limit=5");
          if (admissionsRes.data?.data) {
            setRecentAdmissions(admissionsRes.data.data);
          }
        } catch (error) {
          console.error("Error fetching recent admissions:", error);
        }

        // Fetch top performers
        try {
          const performersRes = await API.get("/admin/top-performers?limit=5");
          if (performersRes.data?.data) {
            setTopPerformers(performersRes.data.data);
          }
        } catch (error) {
          console.error("Error fetching top performers:", error);
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleApproveAdmission = async (studentId) => {
    try {
      await API.post(`/admin/approve-admission/${studentId}`);
      // Refresh recent admissions after approval
      const admissionsRes = await API.get("/admin/recent-admissions?limit=5");
      if (admissionsRes.data?.data) {
        setRecentAdmissions(admissionsRes.data.data);
      }
      toast.success("Admission approved successfully!");
    } catch (error) {
      console.error("Error approving admission:", error);
      toast.error("Failed to approve admission. Please try again.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-28'}`}>
        <Navbar />
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 sm:p-6 lg:p-8">
          {/* Header Section */}
          <div className="mb-6 sm:mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-blue-600 mb-2">
                Admin Dashboard
              </h2>
              <p className="text-gray-600 text-base sm:text-lg">
                Overview of your platform statistics and management
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading statistics...</p>
            </div>
          ) : (
            <>
              {/* Key Metrics Cards - 2x4 Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                {/* Total Students */}
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg border border-blue-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shadow-md">
                      <HiUsers className="text-2xl text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Students</h3>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalStudents.toLocaleString()}</p>
                </div>

                {/* Total Teachers */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shadow-md">
                      <HiAcademicCap className="text-2xl text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Teachers</h3>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalTeachers}</p>
                </div>

                {/* Total Courses */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shadow-md">
                      <HiBookOpen className="text-2xl text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Courses</h3>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalCourses}</p>
                </div>

                {/* Total Revenue */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shadow-md">
                      <HiCurrencyRupee className="text-2xl text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Revenue</h3>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.totalRevenue)}</p>
                </div>

                {/* Pending Admissions */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-amber-200 hover:shadow-xl hover:border-amber-300 transition-all duration-300 backdrop-blur-sm cursor-pointer" onClick={() => navigate('/admin/pending-admissions')}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center shadow-md">
                      <HiClipboardList className="text-2xl text-amber-600" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Pending Admissions</h3>
                  <p className="text-3xl font-bold text-amber-600">{stats.pendingAdmissions}</p>
                </div>

                {/* Active Students */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-green-200 hover:shadow-xl hover:border-green-300 transition-all duration-300 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center shadow-md">
                      <HiCheckCircle className="text-2xl text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Active Students</h3>
                  <p className="text-3xl font-bold text-green-600">{stats.activeStudents.toLocaleString()}</p>
                </div>

                {/* Avg Attendance */}
                <div className={`bg-white rounded-xl p-6 shadow-lg border transition-all duration-300 backdrop-blur-sm ${
                  stats.avgAttendance >= 80 
                    ? 'border-green-200 hover:border-green-300' 
                    : stats.avgAttendance >= 50 
                    ? 'border-amber-200 hover:border-amber-300' 
                    : 'border-red-200 hover:border-red-300'
                } hover:shadow-xl`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-md ${
                      stats.avgAttendance >= 80 
                        ? 'bg-green-100' 
                        : stats.avgAttendance >= 50 
                        ? 'bg-amber-100' 
                        : 'bg-red-100'
                    }`}>
                      <HiChartBar className={`text-2xl ${
                        stats.avgAttendance >= 80 
                          ? 'text-green-600' 
                          : stats.avgAttendance >= 50 
                          ? 'text-amber-600' 
                          : 'text-red-600'
                      }`} />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Avg Attendance</h3>
                  <p className={`text-3xl font-bold ${
                    stats.avgAttendance >= 80 
                      ? 'text-green-600' 
                      : stats.avgAttendance >= 50 
                      ? 'text-amber-600' 
                      : 'text-red-600'
                  }`}>{stats.avgAttendance}%</p>
                </div>

                {/* Monthly Revenue */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shadow-md">
                      <HiTrendingUp className="text-2xl text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-600 mb-1">Monthly Revenue</h3>
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(stats.monthlyRevenue)}</p>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Attendance Trends */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-200 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-blue-600 mb-4">Attendance Trends</h3>
                  {attendanceData.length === 0 ? (
                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                      <p>No attendance data available</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={attendanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis domain={[0, 100]} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="attendance" stroke="#3B82F6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Revenue Trends */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-200 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-blue-600 mb-4">Revenue Trends</h3>
                  {revenueData.length === 0 ? (
                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                      <p>No revenue data available</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value) => formatCurrency(value)} />
                        <Legend />
                        <Bar dataKey="revenue" fill="#10B981" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Additional Cards Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Course Distribution */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-200 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-blue-600 mb-4">Course Distribution</h3>
                  {courseDistributionData.length === 0 ? (
                    <div className="flex items-center justify-center h-[250px] text-gray-500">
                      <p>No course data available</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={courseDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {courseDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-200 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-blue-600 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => navigate("/admin/students")}
                      className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all duration-300 border border-blue-200 hover:border-blue-300 hover:shadow-md"
                    >
                      <HiUsers className="text-3xl text-blue-600 mb-2" />
                      <span className="text-sm font-semibold text-gray-700">Manage Students</span>
                    </button>
                    <button
                      onClick={() => navigate("/admin/teachers")}
                      className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all duration-300 border border-blue-200 hover:border-blue-300 hover:shadow-md"
                    >
                      <HiAcademicCap className="text-3xl text-blue-600 mb-2" />
                      <span className="text-sm font-semibold text-gray-700">Manage Teachers</span>
                    </button>
                    <button
                      onClick={() => navigate("/admin/manage-courses")}
                      className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all duration-300 border border-blue-200 hover:border-blue-300 hover:shadow-md"
                    >
                      <HiBookOpen className="text-3xl text-blue-600 mb-2" />
                      <span className="text-sm font-semibold text-gray-700">Manage Courses</span>
                    </button>
                    <button
                      onClick={() => navigate("/admin/reports")}
                      className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all duration-300 border border-blue-200 hover:border-blue-300 hover:shadow-md"
                    >
                      <HiChartBar className="text-3xl text-blue-600 mb-2" />
                      <span className="text-sm font-semibold text-gray-700">Generate Reports</span>
                    </button>
                  </div>
                </div>

                {/* Recent Admissions */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-200 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-blue-600 mb-4">Recent Admissions</h3>
                  <div className="space-y-4">
                    {recentAdmissions.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No recent admissions</p>
                    ) : (
                      recentAdmissions.map((admission) => (
                        <div key={admission.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">{admission.name}</p>
                            <p className="text-sm text-gray-600">{admission.course} • {formatDate(admission.date)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              admission.status === "approved" 
                                ? "bg-green-100 text-green-700 border border-green-300" 
                                : "bg-yellow-100 text-yellow-700 border border-yellow-300"
                            }`}>
                              {admission.status}
                            </span>
                            {admission.status === "pending" && (
                              <button
                                onClick={() => handleApproveAdmission(admission.id)}
                                className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                              >
                                Approve
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Top Performers */}
                <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-200 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold text-blue-600 mb-4">Top Performers</h3>
                  <div className="space-y-4">
                    {topPerformers.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No performance data available</p>
                    ) : (
                      topPerformers.map((performer) => (
                        <div key={performer.id} className="flex items-center gap-4 p-3 bg-blue-50 rounded-xl border border-blue-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-blue-600 font-bold">#{performer.rank}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-800">{performer.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-blue-600">{performer.attendance}%</p>
                            <p className="text-xs text-gray-600">attendance</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
