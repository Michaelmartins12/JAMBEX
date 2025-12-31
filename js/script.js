const chatArea = document.getElementById("chat-area");
chatArea.innerHTML = `
  <div class="ai-message">
    <p><strong>Welcome to JambeX 👋</strong></p>
    <p>Your AI tutor for JAMB Mathematics.</p>
    <p>What would you like to do?</p>
  </div>
`;


let selectedAction = null;

function handleAction(action) {
  selectedAction = action;

  chatArea.innerHTML += `
    <div class="ai-message">
      <p>Great choice 👍</p>
      <p>Please select a subject to continue.</p>
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

    topicDropdown.addEventListener("change", function() {
        const selectedTopic = this.value;

        
        // Clear previous subtopics
        subtopicDropdown.innerHTML = '<option value="">Select Subtopic</option>';

        if(subtopics[selectedTopic]) {
            subtopics[selectedTopic].forEach(function(sub) {
                const option = document.createElement("option");
                option.value = sub;
                option.text = sub;
                subtopicDropdown.appendChild(option);
            });
        }
    });
