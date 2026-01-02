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
    this.prefetchedQuestion = null;
    this.timerInterval = null;
    this.isGameActive = false;
  }

  startGame(mode, config) {
    this.mode = mode;
    this.config = config;
    this.score = 0;
    this.questionCount = 0;
    this.isGameActive = true;
    this.prefetchedQuestion = null; // Clear old buffer

    // Update UI for Game Start
    document.getElementById("live-score").style.display = "flex";
    this.updateHeader();

    // Clear Chat
    this.chatArea.innerHTML = "";

    if (mode === "exam") {
      document.getElementById("game-timer").style.display = "flex";
      this.startTimer(config.duration_minutes * 60);
      this.totalQuestions = config.count;
    } else {
      document.getElementById("game-timer").style.display = "none";
      this.totalQuestions = Infinity; // Unlimited for practice
    }

    this.fetchQuestion(config.subject);
  }

  startTimer(durationSeconds) {
    let timeLeft = durationSeconds;
    const timerEl = document.getElementById("game-timer");

    this.timerInterval = setInterval(() => {
      if (!this.isGameActive) {
        clearInterval(this.timerInterval);
        return;
      }

      const m = Math.floor(timeLeft / 60)
        .toString()
        .padStart(2, "0");
      const s = (timeLeft % 60).toString().padStart(2, "0");
      timerEl.innerText = `${m}:${s}`;

      if (timeLeft <= 0) {
        clearInterval(this.timerInterval);
        this.endGame(true, "Time's Up!");
      }
      timeLeft--;
    }, 1000);
  }

  updateHeader() {
    const scoreEl = document.getElementById("live-score");
    if (this.mode === "exam") {
      scoreEl.innerText = `Score: ${this.score}/${this.questionCount}`;
    } else {
      scoreEl.innerText = `Score: ${this.score}`;
    }
  }

  async fetchQuestion(subject) {
    // 1. Use Prefetched Question if available
    if (this.prefetchedQuestion) {
      const data = this.prefetchedQuestion;
      this.prefetchedQuestion = null; // Consume it
      this.displayQuestion(data);

      // Background fetch next one
      this.prefetchNext(subject);
      return;
    }

    // 2. Normal Fetch (First load or cache miss)
    try {
      this.showLoading();
      const data = await this._fetchFromApi(subject);
      this.hideLoading();

      if (data) {
        this.displayQuestion(data);
        // Background fetch next one
        this.prefetchNext(subject);
      } else {
        this.showError("Couldn't fetch a question. Please try again.");
      }
    } catch (error) {
      this.hideLoading();
      console.error("Error fetching question:", error);
      this.showError("Network error. Please check your connection.");
    }
  }

  async prefetchNext(subject) {
    try {
      const data = await this._fetchFromApi(subject);
      if (data) this.prefetchedQuestion = data;
    } catch (e) {
      console.warn("Prefetch failed:", e);
    }
  }

  async _fetchFromApi(subject) {
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

    const response = await fetch(`${ALOC_BASE_URL}?subject=${apiSubject}`, {
      headers: { AccessToken: ALOC_ACCESS_TOKEN },
    });
    const result = await response.json();
    return result.status === 200 ? result.data : null;
  }

  showLoading() {
    const loadingId = "loading-" + Date.now();
    this.chatArea.innerHTML += `
      <div id="${loadingId}" class="ai-message loading-message">
        <i class="fas fa-spinner fa-spin"></i> Loading...
      </div>
    `;
    this.chatArea.scrollTop = this.chatArea.scrollHeight;
    this.currentLoadingId = loadingId;
  }

  hideLoading() {
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

  displayQuestion(data) {
    this.currentQuestion = data;
    this.questionCount++;

    // Check Exam Limit
    if (this.mode === "exam" && this.questionCount > this.config.count) {
      this.endGame(true, "Exam Completed!");
      return;
    }

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

    // Create unique ID for this question block to handle events
    const questionId = "q-" + Date.now();

    let optionsHtml = "";
    const options = data.option;

    // Normalize options keys (a,b,c,d / A,B,C,D)
    for (const [key, value] of Object.entries(options)) {
      if (value) {
        // Only show non-null options
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
          <span class="badge type">${data.examtype.toUpperCase()}</span>
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

  checkAnswer(selectedKey, correctKey, questionContainerId) {
    const container = document.getElementById(questionContainerId);
    if (!container || container.classList.contains("answered")) return; // Prevent multiple answers

    container.classList.add("answered");
    const buttons = container.querySelectorAll(".option-btn");
    const solutionBox = container.querySelector(".solution-box");
    const nextBtn = container.querySelector(".next-btn");

    // Normalize keys for comparison
    const isCorrect = selectedKey.toLowerCase() === correctKey.toLowerCase();

    // Update Score
    if (isCorrect) this.score++;
    this.updateHeader();

    buttons.forEach((btn) => {
      const btnKey = btn.getAttribute("data-option").toLowerCase();
      // Disable all buttons
      btn.disabled = true;

      if (btnKey === correctKey.toLowerCase()) {
        btn.classList.add("correct"); // Always highlight correct answer
      }

      if (btnKey === selectedKey.toLowerCase() && !isCorrect) {
        btn.classList.add("wrong"); // Highlight wrong selection
      }
    });

    // Show solution
    if (solutionBox) {
      solutionBox.style.display = "block";
    }

    // Show next button
    if (nextBtn) nextBtn.style.display = "inline-block";

    // Scroll to bottom to show feedback
    this.chatArea.scrollTop = this.chatArea.scrollHeight;
  }

  endGame(finished = true, message = "Session Ended") {
    this.isGameActive = false;
    if (this.timerInterval) clearInterval(this.timerInterval);

    if (!finished) {
      // Silent exit (user clicked back)
      return;
    }

    const percentage =
      this.questionCount > 0
        ? Math.round((this.score / this.questionCount) * 100)
        : 0;

    const summaryHtml = `
        <div class="ai-message" style="text-align: center; padding: 30px;">
            <h2>${message}</h2>
            <div style="font-size: 3rem; font-weight: 800; color: dodgerblue; margin: 20px 0;">
                ${this.score} / ${
      this.questionCount <= this.config.count
        ? this.questionCount - 1
        : this.config.count
    }
            </div>
            <p>Accuracy: <strong>${percentage}%</strong></p>
            <button class="start-game-btn" onclick="document.getElementById('back-to-menu-btn').click()">
                Back to Menu
            </button>
        </div>
      `;

    this.chatArea.innerHTML = summaryHtml;
    document.getElementById("mode-header").style.display = "none";
  }
}

// Initialize global instance
const questionManager = new QuestionManager();
