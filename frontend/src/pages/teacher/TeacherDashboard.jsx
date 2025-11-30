import { useEffect, useState } from "react";
import API from "../../api/axiosConfig";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { useSidebar } from "../../context/SidebarContext";
import { 
  HiBookOpen, 
  HiUsers, 
  HiClipboardCheck,
  HiBell,
  HiChartBar,
  HiClock,
  HiCheckCircle,
  HiExclamationCircle
} from "react-icons/hi";
import { Link, useNavigate } from "react-router-dom";

const TeacherDashboard = () => {
  const { user } = useAuth();
  const { isOpen } = useSidebar();
  const [teacherData, setTeacherData] = useState({
    totalStudents: 0,
    activeCourses: 0,
    pendingGrading: 0,
    announcements: 0,
    avgAttendance: 0,
    upcomingClasses: 0
  });

  const [loading, setLoading] = useState(true);
  const [recentStudents, setRecentStudents] = useState([]);
  const [hasMoreRecentStudents, setHasMoreRecentStudents] = useState(false);
  const [mySubjects, setMySubjects] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    // Fetch teacher dashboard stats
    API.get("/teacher/dashboard")
      .then((res) => {
        const data = res.data?.data || res.data || {};
        setTeacherData((prev) => ({
          ...prev,
          totalStudents: data.totalStudents ?? 0,
          activeCourses: data.activeCourses ?? 0,
          pendingGrading: data.pendingGrading ?? 0,
          announcements: data.announcements ?? 0,
          avgAttendance: data.avgAttendance ?? 0,
          upcomingClasses: data.upcomingClasses ?? 0,
        }));
      })
      .then(() => {
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    // Fetch recent students (request 5 to know if more exist)
    API.get('/teacher/recent-students?limit=5')
      .then(res => {
        const payload = res.data?.data || [];
        const arr = Array.isArray(payload) ? payload : [];
        setHasMoreRecentStudents(arr.length > 4);
        setRecentStudents(arr.slice(0, 4));
      })
      .catch(() => {});

    // Fetch upcoming events
    API.get('/teacher/events')
      .then(res => {
        const payload = res.data?.data || [];
        setEvents(Array.isArray(payload) ? payload : []);
      })
      .catch((error) => {
        // If current user isn't a teacher (e.g., ADMIN previewing), fall back to admin public list
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          API.get('/admin/events', { params: { onlyFuture: true } })
            .then(res => {
              const list = res.data?.data || [];
              setEvents(Array.isArray(list) ? list : []);
            })
            .catch(() => {});
        }
      });

    // Fetch teacher's assigned subjects
    API.get('/teacher/my-subjects')
      .then(res => {
        setMySubjects(res.data?.data || []);
      })
      .catch(() => {
        setMySubjects([]);
      });
  }, []);

  const quickActions = [
    { icon: HiUsers, label: "Manage Students", link: "/teacher/students", color: "blue" },
    { icon: HiBookOpen, label: "Course Content", link: "/teacher/my-courses", color: "green" },
    { icon: HiBell, label: "Announcements", link: "/teacher/announcements", color: "purple" },
    { icon: HiChartBar, label: "Grade Assignments", link: "/teacher/grading", color: "orange" }
  ];

  const navigate = useNavigate();

  

  

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      purple: "bg-amber-100 text-amber-600",
      orange: "bg-amber-100 text-amber-600"
    };
    return colors[color] || colors.blue;
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      high: "bg-red-100 text-red-700",
      medium: "bg-yellow-100 text-yellow-700",
      low: "bg-green-100 text-green-700"
    };
    return badges[priority] || badges.medium;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getInitials = (name) => {
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
            {/* Welcome Banner */}
            <div className="bg-blue-600 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 text-white shadow-2xl">
              <h1 className="text-2xl sm:text-3xl font-bold mb-3">
                Welcome, {user?.name || "Teacher"}! 👋
              </h1>
              <div className="mt-4 space-y-2">
                <p className="text-base sm:text-lg font-semibold">Teacher ID: {user?.id || "N/A"}</p>
                {mySubjects.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium mb-1">Assigned Subjects:</p>
                    <div className="flex flex-wrap gap-2">
                      {mySubjects.map((subj) => (
                        <span key={subj.id} className="bg-emerald-500 bg-opacity-30 px-3 py-1 rounded-full text-sm border border-emerald-300">
                          {subj.subject}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {mySubjects.length === 0 && (
                  <p className="text-sm opacity-75">No subjects assigned yet</p>
                )}
              </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-200 hover:shadow-xl hover:border-blue-300 transition-all duration-300 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center shadow-md">
                    <HiUsers className="text-2xl text-blue-600" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Students</h3>
                <p className="text-3xl font-bold text-blue-600">{teacherData.totalStudents}</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-green-200 hover:shadow-xl hover:border-green-300 transition-all duration-300 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center shadow-md">
                    <HiBookOpen className="text-2xl text-green-600" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Active Courses</h3>
                <p className="text-3xl font-bold text-green-600">{teacherData.activeCourses}</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-lg border border-amber-200 hover:shadow-xl hover:border-amber-300 transition-all duration-300 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center shadow-md">
                    <HiBell className="text-2xl text-amber-600" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Announcements</h3>
                <p className="text-3xl font-bold text-amber-600">{teacherData.announcements}</p>
              </div>

              <div className={`bg-white rounded-xl p-6 shadow-lg border transition-all duration-300 backdrop-blur-sm ${
                teacherData.avgAttendance >= 80 
                  ? 'border-green-200 hover:border-green-300' 
                  : teacherData.avgAttendance >= 50 
                  ? 'border-amber-200 hover:border-amber-300' 
                  : 'border-red-200 hover:border-red-300'
              } hover:shadow-xl`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center shadow-md ${
                    teacherData.avgAttendance >= 80 
                      ? 'bg-green-100' 
                      : teacherData.avgAttendance >= 50 
                      ? 'bg-amber-100' 
                      : 'bg-red-100'
                  }`}>
                    <HiChartBar className={`text-2xl ${
                      teacherData.avgAttendance >= 80 
                        ? 'text-green-600' 
                        : teacherData.avgAttendance >= 50 
                        ? 'text-amber-600' 
                        : 'text-red-600'
                    }`} />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Avg Attendance</h3>
                <p className={`text-3xl font-bold ${
                  teacherData.avgAttendance >= 80 
                    ? 'text-green-600' 
                    : teacherData.avgAttendance >= 50 
                    ? 'text-amber-600' 
                    : 'text-red-600'
                }`}>{teacherData.avgAttendance}%</p>
              </div>

              {/* removed pending tasks and upcoming classes cards */}
            </div>

            {/* Quick Actions and Upcoming Events - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Quick Actions */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-200 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-blue-600 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={index}
                        to={action.link}
                        className="flex flex-col items-center justify-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all duration-300 border border-blue-200 hover:border-blue-300 hover:shadow-md"
                      >
                        <div className={`w-12 h-12 ${getColorClasses(action.color)} rounded-lg flex items-center justify-center mb-2 shadow-sm`}>
                          <Icon className="text-2xl" />
                        </div>
                        <span className="text-sm font-semibold text-gray-700 text-center">{action.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-200 backdrop-blur-sm">
                <h3 className="text-lg font-semibold text-blue-600 mb-4">Upcoming Events</h3>
                <div className="space-y-4">
                  {events.length === 0 && <p className="text-sm text-gray-500">No upcoming events.</p>}
                  {events.slice(0,6).map((ev) => (
                    <div key={ev.id} className="flex items-start justify-between p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all duration-300 border border-blue-200 hover:border-blue-300 hover:shadow-md">
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{ev.title}</p>
                        {ev.description && <p className="text-sm text-gray-600">{ev.description}</p>}
                      </div>
                      <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                        {ev.eventAt ? new Date(ev.eventAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'TBD'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Students - Full Width Below */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-blue-200 mb-8 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-600">Recent Students</h3>
                {hasMoreRecentStudents && (
                  <button
                    onClick={() => navigate('/teacher/students')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-semibold transition-all"
                  >
                    View All
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {recentStudents.map((student) => (
                  <button
                    key={student.id}
                    onClick={() => navigate(`/teacher/students/${student.id}`)}
                    className="w-full text-left flex items-center justify-between p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all duration-300 border border-blue-200 hover:border-blue-300 hover:shadow-md"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                        {getInitials(student.name || '')}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{student.name}</p>
                        <p className="text-sm text-gray-600">{student.email}</p>
                        <p className="text-xs text-gray-500">Joined on {student.createdAt ? new Date(student.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : ''}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
