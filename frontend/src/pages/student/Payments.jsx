import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../api/axiosConfig";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";
import { 
  HiCreditCard, 
  HiCheckCircle,
  HiXCircle,
  HiClock,
  HiCurrencyDollar,
  HiCalendar,
  HiReceiptTax,
  HiArrowRight
} from "react-icons/hi";

const Payments = () => {
  const { isOpen } = useSidebar();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); 
  const [processingPaymentId, setProcessingPaymentId] = useState(null);

  useEffect(() => {
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
    const email = user?.email || localStorage.getItem("email");
    if (email) {
      fetchPayments(email);
    }
  }, [user?.email]);

  const fetchPayments = async (email) => {
    setLoading(true);
    try {
      const res = await API.get("/student/payments", { params: { email } });
      if (res.data?.data) {
        setPayments(res.data.data.payments || []);
        if (res.data.data.statistics) {
          // Statistics are calculated from payments, so we'll use the payments array
        }
      }
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments data");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase() || "pending";
    switch (statusLower) {
      case "success":
      case "paid":
        return <HiCheckCircle className="text-green-500 text-xl" />;
      case "pending":
        return <HiClock className="text-yellow-500 text-xl" />;
      case "failed":
      case "overdue":
        return <HiXCircle className="text-red-500 text-xl" />;
      default:
        return <HiClock className="text-gray-500 text-xl" />;
    }
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || "pending";
    switch (statusLower) {
      case "success":
      case "paid":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "failed":
      case "overdue":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusDisplay = (status) => {
    const statusLower = status?.toLowerCase() || "pending";
    switch (statusLower) {
      case "success":
        return "Paid";
      case "pending":
        return "Pending";
      case "failed":
        return "Failed";
      default:
        return status?.charAt(0).toUpperCase() + status?.slice(1) || "Pending";
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return "N/A";
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const filteredPayments = filter === "ALL" 
    ? payments 
    : payments.filter(p => {
        const status = p.status?.toLowerCase() || "pending";
        if (filter === "paid") return status === "success";
        if (filter === "pending") return status === "pending" || status === "failed";
        if (filter === "overdue") return status === "pending" && p.createdAt && new Date(p.createdAt) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return true;
      });

  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const paidAmount = payments.filter(p => p.status?.toLowerCase() === "success").reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingAmount = payments.filter(p => {
    const status = p.status?.toLowerCase() || "pending";
    return status === "pending" || status === "failed";
  }).reduce((sum, p) => sum + (p.amount || 0), 0);

  const handlePayNow = async (payment) => {
    const email = user?.email || localStorage.getItem("email");
    if (!email) {
      toast.warning("Please login to make payment");
      return;
    }

    if (!payment.course?.id) {
      toast.error("Course information not available");
      return;
    }

    setProcessingPaymentId(payment.id);
    
    try {
      // Create payment order
      const orderRes = await API.post(`/payment/create-order`, null, {
        params: {
          courseId: payment.course.id,
          email: email
        }
      });
      
      const orderData = orderRes.data?.data;

      if (!orderData || !window.Razorpay) {
        toast.error("Payment gateway not available. Please try again.");
        setProcessingPaymentId(null);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount * 100, 
        currency: orderData.currency,
        name: "Learnix",
        description: `Payment for ${payment.course?.title || "Course"}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            await API.post(`/payment/verify`, null, {
              params: {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              }
            });
            
            toast.success("Payment successful! Redirecting to your courses...");
            
            const email = user?.email || localStorage.getItem("email");
            if (email) {
              await fetchPayments(email);
            }
            
            const timestamp = Date.now();
            localStorage.setItem('paymentCompleted', timestamp.toString());
            localStorage.setItem('paymentCompletedTime', timestamp.toString());
            
            window.dispatchEvent(new CustomEvent('paymentCompleted', { 
              detail: { timestamp: timestamp },
              bubbles: true,
              cancelable: true
            }));
            
            setTimeout(() => {
              navigate("/student/my-courses");
            }, 1500);
          } catch (error) {
            toast.error("Payment verification failed. Please contact support.");
            console.error(error);
          } finally {
            setProcessingPaymentId(null);
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
            setProcessingPaymentId(null);
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      toast.error("Failed to initiate payment. Please try again.");
      console.error(error);
      setProcessingPaymentId(null);
    }
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
              <h2 className="text-4xl font-bold text-blue-600 mb-2">My Payments</h2>
              <p className="text-gray-600 text-lg">View and manage your course payments</p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading payments...</p>
              </div>
            ) : (
              <>
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-white rounded-xl p-6 shadow-md border border-blue-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <HiCurrencyDollar className="text-2xl text-blue-600" />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Amount</h3>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalAmount)}</p>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-md border border-green-200 hover:shadow-lg hover:border-green-300 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <HiCheckCircle className="text-2xl text-green-600" />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Paid</h3>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(paidAmount)}</p>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-md border border-amber-200 hover:shadow-lg hover:border-amber-300 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                        <HiClock className="text-2xl text-amber-600" />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Pending</h3>
                    <p className="text-2xl font-bold text-amber-600">{formatCurrency(pendingAmount)}</p>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-md border border-blue-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <HiReceiptTax className="text-2xl text-blue-600" />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Payments</h3>
                    <p className="text-2xl font-bold text-blue-600">{payments.length}</p>
                  </div>
                </div>

                {/* Filter */}
                <div className="bg-white rounded-xl p-6 shadow-md border border-blue-200 mb-6">
                  <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">Filter by status:</label>
                    <select
                      value={filter}
                      onChange={(e) => setFilter(e.target.value)}
                      className="px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ALL">All Payments</option>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>
                </div>

                {/* Payments List */}
                <div className="bg-white rounded-xl shadow-md border border-blue-200 overflow-hidden">
                  <div className="p-6 border-b border-blue-200 bg-blue-50">
                    <h3 className="text-lg font-semibold text-blue-600">
                      Payment History ({filteredPayments.length})
                    </h3>
                  </div>
                  
                  {filteredPayments.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                        <HiCreditCard className="text-4xl text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">No payments found</h3>
                      <p className="text-gray-600">
                        {filter === "ALL" 
                          ? "You don't have any payments yet."
                          : `No ${filter} payments found.`}
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-blue-100">
                      {filteredPayments.map((payment) => (
                        <div key={payment.id} className="p-6 hover:bg-blue-50 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <HiCreditCard className="text-2xl text-blue-600" />
                                </div>
                                <div>
                                  <h4 className="text-lg font-semibold text-gray-800 mb-1">
                                    {payment.course?.title || "Unknown Course"}
                                  </h4>
                                  <p className="text-2xl font-bold text-blue-600">
                                    {formatCurrency(payment.amount || 0)}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 ml-15 mt-3">
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <HiCalendar className="text-gray-400" />
                                  <span><strong>Created:</strong> {formatDate(payment.createdAt)}</span>
                                </div>
                                {payment.status?.toLowerCase() === "success" && payment.paidAt && (
                                  <>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <HiCalendar className="text-gray-400" />
                                      <span><strong>Paid Date:</strong> {formatDate(payment.paidAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <HiReceiptTax className="text-gray-400" />
                                      <span><strong>Transaction ID:</strong> {payment.transactionId || "N/A"}</span>
                                    </div>
                                  </>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 mt-3 ml-15">
                                {getStatusIcon(payment.status)}
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(payment.status)}`}>
                                  {getStatusDisplay(payment.status)}
                                </span>
                                {payment.status?.toLowerCase() === "success" && (
                                  <span className="text-sm text-gray-600">
                                    via Razorpay
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {(payment.status?.toLowerCase() === "pending" || payment.status?.toLowerCase() === "failed") && (
                              <button
                                onClick={() => handlePayNow(payment)}
                                disabled={processingPaymentId === payment.id}
                                className="ml-4 flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {processingPaymentId === payment.id ? (
                                  <>
                                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    <span>Processing...</span>
                                  </>
                                ) : (
                                  <>
                                    <span>Pay Now</span>
                                    <HiArrowRight className="text-lg" />
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payments;

