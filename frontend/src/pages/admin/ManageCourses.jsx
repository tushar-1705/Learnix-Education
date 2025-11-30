import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import API from "../../api/axiosConfig";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useSidebar } from "../../context/SidebarContext";
import { HiPlus, HiTrash, HiBookOpen, HiTag, HiCurrencyRupee, HiSearch, HiX } from "react-icons/hi";
import { HiVideoCamera } from "react-icons/hi2";

const ManageCourses = () => {
  const { isOpen } = useSidebar();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showContentModal, setShowContentModal] = useState({ open: false, course: null });
  const [contents, setContents] = useState([]);

  // Form for creating course
  const {
    register: registerCourse,
    handleSubmit: handleSubmitCourse,
    formState: { errors: courseErrors },
    reset: resetCourse
  } = useForm();

  // Form for adding content
  const {
    register: registerContent,
    handleSubmit: handleSubmitContent,
    formState: { errors: contentErrors },
    reset: resetContent
  } = useForm();

  const [totalCourses, setTotalCourses] = useState(0);

  const fetchCourses = useCallback(async (keyword = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (keyword.trim()) {
        params.append("search", keyword.trim());
      }
      params.append("sortField", "createdAt");
      params.append("sortDirection", "desc");
      const query = params.toString();
      const res = await API.get(query ? `/courses/all?${query}` : "/courses/all");
      const payload = res.data?.data;
      const items = Array.isArray(payload) ? payload : payload?.items;
      setCourses(items || []);
      setTotalCourses(payload?.total ?? (items?.length || 0));
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCourses([]);
      setTotalCourses(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchCourses(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchCourses, searchTerm]);

  const openContentModal = async (course) => {
    setShowContentModal({ open: true, course });
    resetContent();
    try {
      const res = await API.get(`/courses/${course.id}/contents`);
      setContents(res.data?.data || []);
    } catch {
      setContents([]);
    }
  };

  const onSubmitContent = async (data) => {
    if (!showContentModal.course) return;
    const payload = {
      title: data.title,
      videoUrl: data.videoUrl,
      durationMinutes: data.durationMinutes ? Number(data.durationMinutes) : null,
      orderIndex: data.orderIndex ? Number(data.orderIndex) : null,
    };
    try {
      await API.post(`/courses/${showContentModal.course.id}/contents`, payload);
      const res = await API.get(`/courses/${showContentModal.course.id}/contents`);
      setContents(res.data?.data || []);
      resetContent();
    } catch (err) {
      toast.error("Failed to add content");
    }
  };

  const onSubmitCourse = async (data) => {
    setSubmitting(true);
    try {
      const res = await API.post("/courses/create", data);
      if (res.data?.message) {
        toast.success(res.data.message || "Course created successfully!");
      }
      setShowAddModal(false);
      resetCourse();
      fetchCourses(searchTerm);
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Error creating course. Please try again.";
      toast.error(errorMsg);
      console.error("Error creating course:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        const res = await API.delete(`/courses/${id}`);
        if (res.data?.message) {
          toast.success(res.data.message || "Course deleted successfully!");
        }
        fetchCourses(searchTerm);
      } catch (error) {
        const errorMsg = error.response?.data?.message || "Error deleting course. Please try again.";
        toast.error(errorMsg);
        console.error("Error deleting course:", error);
      }
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-28'}`}>
        <Navbar />
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 sm:p-6 lg:p-8">
          <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">Manage Courses</h2>
              <p className="text-gray-600 text-base sm:text-lg">Create, view, and manage all courses</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              <HiPlus className="text-lg" />
              Add Course
            </button>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-6">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex-1 relative">
                <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                <input
                  type="text"
                  placeholder="Search by title, category, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
              </div>
                <div className="text-sm text-gray-600 text-center sm:text-left">
                Showing {courses.length} of {totalCourses} courses
              </div>
            </div>
          </div>

          {/* Courses List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
              <HiBookOpen className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No courses found</h3>
              <p className="text-gray-600">{searchTerm ? "Try adjusting your search." : "Start by creating your first course."}</p>
            </div>
          ) : (
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-4">All Courses ({courses.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((c) => (
                  <div
                    key={c.id}
                    className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col justify-between transform hover:-translate-y-1 overflow-hidden"
                  >
                    {/* Course Image */}
                    <div className="h-40 w-full bg-gray-100 overflow-hidden relative">
                      {c.thumbnail ? (
                        <img 
                          src={c.thumbnail} 
                          alt={c.title} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Hide image and show placeholder if it fails to load
                            e.target.style.display = 'none';
                            const placeholder = e.target.parentElement.querySelector('.image-placeholder');
                            if (placeholder) {
                              placeholder.style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div 
                        className={`image-placeholder w-full h-full ${c.thumbnail ? 'hidden' : 'flex'} items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100 absolute inset-0`}
                      >
                        <HiBookOpen className="text-5xl text-blue-400" />
                      </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2">
                            {c.title}
                          </h3>
                          <div className="flex items-center gap-2 mb-3">
                            <HiTag className="text-blue-500" />
                            <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                              {c.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed flex-1">
                        {c.description}
                      </p>
                      <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                        <HiCurrencyRupee className="text-xl text-gray-600" />
                        <p className="text-2xl font-bold text-gray-800">₹{c.price}</p>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => openContentModal(c)}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-blue-50 transition-colors text-sm font-semibold"
                        >
                          Manage Content
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

            {/* Add Course Modal */}
            {showAddModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Add New Course</h3>
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <HiX className="text-2xl" />
                    </button>
                  </div>
                  <form onSubmit={handleSubmitCourse(onSubmitCourse)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Course Title *
                        </label>
                        <input
                          type="text"
                          {...registerCourse("title", {
                            required: "Course title is required",
                            minLength: {
                              value: 3,
                              message: "Title must be at least 3 characters"
                            }
                          })}
                          placeholder="Enter course title"
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            courseErrors.title ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {courseErrors.title && (
                          <p className="mt-1 text-sm text-red-600">{courseErrors.title.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category *
                        </label>
                        <input
                          type="text"
                          {...registerCourse("category", {
                            required: "Category is required",
                            minLength: {
                              value: 2,
                              message: "Category must be at least 2 characters"
                            }
                          })}
                          placeholder="Enter category"
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            courseErrors.category ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {courseErrors.category && (
                          <p className="mt-1 text-sm text-red-600">{courseErrors.category.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Description *
                        </label>
                        <textarea
                          {...registerCourse("description", {
                            required: "Description is required",
                            minLength: {
                              value: 10,
                              message: "Description must be at least 10 characters"
                            }
                          })}
                          placeholder="Enter course description"
                          rows="3"
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            courseErrors.description ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {courseErrors.description && (
                          <p className="mt-1 text-sm text-red-600">{courseErrors.description.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Price (₹) *
                        </label>
                        <input
                          type="number"
                          {...registerCourse("price", {
                            required: "Price is required",
                            min: {
                              value: 0,
                              message: "Price must be 0 or greater"
                            },
                            valueAsNumber: true
                          })}
                          placeholder="Enter price"
                          min="0"
                          step="0.01"
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            courseErrors.price ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {courseErrors.price && (
                          <p className="mt-1 text-sm text-red-600">{courseErrors.price.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Thumbnail URL (optional)
                        </label>
                        <input
                          type="url"
                          {...registerCourse("thumbnail", {
                            pattern: {
                              value: /^https?:\/\/.+/,
                              message: "Please enter a valid URL"
                            }
                          })}
                          placeholder="https://example.com/image.jpg"
                          className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            courseErrors.thumbnail ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {courseErrors.thumbnail && (
                          <p className="mt-1 text-sm text-red-600">{courseErrors.thumbnail.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-blue-50 transition-colors font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
                      >
                        <HiPlus className="text-lg" />
                        {submitting ? "Adding..." : "Add Course"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Manage Content Modal */}
            {showContentModal.open && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">Manage Content - {showContentModal.course?.title}</h3>
                    <button onClick={() => setShowContentModal({ open: false, course: null })} className="text-gray-400 hover:text-gray-600">
                      <HiX className="text-2xl" />
                    </button>
                  </div>

                  <form onSubmit={handleSubmitContent(onSubmitContent)} className="space-y-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                        <input
                          {...registerContent("title", {
                            required: "Title is required",
                            minLength: {
                              value: 2,
                              message: "Title must be at least 2 characters"
                            }
                          })}
                          className={`w-full px-4 py-2 border rounded-lg ${
                            contentErrors.title ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {contentErrors.title && (
                          <p className="mt-1 text-sm text-red-600">{contentErrors.title.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Video URL *</label>
                        <input
                          type="url"
                          {...registerContent("videoUrl", {
                            required: "Video URL is required",
                            pattern: {
                              value: /^https?:\/\/.+/,
                              message: "Please enter a valid URL"
                            }
                          })}
                          className={`w-full px-4 py-2 border rounded-lg ${
                            contentErrors.videoUrl ? "border-red-500" : "border-gray-300"
                          }`}
                          placeholder="https://..."
                        />
                        {contentErrors.videoUrl && (
                          <p className="mt-1 text-sm text-red-600">{contentErrors.videoUrl.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Duration (minutes)</label>
                        <input
                          type="number"
                          {...registerContent("durationMinutes", {
                            min: {
                              value: 0,
                              message: "Duration must be 0 or greater"
                            }
                          })}
                          className={`w-full px-4 py-2 border rounded-lg ${
                            contentErrors.durationMinutes ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {contentErrors.durationMinutes && (
                          <p className="mt-1 text-sm text-red-600">{contentErrors.durationMinutes.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                        <input
                          type="number"
                          {...registerContent("orderIndex", {
                            min: {
                              value: 0,
                              message: "Order must be 0 or greater"
                            }
                          })}
                          className={`w-full px-4 py-2 border rounded-lg ${
                            contentErrors.orderIndex ? "border-red-500" : "border-gray-300"
                          }`}
                        />
                        {contentErrors.orderIndex && (
                          <p className="mt-1 text-sm text-red-600">{contentErrors.orderIndex.message}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Add Content</button>
                    </div>
                  </form>

                  <div className="space-y-2">
                    {contents.map(item => (
                      <div key={item.id} className="p-3 border rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <HiVideoCamera />
                          <div>
                            <div className="font-medium text-gray-800">{item.title}</div>
                            <div className="text-sm text-gray-500">{item.durationMinutes ? `${item.durationMinutes} min` : ''}</div>
                          </div>
                        </div>
                        <a href={item.videoUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-700 text-sm font-semibold">Open</a>
                      </div>
                    ))}
                    {contents.length === 0 && <div className="text-gray-500">No content yet.</div>}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageCourses;
