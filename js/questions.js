const ALOC_ACCESS_TOKEN = "QB-37cbfd6bf4ce928bde66";
const ALOC_BASE_URL = "https://questions.aloc.com.ng/api/v2/q";

class QuestionManager {
  constructor() {
    this.currentQuestion = null;
    this.chatArea = document.getElementById("chat-area");

    // Game State
    this.mode = "practice"; // 'practice' or 'exam'
    this.config = {};
    this.score = 0;
    this.totalQuestions = 0;
    this.questionCount = 0; // Questions answered/seen
    this.timerInterval = null;
    this.isGameActive = false;
    this.currentLoadingId = null;

    // Track seen questions to prevent repeats
    try {
      this.seenIds = new Set(
        JSON.parse(localStorage.getItem("jambex_seen_ids")) || []
      );
    } catch (e) {
      this.seenIds = new Set();
    }
  }

  // Optimized Data Strategy: Local -> Firestore -> API
  async getQuestions(subject) {
    console.log(`[Cache] Getting questions for: ${subject}`);
    const LOCAL_KEY = `jambex_questions_${subject}`;

    // 1. Check LocalStorage
    let localData = [];
    try {
      localData = JSON.parse(localStorage.getItem(LOCAL_KEY)) || [];
    } catch (e) {
      console.warn("Local storage parse error", e);
    }

    // If we have a healthy buffer, use it
    if (localData.length >= 2) {
      console.log(`[Cache] Found ${localData.length} in LocalStorage.`);
      return localData;
    }

    // 2. Check Firestore (Global Cache)
    let firestoreActive = false;
    let candidates = [];

    try {
      if (!window.fs || !window.db) {
        console.warn("[Cache] Firestore not initialized yet. Skipping to API.");
      } else {
        console.log("[Cache] Checking Firestore...");
        const qRef = window.fs.collection(window.db, "questions");
        const q = window.fs.query(
          qRef,
          window.fs.where("subject", "==", subject),
          window.fs.limit(50)
        );
        const querySnapshot = await window.fs.getDocs(q);
        firestoreActive = true;

        if (!querySnapshot.empty) {
          console.log(`[Cache] Found ${querySnapshot.size} docs in Firestore.`);
          querySnapshot.forEach((doc) => candidates.push(doc.data()));

          // Filter out SEEN questions
          const originalSize = candidates.length;
          candidates = candidates.filter((q) => !this.seenIds.has(q.id));
          console.log(
            `[Cache] Firestore: ${originalSize} raw -> ${candidates.length} fresh.`
          );

          if (candidates.length > 0) {
            // We found fresh questions in Firestore!
            const shuffle = (array) => array.sort(() => Math.random() - 0.5);
            candidates = shuffle(candidates);
            const combined = [...localData, ...candidates];
            localStorage.setItem(LOCAL_KEY, JSON.stringify(combined));
            return combined;
          }
          console.log(
            "[Cache] Firestore only had stale questions. Forcing API for fresh ones."
          );
        } else {
          console.log("[Cache] Firestore returned empty.");
        }
      }
    } catch (e) {
      console.warn("[Cache] Firestore check failed (Rules/Network):", e);
      firestoreActive = false;
    }

    console.log("[Cache] Fetching from ALOC API...");
    // 3. API (Fallback)
    // Fetch 40 questions (ALOC Limit)
    // Map subjects to API expected format
    const subjectMap = {
      Mathematics: "mathematics",
      "English Language": "english",
      Physics: "physics",
      Chemistry: "chemistry",
      Biology: "biology",
      Commerce: "commerce",
      Accounting: "accounting",
      Economics: "economics",
      Government: "government",
      Geography: "geography",
      "Christian Religious Knowledge": "crk",
    };
    const apiSubject = subjectMap[subject] || subject.toLowerCase();

    try {
      // Use 'm' endpoint for bulk fetch (returns 40 questions)
      // Hardcoding base to avoid replace() issues corrupting domain
      const url = `https://questions.aloc.com.ng/api/v2/m?subject=${apiSubject}`;
      console.log(`[Cache] Fetching bulk from URL: ${url}`);

      const response = await fetch(url, {
        headers: { AccessToken: ALOC_ACCESS_TOKEN },
      });

      console.log(`[Cache] API Status: ${response.status}`);

      if (!response.ok) throw new Error(`API Error: ${response.status}`);

      const resJson = await response.json();

      // Normalize: API might return object (1 question) or array (n questions)
      let questions = Array.isArray(resJson.data)
        ? resJson.data
        : [resJson.data];

      if (questions && questions.length > 0 && questions[0]) {
        console.log(`[Cache] Fetched ${questions.length} from API.`);

        // Deduplicate against local buffer AND seen history
        const bufferIds = new Set(localData.map((q) => q.id));
        questions = questions.filter(
          (q) => !bufferIds.has(q.id) && !this.seenIds.has(q.id)
        );

        if (questions.length === 0) {
          console.log(
            "[Cache] All fetched questions are either buffered or already seen."
          );
          // Edge case: if we keep getting old stuff, we might want to return localData anyway
          return localData;
        }

        // Seed Firestore asynchronously ONLY if active
        if (firestoreActive && window.fs && window.db) {
          console.log("Seeding Firestore...");
          const qRef = window.fs.collection(window.db, "questions");
          for (const q of questions) {
            try {
              const docData = {
                subject: subject,
                question: q.question,
                id: q.id, // Important for indexing
                option: q.option,
                answer: q.answer,
                image: q.image || "",
                examyear: q.examyear,
                examtype: q.examtype,
                solution: q.solution || "",
              };
              // Fire and forget, don't await to avoid UI blocking
              window.fs
                .addDoc(qRef, docData)
                .catch((e) => console.warn("Seed fail", e));
            } catch (e) {
              console.error("Error prep doc", e);
            }
          }
        } else {
          console.warn(
            "[Cache] Skipping Firestore seeding (Permissions/Disabled)."
          );
        }

        // Save to Local
        const shuffle = (array) => array.sort(() => Math.random() - 0.5);
        questions = shuffle(questions);
        // Combine with whatever little we had locally
        const combined = [...localData, ...questions];
        localStorage.setItem(LOCAL_KEY, JSON.stringify(combined));
        return combined;
      }
    } catch (error) {
      console.error("[Cache] Critical Error in getQuestions:", error);
      this.showError("Failed to load questions. Please check network.");
    }
    return localData; // Return whatever we have as fallback
  }

