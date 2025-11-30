import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import API from "../../api/axiosConfig";
import { getImageUrl } from "../../api/apiConfig";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useSidebar } from "../../context/SidebarContext";

const StudentProfile = () => {
  const { isOpen } = useSidebar();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get(`/teacher/students/${id}/profile`);
        setProfile(res.data?.data || null);
      } catch (e) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isOpen ? 'lg:ml-64' : 'lg:ml-28'}`}>
        <Navbar />
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="p-8 max-w-5xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-3xl font-bold text-gray-800">Student Profile</h2>
              <Link to="/teacher/dashboard" className="text-blue-600 hover:text-blue-700">Back to Dashboard</Link>
            </div>

            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : !profile ? (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">Not found.</div>
            ) : (
              <div className="space-y-6">
                {/* Header with Photo */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
                  {profile.profilePhoto ? (
                    <img
                      src={getImageUrl(profile.profilePhoto)}
                      alt={profile.name}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-semibold">
                      {(profile.name || "").split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
                    </div>
                  )}
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">{profile.name}</h3>
                    <p className="text-gray-600">{profile.email}</p>
                  </div>
                </div>

                {/* Info */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                    <div><span className="font-semibold">Name:</span> {profile.name}</div>
                    <div><span className="font-semibold">Email:</span> {profile.email}</div>
                    <div><span className="font-semibold">Phone:</span> {profile.phoneNumber || '—'}</div>
                    <div><span className="font-semibold">Roll Number:</span> {profile.rollNo || '—'}</div>
                    <div className="md:col-span-2"><span className="font-semibold">Address:</span> {profile.address || '—'}</div>
                    <div><span className="font-semibold">Joined:</span> {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' }) : ''}</div>
                  </div>
                </div>

                {/* Attendance */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Attendance</h3>
                  <div className="flex items-center gap-6 text-gray-800">
                    <div><span className="font-semibold">Total:</span> {profile.attendance?.total ?? 0}</div>
                    <div><span className="font-semibold">Present:</span> {profile.attendance?.present ?? 0}</div>
                    <div><span className="font-semibold">Percentage:</span> {profile.attendance?.percentage ?? 0}%</div>
                  </div>
                </div>

                {/* Enrolled Courses */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Enrolled Courses</h3>
                  {Array.isArray(profile.courses) && profile.courses.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {profile.courses.map((c) => (
                        <li key={c.id} className="py-3">
                          <div className="font-medium text-gray-800">{c.title}</div>
                          <div className="text-sm text-gray-500">{c.category || 'General'}</div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600">No courses enrolled.</p>
                  )}
                </div>

                {/* Grades */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Grades</h3>
                  {Array.isArray(profile.grades) && profile.grades.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                      {profile.grades.map((g) => (
                        <li key={g.id} className="py-3 flex items-center justify-between">
                          <div>
                            <div className="font-medium text-gray-800">{g.courseTitle || 'General'}</div>
                            <div className="text-sm text-gray-500">{g.remarks || ''}</div>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">{g.grade}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600">No grades available.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
