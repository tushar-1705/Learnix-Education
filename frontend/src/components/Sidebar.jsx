import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import { 
  HiHome, 
  HiBookOpen, 
  HiAcademicCap, 
  HiUser,
  HiMenu,
  HiX,
  HiUsers,
  HiChartBar,
  HiClipboardCheck,
  HiDocumentText,
  HiCreditCard,
  HiBell,
  HiQuestionMarkCircle
} from "react-icons/hi";
import logo from "../assets/Learnix_Logo.png";

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();
  const { isOpen, toggleSidebar } = useSidebar();
  
  if (!user) return null;

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Sidebar Overlay for Mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`bg-white h-screen border-r border-blue-200 shadow-lg transition-all duration-300 ease-in-out fixed z-40 overflow-y-auto backdrop-blur-sm ${
          isOpen
            ? "w-64 translate-x-0 p-6"
            : "w-0 -translate-x-full lg:translate-x-0 lg:w-28 lg:p-4"
        }`}
      >
        {/* Desktop Toggle Button - Top Right Corner on Border Line (Only show when open) */}
        {isOpen && (
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex absolute top-4 -right-0 w-10 h-10 text-black rounded-full items-center justify-center"
            aria-label="Toggle sidebar"
          >
            <HiX className="text-xl" />
          </button>
        )}

        {/* Mobile Close Button - Top Right when sidebar is open on mobile */}
        {isOpen && (
          <button
            onClick={toggleSidebar}
            className="lg:hidden absolute top-4 right-4 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
            aria-label="Close sidebar"
          >
            <HiX className="text-xl text-gray-700" />
          </button>
        )}

        <div className={`mb-8 flex flex-col items-center ${isOpen ? "gap-4" : "lg:gap-4"}`}>
          <div 
            className={`flex justify-center w-full ${!isOpen ? "lg:cursor-pointer" : ""}`}
            onClick={!isOpen ? toggleSidebar : undefined}
          >
            <img
              src={logo}
              alt="Learnix Logo"
              className={`w-28 h-28 transition-all object-contain ${!isOpen ? "lg:hover:opacity-80" : ""}`}
            />
          </div>
        </div>
        <ul className={`space-y-2 ${!isOpen ? "lg:space-y-4 lg:px-0" : ""}`}>
          {user.role === "ADMIN" && (
            <>
              <li>
                <Link 
                  to="/admin/dashboard" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${
                    isActive("/admin/dashboard")
                      ? "bg-blue-600 text-white font-semibold shadow-lg"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  } ${!isOpen ? "lg:justify-center lg:px-3" : ""}`}
                  title={!isOpen ? "Dashboard" : ""}
                >
                  <HiHome className="text-xl flex-shrink-0" />
                  {isOpen && <span>Dashboard</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin/students" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive("/admin/students")
                      ? "bg-blue-600 text-white font-semibold shadow-lg"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  } ${!isOpen ? "lg:justify-center lg:px-3" : ""}`}
                  title={!isOpen ? "Students" : ""}
                >
                  <HiUsers className="text-xl flex-shrink-0" />
                  {isOpen && <span>Students</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin/teachers" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive("/admin/teachers")
                      ? "bg-blue-600 text-white font-semibold shadow-lg"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  } ${!isOpen ? "lg:justify-center lg:px-3" : ""}`}
                  title={!isOpen ? "Teachers" : ""}
                >
                  <HiAcademicCap className="text-xl flex-shrink-0" />
                  {isOpen && <span>Teachers</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin/manage-courses" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive("/admin/manage-courses")
                      ? "bg-blue-600 text-white font-semibold shadow-lg"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  } ${!isOpen ? "lg:justify-center lg:px-3" : ""}`}
                  title={!isOpen ? "Courses" : ""}
                >
                  <HiBookOpen className="text-xl flex-shrink-0" />
                  {isOpen && <span>Courses</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin/reports" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive("/admin/reports")
                      ? "bg-blue-600 text-white font-semibold shadow-lg"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  } ${!isOpen ? "lg:justify-center lg:px-3" : ""}`}
                  title={!isOpen ? "Reports" : ""}
                >
                  <HiChartBar className="text-xl flex-shrink-0" />
                  {isOpen && <span>Reports</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin/online-test-reports" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive("/admin/online-test-reports")
                      ? "bg-blue-600 text-white font-semibold shadow-lg"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  } ${!isOpen ? "lg:justify-center lg:px-3" : ""}`}
                  title={!isOpen ? "Online Test Reports" : ""}
                >
                  <HiDocumentText className="text-xl flex-shrink-0" />
                  {isOpen && <span>Online Test Reports</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin/upcoming-events" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive("/admin/upcoming-events")
                      ? "bg-blue-600 text-white font-semibold shadow-lg"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  } ${!isOpen ? "lg:justify-center lg:px-3" : ""}`}
                  title={!isOpen ? "Upcoming Events" : ""}
                >
                  <HiBell className="text-xl flex-shrink-0" />
                  {isOpen && <span>Upcoming Events</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin/payments" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive("/admin/payments")
                      ? "bg-blue-600 text-white font-semibold shadow-lg"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  } ${!isOpen ? "lg:justify-center lg:px-3" : ""}`}
                  title={!isOpen ? "Payments" : ""}
                >
                  <HiCreditCard className="text-xl flex-shrink-0" />
                  {isOpen && <span>Payments</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/admin/student-help" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive("/admin/student-help")
                      ? "bg-blue-600 text-white font-semibold shadow-lg"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  } ${!isOpen ? "lg:justify-center lg:px-3" : ""}`}
                  title={!isOpen ? "Student Help" : ""}
                >
                  <HiQuestionMarkCircle className="text-xl flex-shrink-0" />
                  {isOpen && <span>Student Help</span>}
                </Link>
              </li>
            </>
          )}

          {user.role === "TEACHER" && (
            <>
              <li>
                <Link 
                  to="/teacher/dashboard" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive("/teacher/dashboard")
                      ? "bg-blue-600 text-white font-semibold shadow-lg"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  } ${!isOpen ? "lg:justify-center lg:px-3" : ""}`}
                  title={!isOpen ? "Dashboard" : ""}
                >
                  <HiHome className="text-xl flex-shrink-0" />
                  {isOpen && <span>Dashboard</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/teacher/students" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive("/teacher/students")
                      ? "bg-blue-600 text-white font-semibold shadow-lg"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  } ${!isOpen ? "lg:justify-center lg:px-3" : ""}`}
                  title={!isOpen ? "Students" : ""}
                >
                  <HiUsers className="text-xl flex-shrink-0" />
                  {isOpen && <span>Students</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/teacher/attendance" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive("/teacher/attendance")
                      ? "bg-blue-600 text-white font-semibold shadow-lg"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  } ${!isOpen ? "lg:justify-center lg:px-3" : ""}`}
                  title={!isOpen ? "Attendance" : ""}
                >
                  <HiClipboardCheck className="text-xl flex-shrink-0" />
                  {isOpen && <span>Attendance</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/teacher/my-courses" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive("/teacher/my-courses")
                      ? "bg-blue-600 text-white font-semibold shadow-lg"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  } ${!isOpen ? "lg:justify-center lg:px-3" : ""}`}
                  title={!isOpen ? "Courses" : ""}
                >
                  <HiBookOpen className="text-xl flex-shrink-0" />
                  {isOpen && <span>Courses</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/teacher/announcements" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive("/teacher/announcements")
                      ? "bg-blue-600 text-white font-semibold shadow-lg"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  } ${!isOpen ? "lg:justify-center lg:px-3" : ""}`}
                  title={!isOpen ? "Announcements" : ""}
                >
                  <HiBell className="text-xl flex-shrink-0" />
                  {isOpen && <span>Announcements</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/teacher/tests" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive("/teacher/tests")
                      ? "bg-blue-600 text-white font-semibold shadow-lg"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  } ${!isOpen ? "lg:justify-center lg:px-3" : ""}`}
                  title={!isOpen ? "Online Tests" : ""}
                >
                  <HiDocumentText className="text-xl flex-shrink-0" />
                  {isOpen && <span>Online Tests</span>}
                </Link>
              </li>
            </>
          )}

          {user.role === "STUDENT" && (
            <>
              <li>
                <Link 
                  to="/student/dashboard" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive("/student/dashboard")
                      ? "bg-blue-600 text-white font-semibold shadow-lg"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  } ${!isOpen ? "lg:justify-center lg:px-3" : ""}`}
                  title={!isOpen ? "Dashboard" : ""}
                >
                  <HiHome className="text-xl flex-shrink-0" />
                  {isOpen && <span>Dashboard</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/student/my-courses" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive("/student/my-courses")
                      ? "bg-blue-600 text-white font-semibold shadow-lg"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  } ${!isOpen ? "lg:justify-center lg:px-3" : ""}`}
                  title={!isOpen ? "Courses" : ""}
                >
                  <HiBookOpen className="text-xl flex-shrink-0" />
                  {isOpen && <span>My Courses</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/student/attendance" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive("/student/attendance")
                      ? "bg-blue-600 text-white font-semibold shadow-lg"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  } ${!isOpen ? "lg:justify-center lg:px-3" : ""}`}
                  title={!isOpen ? "Attendance" : ""}
                >
                  <HiClipboardCheck className="text-xl flex-shrink-0" />
                  {isOpen && <span>Attendance</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/student/marks" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive("/student/marks")
                      ? "bg-blue-600 text-white font-semibold shadow-lg"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  } ${!isOpen ? "lg:justify-center lg:px-3" : ""}`}
                  title={!isOpen ? "Marks" : ""}
                >
                  <HiChartBar className="text-xl flex-shrink-0" />
                  {isOpen && <span>Marks</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/student/payments" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive("/student/payments")
                      ? "bg-blue-600 text-white font-semibold shadow-lg"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  } ${!isOpen ? "lg:justify-center lg:px-3" : ""}`}
                  title={!isOpen ? "Payments" : ""}
                >
                  <HiCreditCard className="text-xl flex-shrink-0" />
                  {isOpen && <span>Payments</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/student/tests" 
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActive("/student/tests")
                      ? "bg-blue-600 text-white font-semibold shadow-lg"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  } ${!isOpen ? "lg:justify-center lg:px-3" : ""}`}
                  title={!isOpen ? "Online Tests" : ""}
                >
                  <HiDocumentText className="text-xl flex-shrink-0" />
                  {isOpen && <span>Online Tests</span>}
                </Link>
              </li>
            </>
          )}
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;
