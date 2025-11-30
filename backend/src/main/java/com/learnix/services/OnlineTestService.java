package com.learnix.services;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import com.learnix.dto.OnlineTestRequest;
import com.learnix.dto.OnlineTestSubmissionRequest;
import com.learnix.models.OnlineTest;
import com.learnix.models.OnlineTestAnswer;
import com.learnix.models.OnlineTestQuestion;
import com.learnix.models.OnlineTestSubmission;
import com.learnix.models.Student;
import com.learnix.models.Teacher;
import com.learnix.models.TeacherSubject;
import com.learnix.models.Users;
import com.learnix.repositories.OnlineTestRepository;
import com.learnix.repositories.OnlineTestSubmissionRepository;
import com.learnix.repositories.StudentRepository;
import com.learnix.repositories.TeacherRepository;
import com.learnix.repositories.TeacherSubjectRepository;
import com.learnix.repositories.UserRepository;
import com.learnix.responseWrapper.MyResponseWrapper;

@Service
public class OnlineTestService {

    @Autowired
    private OnlineTestRepository onlineTestRepository;
    @Autowired
    private OnlineTestSubmissionRepository submissionRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private TeacherRepository teacherRepository;
    @Autowired
    private TeacherSubjectRepository teacherSubjectRepository;
    @Autowired
    private StudentRepository studentRepository;
    @Autowired
    private MyResponseWrapper responseWrapper;

    private static final Set<String> VALID_OPTIONS = Set.of("A", "B", "C", "D");

