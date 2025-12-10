import { useEffect, useState } from "react";
import API from "../../api/axiosConfig";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useSidebar } from "../../context/SidebarContext";

const AdminOnlineTestReports = () => {
  const { isOpen } = useSidebar();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    studentName: "",
    testId: "",
  });

  const loadReports = () => {
    setLoading(true);
    const params = {};
    if (filters.studentName.trim()) params.studentName = filters.studentName.trim();
    if (filters.testId.trim()) params.testId = filters.testId.trim();

    API.get("/admin/online-tests/reports", { params })
      .then((res) => {
        setReports(res.data?.data?.items || []);
      })
      .catch(() => {
        setReports([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReports();
  }, []);

  const formatDateTime = (value) => {
    if (!value) return "-";
    return new Date(value).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          isOpen ? "lg:ml-64" : "lg:ml-28"
        }`}
      >
        <Navbar />
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
                  Online Test Reports
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  View which student scored how much in which online test.
                </p>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Student Name
                  </label>
                  <input
                    type="text"
                    value={filters.studentName}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, studentName: e.target.value }))
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter student name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Test ID (optional)
                  </label>
                  <input
                    type="number"
                    value={filters.testId}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, testId: e.target.value }))
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter test id"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={loadReports}
                    className="flex-1 md:flex-none px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Apply Filters
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFilters({ studentName: "", testId: "" });
                      loadReports();
                    }}
                    className="flex-1 md:flex-none px-4 py-2 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
              {loading ? (
                <p className="text-sm text-gray-500">Loading reports...</p>
              ) : reports.length === 0 ? (
                <p className="text-sm text-gray-500">No test submissions found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Student
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Email
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Test
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Subject
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Teacher
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Score
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Correct
                        </th>
                        <th className="px-4 py-2 text-left font-semibold text-gray-700">
                          Submitted At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {reports.map((row) => {
                        const student = row.student || {};
                        const test = row.test || {};
                        const teacher = (test && test.teacher) || {};

                        return (
                          <tr key={row.submissionId}>
                            <td className="px-4 py-2 font-semibold text-gray-800">
                              {student.name || "-"}
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {student.email || "-"}
                            </td>
                            <td className="px-4 py-2 text-gray-800">
                              {test.title || "-"}{" "}
                              <span className="text-xs text-gray-400">
                                (ID: {test.id || "-"})
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {test.subject || "-"}
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {teacher.name || "-"}
                            </td>
                            <td className="px-4 py-2 text-gray-800 font-semibold">
                              {row.score}/{test.maxMarks}
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {row.totalCorrect}
                            </td>
                            <td className="px-4 py-2 text-gray-500">
                              {formatDateTime(row.submittedAt)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOnlineTestReports;