  async fetchQuestion(subject) {
    if (this.currentLoadingId) return; // Prevent double load
    this.showLoading();

    try {
      const questions = await this.getQuestions(subject);

      if (questions && questions.length > 0) {
        // Pop one question
        const question = questions.pop();

        // Update LocalStorage with the remaining set
        localStorage.setItem(
          `jambex_questions_${subject}`,
          JSON.stringify(questions)
        );

        this.hideLoading();
        this.displayQuestion(question);
      } else {
        this.hideLoading();
        this.showError("No questions available. Try reloading.");
      }
    } catch (error) {
      this.hideLoading();
      this.showError("Something went wrong.");
      console.error(error);
    }
  }

  startGame(mode, config) {
    this.mode = mode;
    this.config = config;
    this.score = 0;
    this.questionCount = 0;
    this.isGameActive = true;

    // Clear old single-prefetch buffer if it exists
    this.prefetchedQuestion = null;

    // Update UI for Game Start
    document.getElementById("live-score").style.display = "flex";
    this.updateHeader();

    // Clear Chat
    this.chatArea.innerHTML = "";

    if (mode === "exam") {
      document.getElementById("game-timer").style.display = "flex";

      // Calculate or Restore Target Time
      if (!this.config.targetTime) {
        // New Exam: Set target to Now + Duration
        this.config.targetTime =
          Date.now() + config.duration_minutes * 60 * 1000;

        // Update persisted state with targetTime
        const savedState = JSON.parse(
          localStorage.getItem("jambex_game_state") || "{}"
        );
        savedState.config = this.config;
        localStorage.setItem("jambex_game_state", JSON.stringify(savedState));
      }

      this.startTimer();
      const finishBtn = document.getElementById("finish-game-btn");
      finishBtn.style.display = "flex";
      finishBtn.innerHTML = `<i class="fas fa-check-circle"></i> Submit`; // Change text for exam
    } else {
      document.getElementById("game-timer").style.display = "none";
      const finishBtn = document.getElementById("finish-game-btn");
      finishBtn.style.display = "flex";
      finishBtn.innerHTML = `<i class="fas fa-flag-checkered"></i> Finish`;
    }

    this.fetchQuestion(config.subject);
  }