    // Teacher actions
    public ResponseEntity<?> createTest(Principal principal, OnlineTestRequest request) {
        try {
            Users teacherUser = userRepository.findByEmail(principal.getName());
            if (teacherUser == null || !"TEACHER".equalsIgnoreCase(teacherUser.getRole())) {
                return universalResponse("Teacher not found", null, HttpStatus.FORBIDDEN);
            }

            Teacher teacher = teacherRepository.findByUser(teacherUser);
            if (teacher == null) {
                return universalResponse("Teacher profile missing", null, HttpStatus.BAD_REQUEST);
            }

            if (request.getSubject() == null || request.getSubject().isBlank()) {
                return universalResponse("Subject is required", null, HttpStatus.BAD_REQUEST);
            }

            List<TeacherSubject> assignedSubjects = teacherSubjectRepository.findByTeacher(teacher);
            boolean subjectAllowed = assignedSubjects.stream()
                    .map(TeacherSubject::getSubject)
                    .filter(s -> s != null)
                    .anyMatch(s -> s.equalsIgnoreCase(request.getSubject().trim()));

            if (!subjectAllowed) {
                return universalResponse("You are not assigned to the selected subject", null, HttpStatus.FORBIDDEN);
            }

            if (request.getTitle() == null || request.getTitle().isBlank()) {
                return universalResponse("Title is required", null, HttpStatus.BAD_REQUEST);
            }

            if (request.getMaxMarks() == null || request.getMaxMarks() < 30 || request.getMaxMarks() > 50) {
                return universalResponse("Max marks must be between 30 and 50", null, HttpStatus.BAD_REQUEST);
            }

            if (request.getQuestions() == null || request.getQuestions().isEmpty()) {
                return universalResponse("Please add at least one question", null, HttpStatus.BAD_REQUEST);
            }

            OnlineTest test = new OnlineTest();
            test.setTitle(request.getTitle().trim());
            test.setSubject(request.getSubject().trim());
            test.setDescription(request.getDescription());
            test.setMaxMarks(request.getMaxMarks());
            test.setTeacher(teacher);
            test.setPublished(true);

            for (OnlineTestRequest.QuestionDTO questionDTO : request.getQuestions()) {
                ResponseEntity<?> validationError = validateQuestion(questionDTO);
                if (validationError != null) {
                    return validationError;
                }

                OnlineTestQuestion question = new OnlineTestQuestion();
                question.setTest(test);
                question.setQuestionText(questionDTO.getQuestionText().trim());
                question.setOptionA(questionDTO.getOptionA().trim());
                question.setOptionB(questionDTO.getOptionB().trim());
                question.setOptionC(questionDTO.getOptionC().trim());
                question.setOptionD(questionDTO.getOptionD().trim());
                question.setCorrectOption(questionDTO.getCorrectOption().trim().toUpperCase(Locale.ENGLISH));
                test.getQuestions().add(question);
            }

            OnlineTest saved = onlineTestRepository.save(test);
            Map<String, Object> payload = new HashMap<>();
            payload.put("testId", saved.getId());
            payload.put("questions", saved.getQuestions().size());

            return universalResponse("Test created successfully", payload, HttpStatus.CREATED);
        } catch (Exception e) {
            return universalResponse("Failed to create test: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public ResponseEntity<?> listTeacherTests(Principal principal) {
        try {
            Users teacherUser = userRepository.findByEmail(principal.getName());
            if (teacherUser == null || !"TEACHER".equalsIgnoreCase(teacherUser.getRole())) {
                return universalResponse("Teacher not found", null, HttpStatus.FORBIDDEN);
            }

            List<OnlineTest> tests = onlineTestRepository.findByTeacherUserId(teacherUser.getId());
            List<Map<String, Object>> data = tests.stream().map(test -> {
                Map<String, Object> row = new HashMap<>();
                row.put("id", test.getId());
                row.put("title", test.getTitle());
                row.put("subject", test.getSubject());
                row.put("maxMarks", test.getMaxMarks());
                row.put("questionCount", test.getQuestions().size());
                row.put("createdAt", test.getCreatedAt());
                row.put("published", test.getPublished());
                row.put("submissions", submissionRepository.countByTest(test));
                return row;
            }).collect(Collectors.toList());

            return universalResponse("Tests fetched", data, HttpStatus.OK);
        } catch (Exception e) {
            return universalResponse("Failed to fetch tests: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public ResponseEntity<?> getTestSubmissions(Long testId, Principal principal) {
        try {
            Users teacherUser = userRepository.findByEmail(principal.getName());
            if (teacherUser == null || !"TEACHER".equalsIgnoreCase(teacherUser.getRole())) {
                return universalResponse("Teacher not found", null, HttpStatus.FORBIDDEN);
            }

            Optional<OnlineTest> optionalTest = onlineTestRepository.findByIdAndTeacherUserId(testId, teacherUser.getId());
            if (optionalTest.isEmpty()) {
                return universalResponse("Test not found", null, HttpStatus.NOT_FOUND);
            }

            List<Map<String, Object>> submissions = submissionRepository.findByTest(optionalTest.get()).stream()
                    .map(sub -> {
                        Map<String, Object> row = new HashMap<>();
                        row.put("submissionId", sub.getId());
                        row.put("studentName", sub.getStudent().getUser().getName());
                        row.put("studentEmail", sub.getStudent().getUser().getEmail());
                        row.put("score", sub.getScore());
                        row.put("totalCorrect", sub.getTotalCorrect());
                        row.put("submittedAt", sub.getSubmittedAt());
                        return row;
                    }).collect(Collectors.toList());

            return universalResponse("Submissions fetched", submissions, HttpStatus.OK);
        } catch (Exception e) {
            return universalResponse("Failed to fetch submissions: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Student actions
    public ResponseEntity<?> listAvailableTestsForStudent(Principal principal) {
        try {
            Users studentUser = userRepository.findByEmail(principal.getName());
            if (studentUser == null || !"STUDENT".equalsIgnoreCase(studentUser.getRole())) {
                return universalResponse("Student not found", null, HttpStatus.FORBIDDEN);
            }
            Student student = studentRepository.findByUser(studentUser);
            if (student == null) {
                return universalResponse("Student profile missing", null, HttpStatus.BAD_REQUEST);
            }

            List<OnlineTest> tests = onlineTestRepository.findByPublishedTrueOrderByCreatedAtDesc();
            List<Map<String, Object>> payload = tests.stream().map(test -> {
                Map<String, Object> row = new HashMap<>();
                row.put("id", test.getId());
                row.put("title", test.getTitle());
                row.put("subject", test.getSubject());
                row.put("description", test.getDescription());
                row.put("maxMarks", test.getMaxMarks());
                row.put("questionCount", test.getQuestions().size());
                row.put("teacherName", test.getTeacher() != null && test.getTeacher().getUser() != null
                        ? test.getTeacher().getUser().getName()
                        : null);
                row.put("createdAt", test.getCreatedAt());

                submissionRepository.findByTestAndStudent(test, student).ifPresentOrElse(sub -> {
                    row.put("attempted", true);
                    row.put("score", sub.getScore());
                    row.put("submittedAt", sub.getSubmittedAt());
                }, () -> {
                    row.put("attempted", false);
                });
                return row;
            }).collect(Collectors.toList());

            return universalResponse("Tests fetched", payload, HttpStatus.OK);
        } catch (Exception e) {
            return universalResponse("Failed to fetch tests: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public ResponseEntity<?> getTestForStudent(Long testId, Principal principal) {
        try {
            Users studentUser = userRepository.findByEmail(principal.getName());
            if (studentUser == null || !"STUDENT".equalsIgnoreCase(studentUser.getRole())) {
                return universalResponse("Student not found", null, HttpStatus.FORBIDDEN);
            }
            Student student = studentRepository.findByUser(studentUser);
            if (student == null) {
                return universalResponse("Student profile missing", null, HttpStatus.BAD_REQUEST);
            }

            Optional<OnlineTest> optionalTest = onlineTestRepository.findById(testId);
            if (optionalTest.isEmpty() || !optionalTest.get().getPublished()) {
                return universalResponse("Test not found", null, HttpStatus.NOT_FOUND);
            }

            OnlineTest test = optionalTest.get();
            Map<String, Object> payload = new HashMap<>();
            payload.put("id", test.getId());
            payload.put("title", test.getTitle());
            payload.put("subject", test.getSubject());
            payload.put("description", test.getDescription());
            payload.put("maxMarks", test.getMaxMarks());
            payload.put("questionCount", test.getQuestions().size());

            Optional<OnlineTestSubmission> submissionOpt = submissionRepository.findByTestAndStudent(test, student);
            
            // Create a map of questionId -> answer details if submission exists
            Map<Long, OnlineTestAnswer> answerMap = new HashMap<>();
            if (submissionOpt.isPresent()) {
                OnlineTestSubmission submission = submissionOpt.get();
                answerMap = submission.getAnswers().stream()
                        .collect(Collectors.toMap(
                                ans -> ans.getQuestion().getId(),
                                ans -> ans));
            }

            final Map<Long, OnlineTestAnswer> finalAnswerMap = answerMap;
            List<Map<String, Object>> questions = test.getQuestions().stream().map(q -> {
                Map<String, Object> question = new HashMap<>();
                question.put("id", q.getId());
                question.put("questionText", q.getQuestionText());
                question.put("options", Map.of(
                        "A", q.getOptionA(),
                        "B", q.getOptionB(),
                        "C", q.getOptionC(),
                        "D", q.getOptionD()));
                
                // If test has been attempted, include answer details
                if (submissionOpt.isPresent()) {
                    OnlineTestAnswer answer = finalAnswerMap.get(q.getId());
                    if (answer != null) {
                        question.put("selectedOption", answer.getSelectedOption() != null ? answer.getSelectedOption() : "");
                        question.put("correctOption", q.getCorrectOption());
                        question.put("isCorrect", answer.getCorrect() != null ? answer.getCorrect() : false);
                    } else {
                        question.put("selectedOption", "");
                        question.put("correctOption", q.getCorrectOption());
                        question.put("isCorrect", false);
                    }
                }
                
                return question;
            }).collect(Collectors.toList());
            payload.put("questions", questions);

            submissionOpt.ifPresent(sub -> {
                payload.put("attempted", true);
                payload.put("score", sub.getScore());
                payload.put("submittedAt", sub.getSubmittedAt());
            });

            return universalResponse("Test fetched", payload, HttpStatus.OK);
        } catch (Exception e) {
            return universalResponse("Failed to fetch test: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public ResponseEntity<?> submitTest(Long testId, Principal principal, OnlineTestSubmissionRequest request) {
        try {
            Users studentUser = userRepository.findByEmail(principal.getName());
            if (studentUser == null || !"STUDENT".equalsIgnoreCase(studentUser.getRole())) {
                return universalResponse("Student not found", null, HttpStatus.FORBIDDEN);
            }
            Student student = studentRepository.findByUser(studentUser);
            if (student == null) {
                return universalResponse("Student profile missing", null, HttpStatus.BAD_REQUEST);
            }

            Optional<OnlineTest> optionalTest = onlineTestRepository.findById(testId);
            if (optionalTest.isEmpty() || !optionalTest.get().getPublished()) {
                return universalResponse("Test not found", null, HttpStatus.NOT_FOUND);
            }
            OnlineTest test = optionalTest.get();

            if (submissionRepository.findByTestAndStudent(test, student).isPresent()) {
                return universalResponse("You have already attempted this test", null, HttpStatus.BAD_REQUEST);
            }

            if (request.getAnswers() == null || request.getAnswers().isEmpty()) {
                return universalResponse("Please answer at least one question", null, HttpStatus.BAD_REQUEST);
            }

            Map<Long, OnlineTestQuestion> questionsMap = test.getQuestions().stream()
                    .collect(Collectors.toMap(OnlineTestQuestion::getId, q -> q));

            int totalQuestions = questionsMap.size();
            if (totalQuestions == 0) {
                return universalResponse("Test has no questions", null, HttpStatus.BAD_REQUEST);
            }

            Map<Long, String> answersMap = request.getAnswers().stream()
                    .filter(ans -> ans.getQuestionId() != null && ans.getSelectedOption() != null)
                    .collect(Collectors.toMap(
                            OnlineTestSubmissionRequest.AnswerDTO::getQuestionId,
                            ans -> ans.getSelectedOption().trim().toUpperCase(Locale.ENGLISH),
                            (a, b) -> b));

            int correctCount = 0;
            OnlineTestSubmission submission = new OnlineTestSubmission();
            submission.setStudent(student);
            submission.setTest(test);

            for (OnlineTestQuestion question : questionsMap.values()) {
                OnlineTestAnswer answer = new OnlineTestAnswer();
                answer.setQuestion(question);
                String selected = answersMap.getOrDefault(question.getId(), "");
                if (!VALID_OPTIONS.contains(selected)) {
                    selected = "";
                }
                answer.setSelectedOption(selected);
                boolean isCorrect = question.getCorrectOption().equalsIgnoreCase(selected);
                answer.setCorrect(isCorrect);
                if (isCorrect) {
                    correctCount++;
                }
                answer.setSubmission(submission);
                submission.getAnswers().add(answer);
            }

            submission.setTotalCorrect(correctCount);
            int score = calculateScore(correctCount, totalQuestions, test.getMaxMarks());
            submission.setScore(score);
            submission.setSubmittedAt(LocalDateTime.now());

            OnlineTestSubmission saved = submissionRepository.save(submission);

            Map<String, Object> payload = new HashMap<>();
            payload.put("submissionId", saved.getId());
            payload.put("score", saved.getScore());
            payload.put("totalCorrect", saved.getTotalCorrect());
            payload.put("maxMarks", test.getMaxMarks());

            return universalResponse("Test submitted successfully", payload, HttpStatus.OK);
        } catch (Exception e) {
            return universalResponse("Failed to submit test: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    public ResponseEntity<?> getStudentResults(Principal principal) {
        try {
            Users studentUser = userRepository.findByEmail(principal.getName());
            if (studentUser == null || !"STUDENT".equalsIgnoreCase(studentUser.getRole())) {
                return universalResponse("Student not found", null, HttpStatus.FORBIDDEN);
            }
            Student student = studentRepository.findByUser(studentUser);
            if (student == null) {
                return universalResponse("Student profile missing", null, HttpStatus.BAD_REQUEST);
            }

            List<Map<String, Object>> payload = submissionRepository.findByStudent(student).stream()
                    .map(sub -> {
                        Map<String, Object> row = new HashMap<>();
                        row.put("testId", sub.getTest().getId());
                        row.put("testTitle", sub.getTest().getTitle());
                        row.put("subject", sub.getTest().getSubject());
                        row.put("score", sub.getScore());
                        row.put("maxMarks", sub.getTest().getMaxMarks());
                        row.put("totalCorrect", sub.getTotalCorrect());
                        row.put("submittedAt", sub.getSubmittedAt());
                        return row;
                    }).collect(Collectors.toList());

            return universalResponse("Results fetched", payload, HttpStatus.OK);
        } catch (Exception e) {
            return universalResponse("Failed to fetch results: " + e.getMessage(), null, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    // Helpers
    private ResponseEntity<?> validateQuestion(OnlineTestRequest.QuestionDTO questionDTO) {
        if (questionDTO == null) {
            return universalResponse("Invalid question payload", null, HttpStatus.BAD_REQUEST);
        }
        if (questionDTO.getQuestionText() == null || questionDTO.getQuestionText().isBlank()) {
            return universalResponse("Question text is required", null, HttpStatus.BAD_REQUEST);
        }
        if (questionDTO.getOptionA() == null || questionDTO.getOptionB() == null
                || questionDTO.getOptionC() == null || questionDTO.getOptionD() == null) {
            return universalResponse("All four options are required", null, HttpStatus.BAD_REQUEST);
        }
        if (questionDTO.getCorrectOption() == null || !VALID_OPTIONS
                .contains(questionDTO.getCorrectOption().trim().toUpperCase(Locale.ENGLISH))) {
            return universalResponse("Correct option must be one of A, B, C or D", null, HttpStatus.BAD_REQUEST);
        }
        return null;
    }

    private int calculateScore(int correctCount, int totalQuestions, int maxMarks) {
        if (totalQuestions == 0) {
            return 0;
        }
        double marksPerQuestion = (double) maxMarks / totalQuestions;
        int score = (int) Math.round(correctCount * marksPerQuestion);
        return Math.min(score, maxMarks);
    }

    private ResponseEntity<?> universalResponse(String message, Object data, HttpStatus httpStatus) {
        responseWrapper.setMessage(message);
        responseWrapper.setData(data);
        return new ResponseEntity<>(responseWrapper, httpStatus);
    }
}

