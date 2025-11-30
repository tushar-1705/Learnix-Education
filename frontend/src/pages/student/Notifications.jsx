import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../api/axiosConfig";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";
import { 
  HiBell, 
  HiCalendar,
  HiBookOpen,
  HiUser,
  HiArrowLeft
} from "react-icons/hi";

const Notifications = () => {
  const { isOpen } = useSidebar();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role?.toUpperCase() !== "STUDENT") {
      navigate("/");
      return;
    }
    fetchNotifications();
  }, [user, navigate]);

  // Mark all notifications as read when page loads (to update count in Navbar)
  useEffect(() => {
    if (notifications.length > 0) {
      const readNotifications = JSON.parse(
        localStorage.getItem("readNotifications") || "[]"
      );
      const allIds = notifications.map((n) => n.id);
      const newReadIds = [...new Set([...readNotifications, ...allIds])];
      localStorage.setItem("readNotifications", JSON.stringify(newReadIds));
      
      // Trigger Navbar to refresh count
      window.dispatchEvent(new CustomEvent("notificationsUpdated"));
    }
  }, [notifications.length]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await API.get("/student/announcements");
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      
      // Sort by date (newest first)
      const sortedNotifications = [...list].sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      
      setNotifications(sortedNotifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };



  const formatNotificationTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };


  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-28'}`}>
        <Navbar />
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-6">
              {/* Back button for mobile */}
              <div className="flex items-center gap-3 mb-4 sm:hidden">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-50 hover:bg-blue-100 transition-all duration-300 shadow-sm hover:shadow-md"
                  aria-label="Go back"
                >
                  <HiArrowLeft className="text-xl text-blue-600" />
                </button>
                <h2 className="text-2xl font-bold text-blue-600">
                  Notifications
                </h2>
              </div>
              
              {/* Desktop header */}
              <div className="hidden sm:block">
                <h2 className="text-3xl lg:text-4xl font-bold text-blue-600 mb-2">
                  Notifications
                </h2>
                <p className="text-gray-600 text-sm sm:text-base">
                  {notifications.length > 0
                    ? `${notifications.length} notification${notifications.length > 1 ? "s" : ""}`
                    : "No notifications"}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="bg-white rounded-xl p-8 sm:p-12 shadow-md border border-blue-200 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4">
                  <HiBell className="text-4xl text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">
                  No notifications yet
                </h3>
                <p className="text-gray-600">
                  You're all caught up! New announcements will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="bg-white rounded-xl p-4 sm:p-6 shadow-md border border-gray-200 transition-all duration-300 hover:shadow-lg hover:border-blue-300"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                {notification.title || "Announcement"}
                              </h3>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-2 text-xs sm:text-sm text-gray-500">
                              {notification.course && (
                                <div className="flex items-center gap-1">
                                  <HiBookOpen className="text-sm" />
                                  <span>{notification.course.title}</span>
                                </div>
                              )}
                              {notification.teacher && (
                                <div className="flex items-center gap-1">
                                  <HiUser className="text-sm" />
                                  <span>{notification.teacher.name}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <HiCalendar className="text-sm" />
                                <span>{formatNotificationTime(notification.createdAt)}</span>
                              </div>
                            </div>
                            <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap">
                              {notification.message || "No description provided."}
                            </p>
                          </div>
                        </div>
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

export default Notifications;

