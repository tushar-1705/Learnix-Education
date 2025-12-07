import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import API from "../../api/axiosConfig";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";
import { HiCollection, HiClock, HiBadgeCheck, HiLockClosed, HiRefresh, HiCheckCircle } from "react-icons/hi";

const CourseDetails = () => {
  const { isOpen } = useSidebar();
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState([]);
  const [player, setPlayer] = useState({ open: false, url: "" });
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);

  // Refresh course data (useful after payment)
  const refreshCourseData = async () => {
    const email = user?.email || localStorage.getItem("email");
    const role = user?.role || localStorage.getItem("role");
    
    if (!email) {
      toast.warning("Please login to refresh course data.");
      return;
    }
    
    if (role && role.toUpperCase() !== "STUDENT") {
      toast.warning("Only students can access course content.");
      return;
    }
    
    try {
      setLoading(true);
      console.log(`🔄 Refreshing course data for course ${id}, email: ${email}`);
      
      // Re-check enrollment
      const checkRes = await API.get(`/payment/check?courseId=${id}&email=${email}`);
      console.log("🔄 Refresh - Enrollment check response:", checkRes.data);
      
      // Handle both response formats
      const isPaid = checkRes.data?.isPaid ?? checkRes.data?.data?.isPaid ?? false;
      console.log(`🔄 Refresh - Payment status: ${isPaid}`);
      setIsEnrolled(isPaid);
      
      // Always try to fetch contents - backend will verify enrollment
      try {
        console.log(`🔄 Refresh - Fetching contents...`);
        const contentsRes = await API.get(`/courses/${id}/contents?email=${email}`);
        const fetchedContents = contentsRes?.data?.data || contentsRes?.data || [];
        console.log(`🔄 Refresh - Contents fetched: ${fetchedContents.length} items`);
        setContents(fetchedContents);
        
        // Check if any content is actually unlocked
        const hasUnlockedContent = fetchedContents.some(item => item.isUnlocked !== false);
        
        if (hasUnlockedContent) {
          setIsEnrolled(true);
          toast.success(`Course content unlocked! ${fetchedContents.length} lesson(s) available.`);
        } else if (fetchedContents.length > 0) {
          // Contents exist but all locked - student is NOT enrolled
          setIsEnrolled(false);
          toast.warning("You need to complete payment to access course content.");
        } else if (isPaid) {
          toast.info("Enrollment confirmed, but this course has no content yet.");
        } else {
          setIsEnrolled(false);
          toast.info("You are not enrolled in this course yet.");
        }
      } catch (contentsErr) {
        console.error("🔄 Refresh - Error fetching contents:", contentsErr);
        console.error("Response status:", contentsErr.response?.status);
        console.error("Response data:", contentsErr.response?.data);
        
        if (contentsErr.response?.status === 403) {
          if (isPaid) {
            toast.error("Enrollment mismatch detected. Please contact support or try again in a moment.");
            console.error("🚨 MISMATCH: Payment check says paid but content access denied!");
          } else {
            toast.warning("You need to complete payment to access course content.");
          }
          setContents([]);
          setIsEnrolled(false);
        } else {
          toast.error("Failed to load course content. Please try again.");
          setContents([]);
        }
      }
    } catch (error) {
      console.error("🔄 Refresh - Error:", error);
      toast.error("Failed to refresh course data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    // Check if we're returning from payment
    const paymentCompleted = localStorage.getItem('paymentCompleted');
    if (paymentCompleted) {
      // Clear the flag
      localStorage.removeItem('paymentCompleted');
      localStorage.removeItem('paymentCompletedTime');
    }

    const loadCourseData = async () => {
      const email = user?.email || localStorage.getItem("email");
      const role = user?.role || localStorage.getItem("role");
      
      try {
        // First, load course details
        const courseRes = await API.get(`/courses/${id}`);
        setCourse(courseRes.data?.data || null);
        
        // Check enrollment status and fetch contents (for students)
        if (email && role && role.toUpperCase() === "STUDENT") {
          try {
            // Check enrollment status
            const checkRes = await API.get(`/payment/check?courseId=${id}&email=${email}`);
            
            // Handle both direct response and wrapped response
            const isPaid = checkRes.data?.isPaid ?? checkRes.data?.data?.isPaid ?? false;
            setIsEnrolled(isPaid);
            
            // Always try to fetch contents with email - backend will check enrollment
            try {
              const contentsRes = await API.get(`/courses/${id}/contents?email=${email}`);
              const fetchedContents = contentsRes?.data?.data || contentsRes?.data || [];
              setContents(fetchedContents);
              
              // Check if any content is actually unlocked (student is enrolled)
              const hasUnlockedContent = fetchedContents.some(item => item.isUnlocked !== false);
              
              if (hasUnlockedContent) {
                // Student is enrolled and has access to content
                setIsEnrolled(true);
              } else if (fetchedContents.length > 0) {
                // Contents exist but all are locked - student is NOT enrolled
                setIsEnrolled(false);
                console.warn("⚠️ Contents fetched but all locked - student not enrolled");
              } else if (isPaid) {
                // Enrollment check says paid but no contents - might be empty course
                console.warn("⚠️ Enrollment confirmed but course has no content");
              } else {
                // Not enrolled
                setIsEnrolled(false);
              }
            } catch (contentsErr) {
              console.error("❌ Error fetching contents:", contentsErr);
              console.error("Response status:", contentsErr.response?.status);
              console.error("Response data:", contentsErr.response?.data);
              
              if (contentsErr.response?.status === 403) {
                console.warn("⚠️ Access denied (403). Enrollment check result:", isPaid);
                // If enrollment check says paid but we get 403, there's a mismatch
                if (isPaid) {
                  console.error("🚨 MISMATCH: Payment check says paid but content access denied!");
                  toast.warning("Enrollment issue detected. Please refresh the page or contact support.");
                }
                setContents([]);
                setIsEnrolled(false);
              } else {
                setContents([]);
              }
            }
          } catch (checkErr) {
            console.error("❌ Enrollment check error:", checkErr);
            setIsEnrolled(false);
            // Try to fetch contents anyway to see what happens
            try {
              const contentsRes = await API.get(`/courses/${id}/contents?email=${email}`);
              const fetchedContents = contentsRes?.data?.data || contentsRes?.data || [];
              setContents(fetchedContents);
              
              // Check if any content is actually unlocked
              const hasUnlockedContent = fetchedContents.some(item => item.isUnlocked !== false);
              if (hasUnlockedContent) {
                setIsEnrolled(true);
              } else {
                setIsEnrolled(false);
              }
            } catch (contentsErr) {
              console.error("Error fetching contents:", contentsErr);
              setContents([]);
              setIsEnrolled(false);
            }
          }
        } else {
          // For non-students or when no email, fetch without email
          try {
            const contentsRes = await API.get(`/courses/${id}/contents`);
            setContents(contentsRes?.data?.data || contentsRes?.data || []);
          } catch (contentsErr) {
            console.error("Error fetching contents:", contentsErr);
            setContents([]);
          }
        }
      } catch (error) {
        console.error("Error loading course:", error);
        toast.error("Failed to load course details");
      } finally {
        setLoading(false);
      }
    };
    
    loadCourseData();

    // Listen for page visibility changes (useful when returning from payment)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const email = user?.email || localStorage.getItem("email");
        const role = user?.role || localStorage.getItem("role");
        // Check if payment was just completed
        const paymentCompleted = localStorage.getItem('paymentCompleted');
        if (email && role && role.toUpperCase() === "STUDENT" && paymentCompleted) {
          // Small delay to ensure backend has processed payment
          setTimeout(() => {
            refreshCourseData();
          }, 500);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id, user]);

  const handlePayment = async () => {
    const email = user?.email || localStorage.getItem("email");
    if (!email) {
      toast.warning("Please login to purchase this course");
      navigate("/login");
      return;
    }

    setIsPaymentLoading(true);
    try {
      // Create payment order
      const orderRes = await API.post(`/payment/create-order?courseId=${id}&email=${email}`);
      const orderData = orderRes.data?.data;

      if (!orderData || !window.Razorpay) {
        toast.error("Payment gateway not available. Please try again.");
        setIsPaymentLoading(false);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount * 100, // Convert to paise
        currency: orderData.currency,
        name: "Learnix",
        description: `Payment for ${course?.title}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            // Verify payment
            await API.post(`/payment/verify`, null, {
              params: {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              }
            });
            toast.success("Payment successful! Enrollment confirmed. Loading course content...");
            
            // Wait a moment for backend to save enrollment
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Re-check enrollment status
            const email = user?.email || localStorage.getItem("email");
            try {
              const checkRes = await API.get(`/payment/check?courseId=${id}&email=${email}`);
              const isPaid = checkRes.data?.isPaid ?? checkRes.data?.data?.isPaid ?? false;
              setIsEnrolled(isPaid);
              
              if (isPaid) {
                // Fetch contents with email
                const contentsRes = await API.get(`/courses/${id}/contents?email=${email}`);
                const fetchedContents = contentsRes?.data?.data || contentsRes?.data || [];
                setContents(fetchedContents);
                
                if (fetchedContents.length > 0) {
                  toast.success("Course content unlocked! You can now access all videos.");
                } else {
                  toast.info("Enrollment confirmed. Course content will be available shortly.");
                }
              }
            } catch (refreshErr) {
              console.error("Error refreshing enrollment after payment:", refreshErr);
            }
            
            // Redirect to My Courses page after a short delay
            setTimeout(() => {
              navigate("/student/my-courses");
            }, 2000);
          } catch (error) {
            toast.error("Payment verification failed. Please contact support.");
            console.error(error);
          } finally {
            setIsPaymentLoading(false);
          }
        },
        prefill: {
          email: email
        },
        theme: {
          color: "#2563eb"
        },
        modal: {
          ondismiss: function() {
            setIsPaymentLoading(false);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error("Failed to initiate payment. Please try again.");
      console.error(error);
      setIsPaymentLoading(false);
    }
  };

  const handleVideoClick = async (contentItem) => {
    if (!isEnrolled) {
      toast.warning("Please enroll and complete payment to access this video.");
      return;
    }
    
    // Check if video is unlocked
    if (contentItem.isUnlocked === false) {
      toast.warning("Please complete the previous video first to unlock this one.");
      return;
    }
    
    if (!contentItem.videoUrl) {
      toast.warning("Video URL not available.");
      return;
    }
    
    // Mark content as watched when video is opened
    const email = user?.email || localStorage.getItem("email");
    if (email && contentItem.id) {
      try {
        await API.post(`/student/courses/${id}/content/${contentItem.id}/mark-watched?email=${email}`);
      } catch (error) {
        console.error("Error marking content as watched:", error);
        if (error.response?.status === 403) {
          toast.warning("Please complete the previous video first.");
          return;
        }
      }
    }
    
    setPlayer({ open: true, url: normalizeVideoUrl(contentItem.videoUrl) });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-28'}`}>
        <Navbar />
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-8 max-w-6xl mx-auto">
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : !course ? (
              <div className="bg-white rounded-xl p-6">Course not found.</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Course content/description */}
                <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <span className="text-sm text-gray-500">{course.category}</span>
                  <h1 className="text-2xl font-bold text-gray-900 mt-1 mb-4">{course.title}</h1>
                  <p className="text-gray-700 leading-relaxed mb-6">{course.description}</p>

                  <div className="mb-4 text-sm text-gray-600">
                    {course.lessonCount !== undefined && (
                      <span className="inline-flex items-center gap-1 mr-4"><HiCollection /> {course.lessonCount} sections • {contents.length} lectures</span>
                    )}
                    {course.durationFormatted && (
                      <span className="inline-flex items-center gap-1"><HiClock /> {course.durationFormatted} total length</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-800">Course content</h3>
                    <button
                      onClick={refreshCourseData}
                      disabled={loading}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Refresh course content and enrollment status"
                    >
                      <HiRefresh className={`text-base ${loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>
                  {contents.length === 0 ? (
                    <div className="text-center py-8">
                      <HiLockClosed className="mx-auto text-4xl text-gray-400 mb-2" />
                      <p className="text-gray-600 mb-3">
                        {isEnrolled 
                          ? "Content is loading or not available yet. Please try refreshing." 
                          : "Please enroll and complete payment to access course content."}
                      </p>
                      {isEnrolled && (
                        <button
                          onClick={refreshCourseData}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Refresh Content
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {contents.map((item, index) => {
                        const isUnlocked = item.isUnlocked !== false; // Default to true if not specified (for backward compatibility)
                        const isWatched = item.isWatched === true;
                        const isLocked = !isUnlocked;
                        
                        return (
                          <button 
                            key={item.id} 
                            onClick={() => handleVideoClick(item)} 
                            className={`w-full p-3 border rounded-lg flex items-center justify-between text-left transition-all ${
                              isLocked
                                ? "border-gray-300 bg-gray-100 cursor-not-allowed opacity-60"
                                : isWatched
                                ? "border-green-200 bg-green-50 hover:bg-green-100"
                                : "border-gray-200 hover:bg-gray-50"
                            }`}
                            disabled={!isEnrolled || isLocked}
                            title={isLocked ? "Complete the previous video to unlock this one" : ""}
                          >
                            <div className="flex items-center gap-3">
                              {isWatched ? (
                                <HiCheckCircle className="text-green-600 text-xl flex-shrink-0" />
                              ) : isLocked ? (
                                <HiLockClosed className="text-gray-400 text-xl flex-shrink-0" />
                              ) : (
                                <div className="w-5 h-5 border-2 border-blue-600 rounded-full flex-shrink-0"></div>
                              )}
                              <div className={`font-medium ${isLocked ? "text-gray-500" : "text-gray-800"}`}>
                                {item.title}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500 flex items-center gap-4">
                              <span className="inline-flex items-center gap-1"><HiCollection /> Lecture</span>
                              {item.durationMinutes && (
                                <span className="inline-flex items-center gap-1">
                                  <HiClock /> {item.durationMinutes}min
                                </span>
                              )}
                              {isLocked && <HiLockClosed className="text-red-500" />}
                              {isWatched && <span className="text-green-600 text-xs font-semibold">Completed</span>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right: Price card */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-fit">
                  <div className="text-3xl font-bold text-gray-900 mb-2">₹{course.price}</div>
                  {isEnrolled ? (
                    <div className="w-full bg-green-100 text-green-700 py-3 rounded-lg font-semibold mb-3 text-center">
                      ✓ Enrolled
                    </div>
                  ) : (
                    <button 
                      onClick={handlePayment} 
                      disabled={isPaymentLoading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold mb-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPaymentLoading ? "Processing..." : "Buy now"}
                    </button>
                  )}
                  <div className="mt-4 text-sm text-gray-700 space-y-2">
                    <div className="flex items-center gap-2"><HiBadgeCheck className="text-green-600"/> 2 hours on-demand video</div>
                    <div className="flex items-center gap-2"><HiBadgeCheck className="text-green-600"/> Access on mobile and TV</div>
                    <div className="flex items-center gap-2"><HiBadgeCheck className="text-green-600"/> Lifetime access</div>
                    <div className="flex items-center gap-2"><HiBadgeCheck className="text-green-600"/> Certificate of completion</div>
                  </div>
                </div>
              </div>
            )}
            <VideoOverlay 
              open={player.open} 
              url={player.url} 
              onClose={() => {
                setPlayer({ open: false, url: "" });
                // Refresh content to update unlock status after closing video
                setTimeout(() => {
                  refreshCourseData();
                }, 500);
              }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// Fullscreen video overlay
// eslint-disable-next-line
const VideoOverlay = ({ open, url, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <button onClick={onClose} className="absolute top-4 right-4 text-white text-xl">✕</button>
      <div className="w-full h-full p-6">
        <iframe
          title="course-video"
          src={normalizeVideoUrl(url)}
          className="w-full h-full rounded-lg"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    </div>
  );
};

// Convert watch/short URLs to embeddable ones (YouTube, Google Drive)
function normalizeVideoUrl(rawUrl) {
  if (!rawUrl) return rawUrl;
  try {
    const url = new URL(rawUrl);
    // YouTube watch URL
    if (url.hostname.includes('youtube.com')) {
      const vid = url.searchParams.get('v');
      if (vid) return `https://www.youtube.com/embed/${vid}?autoplay=1&rel=0&modestbranding=1`;
      // already embed or /embed/
      if (url.pathname.startsWith('/embed/')) return rawUrl;
    }
    // youtu.be short link
    if (url.hostname === 'youtu.be') {
      const vid = url.pathname.replace('/', '');
      if (vid) return `https://www.youtube.com/embed/${vid}?autoplay=1&rel=0&modestbranding=1`;
    }
    // Google Drive preview
    if (url.hostname.includes('drive.google.com')) {
      const match = url.pathname.match(/\/file\/d\/([^/]+)/);
      if (match && match[1]) return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
  } catch (_) {}
  return rawUrl;
}

export default CourseDetails;
