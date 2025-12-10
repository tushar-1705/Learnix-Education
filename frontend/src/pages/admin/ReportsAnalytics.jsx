import { useEffect, useState } from "react";
import API from "../../api/axiosConfig";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useSidebar } from "../../context/SidebarContext";
import jsPDF from "jspdf";
import { 
  HiUsers, 
  HiBookOpen, 
  HiAcademicCap, 
  HiChartBar,
  HiTrendingUp,
  HiDownload
} from "react-icons/hi";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

const ReportsAnalytics = () => {
  const { isOpen } = useSidebar();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    totalEnrollments: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, statsRes] = await Promise.all([
        API.get("/admin/reports/analytics"),
        API.get("/admin/stats")
      ]);

      if (analyticsRes.data?.data) {
        setAnalytics(analyticsRes.data.data);
      }

      if (statsRes.data?.data) {
        setStats({
          totalStudents: statsRes.data.data.totalStudents || 0,
          totalTeachers: statsRes.data.data.totalTeachers || 0,
          totalCourses: statsRes.data.data.totalCourses || 0,
          totalEnrollments: statsRes.data.data.totalEnrollments || 0
        });
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      setLoading(false);
    }
  };

  const prepareCourseDistributionData = () => {
    if (!analytics?.courseDistribution) return [];
    
    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];
    let colorIndex = 0;
    
    return Object.entries(analytics.courseDistribution).map(([name, value]) => ({
      name,
      value: Number(value),
      color: colors[colorIndex++ % colors.length]
    }));
  };

  const prepareEnrollmentTrends = () => {
    if (!analytics?.enrollmentTrends) return [];
    return analytics.enrollmentTrends.map(trend => ({
      month: trend.month,
      enrollments: Number(trend.enrollments || 0)
    }));
  };

  const handleExportReport = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    const checkPageBreak = (requiredSpace = 10) => {
      if (yPosition + requiredSpace > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
    };

    // Header
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(37, 99, 235); // Blue color
    doc.text('Learnix Portal - Analytics Report', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(107, 114, 128); // Gray color
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Overall Statistics Section
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Overall Statistics', 14, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    const statistics = [
      { label: 'Total Students', value: stats.totalStudents },
      { label: 'Total Teachers', value: stats.totalTeachers },
      { label: 'Total Courses', value: stats.totalCourses },
      { label: 'Total Enrollments', value: stats.totalEnrollments }
    ];

    statistics.forEach(stat => {
      checkPageBreak(8);
      doc.text(`${stat.label}:`, 20, yPosition);
      doc.setFont(undefined, 'bold');
      doc.text(stat.value.toString(), 90, yPosition);
      doc.setFont(undefined, 'normal');
      yPosition += 7;
    });

    yPosition += 5;

    // Course Distribution Section
    checkPageBreak(20);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Course Distribution', 14, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    const courseDistribution = prepareCourseDistributionData();
    if (courseDistribution.length > 0) {
      courseDistribution.forEach(course => {
        checkPageBreak(8);
        const percentage = ((course.value / courseDistribution.reduce((sum, c) => sum + c.value, 0)) * 100).toFixed(1);
        doc.text(`${course.name}:`, 20, yPosition);
        doc.setFont(undefined, 'bold');
        doc.text(`${course.value} courses (${percentage}%)`, 90, yPosition);
        doc.setFont(undefined, 'normal');
        yPosition += 7;
      });
    } else {
      doc.text('No course distribution data available', 20, yPosition);
      yPosition += 7;
    }

    yPosition += 5;

    // Enrollment Trends Section
    checkPageBreak(20);
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Enrollment Trends', 14, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    const enrollmentTrends = prepareEnrollmentTrends();
    if (enrollmentTrends.length > 0) {
      enrollmentTrends.forEach(trend => {
        checkPageBreak(8);
        doc.text(`${trend.month}:`, 20, yPosition);
        doc.setFont(undefined, 'bold');
        doc.text(`${trend.enrollments} enrollments`, 90, yPosition);
        doc.setFont(undefined, 'normal');
        yPosition += 7;
      });
    } else {
      doc.text('No enrollment trends data available', 20, yPosition);
      yPosition += 7;
    }

    // Analytics Summary Section
    checkPageBreak(30);
    yPosition += 10;
    doc.setFontSize(16);
    doc.setFont(undefined, 'bold');
    doc.text('Analytics Summary', 14, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    
    // System Overview
    doc.setFont(undefined, 'bold');
    doc.text('System Overview:', 20, yPosition);
    yPosition += 7;
    doc.setFont(undefined, 'normal');
    
    statistics.forEach(stat => {
      checkPageBreak(8);
      doc.text(`${stat.label}:`, 25, yPosition);
      doc.setFont(undefined, 'bold');
      doc.text(stat.value.toString(), 100, yPosition);
      doc.setFont(undefined, 'normal');
      yPosition += 7;
    });

    // Course Categories
    checkPageBreak(20);
    yPosition += 5;
    doc.setFont(undefined, 'bold');
    doc.text('Course Categories:', 20, yPosition);
    yPosition += 7;
    doc.setFont(undefined, 'normal');

    if (courseDistribution.length > 0) {
      courseDistribution.forEach(category => {
        checkPageBreak(8);
        doc.text(`${category.name}:`, 25, yPosition);
        doc.setFont(undefined, 'bold');
        doc.text(category.value.toString(), 100, yPosition);
        doc.setFont(undefined, 'normal');
        yPosition += 7;
      });
    }

    // Footer
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text('Learnix Portal - Confidential Report', pageWidth / 2, pageHeight - 5, { align: 'center' });
    }

    // Save the PDF
    const fileName = `learnix-analytics-report-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-28'}`}>
        <Navbar />
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-2">Reports & Analytics</h2>
                <p className="text-gray-600 text-base sm:text-lg">View comprehensive reports and analytics</p>
              </div>
              <button
                onClick={handleExportReport}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg text-sm sm:text-base w-full sm:w-auto justify-center"
              >
                <HiDownload className="text-lg" />
                Export Report
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="mt-4 text-gray-600">Loading analytics...</p>
              </div>
            ) : (
              <>
                {/* Overall Statistics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <HiUsers className="text-2xl text-blue-600" />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Students</h3>
                    <p className="text-3xl font-bold text-gray-800">{stats.totalStudents}</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <HiAcademicCap className="text-2xl text-green-600" />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Teachers</h3>
                    <p className="text-3xl font-bold text-gray-800">{stats.totalTeachers}</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <HiBookOpen className="text-2xl text-blue-600" />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Courses</h3>
                    <p className="text-3xl font-bold text-gray-800">{stats.totalCourses}</p>
                  </div>

                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <HiTrendingUp className="text-2xl text-blue-600" />
                      </div>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Total Enrollments</h3>
                    <p className="text-3xl font-bold text-gray-800">{stats.totalEnrollments}</p>
                  </div>
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
                  {/* Course Distribution */}
                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Course Distribution</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={prepareCourseDistributionData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {prepareCourseDistributionData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Enrollment Trends */}
                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Enrollment Trends</h3>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={prepareEnrollmentTrends()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="enrollments" stroke="#3B82F6" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Additional Analytics Table */}
                <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Analytics Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3">System Overview</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Students</span>
                          <span className="font-semibold">{stats.totalStudents}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Teachers</span>
                          <span className="font-semibold">{stats.totalTeachers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Courses</span>
                          <span className="font-semibold">{stats.totalCourses}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Enrollments</span>
                          <span className="font-semibold">{stats.totalEnrollments}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-3">Course Categories</h4>
                      <div className="space-y-2 text-sm">
                        {prepareCourseDistributionData().map((category, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }}></div>
                              <span className="text-gray-600">{category.name}</span>
                            </div>
                            <span className="font-semibold">{category.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;

