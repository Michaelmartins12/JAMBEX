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
    // Show Coming Soon Toast
    window.showToast?.(
      "Coming Soon! This feature is under development.",
      "info"
    );
    return;
  }

  if (action === "questions") {
    // Clear welcome message
    chatArea.innerHTML = "";

    // Show Mode Header
    const modeHeader = document.getElementById("mode-header");
    const modeTitle = document.getElementById("mode-title");
    modeHeader.style.display = "flex";
    modeTitle.innerText = "Past Questions";

    // Reveal subject dropdowns
    document.getElementById("subject-box").style.display = "flex";

    // Hide welcome buttons
    document.getElementById("welcome-actions").style.display = "none";
  }
}
window.handleAction = handleAction;

// Back Button Logic
document.getElementById("back-to-menu-btn").addEventListener("click", () => {
  // Reset UI
  document.getElementById("mode-header").style.display = "none";
  document.getElementById("subject-box").style.display = "none";
  document.getElementById("welcome-actions").style.display = "flex";

  // Restore Welcome Message
  chatArea.innerHTML = `
      <div class="ai-message">
        <p><strong>Welcome to JambeX 👋</strong></p>
        <p>Your AI powered jamb learning assistant.</p>
        <p>What would you like to do?</p>
      </div>
    `;

  // Reset state
  selectedAction = null;

  // Reset dropdowns if needed (optional)
  document.getElementById("subjects").value = "";
  document.getElementById("topic").disabled = true;
  document.getElementById("topic").value = "";
  document.getElementById("subtopic").disabled = true;
  document.getElementById("subtopic").innerHTML =
    "<option>Select Subtopic</option>";
});

function onSubtopicSelected() {
  if (selectedAction === "notes") {
    chatArea.innerHTML += `<div class="ai-message">Here are your notes 📘</div>`;
  }

  if (selectedAction === "questions") {
    chatArea.innerHTML += `<div class="ai-message">Let’s practice past questions 📝</div>`;
  }

  if (selectedAction === "ask") {
    chatArea.innerHTML += `<div class="ai-message">You can now ask any question 💬</div>`;
  }
}

const subjectDropDown = document.getElementById("subjects");
subjectDropDown.addEventListener("change", function () {
  // If we are in "questions" mode, fetch a question immediately
  if (selectedAction === "questions") {
    const subject = this.value;
    if (subject) {
      questionManager.fetchQuestion(subject);
    }
  }

  // reveal topic dropdown
  document.getElementById("topic").disabled = false;
});

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
});
