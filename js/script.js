const chatArea = document.getElementById("chat-area");
chatArea.innerHTML = `
  <div class="ai-message">
    <p><strong>Welcome to JambeX 👋</strong></p>
    <p>Your AI powered jamb learning assistant.</p>
    <p>What would you like to do?</p>
  </div>
`;

let selectedAction = null;

function handleAction(action) {
  selectedAction = action;

  // Persist the action so we can restore it on refresh
  if (action && action !== "notes" && action !== "ask") {
    localStorage.setItem("jambex_current_action", action);
  }

  if (action === "notes" || action === "ask") {
    window.showToast?.(
      "Coming Soon! This feature is under development.",
      "info"
    );
    return;
  }

  if (action === "questions") {
    chatArea.innerHTML = "";

    const modeHeader = document.getElementById("mode-header");
    const modeTitle = document.getElementById("mode-title");
    modeHeader.style.display = "flex";
    modeTitle.innerText = "Past Questions";

    document.getElementById("subject-box").style.display = "flex";
    document.getElementById("welcome-actions").style.display = "none";

    // Reset Game UI
    document.getElementById("game-options").style.display = "none";
    document.getElementById("game-timer").style.display = "none";
    document.getElementById("live-score").style.display = "none";
    document.getElementById("finish-game-btn").style.display = "none";
  }
}
window.handleAction = handleAction;

document.getElementById("back-to-menu-btn").addEventListener("click", () => {
  document.getElementById("mode-header").style.display = "none";
  document.getElementById("subject-box").style.display = "none";
  document.getElementById("game-options").style.display = "none";
  document.getElementById("welcome-actions").style.display = "flex";

  // Stop any running game
  if (window.questionManager && window.questionManager.endGame) {
    window.questionManager.endGame(false);
  }

  chatArea.innerHTML = `
      <div class="ai-message">
        <p><strong>Welcome to JambeX 👋</strong></p>
        <p>Your AI powered jamb learning assistant.</p>
        <p>What would you like to do?</p>
      </div>
    `;

  selectedAction = null;
  document.getElementById("subjects").value = "";

  // Hide topics for cleaner UI
  document.getElementById("topic").style.display = "none";
  document.getElementById("subtopic").style.display = "none";

  // Clear persisted state
  localStorage.removeItem("jambex_current_action");
  localStorage.removeItem("jambex_selected_subject");
  localStorage.removeItem("jambex_game_state");
});

// Restore state on load
window.addEventListener("DOMContentLoaded", () => {
  const savedGameState = localStorage.getItem("jambex_game_state");
  const savedSubject = localStorage.getItem("jambex_selected_subject");
  const savedAction = localStorage.getItem("jambex_current_action");

  if (savedGameState) {
    // Priority 1: Restore Active Game
    try {
      const gameState = JSON.parse(savedGameState);
      handleAction("questions");

      // Wait a tick for UI to ready, then start
      setTimeout(() => {
        // Pre-fill subject dropdown for visual consistency
        const subDrop = document.getElementById("subjects");
        if (subDrop) subDrop.value = gameState.config.subject;

        // Directly start game with saved config
        questionManager.startGame(gameState.mode, gameState.config);
      }, 100);
    } catch (e) {
      console.error("Failed to restore game state", e);
      localStorage.removeItem("jambex_game_state");
    }
  } else if (savedSubject) {
    // Priority 2: Restore Selected Subject
    handleAction("questions");
    const subDrop = document.getElementById("subjects");
    if (subDrop) {
      subDrop.value = savedSubject;
      // Manually trigger change event to show options
      const event = new Event("change");
      subDrop.dispatchEvent(event);
    }
  } else if (savedAction) {
    // Priority 3: Restore Navigation only
    handleAction(savedAction);
  }
});

function onSubtopicSelected() {
  // Logic moved to startGame
}

