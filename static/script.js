// ================= GLOBAL FUNCTION =================
function addMessage(text, type) {
  let box = document.createElement("div");

  box.className = type === "user" ? "text-right" : "text-left";

  let bubble = document.createElement("span");

  bubble.className =
    type === "user"
      ? "inline-block bg-orange-500 text-white px-3 py-2 rounded-xl"
      : "inline-block bg-gray-800 text-gray-200 px-3 py-2 rounded-xl";

  bubble.innerText = text;

  box.appendChild(bubble);

  let chatBox = document.getElementById("chatBox");

  if (chatBox) {
    chatBox.appendChild(box);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

// ================= MAIN =================
document.addEventListener("DOMContentLoaded", function () {

  // ================= SEND MESSAGE =================
  window.sendMsg = function () {
    let input = document.getElementById("msg");
    let msg = input.value.trim();

    if (!msg) return;

    addMessage("You: " + msg, "user");
    input.value = "";

    fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: msg }),
    })
      .then((res) => res.json())
      .then((data) => {
        addMessage("AI: " + (data.response || data.error), "bot");
      })
      .catch(() => {
        addMessage("AI: Server error 😅", "bot");
      });
  };

  // ================= ENTER PRESS =================
  let input = document.getElementById("msg");
  if (input) {
    input.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        sendMsg();
      }
    });
  }

  // ================= RESUME =================
const form = document.getElementById("resumeForm");

if (form) {
  form.onsubmit = function (e) {
    e.preventDefault();

    let formData = new FormData(this);
    let scoreBox = document.getElementById("score");
    let bar = document.getElementById("progressBar");

    // 🔄 Loading
    scoreBox.innerText = "Analyzing... ⏳";
    scoreBox.className = "mt-4 text-yellow-400 font-semibold";

    if (bar) bar.style.width = "10%";

    fetch("/resume", {
      method: "POST",
      body: formData,
    })
      .then((res) => res.json())
      .then((data) => {

        // ❌ error
        if (data.error) {
          scoreBox.innerText = "❌ " + data.error;
          scoreBox.className = "mt-4 text-red-400 font-semibold";
          if (bar) bar.style.width = "0%";
          return;
        }

        let score = data.score;

        // 🎨 Score color
        let color = "text-red-400";
        if (score >= 70) color = "text-green-400";
        else if (score >= 50) color = "text-yellow-400";

        // 🔥 MAIN HTML
        let html = `
          <div class="${color} font-bold text-lg mb-2">
            🔥 Score: ${score}/100
          </div>
        `;

        // ✅ Strengths
        if (data.found && data.found.length > 0) {
          html += `<div class="text-green-400 mb-2">✅ Strengths:</div>`;
          data.found.forEach((item) => {
            html += `<div class="text-sm text-gray-300">✔ ${item}</div>`;
          });
        }

        // ⚠️ Suggestions
        if (data.suggestions && data.suggestions.length > 0) {
          html += `<div class="text-yellow-400 mt-3 mb-2">⚠️ Improvements:</div>`;
          data.suggestions.forEach((item) => {
            html += `<div class="text-sm text-gray-300">➤ ${item}</div>`;
          });
        }

        scoreBox.className = "mt-4";
        scoreBox.innerHTML = html;

        // 📊 progress bar
        if (bar) bar.style.width = score + "%";
      })
      .catch(() => {
        scoreBox.innerText = "❌ Server error 😅";
        scoreBox.className = "mt-4 text-red-400 font-semibold";
        if (bar) bar.style.width = "0%";
      });
  };
}

  // ================= LOAD CHAT HISTORY =================
  fetch("/history")
    .then((res) => res.json())
    .then((data) => {
      data.forEach((chat) => {
        addMessage("You: " + chat.message, "user");
        addMessage("AI: " + chat.response, "bot");
      });
    });
});

// ================= BACKGROUND =================
document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("bg");

  if (canvas) {
    const ctx = canvas.getContext("2d");

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener("resize", resize);

    let particles = [];

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 2,
        dx: (Math.random() - 0.5) * 0.5,
        dy: (Math.random() - 0.5) * 0.5,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "orange";

      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;

        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(draw);
    }

    draw();
  }
});

// 🔥 TYPING ANIMATION
function typingEffect(text) {
    let chatBox = document.getElementById("chatBox");

    let box = document.createElement("div");
    box.className = "text-left";

    let bubble = document.createElement("span");
    bubble.className = "inline-block bg-gray-800 text-gray-200 px-3 py-2 rounded-xl";

    box.appendChild(bubble);
    chatBox.appendChild(box);

    let i = 0;

    function type() {
        if (i < text.length) {
            bubble.innerHTML += text.charAt(i);
            i++;
            chatBox.scrollTop = chatBox.scrollHeight;
            setTimeout(type, 20); // speed 🔥
        }
    }

    type();
}