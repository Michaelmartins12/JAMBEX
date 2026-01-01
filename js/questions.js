const ALOC_ACCESS_TOKEN = "QB-37cbfd6bf4ce928bde66";
const ALOC_BASE_URL = "https://questions.aloc.com.ng/api/v2/q";

class QuestionManager {
  constructor() {
    this.currentQuestion = null;
    this.chatArea = document.getElementById("chat-area");
  }

  async fetchQuestion(subject) {
    // Map UI subject names to API expected values
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
      this.showLoading();
      const response = await fetch(`${ALOC_BASE_URL}?subject=${apiSubject}`, {
        headers: {
          AccessToken: ALOC_ACCESS_TOKEN,
        },
      });

      const result = await response.json();

      this.hideLoading();

      if (result.status === 200) {
        this.currentQuestion = result.data;
        this.displayQuestion(result.data);
      } else {
        this.showError("Couldn't fetch a question. Please try again.");
      }
    } catch (error) {
      this.hideLoading();
      console.error("Error fetching question:", error);
      this.showError("Network error. Please check your connection.");
    }
  }

  showLoading() {
    const loadingId = "loading-" + Date.now();
    this.chatArea.innerHTML += `
      <div id="${loadingId}" class="ai-message loading-message">
        <i class="fas fa-spinner fa-spin"></i> Fetching a question for you...
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
          document.getElementById("subjects").value
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
}

// Initialize global instance
const questionManager = new QuestionManager();
