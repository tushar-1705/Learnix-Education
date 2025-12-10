import { useEffect, useState, useCallback } from "react";
import API from "../../api/axiosConfig";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { useSidebar } from "../../context/SidebarContext";
import { 
  HiBookOpen, 
  HiClipboardCheck, 
  HiChartBar, 
  HiCreditCard,
  HiCalendar,
  HiClock
} from "react-icons/hi";
import { Link } from "react-router-dom";

const StudentDashboard = () => {
  const { user } = useAuth();
  const { isOpen } = useSidebar();
  const [announcements, setAnnouncements] = useState([]);
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
  const [events, setEvents] = useState([]);
  const [studentData, setStudentData] = useState({
    enrolledCourses: 6,
    attendance: 0,
    averageGrade: 0,
    rollNumber: "ST001",
    course: "Computer Science",
    batch: "2025"
  });

  // Function to fetch average grade
  const fetchAverageGrade = useCallback(() => {
    const email = user?.email || localStorage.getItem("email");
    if (email) {
      API.get(`/student/grades`, { params: { email } })
        .then((res) => {
          const averageGrade = res.data?.data?.averageGrade ?? 0;
          setStudentData((prev) => ({ ...prev, averageGrade: averageGrade }));
        })
        .catch((error) => {
          console.error('Error fetching average grade:', error);
        });
    }
  }, [user?.email]);

  useEffect(() => {
    // Fetch enrolled courses count
    const email = user?.email || localStorage.getItem("email");
    if (email) {
      API.get(`/student/my-courses`, { params: { email } })
        .then((res) => {
          const list = res.data?.data || [];
          setStudentData((prev) => ({ ...prev, enrolledCourses: Array.isArray(list) ? list.length : 0 }));
        })
        .catch(() => {});

      // Fetch student profile info (roll number and batch)
      API.get(`/student/profile`, { params: { email } })
        .then((res) => {
          if (res.data?.data) {
            setStudentData((prev) => ({
              ...prev,
              rollNumber: `ST00${res.data.data.id || ''}`,
              batch: res.data.data.batch || "2025"
            }));
          }
        })
        .catch(() => {});
    }

    // Fetch attendance summary for current student
    if (user?.email) {
      API.get(`/student/attendance/summary`, { params: { email: user.email } })
        .then((res) => {
          const percent = res.data?.data?.attendancePercent ?? 0;
          setStudentData((prev) => ({ ...prev, attendance: percent }));
        })
        .catch(() => {});

      // Fetch average grade
      fetchAverageGrade();
    }
  }, [user?.email, fetchAverageGrade]);


  useEffect(() => {
    API.get('/student/announcements')
      .then(res => {
        const list = res.data?.data || [];
        setAnnouncements(Array.isArray(list) ? list : []);
      })
      .catch((error) => {
        console.error("Error fetching announcements:", error);
        setAnnouncements([]);
      });
  }, []);

  useEffect(() => {
    API.get('/student/events', { params: { onlyFuture: true } })
      .then(res => {
        const eventsData = res.data?.data;
        // Ensure events is always an array
        if (Array.isArray(eventsData)) {
          setEvents(eventsData);
        } else {
          setEvents([]);
        }
      })
      .catch((error) => {
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          API.get('/admin/events', { params: { onlyFuture: true } })
            .then(res => {
              const list = res.data?.data || [];
              setEvents(Array.isArray(list) ? list : []);
            })
            .catch(() => setEvents([]));
        } else {
          setEvents([]);
        }
      });
  }, []);

  const quickActions = [
    { icon: HiBookOpen, label: "View Courses", link: "/student/courses", color: "blue" },
    { icon: HiClipboardCheck, label: "Attendance", link: "/student/attendance", color: "green" },
    { icon: HiChartBar, label: "View Marks", link: "/student/marks", color: "purple" },
    { icon: HiCreditCard, label: "Payments", link: "/student/payments", color: "orange" }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: "bg-blue-100 text-blue-600",
      green: "bg-green-100 text-green-600",
      purple: "bg-amber-100 text-amber-600",
      orange: "bg-amber-100 text-amber-600"
    };
    return colors[color] || colors.blue;
  };

  const formatDate = (dateString) => {
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
            {/* Welcome Banner */}
            <div className="bg-blue-600 rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 text-white shadow-2xl">
              <h1 className="text-2xl sm:text-3xl font-bold mb-3">
                Welcome back, {user?.name || "Student"}! 👋
              </h1>
              <div className="flex flex-wrap gap-4 text-blue-100">
                <span className="flex items-center gap-2">
                  <span className="font-semibold">Roll Number:</span> {studentData.rollNumber}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-semibold">Batch:</span> {studentData.batch}
                </span>
              </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-md border border-blue-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <HiBookOpen className="text-2xl text-blue-600" />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Enrolled Courses</h3>
                <p className="text-3xl font-bold text-blue-600">{studentData.enrolledCourses}</p>
              </div>

              <div className={`bg-white rounded-xl p-6 shadow-md border transition-all duration-300 ${
                studentData.attendance >= 80 
                  ? 'border-green-200 hover:border-green-300' 
                  : studentData.attendance >= 50 
                  ? 'border-amber-200 hover:border-amber-300' 
                  : 'border-red-200 hover:border-red-300'
              } hover:shadow-lg`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    studentData.attendance >= 80 
                      ? 'bg-green-100' 
                      : studentData.attendance >= 50 
                      ? 'bg-amber-100' 
                      : 'bg-red-100'
                  }`}>
                    <HiClipboardCheck className={`text-2xl ${
                      studentData.attendance >= 80 
                        ? 'text-green-600' 
                        : studentData.attendance >= 50 
                        ? 'text-amber-600' 
                        : 'text-red-600'
                    }`} />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Attendance</h3>
                <p className={`text-3xl font-bold ${
                  studentData.attendance >= 80 
                    ? 'text-green-600' 
                    : studentData.attendance >= 50 
                    ? 'text-amber-600' 
                    : 'text-red-600'
                }`}>{studentData.attendance}%</p>
              </div>

              <div className={`bg-white rounded-xl p-6 shadow-md border transition-all duration-300 ${
                studentData.averageGrade >= 8 
                  ? 'border-green-200 hover:border-green-300' 
                  : studentData.averageGrade >= 7 
                  ? 'border-blue-200 hover:border-blue-300' 
                  : studentData.averageGrade >= 6 
                  ? 'border-amber-200 hover:border-amber-300' 
                  : studentData.averageGrade > 0 
                  ? 'border-red-200 hover:border-red-300' 
                  : 'border-blue-200 hover:border-blue-300'
              } hover:shadow-lg`}>
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    studentData.averageGrade >= 8 
                      ? 'bg-green-100' 
                      : studentData.averageGrade >= 7 
                      ? 'bg-blue-100' 
                      : studentData.averageGrade >= 6 
                      ? 'bg-amber-100' 
                      : studentData.averageGrade > 0 
                      ? 'bg-red-100' 
                      : 'bg-blue-100'
                  }`}>
                    <HiChartBar className={`text-2xl ${
                      studentData.averageGrade >= 8 
                        ? 'text-green-600' 
                        : studentData.averageGrade >= 7 
                        ? 'text-blue-600' 
                        : studentData.averageGrade >= 6 
                        ? 'text-amber-600' 
                        : studentData.averageGrade > 0 
                        ? 'text-red-600' 
                        : 'text-blue-600'
                    }`} />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-600 mb-1">Average Grade</h3>
                <p className={`text-3xl font-bold ${
                  studentData.averageGrade >= 8 
                    ? 'text-green-600' 
                    : studentData.averageGrade >= 7 
                    ? 'text-blue-600' 
                    : studentData.averageGrade >= 6 
                    ? 'text-amber-600' 
                    : studentData.averageGrade > 0 
                    ? 'text-red-600' 
                    : 'text-blue-600'
                }`}>
                  {studentData.averageGrade > 0 ? studentData.averageGrade.toFixed(1) : 'N/A'}
                </p>
              </div>
            </div>

            {/* Quick Actions and Upcoming Events */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Quick Actions */}
              <div className="bg-white rounded-xl p-6 shadow-md border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-600 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
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
              <div className="bg-white rounded-xl p-6 shadow-md border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-600 mb-4">Upcoming Events</h3>
                <div className="space-y-4">
                  {!Array.isArray(events) || events.length === 0 ? (
                    <p className="text-gray-500">No upcoming events.</p>
                  ) : (
                    events.map((ev) => (
                      <div
                        key={ev.id}
                        className="flex items-center justify-between p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-all duration-300 border border-blue-200 hover:border-blue-300 hover:shadow-md"
                        title={`${ev.title || ''}${ev.description ? `\n${ev.description}` : ''}${ev.eventAt ? `\nOn: ${new Date(ev.eventAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}` : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shadow-sm">
                            <HiCalendar className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{ev.title}</p>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                              <HiClock className="text-xs" />
                              {ev.eventAt ? new Date(ev.eventAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Scheduled'}
                            </p>
                            {ev.description && (
                              <p className="text-xs text-gray-500 line-clamp-1">{ev.description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Announcements */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-blue-600">Announcements</h3>
                {announcements.length > 4 && (
                  <button
                    onClick={() => setShowAllAnnouncements((v) => !v)}
                    className="text-blue-600 hover:text-blue-700 text-sm font-semibold transition-all"
                  >
                    {showAllAnnouncements ? 'View Less' : 'View All'}
                  </button>
                )}
              </div>
              {announcements.length === 0 ? (
                <p className="text-gray-500">No announcements yet.</p>
              ) : (
                <div className="space-y-4">
                  {(showAllAnnouncements ? announcements : announcements.slice(0,4)).map((a) => (
                    <div key={a.id} className="p-4 border border-blue-200 rounded-xl hover:shadow-md bg-blue-50 transition-all duration-300">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-md font-semibold text-gray-800">{a.title}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">By {a.teacher?.name || a.teacherName || 'Teacher'}</p>
                          <p className="text-gray-600 mt-1 whitespace-pre-line">{a.message}</p>
                        </div>
                        <span className="text-sm text-gray-500">{new Date(a.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                      {a.course && (
                        <div className="mt-2 text-xs text-blue-700 bg-blue-100 inline-block px-2 py-1 rounded-full border border-blue-200">
                          Course: {a.course.title}
                        </div>
                      )}
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

export default StudentDashboard;
