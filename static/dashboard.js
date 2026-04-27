// ================= CHAT HISTORY =================
fetch("/history")
.then(res => res.json())
.then(data => {
    let box = document.getElementById("chatHistory");

    if(data.length === 0){
        box.innerHTML = "<p class='text-gray-400'>No chat history 😅</p>";
        return;
    }

    data.forEach(chat => {
        let div = document.createElement("div");

        div.innerHTML = `
            <div class="text-orange-400">You: ${chat.message}</div>
            <div class="text-gray-300">AI: ${chat.response}</div>
        `;

        box.appendChild(div);
    });
});


// ================= RESUME HISTORY =================
fetch("/resume-history")
.then(res => res.json())
.then(data => {
    let box = document.getElementById("resumeHistory");

    if(data.length === 0){
        box.innerHTML = "<p class='text-gray-400'>No resume history 😅</p>";
        return;
    }

    data.forEach(r => {
        let div = document.createElement("div");

        div.innerHTML = `
            <div class="text-green-400">🔥 Score: ${r.score}/100</div>
            <div class="text-gray-400">${r.suggestions}</div>
        `;

        box.appendChild(div);
    });
});