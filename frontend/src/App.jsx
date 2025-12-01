import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Courses from "./pages/student/Courses";
import CourseDetails from "./pages/student/CourseDetails";
import MyCourses from "./pages/student/MyCourses";
import MyAttendance from "./pages/student/MyAttendance";
import MyMarks from "./pages/student/MyMarks";
import StudentDashboard from "./pages/student/StudentDashboard";
import Payments from "./pages/student/Payments";
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageCourses from "./pages/admin/ManageCourses";
import Students from "./pages/admin/Students";
import Teachers from "./pages/admin/Teachers";
import ReportsAnalytics from "./pages/admin/ReportsAnalytics";
import UpcomingEvents from "./pages/admin/UpcomingEvents";
import PendingAdmissions from "./pages/admin/PendingAdmissions";
import AdminPayments from "./pages/admin/Payments";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherMyCourses from "./pages/teacher/MyCourses";
import TeacherAnnouncements from "./pages/teacher/Announcements";
import TeacherGrading from "./pages/teacher/Grading";
import ManageStudents from "./pages/teacher/ManageStudents";
import MyProfile from "./pages/MyProfile";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { SidebarProvider } from "./context/SidebarContext";
import StudentProfile from "./pages/teacher/StudentProfile";
import AllStudents from "./pages/teacher/AllStudents";
import Attendance from "./pages/teacher/Attendance";
import StudentHelp from "./pages/student/StudentHelp";
import AdminStudentHelp from "./pages/admin/AdminStudentHelp";
import AdminOnlineTestReports from "./pages/admin/OnlineTestReports";
import TeacherOnlineTests from "./pages/teacher/OnlineTests";
import StudentOnlineTests from "./pages/student/OnlineTests";
import Notifications from "./pages/student/Notifications";

function App() {
  return (
    <AuthProvider>
      <SidebarProvider>
      <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
        <Routes>
          {/* ---------- PUBLIC ROUTES ---------- */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* ---------- STUDENT ROUTES ---------- */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute role="STUDENT">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/courses"
            element={
              <ProtectedRoute role="STUDENT">
                <Courses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/courses/:id"
            element={
              <ProtectedRoute role="STUDENT">
                <CourseDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/my-courses"
            element={
              <ProtectedRoute role="STUDENT">
                <MyCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/attendance"
            element={
              <ProtectedRoute role="STUDENT">
                <MyAttendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/marks"
            element={
              <ProtectedRoute role="STUDENT">
                <MyMarks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/payments"
            element={
              <ProtectedRoute role="STUDENT">
                <Payments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/myprofile"
            element={
              <ProtectedRoute role="STUDENT">
                <MyProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/help"
            element={
              <ProtectedRoute role="STUDENT">
                <StudentHelp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/tests"
            element={
              <ProtectedRoute role="STUDENT">
                <StudentOnlineTests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/notifications"
            element={
              <ProtectedRoute role="STUDENT">
                <Notifications />
              </ProtectedRoute>
            }
          />

          {/* ---------- ADMIN ROUTES ---------- */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute role="ADMIN">
                <Students />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/teachers"
            element={
              <ProtectedRoute role="ADMIN">
                <Teachers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/manage-courses"
            element={
              <ProtectedRoute role="ADMIN">
                <ManageCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reports"
            element={
              <ProtectedRoute role="ADMIN">
                <ReportsAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/upcoming-events"
            element={
              <ProtectedRoute role="ADMIN">
                <UpcomingEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute role="ADMIN">
                <ReportsAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/pending-admissions"
            element={
              <ProtectedRoute role="ADMIN">
                <PendingAdmissions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/payments"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminPayments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/myprofile"
            element={
              <ProtectedRoute role="ADMIN">
                <MyProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/student-help"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminStudentHelp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/online-test-reports"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminOnlineTestReports />
              </ProtectedRoute>
            }
          />

          {/* ---------- TEACHER ROUTES ---------- */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute role="TEACHER">
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/my-courses"
            element={
              <ProtectedRoute role="TEACHER">
                <TeacherMyCourses />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/announcements"
            element={
              <ProtectedRoute role="TEACHER">
                <TeacherAnnouncements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/grading"
            element={
              <ProtectedRoute role="TEACHER">
                <TeacherGrading />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/students"
            element={
              <ProtectedRoute role="TEACHER">
                <AllStudents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/students/:id"
            element={
              <ProtectedRoute role="TEACHER">
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/attendance"
            element={
              <ProtectedRoute role="TEACHER">
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/tests"
            element={
              <ProtectedRoute role="TEACHER">
                <TeacherOnlineTests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/myprofile"
            element={
              <ProtectedRoute role="TEACHER">
                <MyProfile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      </SidebarProvider>
    </AuthProvider>
  );
}

export default App;
