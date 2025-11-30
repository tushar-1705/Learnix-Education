import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import API from "../../api/axiosConfig";
import { useSidebar } from "../../context/SidebarContext";

const Announcements = () => {
  const { isOpen } = useSidebar();
  const [announcements, setAnnouncements] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const fetchAnnouncements = async () => {
    try {
      const res = await API.get("/teacher/announcements");
      const list = res.data?.data || [];
      setAnnouncements(list);
    } catch (e) {
      // ignore
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      const params = new URLSearchParams();
      params.append('id', id);
      await API.post(`/teacher/announcements/delete?${params.toString()}`);
      await fetchAnnouncements();
    } catch (e) {
      toast.error('Failed to delete announcement');
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const params = new URLSearchParams();
      params.append("title", data.title.trim());
      params.append("message", data.message.trim());
      await API.post(`/teacher/announcements?${params.toString()}`);
      reset();
      await fetchAnnouncements();
    } catch (e) {
      toast.error("Failed to create announcement");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-28'}`}>
        <Navbar />
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-8">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Announcements</h2>
              <p className="text-gray-600">Post announcements for your students</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Create Announcement */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 lg:col-span-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Create Announcement</h3>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      {...register("title", {
                        required: "Title is required",
                        minLength: {
                          value: 2,
                          message: "Title must be at least 2 characters"
                        }
                      })}
                      placeholder="Enter title"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.title ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.title && (
                      <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      {...register("message", {
                        required: "Message is required",
                        minLength: {
                          value: 5,
                          message: "Message must be at least 5 characters"
                        }
                      })}
                      placeholder="Write your announcement..."
                      rows={5}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.message ? "border-red-500" : "border-gray-300"
                      }`}
                    />
                    {errors.message && (
                      <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full px-4 py-2 rounded-lg text-white ${submitting ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {submitting ? 'Posting...' : 'Post Announcement'}
                  </button>
                </form>
              </div>

              {/* Announcements List */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Announcements</h3>
                  {announcements.length === 0 ? (
                    <p className="text-gray-500">No announcements yet.</p>
                  ) : (
                    <div className="space-y-4">
                      {announcements.map((a) => (
                        <div key={a.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-sm">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <h4 className="text-md font-semibold text-gray-800">{a.title}</h4>
                              <p className="text-gray-600 mt-1 whitespace-pre-line">{a.message}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className="text-sm text-gray-500">{formatDate(a.createdAt)}</span>
                              <button
                                onClick={() => handleDelete(a.id)}
                                className="px-3 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200 text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                          {a.course && (
                            <div className="mt-2 text-xs text-blue-700 bg-blue-50 inline-block px-2 py-1 rounded">
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
      </div>
    </div>
  );
};

export default Announcements;


