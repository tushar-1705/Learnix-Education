import { useEffect, useState, useMemo } from "react";
import { toast } from "react-toastify";
import API from "../../api/axiosConfig";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useSidebar } from "../../context/SidebarContext";
import { useAuth } from "../../context/AuthContext";
import { 
  HiChartBar, 
  HiAcademicCap,
  HiBookOpen,
  HiUser,
  HiCalendar,
  HiFilter,
  HiStar,
  HiTrendingUp
} from "react-icons/hi";

const MyMarks = () => {
  const { isOpen } = useSidebar();
  const { user } = useAuth();
  const [gradesData, setGradesData] = useState({
    records: [],
    total: 0,
    averageGrade: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("ALL"); 

  useEffect(() => {
    const email = user?.email || localStorage.getItem("email");
    if (email) {
      fetchGrades(email);
    }
  }, [user?.email]);

  const fetchGrades = async (email) => {
    setLoading(true);
    try {
      const res = await API.get("/student/grades", { params: { email } });
      if (res.data?.data) {
        setGradesData(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching grades:", error);
      toast.error("Failed to load grades data");
    } finally {
      setLoading(false);
    }
  };

  // Get unique subjects for filter
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set();
    (gradesData.records || []).forEach(record => {
      if (record.subject) {
        // Handle comma-separated subjects
        record.subject.split(',').forEach(sub => {
          const trimmed = sub.trim();
          if (trimmed) subjects.add(trimmed);
        });
      }
    });
    return Array.from(subjects).sort();
  }, [gradesData.records]);

  const filteredRecords = useMemo(() => {
    let filtered = gradesData.records || [];

    // Filter by subject
    if (subjectFilter !== "ALL") {
      filtered = filtered.filter(record =>
        record.subject && record.subject.includes(subjectFilter)
      );
    }

    // Filter by search term (subject, teacher, or grade)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(record =>
        (record.subject || "").toLowerCase().includes(term) ||
        (record.teacherName || "").toLowerCase().includes(term) ||
        (record.grade || "").toLowerCase().includes(term) ||
        (record.remarks || "").toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [gradesData.records, subjectFilter, searchTerm]);

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getGradeColor = (grade) => {
    if (!grade) return "bg-gray-100 text-gray-700";
    
    const gradeStr = grade.toString().toUpperCase();
    
    // Check for letter grades
    if (gradeStr.includes("A+") || gradeStr.includes("O")) {
      return "bg-green-100 text-green-700";
    } else if (gradeStr.includes("A")) {
      return "bg-green-100 text-green-700";
    } else if (gradeStr.includes("B+")) {
      return "bg-blue-100 text-blue-700";
    } else if (gradeStr.includes("B")) {
      return "bg-blue-100 text-blue-700";
    } else if (gradeStr.includes("C+")) {
      return "bg-yellow-100 text-yellow-700";
    } else if (gradeStr.includes("C")) {
      return "bg-yellow-100 text-yellow-700";
    } else if (gradeStr.includes("D")) {
      return "bg-orange-100 text-orange-700";
    } else if (gradeStr.includes("E") || gradeStr.includes("F")) {
      return "bg-red-100 text-red-700";
    }
    
    // Check for numeric grades
    try {
      const numGrade = parseFloat(gradeStr);
      if (numGrade >= 90) return "bg-green-100 text-green-700";
      if (numGrade >= 80) return "bg-blue-100 text-blue-700";
      if (numGrade >= 70) return "bg-yellow-100 text-yellow-700";
      if (numGrade >= 60) return "bg-orange-100 text-orange-700";
      return "bg-red-100 text-red-700";
    } catch (e) {
      return "bg-gray-100 text-gray-700";
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
              <h2 className="text-4xl font-bold text-blue-600 mb-2">My Marks & Grades</h2>
              <p className="text-gray-600 text-lg">View your grades and marks subject-wise</p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading grades data...</p>
              </div>
            ) : (
              <>
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {/* Total Grades */}
                  <div className="bg-white rounded-xl p-6 shadow-md border border-blue-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <HiAcademicCap className="text-2xl text-blue-600" />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Grades</h3>
                    <p className="text-3xl font-bold text-blue-600">{gradesData.total}</p>
                  </div>

                  {/* Average Grade */}
                  <div className="bg-white rounded-xl p-6 shadow-md border border-blue-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <HiChartBar className="text-2xl text-blue-600" />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Average Grade</h3>
                    <p className="text-3xl font-bold text-blue-600">
                      {gradesData.averageGrade > 0 ? gradesData.averageGrade.toFixed(1) : "N/A"}
                    </p>
                  </div>

                  {/* Performance Indicator */}
                  <div className={`bg-white rounded-xl p-6 shadow-md border transition-all duration-300 ${
                    gradesData.averageGrade >= 8 
                      ? 'border-green-200 hover:border-green-300' 
                      : gradesData.averageGrade >= 7 
                      ? 'border-blue-200 hover:border-blue-300' 
                      : gradesData.averageGrade >= 6 
                      ? 'border-amber-200 hover:border-amber-300' 
                      : gradesData.averageGrade > 0 
                      ? 'border-red-200 hover:border-red-300' 
                      : 'border-blue-200 hover:border-blue-300'
                  } hover:shadow-lg`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        gradesData.averageGrade >= 8 
                          ? 'bg-green-100' 
                          : gradesData.averageGrade >= 7 
                          ? 'bg-blue-100' 
                          : gradesData.averageGrade >= 6 
                          ? 'bg-amber-100' 
                          : gradesData.averageGrade > 0 
                          ? 'bg-red-100' 
                          : 'bg-blue-100'
                      }`}>
                        <HiTrendingUp className={`text-2xl ${
                          gradesData.averageGrade >= 8 
                            ? 'text-green-600' 
                            : gradesData.averageGrade >= 7 
                            ? 'text-blue-600' 
                            : gradesData.averageGrade >= 6 
                            ? 'text-amber-600' 
                            : gradesData.averageGrade > 0 
                            ? 'text-red-600' 
                            : 'text-blue-600'
                        }`} />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Performance</h3>
                    <p className={`text-3xl font-bold ${
                      gradesData.averageGrade >= 8 
                        ? 'text-green-600' 
                        : gradesData.averageGrade >= 7 
                        ? 'text-blue-600' 
                        : gradesData.averageGrade >= 6 
                        ? 'text-amber-600' 
                        : gradesData.averageGrade > 0 
                        ? 'text-red-600' 
                        : 'text-blue-600'
                    }`}>
                      {gradesData.averageGrade >= 8 ? "Excellent" :
                       gradesData.averageGrade >= 7 ? "Good" :
                       gradesData.averageGrade >= 6 ? "Average" :
                       gradesData.averageGrade > 0 ? "Needs Improvement" : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl p-6 shadow-md border border-blue-200 mb-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Search by subject, teacher, grade, or remarks..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full px-4 py-2 pl-10 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <HiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400" />
                      </div>
                    </div>

                    {/* Subject Filter */}
                    <div className="md:w-64">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                      <select
                        value={subjectFilter}
                        onChange={(e) => setSubjectFilter(e.target.value)}
                        className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="ALL">All Subjects</option>
                        {uniqueSubjects.map((subject) => (
                          <option key={subject} value={subject}>
                            {subject}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Grades Records Table */}
                <div className="bg-white rounded-xl shadow-md border border-blue-200 overflow-hidden">
                  <div className="p-6 border-b border-blue-200 bg-blue-50">
                    <h3 className="text-lg font-semibold text-blue-600">
                      Grades & Marks ({filteredRecords.length})
                    </h3>
                  </div>
                  
                  {filteredRecords.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                        <HiAcademicCap className="text-4xl text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">No grades found</h3>
                      <p className="text-gray-600">
                        {gradesData.records.length === 0 
                          ? "You don't have any grades yet."
                          : "Try adjusting your filters to see more results."}
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-blue-100">
                        <thead className="bg-blue-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Subject
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Grade/Marks
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Teacher
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Remarks
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                              Date
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-blue-50">
                          {filteredRecords.map((record) => (
                            <tr key={record.id} className="hover:bg-blue-50 transition-colors">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <HiBookOpen className="text-gray-400" />
                                  <span className="text-sm font-medium text-gray-900">
                                    {record.subject || "General"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(record.grade)}`}>
                                  <HiStar className="text-xs" />
                                  {record.grade || "N/A"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <HiUser className="text-gray-400" />
                                  <span className="text-sm text-gray-900">{record.teacherName || "Unknown"}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-gray-900">
                                  {record.remarks || "-"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <HiCalendar className="text-gray-400" />
                                  <span className="text-sm text-gray-900">
                                    {record.createdAt ? formatDate(record.createdAt) : "-"}
                                  </span>
                                </div>
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
    </div>
  );
};

export default MyMarks;

