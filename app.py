from flask import Flask, render_template, request, redirect, session, jsonify
from flask_sqlalchemy import SQLAlchemy
import requests
import PyPDF2
from werkzeug.security import generate_password_hash, check_password_hash


app = Flask(__name__)
app.secret_key = "my_secret_123"

# ================= DB =================
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite3'
db = SQLAlchemy(app)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(100))
    password = db.Column(db.String(100))


class Chat(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_email = db.Column(db.String(100))
    message = db.Column(db.Text)
    response = db.Column(db.Text)


class Resume(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_email = db.Column(db.String(100))
    score = db.Column(db.Integer)
    suggestions = db.Column(db.Text)
# ================= HOME =================


@app.route("/")
def home():
    if "user" in session:
        return render_template("index.html")
    return redirect("/login")

# ================= SIGNUP =================


@app.route("/signup", methods=["GET", "POST"])
def signup():
    if request.method == "POST":
        email = request.form["email"]
        password = generate_password_hash(request.form["password"])

        user = User(email=email, password=password)
        db.session.add(user)
        db.session.commit()

        return redirect("/login")

    return render_template("signup.html")

# ================= LOGIN =================


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        email = request.form["email"]
        password = request.form["password"]

        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password, password):
            session["user"] = email
            return redirect("/dashboard")

    return render_template("login.html")
# ================= LOGOUT =================


@app.route("/logout")
def logout():
    session.pop("user", None)
    return redirect("/login")


# ================= 🔥 CHAT (REAL AI) =================
OPENROUTER_API_KEY = "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"


@app.route("/chat", methods=["POST"])
def chat():
    if "user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.get_json()
    msg = data.get("message")

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5000",
                "X-Title": "AI Assistant"
            },
            json={
                "model": "meta-llama/llama-3-8b-instruct",
                "messages": [
                    {"role": "user", "content": msg}
                ]
            }
        )

        result = response.json()
        print(result)

        # ❌ error
        if "error" in result:
            return jsonify({"response": "API Error 😅: " + result["error"]["message"]})

        # ✅ correct block
        if "choices" in result:
            reply = result["choices"][0]["message"]["content"]

            # SAVE CHAT
            chat_data = Chat(
                user_email=session["user"],
                message=msg,
                response=reply
            )

            db.session.add(chat_data)
            db.session.commit()

            return jsonify({"response": reply})

        else:
            return jsonify({"response": "No response from AI 😅"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ================= RESUME =================


@app.route("/resume", methods=["POST"])
def resume():
    if "user" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    file = request.files.get("file")

    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    try:
        pdf_reader = PyPDF2.PdfReader(file)
        text = ""

        for page in pdf_reader.pages:
            text += page.extract_text() or ""

        text = text.lower()

        # 🔥 KEYWORDS
        keywords = {
            "python": "Good Python knowledge ✅",
            "java": "Java skills detected 👍",
            "sql": "Database knowledge present 🗄️",
            "project": "Projects mentioned 🚀",
            "experience": "Experience section present 💼",
            "react": "Frontend skill React ⚛️",
            "flask": "Backend Flask skill 🔥",
            "api": "API knowledge present 🌐",
            "github": "Good use of GitHub 🧑‍💻"
        }

        score = 0
        found = []

        for key, msg in keywords.items():
            if key in text:
                score += 10
                found.append(msg)

        score = min(score, 100)

        # 🔥 Suggestions
        suggestions = []

        if "project" not in text:
            suggestions.append("Add at least 2 strong projects 🚀")

        if "experience" not in text:
            suggestions.append("Mention internships or experience 💼")

        if "react" not in text:
            suggestions.append("Add frontend skills like React ⚛️")

        if "api" not in text:
            suggestions.append("Mention API or backend integration 🌐")

        if "github" not in text:
            suggestions.append("Add GitHub profile link 🧑‍💻")

        # ✅ SAVE RESUME HISTORY (सही जगह)
        resume_data = Resume(
            user_email=session["user"],
            score=score,
            suggestions=" | ".join(suggestions)
        )

        db.session.add(resume_data)
        db.session.commit()

        return jsonify({
            "score": score,
            "found": found,
            "suggestions": suggestions
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500
# dashboard

@app.route("/dashboard")
def dashboard():
    if "user" not in session:
        return redirect("/login")
    return render_template("dashboard.html")

# history
@app.route("/history")
def history():
    if "user" not in session:
        return jsonify([])

    chats = (Chat.query
             .filter_by(user_email=session["user"])
             .order_by(Chat.id.desc())
             .limit(50)
             .all())

    return jsonify([
        {"message": c.message, "response": c.response}
        for c in chats
    ])


@app.route("/chat-page")
def chat_page():
    if "user" not in session:
        return redirect("/login")
    return render_template("index.html")

@app.route("/resume-history")
def resume_history():
    if "user" not in session:
        return jsonify([])

    data = Resume.query.filter_by(user_email=session["user"]).all()

    return jsonify([
        {
            "score": r.score,
            "suggestions": r.suggestions
        } for r in data
    ])
    
# ================= RUN =================
if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
