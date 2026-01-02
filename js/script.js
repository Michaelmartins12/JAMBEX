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
  document.getElementById("topic").disabled = true;
  document.getElementById("topic").value = "";
  document.getElementById("subtopic").disabled = true;
  document.getElementById("subtopic").innerHTML =
    "<option>Select Subtopic</option>";
});

function onSubtopicSelected() {
  // Logic moved to startGame
}

const subjectDropDown = document.getElementById("subjects");
subjectDropDown.addEventListener("change", function () {
  // reveal topic dropdown
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
  const topic = document.getElementById("topic").value;

  if (!subject || !topic) {
    window.showToast?.("Please select a subject and topic first.", "error");
    return;
  }

  const mode = document.querySelector('input[name="gameMode"]:checked').value;
  const count = document.getElementById("question-count").value;

  // Hide Options
  document.getElementById("game-options").style.display = "none";

  // Initialize Game
  questionManager.startGame(mode, {
    subject: subject,
    topic: topic,
    count: parseInt(count),
    duration_minutes:
      parseInt(count) === 5
        ? 3
        : parseInt(count) === 10
        ? 5
        : parseInt(count) * 0.5,
  });
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
