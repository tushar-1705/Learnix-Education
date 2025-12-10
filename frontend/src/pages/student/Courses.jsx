import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/axiosConfig";
import CourseCard from "../../components/CourseCard";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useSidebar } from "../../context/SidebarContext";
import { HiAcademicCap } from "react-icons/hi";

const Courses = () => {
  const { isOpen } = useSidebar();
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolledIds, setEnrolledIds] = useState(new Set());
  const [myCourses, setMyCourses] = useState([]);
  const studentEmail = localStorage.getItem("email");

  useEffect(() => {
    // Fetch all courses and student's enrolled courses 
    Promise.all([
      API.get("/courses/all"),
      studentEmail ? API.get(`/student/my-courses?email=${studentEmail}`) : Promise.resolve({ data: { data: [] } })
    ])
      .then(([allRes, myRes]) => {
        const payload = allRes.data?.data;
        const items = Array.isArray(payload) ? payload : payload?.items;
        setCourses(items || []);
        const myList = myRes?.data?.data || [];
        setMyCourses(myList);
        setEnrolledIds(new Set(myList.map((c) => c.id)));
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const enroll = (id) => {
    // Navigate to course details page where payment/enrollment can be completed
    navigate(`/student/courses/${id}`);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-28'}`}>
        <Navbar />
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <HiAcademicCap className="text-3xl text-blue-600" />
              <h2 className="text-3xl font-bold text-blue-600">All Courses</h2>
            </div>
            <p className="text-gray-600 ml-11">Browse and enroll in courses that interest you</p>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-blue-200 backdrop-blur-sm">
              <HiAcademicCap className="text-6xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No courses available at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((c) => (
                <CourseCard key={c.id} course={c} onEnroll={enroll} isEnrolled={enrolledIds.has(c.id)} />
              ))}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Courses;
