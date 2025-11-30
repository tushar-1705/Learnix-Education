import { HiBookOpen, HiTag, HiCollection, HiClock } from "react-icons/hi";
import { useNavigate } from "react-router-dom";

const CourseCard = ({ course, onEnroll, isEnrolled = false }) => {
  const navigate = useNavigate();
  const thumbnail = course.thumbnail || null; // optional future field
  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group flex flex-col justify-between transform hover:-translate-y-1">
      {/* Image */}
      <div onClick={() => navigate(`/student/courses/${course.id}`)} className="cursor-pointer h-40 w-full bg-gray-100 overflow-hidden">
        {thumbnail ? (
          <img src={thumbnail} alt={course.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-200" />
        )}
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
              {course.title}
            </h3>
            <div className="flex items-center gap-2 mb-3">
              <HiTag className="text-blue-500" />
              <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                {course.category}
              </span>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{course.description}</p>
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div>
            <p className="text-xs text-gray-500 mb-1">Price</p>
            <p className="text-2xl font-bold text-gray-800">₹{course.price}</p>
          </div>
          <div className="flex items-center gap-4 text-gray-500 text-sm">
            {course.lessonCount !== undefined && (
              <span className="inline-flex items-center gap-1"><HiCollection /> {course.lessonCount} Lessons</span>
            )}
            {course.durationFormatted && (
              <span className="inline-flex items-center gap-1"><HiClock /> {course.durationFormatted}</span>
            )}
            {typeof course.enrolledCount === 'number' && (
              <span className="inline-flex items-center gap-1"><HiBookOpen /> {course.enrolledCount} enrolled</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex gap-3 mx-6 mb-6">
        <button
          onClick={() => navigate(`/student/courses/${course.id}`)}
          className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold transition-all"
        >
          View Details
        </button>
        <button
          onClick={() => onEnroll(course.id)}
          disabled={isEnrolled}
          className={`flex-1 py-3 rounded-lg font-semibold transition-all duration-200 shadow-md ${
            isEnrolled
              ? 'bg-green-100 text-green-700 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 active:scale-95'
          }`}
        >
          {isEnrolled ? 'Enrolled' : 'Enroll Now'}
        </button>
      </div>
    </div>
  );
};

export default CourseCard;
