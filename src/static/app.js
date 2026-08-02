document.addEventListener("DOMContentLoaded", () => {
  const TOKEN_STORAGE_KEY = "teacherToken";
  const USERNAME_STORAGE_KEY = "teacherUsername";

  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const signupContainer = document.getElementById("signup-container");
  const messageDiv = document.getElementById("message");

  const authToggleButton = document.getElementById("teacher-auth-toggle");
  const authPanel = document.getElementById("teacher-auth-panel");
  const teacherLoginForm = document.getElementById("teacher-login-form");
  const teacherLogoutButton = document.getElementById("teacher-logout");
  const teacherAuthStatus = document.getElementById("teacher-auth-status");

  let teacherToken = localStorage.getItem(TOKEN_STORAGE_KEY) || "";
  let teacherUsername = localStorage.getItem(USERNAME_STORAGE_KEY) || "";

  function isTeacherAuthenticated() {
    return teacherToken.length > 0;
  }

  function getAuthHeaders() {
    if (!isTeacherAuthenticated()) {
      return {};
    }
    return {
      "X-Teacher-Token": teacherToken,
    };
  }

  function showTeacherStatus(message, type) {
    teacherAuthStatus.textContent = message;
    teacherAuthStatus.className = type;
    teacherAuthStatus.classList.remove("hidden");
  }

  function updateAuthUI() {
    if (isTeacherAuthenticated()) {
      authToggleButton.textContent = `Teacher: ${teacherUsername}`;
      teacherLogoutButton.classList.remove("hidden");
      signupContainer.classList.remove("hidden");
      showTeacherStatus("Logged in. You can register and unregister students.", "success");
    } else {
      authToggleButton.textContent = "Teacher Login";
      teacherLogoutButton.classList.add("hidden");
      signupContainer.classList.add("hidden");
      showTeacherStatus("Students can view activities. Teachers must log in to edit registrations.", "info");
    }
  }

  async function validateStoredSession() {
    if (!isTeacherAuthenticated()) {
      updateAuthUI();
      return;
    }

    try {
      const response = await fetch("/auth/session", {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Session expired");
      }

      const payload = await response.json();
      teacherUsername = payload.username;
      localStorage.setItem(USERNAME_STORAGE_KEY, teacherUsername);
      updateAuthUI();
    } catch (error) {
      teacherToken = "";
      teacherUsername = "";
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USERNAME_STORAGE_KEY);
      updateAuthUI();
    }
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML =
        '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft =
          details.max_participants - details.participants.length;

        // Create participants HTML with delete icons instead of bullet points
        const participantsHTML =
          details.participants.length > 0
            ? `<div class="participants-section">
              <h5>Participants:</h5>
              <ul class="participants-list">
                ${details.participants
                  .map(
                    (email) =>
                      `<li><span class="participant-email">${email}</span>${
                        isTeacherAuthenticated()
                          ? `<button class="delete-btn" data-activity="${name}" data-email="${email}">Unregister</button>`
                          : ""
                      }</li>`
                  )
                  .join("")}
              </ul>
            </div>`
            : `<p><em>No participants yet</em></p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-container">
            ${participantsHTML}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll(".delete-btn").forEach((button) => {
        button.addEventListener("click", handleUnregister);
      });
    } catch (error) {
      activitiesList.innerHTML =
        "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle unregister functionality
  async function handleUnregister(event) {
    if (!isTeacherAuthenticated()) {
      messageDiv.textContent =
        "Only teachers can unregister students. Please log in.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      return;
    }

    const button = event.target;
    const activity = button.getAttribute("data-activity");
    const email = button.getAttribute("data-email");

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/unregister?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!isTeacherAuthenticated()) {
      messageDiv.textContent =
        "Only teachers can register students. Please log in.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      return;
    }

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(
          activity
        )}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();

        // Refresh activities list to show updated participants
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  authToggleButton.addEventListener("click", () => {
    authPanel.classList.toggle("hidden");
  });

  teacherLoginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("teacher-username").value.trim();
    const password = document.getElementById("teacher-password").value;

    try {
      const response = await fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const result = await response.json();
      if (!response.ok) {
        showTeacherStatus(result.detail || "Login failed", "error");
        return;
      }

      teacherToken = result.token;
      teacherUsername = result.username;
      localStorage.setItem(TOKEN_STORAGE_KEY, teacherToken);
      localStorage.setItem(USERNAME_STORAGE_KEY, teacherUsername);
      teacherLoginForm.reset();
      updateAuthUI();
      fetchActivities();
    } catch (error) {
      showTeacherStatus("Login failed. Please try again.", "error");
      console.error("Error logging in:", error);
    }
  });

  teacherLogoutButton.addEventListener("click", async () => {
    if (!isTeacherAuthenticated()) {
      return;
    }

    try {
      await fetch("/auth/logout", {
        method: "POST",
        headers: getAuthHeaders(),
      });
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      teacherToken = "";
      teacherUsername = "";
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USERNAME_STORAGE_KEY);
      updateAuthUI();
      fetchActivities();
    }
  });

  // Initialize app
  validateStoredSession();
  fetchActivities();
});