  checkAnswer(selectedKey, correctKey, questionContainerId) {
    if (!this.isGameActive) return;

    const container = document.getElementById(questionContainerId);
    if (!container) return; // Already handled

    const btns = container.querySelectorAll(".option-btn");
    const nextBtn = container.querySelector(".next-btn");
    const solutionBox = container.querySelector(".solution-box");

    let isCorrect = selectedKey.toLowerCase() === correctKey.toLowerCase();

    // Highlight Answers
    btns.forEach((btn) => {
      btn.disabled = true; // Disable all
      const optKey = btn.getAttribute("data-option");

      if (optKey.toLowerCase() === correctKey.toLowerCase()) {
        btn.classList.add("correct");
        btn.innerHTML += ` <i class="fas fa-check-circle"></i>`;
      } else if (
        optKey.toLowerCase() === selectedKey.toLowerCase() &&
        !isCorrect
      ) {
        btn.classList.add("wrong");
        btn.innerHTML += ` <i class="fas fa-times-circle"></i>`;
      }
    });

    if (isCorrect) {
      this.score++;
      // Celebrate?
    }

    this.updateHeader();

    // Show Solution & Next Button
    solutionBox.style.display = "block";
    nextBtn.style.display = "inline-block";

    // Auto-scroll to solution
    solutionBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  updateHeader() {
    const scoreEl = document.getElementById("live-score");
    if (this.mode === "exam") {
      scoreEl.innerText = `Score: ${this.score}/${this.questionCount}`;
    } else {
      scoreEl.innerText = `Score: ${this.score}`;
    }
  }

  startTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval); // Safety clear

    const targetTimestamp = this.config.targetTime;
    const timerEl = document.getElementById("game-timer");

    // Immediate update
    const update = () => {
      const now = Date.now();
      const timeLeft = Math.round((targetTimestamp - now) / 1000);

      if (!this.isGameActive) {
        if (this.timerInterval) clearInterval(this.timerInterval);
        return;
      }

      if (timeLeft <= 0) {
        timerEl.innerText = "00:00";
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.endGame(true, "Time's Up!");
        return;
      }

      const m = Math.floor(timeLeft / 60)
        .toString()
        .padStart(2, "0");
      const s = (timeLeft % 60).toString().padStart(2, "0");
      timerEl.innerText = `${m}:${s}`;

      // Warning color
      if (timeLeft < 60) {
        timerEl.style.backgroundColor = "#fee2e2";
        timerEl.style.color = "#dc2626";
      } else {
        // Reset if added time (optional feature) or reload
        timerEl.style.backgroundColor = "";
        timerEl.style.color = "";
      }
    };

