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

  chatArea.innerHTML += `
    <div class="ai-message">
      <p>Great choice 👍</p>
      <p>Please choose an option to continue.</p>
    </div>
  `;

  // reveal subject dropdowns
  document.getElementById("subject-box").style.display = "flex";

  // hide the welcome buttons
  document.getElementById("welcome-actions").style.display = "none";
}

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
subjectDropDown.addEventListener("change", function() {
  // reveal topic dropdown
  document.getElementById("topic").disabled = false;
})

    
    // Dynamic Subtopic options based on selected Topic
    const subtopics = {
    "Algebra": ["Quadratic Equations", "Simultaneous Equations", "Polynomials", "Sequences & Series", "Logarithms"],
    "Geometry & Mensuration": ["Plane Geometry", "Solid Geometry", "Coordinate Geometry"],
    "Trigonometry": ["Trig Ratios & Identities", "Heights & Distances", "Graphs of Trig Functions"],
    "Calculus": ["Differentiation", "Integration", "Applications of Derivatives"],
    "Statistics & Probability": ["Mean, Median, Mode", "Probability", "Permutations & Combinations", "Set Theory"],
    "Vectors & Matrices": ["Vector Operations", "Scalar & Vector Products", "Matrix Algebra"],
    "Financial Maths": ["Simple Interest", "Compound Interest", "Percentage Problems"]
};

const topicDropdown = document.getElementById("topic");
const subtopicDropdown = document.getElementById("subtopic");

// Initially disable subtopic
subtopicDropdown.disabled = true;

topicDropdown.addEventListener("change", function() {
    const selectedTopic = this.value;

    // Clear previous subtopics
    subtopicDropdown.innerHTML = '';

    if(subtopics[selectedTopic]) {
        // Add placeholder option (required validation works)
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.text = "Select Subtopic";
        placeholder.disabled = true;  // Prevent selection
        placeholder.selected = true;  // Default selected
        subtopicDropdown.appendChild(placeholder);

        // Add actual subtopics
        subtopics[selectedTopic].forEach(function(sub) {
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
