import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import API from "../../api/axiosConfig";
import { useSidebar } from "../../context/SidebarContext";
import { HiBookOpen, HiUsers, HiSearch, HiFilter, HiX } from "react-icons/hi";

const MyCourses = () => {
  const { isOpen } = useSidebar();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [expandedCourse, setExpandedCourse] = useState(null);

  useEffect(() => {
    fetchCourseContent();
  }, [searchKeyword, selectedCategory]);

  const fetchCourseContent = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchKeyword.trim()) {
        params.append("search", searchKeyword.trim());
      }
      if (selectedCategory) {
        params.append("category", selectedCategory);
      }

      const response = await API.get(`/teacher/course-content?${params.toString()}`);
      const data = response.data?.data || response.data || [];
      setCourses(data);

      // Extract unique categories for filter dropdown
      const uniqueCategories = [...new Set(data.map(c => c.category).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error("Error fetching course content:", error);
      toast.error("Error fetching courses");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchKeyword(e.target.value);
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category === selectedCategory ? "" : category);
  };

  const clearFilters = () => {
    setSearchKeyword("");
    setSelectedCategory("");
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const toggleCourseExpansion = (courseId) => {
    setExpandedCourse(expandedCourse === courseId ? null : courseId);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-28'}`}>
        <Navbar />
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Course Content</h2>
              <p className="text-gray-600">View all courses and track student enrollments</p>
            </div>

            {/* Search and Filter Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search Bar */}
                <div className="flex-1 relative">
                  <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                  <input
                    type="text"
                    placeholder="Search courses by title..."
                    value={searchKeyword}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Category Filter (Dropdown) */}
                <div className="flex items-center gap-3">
                  <HiFilter className="text-gray-600 text-xl" />
                  <span className="text-sm font-medium text-gray-700">Category:</span>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                  {(searchKeyword || selectedCategory) && (
                    <button
                      onClick={clearFilters}
                      className="px-3 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 flex items-center gap-1"
                    >
                      <HiX className="text-lg" />
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Courses List */}
            {loading ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading courses...</p>
              </div>
            ) : courses.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                  <HiBookOpen className="text-4xl text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No courses found</h3>
                <p className="text-gray-600">
                  {searchKeyword || selectedCategory 
                    ? "Try adjusting your search or filter criteria" 
                    : "No courses available at the moment"}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {courses.map((course) => (
                  <div
                    key={course.id}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-2xl font-bold text-gray-800">
                              {course.title}
                            </h3>
                            {course.category && (
                              <span className="inline-block text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                                {course.category}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 mb-3">{course.description}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Teacher: <strong>{course.teacher || "N/A"}</strong></span>
                            {course.price !== undefined && course.price !== null && (
                              <span>
                                Price: <strong>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(course.price)}</strong>
                              </span>
                            )}
                            <span>Created: <strong>{formatDate(course.createdAt)}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Enrollments Section */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <HiUsers className="text-blue-600 text-xl" />
                            <span className="font-semibold text-gray-800">
                              Enrolled Students ({course.enrollmentCount || 0})
                            </span>
                          </div>
                          {course.enrolledStudents && course.enrolledStudents.length > 0 && (
                            <button
                              onClick={() => toggleCourseExpansion(course.id)}
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              {expandedCourse === course.id ? "Hide" : "Show"} Students
                            </button>
                          )}
                        </div>

                        {expandedCourse === course.id && course.enrolledStudents && (
                          <div className="mt-3 bg-blue-50 rounded-lg p-4">
                            {course.enrolledStudents.length === 0 ? (
                              <p className="text-gray-500 text-sm">No students enrolled yet</p>
                            ) : (
                              <div className="space-y-2">
                                {course.enrolledStudents.map((student, index) => (
                                  <div
                                    key={student.id || index}
                                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:shadow-sm transition-shadow"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 font-semibold">
                                          {student.name?.charAt(0).toUpperCase() || "S"}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="font-medium text-gray-800">{student.name}</p>
                                        <p className="text-sm text-gray-500">{student.email}</p>
                                      </div>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      Enrolled: {formatDate(student.enrolledAt)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
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