    update(); // Run once immediately
    this.timerInterval = setInterval(update, 1000);
  }

  endGame(finished = true, message = "Session Ended") {
    this.isGameActive = false;
    if (this.timerInterval) clearInterval(this.timerInterval);

    // Clear persisted game state
    localStorage.removeItem("jambex_game_state");

    // Calculate accuracy if questions were answered
    const percentage =
      this.questionCount > 0
        ? Math.round((this.score / this.questionCount) * 100)
        : 0;

    // For Exam, show total questions. For practice, show answered.
    const totalDivisor =
      this.mode === "exam" ? this.config.count : this.questionCount;

    const summaryHtml = `
        <div class="ai-message" style="text-align: center; padding: 30px;">
            <h2>${message}</h2>
            <div style="font-size: 3rem; font-weight: 800; color: dodgerblue; margin: 20px 0;">
                ${this.score} / ${totalDivisor}
            </div>
            <p>Accuracy: <strong>${percentage}%</strong></p>
            <button class="start-game-btn" onclick="document.getElementById('back-to-menu-btn').click()">
                Back to Menu
            </button>
        </div>
      `;

    this.chatArea.innerHTML = summaryHtml;
    document.getElementById("mode-header").style.display = "none";
    document.getElementById("finish-game-btn").style.display = "none";
  }

  displayQuestion(data) {
    // Increment seen count only when displaying
    this.questionCount++;
    this.currentQuestion = data;

    // Mark as SEEN
    if (data.id) {
      this.seenIds.add(data.id);
      localStorage.setItem(
        "jambex_seen_ids",
        JSON.stringify([...this.seenIds])
      );
    }

    // Check Exam Limit (before displaying? No, usually after answer, but here we enforce count)
    // Actually, exam limit is handled by timer or when answers reach count.
    // Let's just track index.

    this.updateHeader();

    // Hide the subject selection box when questions start
    const subjectBox = document.getElementById("subject-box");
    if (subjectBox) {
      subjectBox.style.display = "none";
    }

    // Hide previous questions
    const prevQuestions = this.chatArea.querySelectorAll(".question-container");
    prevQuestions.forEach((q) => {
      q.classList.add("history-hidden");
    });

    // Create unique ID for this question block
    const questionId = "q-" + Date.now();

    let optionsHtml = "";
    const options = data.option;

    for (const [key, value] of Object.entries(options)) {
      if (value) {
        optionsHtml += `
          <button class="option-btn" onclick="questionManager.checkAnswer('${key}', '${
          data.answer
        }', '${questionId}')" data-option="${key}">
            <span class="opt-label">${key.toUpperCase()}.</span> ${value}
          </button>
        `;
      }
    }

    let imageHtml = "";
    if (data.image) {
      imageHtml = `<div class="question-image"><img src="${data.image}" alt="Question Image"></div>`;
    }

    const html = `
      <div class="ai-message question-container" id="${questionId}">
        <div class="question-meta">
          <span class="badge year">${data.examyear}</span>
          <span class="badge type">${
            data.examtype ? data.examtype.toUpperCase() : "JAMB"
          }</span>
        </div>
        <div class="question-text">
          ${data.question}
        </div>
        ${imageHtml}
        <div class="options-grid">
          ${optionsHtml}
        </div>
        <div class="solution-box" style="display:none;">
          <h4 class="solution-title"><i class="fas fa-lightbulb"></i> Solution</h4>
          <p class="solution-text">${
            data.solution || "No detailed solution provided."
          }</p>
        </div>
        <button class="next-btn" style="display:none;" onclick="questionManager.fetchQuestion('${
          this.config.subject
        }')">
          Next Question <i class="fas fa-arrow-right"></i>
        </button>
      </div>
    `;

    this.chatArea.innerHTML += html;
    this.chatArea.scrollTop = this.chatArea.scrollHeight;
  }

  showLoading() {
    if (this.mode === "exam" && this.timerInterval) {
      clearInterval(this.timerInterval); // Visual Pause during load
    }

    this.loadingStartTime = Date.now(); // Track when loading started
    const loadingId = "loading-" + Date.now();
    this.chatArea.innerHTML += `
      <div class="ai-message loading-message" id="${loadingId}">
        <i class="fas fa-spinner fa-spin"></i> Loading...
      </div>
    `;
    this.chatArea.scrollTop = this.chatArea.scrollHeight;
    this.currentLoadingId = loadingId;
  }

  hideLoading() {
    // 1. Refund Time
    if (
      this.loadingStartTime &&
      this.mode === "exam" &&
      this.config.targetTime
    ) {
      const elapsed = Date.now() - this.loadingStartTime;
      // Add elapsed loading time to the target deadline
      this.config.targetTime += elapsed;

      // Persist the new adjusted time
      const savedState = JSON.parse(
        localStorage.getItem("jambex_game_state") || "{}"
      );
      if (savedState.config) {
        savedState.config.targetTime = this.config.targetTime;
        localStorage.setItem("jambex_game_state", JSON.stringify(savedState));
      }

      console.log(
        `[Timer] Refunded ${Math.round(elapsed / 1000)}s for loading.`
      );
      this.loadingStartTime = null;

      // Resume Timer visually
      this.startTimer();
    }

    if (this.currentLoadingId) {
      const el = document.getElementById(this.currentLoadingId);
      if (el) el.remove();
      this.currentLoadingId = null;
    }
  }

  showError(msg) {
    this.chatArea.innerHTML += `
      <div class="ai-message error-message">
        <i class="fas fa-exclamation-triangle"></i> ${msg}
      </div>
    `;
    this.chatArea.scrollTop = this.chatArea.scrollHeight;
  }
}

// Initialize global instance
const questionManager = new QuestionManager();
window.questionManager = questionManager; // Ensure global access
