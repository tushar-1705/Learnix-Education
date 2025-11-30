import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import API from "../../api/axiosConfig";
import { getImageUrl } from "../../api/apiConfig";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useSidebar } from "../../context/SidebarContext";
import { HiQuestionMarkCircle, HiCheckCircle, HiClock, HiSearch, HiUserCircle, HiReply } from "react-icons/hi";

const AdminStudentHelp = () => {
  const { isOpen } = useSidebar();
  const [helpRequests, setHelpRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [statusCounts, setStatusCounts] = useState({ pending: 0, resolved: 0 });
  const [totalRequests, setTotalRequests] = useState(0);
  const [initialized, setInitialized] = useState(false);
  const [replyInputs, setReplyInputs] = useState({});
  const [submittingReply, setSubmittingReply] = useState({});
  const [openReplyForms, setOpenReplyForms] = useState({});

  const fetchHelpRequests = useCallback(async (search = "", status = statusFilter) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.append("search", search.trim());
      }
      if (status && status !== "ALL") {
        params.append("status", status);
      }
      const query = params.toString();
      const res = await API.get(query ? `/admin/student-help?${query}` : "/admin/student-help");
      const payload = res.data?.data;
      const items = payload?.items ?? [];
      setHelpRequests(items);
      setTotalRequests(payload?.total ?? items.length);
      const counts = payload?.statusCounts || {};
      setStatusCounts({
        pending: counts.PENDING ?? 0,
        resolved: counts.RESOLVED ?? 0
      });
    } catch (error) {
      console.error("Error fetching help requests:", error);
      toast.error("Error loading help requests");
      setHelpRequests([]);
      setTotalRequests(0);
      setStatusCounts({ pending: 0, resolved: 0 });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    let mounted = true;
    fetchHelpRequests(searchTerm, statusFilter).finally(() => {
      if (mounted) setInitialized(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!initialized) return;
    const handler = setTimeout(() => {
      fetchHelpRequests(searchTerm, statusFilter);
    }, 300);
    return () => clearTimeout(handler);
  }, [fetchHelpRequests, searchTerm, statusFilter, initialized]);
  
  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await API.put(`/admin/student-help/${id}/status?status=${newStatus}`);
      toast.success(`Request marked as ${newStatus}`);
      fetchHelpRequests(searchTerm, statusFilter);
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Error updating request status");
    }
  };

  const handleReplyChange = (id, value) => {
    setReplyInputs((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmitReply = async (id) => {
    const reply = replyInputs[id]?.trim();
    if (!reply) {
      toast.error("Please enter a reply");
      return;
    }

    setSubmittingReply((prev) => ({ ...prev, [id]: true }));
    try {
      await API.post(`/admin/student-help/${id}/reply`, { reply });
      toast.success("Reply submitted successfully!");
      setReplyInputs((prev) => {
        const newInputs = { ...prev };
        delete newInputs[id];
        return newInputs;
      });
      setOpenReplyForms((prev) => ({ ...prev, [id]: false }));
      fetchHelpRequests(searchTerm, statusFilter);
    } catch (error) {
      console.error("Error submitting reply:", error);
      toast.error("Error submitting reply");
    } finally {
      setSubmittingReply((prev) => ({ ...prev, [id]: false }));
    }
  };

  const toggleReplyForm = (id) => {
    setOpenReplyForms((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
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

  const getInitials = (name) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const pendingCount = statusCounts.pending;
  const resolvedCount = statusCounts.resolved;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-28'}`}>
        <Navbar />
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Student Help Requests</h2>
              <p className="text-gray-600">View and manage student queries and issues</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Requests</p>
                    <p className="text-2xl font-bold text-gray-800">{totalRequests}</p>
                  </div>
                  <HiQuestionMarkCircle className="text-3xl text-blue-600" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
                  </div>
                  <HiClock className="text-3xl text-yellow-600" />
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Resolved</p>
                    <p className="text-2xl font-bold text-green-600">{resolvedCount}</p>
                  </div>
                  <HiCheckCircle className="text-3xl text-green-600" />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl" />
                  <input
                    type="text"
                    placeholder="Search by student name, email, or issue..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>
            </div>

            {/* Help Requests List */}
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading help requests...</p>
              </div>
            ) : helpRequests.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                <HiQuestionMarkCircle className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No help requests found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== "ALL"
                    ? "Try adjusting your filters."
                    : "No student help requests yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {helpRequests.map((request) => (
                  <div
                    key={request.id}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        {request.student?.profilePhoto ? (
                          <img
                            src={getImageUrl(request.student.profilePhoto)}
                            alt={request.student.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                            {getInitials(request.student?.name)}
                          </div>
                        )}
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 text-lg">
                            {request.student?.name || "Unknown Student"}
                          </h4>
                          <p className="text-sm text-gray-600">{request.student?.email || "N/A"}</p>
                        </div>
                      </div>
                      <div className="ml-4">{getStatusBadge(request.status)}</div>
                    </div>
                    <div className="mb-4">
                      <p className="text-gray-700 whitespace-pre-wrap">{request.issue}</p>
                    </div>

                    {/* Admin Reply Section */}
                    {request.reply && (
                      <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
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

                    {/* Reply Button and Form - Only show if no reply exists */}
                    {!request.reply && (
                      <>
                        {/* Reply Button - Show/Hide Reply Form */}
                        <div className="mb-4">
                          <button
                            onClick={() => toggleReplyForm(request.id)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
                          >
                            <HiReply className="text-sm" />
                            {openReplyForms[request.id] ? "Hide Reply Form" : "Reply"}
                          </button>
                        </div>

                        {/* Reply Form - Only show when open */}
                        {openReplyForms[request.id] && (
                          <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-gray-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Add Reply:
                            </label>
                            <textarea
                              value={replyInputs[request.id] || ""}
                              onChange={(e) => handleReplyChange(request.id, e.target.value)}
                              rows={4}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2"
                              placeholder="Type your reply here..."
                              disabled={submittingReply[request.id]}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSubmitReply(request.id)}
                                disabled={submittingReply[request.id] || !replyInputs[request.id]?.trim()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                              >
                                <HiReply className="text-sm" />
                                {submittingReply[request.id] ? "Submitting..." : "Send Reply"}
                              </button>
                              <button
                                onClick={() => toggleReplyForm(request.id)}
                                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="text-sm text-gray-500">
                        <span>Submitted: {formatDate(request.createdAt)}</span>
                        {request.resolvedAt && (
                          <span className="ml-4">Resolved: {formatDate(request.resolvedAt)}</span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {request.status === "PENDING" && (
                          <button
                            onClick={() => handleStatusUpdate(request.id, "RESOLVED")}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md"
                          >
                            Mark as Resolved
                          </button>
                        )}
                        {request.status === "RESOLVED" && (
                          <button
                            onClick={() => handleStatusUpdate(request.id, "PENDING")}
                            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors shadow-sm hover:shadow-md"
                          >
                            Mark as Pending
                          </button>
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

export default AdminStudentHelp;

