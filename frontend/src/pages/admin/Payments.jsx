import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import API from "../../api/axiosConfig";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";
import { 
  HiCreditCard, 
  HiBookOpen,
  HiUser,
  HiCurrencyDollar,
  HiShoppingCart,
  HiFilter,
  HiSearch,
  HiCalendar,
  HiCheckCircle,
  HiClock,
  HiX,
  HiUsers
} from "react-icons/hi";

const Payments = () => {
  const { isOpen } = useSidebar();
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [statistics, setStatistics] = useState({
    totalCourses: 0,
    soldCourses: 0,
    totalAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [totalPayments, setTotalPayments] = useState(0);
  const [matchedPayments, setMatchedPayments] = useState(0);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseBuyers, setCourseBuyers] = useState([]);
  const [showBuyersModal, setShowBuyersModal] = useState(false);

  const fetchPayments = useCallback(async (search = "", category = categoryFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.append("search", search.trim());
      }
      if (category && category !== "ALL") {
        params.append("category", category);
      }
      const query = params.toString();
      const res = await API.get(query ? `/admin/payments?${query}` : "/admin/payments");
      if (res.data?.data) {
        const payload = res.data.data;
        const items = payload.items || [];
        setPayments(items);
        setStatistics(payload.statistics || {
          totalCourses: 0,
          soldCourses: 0,
          totalAmount: 0
        });
        setTotalPayments(payload.total ?? items.length);
        setMatchedPayments(payload.matched ?? items.length);
        setAvailableCategories(payload.categories || []);
      } else {
        setPayments([]);
        setStatistics({ totalCourses: 0, soldCourses: 0, totalAmount: 0 });
        setTotalPayments(0);
        setMatchedPayments(0);
        setAvailableCategories([]);
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments data");
      setPayments([]);
      setAvailableCategories([]);
      setMatchedPayments(0);
      setTotalPayments(0);
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;
    fetchPayments(searchTerm, categoryFilter).finally(() => {
      if (mounted) {
        setInitialized(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []); // initial load

  useEffect(() => {
    if (!initialized) return;
    const handler = setTimeout(() => {
      fetchPayments(searchTerm, categoryFilter);
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchPayments, searchTerm, categoryFilter, initialized]);

  const fetchCourseBuyers = async (courseId) => {
    try {
      const res = await API.get(`/admin/payments/course/${courseId}`);
      if (res.data?.data) {
        setCourseBuyers(res.data.data.buyers || []);
        setSelectedCourse({
          id: res.data.data.courseId,
          title: res.data.data.courseTitle,
          buyerCount: res.data.data.buyerCount
        });
        setShowBuyersModal(true);
      }
    } catch (error) {
      console.error("Error fetching course buyers:", error);
      toast.error("Failed to load course buyers");
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCourseClick = (courseId) => {
    fetchCourseBuyers(courseId);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-28'}`}>
        <Navbar />
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-8">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-gray-800 mb-2">Payment Management</h2>
              <p className="text-gray-600 text-lg">View all course payments and transactions</p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading payments...</p>
              </div>
            ) : (
              <>
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <HiBookOpen className="text-2xl text-blue-600" />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Courses</h3>
                    <p className="text-3xl font-bold text-gray-800">{statistics.totalCourses}</p>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <HiShoppingCart className="text-2xl text-green-600" />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Courses Sold</h3>
                    <p className="text-3xl font-bold text-gray-800">{statistics.soldCourses}</p>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <HiCurrencyDollar className="text-2xl text-blue-600" />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Amount</h3>
                    <p className="text-3xl font-bold text-gray-800">
                      {formatCurrency(statistics.totalAmount)}
                    </p>
                  </div>
                </div>

                {/* Search and Filter */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search by student name, course, or transaction ID..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      </div>
                    </div>

                    {/* Category Filter */}
                    <div className="md:w-64">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ALL">All Categories</option>
                        {availableCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Payments Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-800">
                      Payment Records ({matchedPayments})
                    </h3>
                  </div>
                  
                  {payments.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                        <HiCreditCard className="text-4xl text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">No payments found</h3>
                      <p className="text-gray-600">
                        {payments.length === 0 
                          ? "No payment records available."
                      : "Try adjusting your filters to see more results."}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-blue-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Student
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Course
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Transaction ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Paid Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                      {payments.map((payment) => (
                            <tr key={payment.id} className="hover:bg-blue-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <HiUser className="text-gray-400" />
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {payment.student?.name || "Unknown"}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {payment.student?.email || ""}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      Roll: {payment.student?.rollNumber || "N/A"}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <button
                                  onClick={() => handleCourseClick(payment.course?.id)}
                                  className="text-left hover:text-blue-600 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    <HiBookOpen className="text-gray-400" />
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">
                                        {payment.course?.title || "Unknown Course"}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {payment.course?.category || "N/A"}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-gray-900">
                                  {formatCurrency(payment.amount || 0)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 font-mono">
                                  {payment.transactionId || "N/A"}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2 text-sm text-gray-900">
                                  <HiCalendar className="text-gray-400" />
                                  {formatDate(payment.paidAt)}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                                  (payment.status || "SUCCESS").toLowerCase() === "success" || (payment.status || "SUCCESS").toLowerCase() === "paid"
                                    ? "bg-green-100 text-green-700"
                                    : (payment.status || "SUCCESS").toLowerCase() === "pending"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-red-100 text-red-700"
                                }`}>
                                  {(payment.status || "SUCCESS").toLowerCase() === "success" || (payment.status || "SUCCESS").toLowerCase() === "paid" ? (
                                    <HiCheckCircle className="text-xs" />
                                  ) : (payment.status || "SUCCESS").toLowerCase() === "pending" ? (
                                    <HiClock className="text-xs" />
                                  ) : (
                                    <HiX className="text-xs" />
                                  )}
                                  {payment.status || "SUCCESS"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Course Buyers Modal */}
      {showBuyersModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">{selectedCourse.title}</h3>
                <p className="text-gray-600 mt-1">
                  {selectedCourse.buyerCount} {selectedCourse.buyerCount === 1 ? 'student' : 'students'} bought this course
                </p>
              </div>
              <button
                onClick={() => setShowBuyersModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <HiX className="text-2xl text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {courseBuyers.length === 0 ? (
                <div className="text-center py-12">
                  <HiUsers className="text-6xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No students have purchased this course yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {courseBuyers.map((buyer, index) => (
                    <div key={buyer.id || index} className="bg-blue-50 rounded-lg p-4 hover:bg-blue-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <HiUser className="text-blue-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{buyer.name}</div>
                            <div className="text-sm text-gray-600">{buyer.email}</div>
                            <div className="text-xs text-gray-500">Roll: {buyer.rollNumber}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(buyer.amount || 0)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(buyer.paidAt)}
                          </div>
                          <div className="text-xs text-gray-400 font-mono mt-1">
                            {buyer.transactionId}
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
      )}
    </div>
  );
};

export default Payments;