const subjectDropDown = document.getElementById("subjects");
subjectDropDown.addEventListener("change", function () {
  // If in "questions" mode, show options immediately
  if (selectedAction === "questions") {
    document.getElementById("game-options").style.display = "flex";
    document.getElementById("subject-box").style.display = "none";

    const subject = this.value;
    if (subject) {
      document.getElementById("mode-title").innerText = subject;
      // Persist Subject Selection
      localStorage.setItem("jambex_selected_subject", subject);
    }
    return;
  }

  // reveal topic dropdown for other modes
  document.getElementById("topic").style.display = "block";
  document.getElementById("topic").disabled = false;
});

// UI Helper: Toggle Exam Settings
window.handleModeChange = function () {
  const mode = document.querySelector('input[name="gameMode"]:checked').value;
  const settings = document.getElementById("exam-settings");
  settings.style.display = mode === "exam" ? "flex" : "none";
};

// UI Helper: Start Game
window.startGame = function () {
  const subject = document.getElementById("subjects").value;

  if (!subject) {
    window.showToast?.("Please select a subject first.", "error");
    return;
  }

  const mode = document.querySelector('input[name="gameMode"]:checked').value;
  const count = document.getElementById("question-count").value;

  // Hide Options
  document.getElementById("game-options").style.display = "none";

  // Initialize Game
  const gameConfig = {
    subject: subject,
    topic: null,
    count: parseInt(count),
    duration_minutes:
      parseInt(count) === 5
        ? 3
        : parseInt(count) === 10
        ? 5
        : parseInt(count) * 0.5,
  };

  // Persist Game State
  localStorage.setItem(
    "jambex_game_state",
    JSON.stringify({
      mode: mode,
      config: gameConfig,
    })
  );

  questionManager.startGame(mode, gameConfig);
};

// Dynamic Subtopic options based on selected Topic
const subtopics = {
  Algebra: [
    "Quadratic Equations",
    "Simultaneous Equations",
    "Polynomials",
    "Sequences & Series",
    "Logarithms",
  ],
  "Geometry & Mensuration": [
    "Plane Geometry",
    "Solid Geometry",
    "Coordinate Geometry",
  ],
  Trigonometry: [
    "Trig Ratios & Identities",
    "Heights & Distances",
    "Graphs of Trig Functions",
  ],
  Calculus: ["Differentiation", "Integration", "Applications of Derivatives"],
  "Statistics & Probability": [
    "Mean, Median, Mode",
    "Probability",
    "Permutations & Combinations",
    "Set Theory",
  ],
  "Vectors & Matrices": [
    "Vector Operations",
    "Scalar & Vector Products",
    "Matrix Algebra",
  ],
  "Financial Maths": [
    "Simple Interest",
    "Compound Interest",
    "Percentage Problems",
  ],
};

const topicDropdown = document.getElementById("topic");
const subtopicDropdown = document.getElementById("subtopic");

// Initially disable subtopic
subtopicDropdown.disabled = true;

topicDropdown.addEventListener("change", function () {
  const selectedTopic = this.value;

  // Clear previous subtopics
  subtopicDropdown.innerHTML = "";

  if (subtopics[selectedTopic]) {
    // Add placeholder option (required validation works)
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.text = "Select Subtopic";
    placeholder.disabled = true; // Prevent selection
    placeholder.selected = true; // Default selected
    subtopicDropdown.appendChild(placeholder);

    // Add actual subtopics
    subtopics[selectedTopic].forEach(function (sub) {
      const option = document.createElement("option");
      option.value = sub;
      option.text = sub;
      subtopicDropdown.appendChild(option);
    });

    // Enable subtopic dropdown
    subtopicDropdown.disabled = false;
  } else {
    subtopicDropdown.disabled = true;
  }

  // Show Game Options Panel if in questions mode
  if (selectedAction === "questions") {
    document.getElementById("game-options").style.display = "flex";
    document.getElementById("subject-box").style.display = "none"; // Hide inputs for cleaner UI

    // Update header title
    document.getElementById("mode-title").innerText = selectedTopic;
  }
});
