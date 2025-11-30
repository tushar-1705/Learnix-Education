import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import API from "../../api/axiosConfig";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { useSidebar } from "../../context/SidebarContext";

const StudentOnlineTests = () => {
  const { isOpen } = useSidebar();
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [selectedTest, setSelectedTest] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loadingTests, setLoadingTests] = useState(true);
  const [loadingTestDetail, setLoadingTestDetail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadTests = () => {
    setLoadingTests(true);
    API.get("/student/tests")
      .then((res) => setTests(res.data?.data || []))
      .catch(() => setTests([]))
      .finally(() => setLoadingTests(false));
  };

  const loadResults = () => {
    API.get("/student/tests/results")
      .then((res) => setResults(res.data?.data || []))
      .catch(() => setResults([]));
  };

  useEffect(() => {
    loadTests();
    loadResults();
  }, []);

  const openTest = (testId) => {
    setLoadingTestDetail(true);
    setSelectedTest(null);
    setAnswers({});
    API.get(`/student/tests/${testId}`)
      .then((res) => {
        const payload = res.data?.data || {};
        setSelectedTest(payload);
        if (payload.attempted) {
          toast.info("You have already attempted this test. Showing your summary.");
        }
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to fetch test.");
      })
      .finally(() => setLoadingTestDetail(false));
  };

  const handleAnswerChange = (questionId, option) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const submitTest = () => {
    if (!selectedTest) return;
    if (selectedTest.attempted) {
      toast.info("You have already submitted this test.");
      return;
    }
    if (Object.keys(answers).length === 0) {
      toast.error("Please answer at least one question.");
      return;
    }
    setSubmitting(true);
    const payload = {
      answers: Object.entries(answers).map(([questionId, selectedOption]) => ({
        questionId: Number(questionId),
        selectedOption,
      })),
    };
    API.post(`/student/tests/${selectedTest.id}/submit`, payload)
      .then((res) => {
        toast.success("Test submitted successfully!");
        setSelectedTest((prev) => ({
          ...prev,
          attempted: true,
          score: res.data?.data?.score,
          submittedAt: new Date().toISOString(),
        }));
        loadTests();
        loadResults();
      })
      .catch((err) => {
        toast.error(err.response?.data?.message || "Failed to submit test.");
      })
      .finally(() => setSubmitting(false));
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
            <div className="bg-white rounded-xl shadow-lg border border-blue-200 p-6 backdrop-blur-sm">
              <div className="mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-blue-600">Available Tests</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Attempt the tests assigned by your teachers and view your scores instantly.
                  </p>
                </div>
              </div>
              {loadingTests ? (
                <p className="text-sm text-gray-500">Loading tests...</p>
              ) : tests.length === 0 ? (
                <p className="text-sm text-gray-500">No tests available yet.</p>
              ) : (
                <div className="space-y-4">
                  {tests.map((test) => (
                    <div
                      key={test.id}
                      className="border border-blue-200 rounded-xl p-4 bg-blue-50 flex flex-col gap-2 md:flex-row md:items-center md:justify-between hover:shadow-lg hover:border-blue-300 transition-all duration-300"
                    >
                      <div>
                        <p className="text-lg font-semibold text-gray-800">{test.title}</p>
                        <p className="text-sm text-gray-600">
                          Subject: {test.subject} • {test.questionCount} questions • Max Marks:{" "}
                          {test.maxMarks}
                        </p>
                        <p className="text-xs text-gray-500">
                          Created by {test.teacherName || "Teacher"} on {formatDate(test.createdAt)}
                        </p>
                      </div>
                      <div className="flex flex-col md:items-end gap-2">
                        {test.attempted ? (
                          <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                            Attempted • Score: {test.score}/{test.maxMarks}
                          </span>
                        ) : (
                          <span className="text-sm text-amber-600 font-semibold bg-amber-50 px-3 py-1 rounded-full">
                            Not attempted
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => openTest(test.id)}
                          className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                        >
                          {test.attempted ? "View Summary" : "Start Test"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedTest && (
              <div className="bg-white rounded-xl shadow-lg border border-blue-200 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-blue-600">{selectedTest.title}</h2>
                    <p className="text-sm text-gray-600 mt-1">
                      Subject: {selectedTest.subject} • Max Marks: {selectedTest.maxMarks}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTest(null);
                      setAnswers({});
                    }}
                    className="text-sm text-red-500 font-semibold hover:text-red-700 transition-colors"
                  >
                    Close
                  </button>
                </div>

                {loadingTestDetail ? (
                  <p className="text-sm text-gray-500">Fetching test details...</p>
                ) : selectedTest.attempted ? (
                  <>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-300 rounded-xl p-6 shadow-md mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-blue-700">
                            Score: {selectedTest.score}/{selectedTest.maxMarks}
                          </p>
                          <p className="text-sm text-blue-600 mt-1">
                            Submitted on {formatDate(selectedTest.submittedAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">
                            Correct: {selectedTest.questions?.filter(q => q.isCorrect).length || 0} / {selectedTest.questions?.length || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <h3 className="text-xl font-semibold text-gray-800 mb-4">Test Summary</h3>
                      {selectedTest.questions?.map((question, idx) => {
                        const isCorrect = question.isCorrect === true;
                        const selectedOption = question.selectedOption || "";
                        const correctOption = question.correctOption || "";
                        
                        return (
                          <div
                            key={question.id}
                            className={`border-2 rounded-xl p-5 transition-all ${
                              isCorrect
                                ? "border-green-300 bg-green-50"
                                : "border-red-300 bg-red-50"
                            }`}
                          >
                            <div className="flex items-start justify-between mb-4">
                              <p className="font-semibold text-gray-800 text-lg">
                                Q{idx + 1}. {question.questionText}
                              </p>
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                  isCorrect
                                    ? "bg-green-200 text-green-800"
                                    : "bg-red-200 text-red-800"
                                }`}
                              >
                                {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {["A", "B", "C", "D"].map((optionKey) => {
                                const isSelected = selectedOption === optionKey;
                                const isCorrectAnswer = correctOption === optionKey;
                                let optionClass = "border rounded-xl px-4 py-3 transition-all";
                                
                                if (isCorrectAnswer) {
                                  optionClass += " border-green-500 bg-green-100 font-semibold";
                                } else if (isSelected && !isCorrect) {
                                  optionClass += " border-red-500 bg-red-100";
                                } else {
                                  optionClass += " border-gray-300 bg-white";
                                }
                                
                                return (
                                  <div key={optionKey} className={optionClass}>
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-gray-700">
                                        {optionKey}.
                                      </span>
                                      <span className="text-sm text-gray-700">
                                        {question.options?.[optionKey]}
                                      </span>
                                      {isCorrectAnswer && (
                                        <span className="ml-auto text-green-600 font-bold">
                                          ✓ Correct Answer
                                        </span>
                                      )}
                                      {isSelected && !isCorrectAnswer && (
                                        <span className="ml-auto text-red-600 font-semibold">
                                          Your Answer
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            {!isCorrect && selectedOption && (
                              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                  <span className="font-semibold">Your Answer:</span> {selectedOption} - {question.options?.[selectedOption]}
                                </p>
                                <p className="text-sm text-green-700 mt-1">
                                  <span className="font-semibold">Correct Answer:</span> {correctOption} - {question.options?.[correctOption]}
                                </p>
                              </div>
                            )}
                            {!isCorrect && !selectedOption && (
                              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <p className="text-sm text-yellow-800">
                                  <span className="font-semibold">You did not answer this question.</span>
                                </p>
                                <p className="text-sm text-green-700 mt-1">
                                  <span className="font-semibold">Correct Answer:</span> {correctOption} - {question.options?.[correctOption]}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-6">
                      {selectedTest.questions?.map((question, idx) => (
                        <div key={question.id} className="border border-blue-200 rounded-xl p-4 bg-blue-50 hover:shadow-md transition-all">
                          <p className="font-semibold text-gray-800 mb-3">
                            Q{idx + 1}. {question.questionText}
                          </p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {["A", "B", "C", "D"].map((optionKey) => (
                              <label
                                key={optionKey}
                                className={`flex items-center gap-2 border rounded-xl px-3 py-2 cursor-pointer transition-all duration-300 ${
                                  answers[question.id] === optionKey
                                    ? "border-blue-500 bg-blue-100 shadow-md"
                                    : "border-blue-200 hover:border-blue-400 hover:bg-blue-50"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`question-${question.id}`}
                                  value={optionKey}
                                  checked={answers[question.id] === optionKey}
                                  onChange={() => handleAnswerChange(question.id, optionKey)}
                                  className="text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">
                                  {question.options?.[optionKey]}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button
                        type="button"
                        onClick={submitTest}
                        disabled={submitting}
                        className="px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                      >
                        {submitting ? "Submitting..." : "Submit Test"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="bg-white rounded-xl shadow-lg border border-blue-200 p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-blue-600">My Test Results</h2>
                  <p className="text-sm text-gray-600 mt-1">Track your past attempts.</p>
                </div>
              </div>
              {results.length === 0 ? (
                <p className="text-sm text-gray-500">No submissions yet.</p>
              ) : (
                <div className="overflow-x-auto border border-blue-200 rounded-xl">
                  <table className="min-w-full divide-y divide-blue-100 text-sm">
                    <thead className="bg-blue-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Test</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Subject</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Score</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Correct Answers
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                          Submitted At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50 bg-white">
                      {results.map((result) => (
                        <tr key={result.testId} className="hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-3 font-semibold text-gray-800">
                            {result.testTitle}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{result.subject}</td>
                          <td className="px-4 py-3 text-gray-800 font-semibold">
                            {result.score}/{result.maxMarks}
                          </td>
                          <td className="px-4 py-3 text-gray-600">{result.totalCorrect}</td>
                          <td className="px-4 py-3 text-gray-500">
                            {formatDate(result.submittedAt)}
                          </td>
                        </tr>
                      ))}
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

export default StudentOnlineTests;

