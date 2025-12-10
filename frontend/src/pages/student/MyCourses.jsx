import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import API from "../../api/axiosConfig";
import { useSidebar } from "../../context/SidebarContext";
import { Link } from "react-router-dom";
import { 
  HiBookOpen, 
  HiTag, 
  HiCollection, 
  HiClock,
  HiPlay,
  HiCheckCircle
} from "react-icons/hi";

const MyCourses = () => {
  const { isOpen } = useSidebar();
  const navigate = useNavigate();
  const [myCourses, setMyCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const email = localStorage.getItem("email");

  const loadCourses = () => {
    if (!email) return;
    
    setLoading(true);
    API.get(`/student/my-courses?email=${email}`)
    .then((res) => {
      setMyCourses(res.data?.data || res.data || []);
    })
    .catch((err) => {
      console.error("Error loading courses:", err);
      toast.error("Error loading courses");
    })
    .finally(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    loadCourses();
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setTimeout(() => {
          loadCourses();
        }, 300);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [email]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-28'}`}>
        <Navbar />
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-blue-600 mb-2">My Enrolled Courses</h2>
            <p className="text-gray-600">Manage and continue your learning journey</p>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading your courses...</p>
            </div>
          ) : myCourses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-lg border border-blue-200 backdrop-blur-sm">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4 shadow-md">
                <HiBookOpen className="text-4xl text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-blue-600 mb-2">No courses yet</h3>
              <p className="text-gray-600 mb-6">You haven't enrolled in any course yet.</p>
              <Link 
                to="/student/courses"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Browse Courses
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCourses.map((course) => (
                <div 
                  key={course.id} 
                  onClick={() => navigate(`/student/courses/${course.id}`)}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group flex flex-col justify-between transform hover:-translate-y-1 cursor-pointer"
                >
                  {/* Image/Thumbnail */}
                  <div className="h-40 w-full bg-gradient-to-br from-blue-400 to-indigo-600 overflow-hidden relative">
                    {course.thumbnail ? (
                      <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <HiBookOpen className="text-6xl text-white opacity-50" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span className="bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                        <HiCheckCircle className="text-sm" />
                        Enrolled
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                          {course.title}
                        </h3>
                        <div className="flex items-center gap-2 mb-3">
                          <HiTag className="text-blue-500" />
                          <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                            {course.category || "General"}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed flex-1">
                      {course.description || "No description available."}
                    </p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mb-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Price</p>
                        <p className="text-2xl font-bold text-gray-800">₹{course.price || 0}</p>
                      </div>
                      <div className="flex items-center gap-4 text-gray-500 text-sm">
                        {course.lessonCount !== undefined && (
                          <span className="inline-flex items-center gap-1">
                            <HiCollection /> {course.lessonCount}
                          </span>
                        )}
                        {course.durationFormatted && (
                          <span className="inline-flex items-center gap-1">
                            <HiClock /> {course.durationFormatted}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/student/courses/${course.id}`);
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <HiPlay className="text-lg" />
                      Continue Learning
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MyCourses;
