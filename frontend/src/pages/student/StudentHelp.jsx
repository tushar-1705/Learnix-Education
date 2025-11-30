import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import API from "../../api/axiosConfig";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";
import { HiQuestionMarkCircle, HiCheckCircle, HiClock, HiReply } from "react-icons/hi";

const StudentHelp = () => {
  const { isOpen } = useSidebar();
  const { user } = useAuth();
  const [issue, setIssue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHelpRequests();
  }, []);

  const fetchHelpRequests = async () => {
    try {
      const email = user?.email || localStorage.getItem("email");
      const res = await API.get(`/student/help?email=${email}`);
      setHelpRequests(res.data?.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching help requests:", error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!issue.trim()) {
      toast.error("Please describe your issue");
      return;
    }

    setSubmitting(true);
    try {
      const email = user?.email || localStorage.getItem("email");
      await API.post(`/student/help?email=${email}`, { issue });
      toast.success("Help request submitted successfully!");
      setIssue("");
      fetchHelpRequests();
    } catch (error) {
      console.error("Error submitting help request:", error);
      toast.error("Error submitting help request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status) => {
    if (status === "RESOLVED") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
          <HiCheckCircle className="text-sm" />
          Resolved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-700 rounded-full">
        <HiClock className="text-sm" />
        Pending
      </span>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-28'}`}>
        <Navbar />
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Get Help</h2>
              <p className="text-gray-600">Submit your queries and issues. Our admin team will assist you.</p>
            </div>

            {/* Submit Help Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <HiQuestionMarkCircle className="text-2xl text-blue-600" />
                <h3 className="text-xl font-semibold text-gray-800">Submit a Help Request</h3>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="issue" className="block text-sm font-medium text-gray-700 mb-2">
                    Describe your issue or query
                  </label>
                  <textarea
                    id="issue"
                    value={issue}
                    onChange={(e) => setIssue(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Please describe your issue or query in detail..."
                    disabled={submitting}
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting || !issue.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </form>
            </div>

            {/* Previous Help Requests */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Your Help Requests</h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-4 text-gray-600">Loading...</p>
                </div>
              ) : helpRequests.length === 0 ? (
                <div className="text-center py-12">
                  <HiQuestionMarkCircle className="text-5xl text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No help requests yet. Submit your first request above.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {helpRequests.map((request) => (
                    <div
                      key={request.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 mb-2">Your Issue:</h4>
                          <p className="text-gray-800 whitespace-pre-wrap">{request.issue}</p>
                        </div>
                        <div className="ml-4">
                          {getStatusBadge(request.status)}
                        </div>
                      </div>

                      {/* Admin Reply Section */}
                      {request.reply && (
                        <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <HiReply className="text-blue-600" />
                            <h5 className="font-semibold text-blue-800">Admin Reply:</h5>
                          </div>
                          <p className="text-gray-700 whitespace-pre-wrap">{request.reply}</p>
                          {request.repliedAt && (
                            <p className="text-xs text-gray-500 mt-2">
                              Replied: {formatDate(request.repliedAt)}
                            </p>
                          )}
                        </div>
                      )}

                      {!request.reply && request.status === "PENDING" && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <HiClock className="inline mr-1" />
                            Waiting for admin response...
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-gray-500 mt-3 pt-3 border-t border-gray-200">
                        <span>Submitted: {formatDate(request.createdAt)}</span>
                        {request.resolvedAt && (
                          <span>Resolved: {formatDate(request.resolvedAt)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentHelp;

