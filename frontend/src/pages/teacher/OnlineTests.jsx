import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import API from "../../api/axiosConfig";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useSidebar } from "../../context/SidebarContext";

const defaultQuestion = () => ({
  questionText: "",
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctOption: "A",
});

const TeacherOnlineTests = () => {
  const { isOpen } = useSidebar();
  const [subjects, setSubjects] = useState([]);
  const [tests, setTests] = useState([]);
  const [selectedTestResults, setSelectedTestResults] = useState([]);
  const [activeTestId, setActiveTestId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchingResults, setFetchingResults] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    description: "",
    maxMarks: 30,
    questions: [defaultQuestion()],
  });

  const loadSubjects = () => {
    API.get("/teacher/my-subjects")
      .then((res) => setSubjects(res.data?.data || []))
      .catch(() => setSubjects([]));
  };

  const loadTests = () => {
    setLoading(true);
    API.get("/teacher/tests")
      .then((res) => setTests(res.data?.data || []))
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSubjects();
    loadTests();
  }, []);

  const handleQuestionChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.questions];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, questions: updated };
    });
  };

  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, defaultQuestion()],
    }));
  };

  const removeQuestion = (index) => {
    if (formData.questions.length === 1) {
      toast.warn("At least one question is required.");
      return;
    }
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, idx) => idx !== index),
    }));
  };

  const handleCreateTest = (e) => {
    e.preventDefault();
    if (!formData.subject) {
      toast.error("Please select a subject.");
      return;
    }
    if (formData.maxMarks < 30 || formData.maxMarks > 50) {
      toast.error("Max marks must be between 30 and 50.");
      return;
    }
    if (formData.questions.some((q) => !q.questionText.trim())) {
      toast.error("Every question needs text.");
      return;
    }
    setSaving(true);
    API.post("/teacher/tests", formData)
      .then(() => {
        toast.success("Test created successfully!");
        setFormData({
          title: "",
          subject: "",
          description: "",
          maxMarks: 30,
          questions: [defaultQuestion()],
        });
        loadTests();
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to create test.");
      })
      .finally(() => setSaving(false));
  };

  const viewResults = (testId) => {
    setFetchingResults(true);
    setActiveTestId(testId);
    API.get(`/teacher/tests/${testId}/submissions`)
      .then((res) => setSelectedTestResults(res.data?.data || []))
      .catch(() => setSelectedTestResults([]))
      .finally(() => setFetchingResults(false));
  };

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleString("en-IN", {
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
          <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Create Online MCQ Test
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Maximum marks must be between 30 and 50. Questions support 4 options (A-D).
              </p>
              <form onSubmit={handleCreateTest} className="space-y-5">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Test Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Mid Term MCQ Test"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Subject
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, subject: e.target.value }))
                      }
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.subject}>
                          {subject.subject}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Marks (30-50)
                    </label>
                    <input
                      type="number"
                      min={30}
                      max={50}
                      value={formData.maxMarks}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          maxMarks: Number(e.target.value),
                        }))
                      }
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g. Chapters 1-3 coverage"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">Questions</h3>
                    <button
                      type="button"
                      onClick={addQuestion}
                      className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Question
                    </button>
                  </div>
                  {formData.questions.map((question, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-xl p-4 bg-blue-50 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-md font-semibold text-gray-700">
                          Question {index + 1}
                        </h4>
                        <button
                          type="button"
                          onClick={() => removeQuestion(index)}
                          className="text-sm text-red-500 hover:text-red-600 font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                      <textarea
                        value={question.questionText}
                        onChange={(e) =>
                          handleQuestionChange(index, "questionText", e.target.value)
                        }
                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter the question"
                        required
                      />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {["optionA", "optionB", "optionC", "optionD"].map((field, idx) => (
                          <div key={field}>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                              Option {String.fromCharCode(65 + idx)}
                            </label>
                            <input
                              type="text"
                              value={question[field]}
                              onChange={(e) =>
                                handleQuestionChange(index, field, e.target.value)
                              }
                              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              required
                            />
                          </div>
                        ))}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1">
                          Correct Option
                        </label>
                        <select
                          value={question.correctOption}
                          onChange={(e) =>
                            handleQuestionChange(index, "correctOption", e.target.value)
                          }
                          className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Creating..." : "Create Test"}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">My Tests</h2>
                  <p className="text-sm text-gray-500">Published tests visible to students.</p>
                </div>
              </div>
              {loading ? (
                <p className="text-sm text-gray-500">Loading tests...</p>
              ) : tests.length === 0 ? (
                <p className="text-sm text-gray-500">No tests created yet.</p>
              ) : (
                <div className="space-y-4">
                  {tests.map((test) => (
                    <div
                      key={test.id}
                      className="border border-gray-200 rounded-lg p-4 bg-blue-50 flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="text-lg font-semibold text-gray-800">{test.title}</p>
                        <p className="text-sm text-gray-500">
                          Subject: {test.subject} • {test.questionCount} questions • Max Marks:{" "}
                          {test.maxMarks}
                        </p>
                        <p className="text-xs text-gray-400">Created on {formatDate(test.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-blue-600">
                          {test.submissions} submissions
                        </span>
                        <button
                          type="button"
                          onClick={() => viewResults(test.id)}
                          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          View Results
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTestId && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-800">Test Results</h3>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTestId(null);
                        setSelectedTestResults([]);
                      }}
                      className="text-sm text-red-500 font-semibold"
                    >
                      Close
                    </button>
                  </div>
                  {fetchingResults ? (
                    <p className="text-sm text-gray-500">Fetching submissions...</p>
                  ) : selectedTestResults.length === 0 ? (
                    <p className="text-sm text-gray-500">No submissions yet.</p>
                  ) : (
                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold text-gray-600">
                              Student
                            </th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-600">
                              Email
                            </th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-600">
                              Score
                            </th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-600">
                              Correct
                            </th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-600">
                              Submitted At
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {selectedTestResults.map((result) => (
                            <tr key={result.submissionId}>
                              <td className="px-4 py-2 font-semibold text-gray-800">
                                {result.studentName}
                              </td>
                              <td className="px-4 py-2 text-gray-600">{result.studentEmail}</td>
                              <td className="px-4 py-2 text-gray-800">{result.score}</td>
                              <td className="px-4 py-2 text-gray-600">{result.totalCorrect}</td>
                              <td className="px-4 py-2 text-gray-500">{formatDate(result.submittedAt)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherOnlineTests;

