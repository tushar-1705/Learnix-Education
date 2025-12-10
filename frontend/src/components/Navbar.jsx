import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import { HiUserCircle, HiQuestionMarkCircle, HiBell } from "react-icons/hi";
import API from "../api/axiosConfig";
import { getImageUrl } from "../api/apiConfig";
import logo from "../assets/Learnix_Logo.png";

const Navbar = () => {
  const { user } = useAuth();
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user || user.role?.toUpperCase() !== "STUDENT") {
        setNotifications([]);
        return;
      }
      try {
        const res = await API.get("/student/announcements");
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setNotifications(list);
      } catch (error) {
        setNotifications([]);
      }
    };

    fetchNotifications();

    // Listen for notification updates
    const handleNotificationUpdate = () => {
      fetchNotifications();
    };

    window.addEventListener("notificationsUpdated", handleNotificationUpdate);
    return () => {
      window.removeEventListener("notificationsUpdated", handleNotificationUpdate);
    };
  }, [user]);

  const handleProfileClick = () => {
    if (!user) return;
    const role = user.role?.toLowerCase() || "student";
    navigate(`/${role}/myprofile`);
  };

  const notificationsEnabled = user && user.role === "STUDENT";
  
  // Get unread count
  const getUnreadCount = () => {
    if (!notificationsEnabled || notifications.length === 0) return 0;
    const readNotifications = JSON.parse(
      localStorage.getItem("readNotifications") || "[]"
    );
    const unread = notifications.filter(
      (notif) => !readNotifications.includes(notif.id)
    );
    return Math.min(unread.length, 99);
  };

  const notificationCount = getUnreadCount();

  const handleNotificationClick = () => {
    navigate("/student/notifications");
  };

  return (
    <nav className="bg-white shadow-md border-b border-blue-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center sticky top-0 z-30 backdrop-blur-sm">
      {/* Logo - Only visible on mobile */}
      {user && (
        <button
          onClick={toggleSidebar}
          className="lg:hidden flex items-center"
          aria-label="Toggle sidebar"
        >
          <img
            src={logo}
            alt="Learnix Logo"
            className="w-10 h-10 object-contain"
          />
        </button>
      )}
      {!user && (
        <div className="lg:hidden flex items-center">
          <img
            src={logo}
            alt="Learnix Logo"
            className="w-10 h-10 object-contain"
          />
        </div>
      )}
      
      {/* Spacer for desktop - pushes content to right */}
      <div className="hidden lg:block flex-1"></div>
      
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 ml-auto lg:ml-0">
        {notificationsEnabled && (
          <button
            type="button"
            onClick={handleNotificationClick}
            className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-50 hover:bg-blue-100 flex items-center justify-center transition-all duration-300 shadow-sm hover:shadow-md active:scale-95"
            aria-label="Notifications"
          >
            <HiBell className="text-lg sm:text-xl text-blue-600" />
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] sm:text-xs font-semibold px-1 sm:px-1.5 py-0.5 rounded-full shadow-lg min-w-[18px] sm:min-w-[20px] text-center">
                {notificationCount > 99 ? "99+" : notificationCount}
              </span>
            )}
          </button>
        )}
        {user && user.role === "STUDENT" && (
          <Link
            to="/student/help"
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
            title="Get Help"
          >
            <HiQuestionMarkCircle className="text-lg sm:text-xl" />
            <span className="text-sm sm:text-base font-medium hidden sm:inline">Help</span>
          </Link>
        )}
        {user && (
          <div 
            onClick={handleProfileClick}
            className="flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            {user.profilePhoto ? (
              <img
                src={getImageUrl(user.profilePhoto)}
                alt={user.name}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-blue-500 shadow-md"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling?.classList.remove('hidden');
                }}
              />
            ) : (
              <HiUserCircle className="text-lg sm:text-xl text-blue-600" />
            )}
            <span className="text-sm sm:text-base text-gray-700 font-medium hidden sm:inline">{user.name}</span>
            <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full border border-blue-200">
              {user.role}
            </span>
          </div>
        )}
        {!user && (
          <Link 
            to="/" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 text-sm sm:text-base"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
