Here is the updated `README.md` file without emojis.

-----

# Road Is Taken

**Road Is Taken** is an intelligent, personalized learning roadmap generator. Unlike static tutorials, this application uses GenAI to create dynamic Directed Acyclic Graphs (DAGs) for learning new technologies. It tailors the roadmap based on your current skill level, quiz performance, and verified skills fetched directly from your GitHub repository history.

## Key Features

### 1\. AI-Powered Roadmap Generation

  - Uses **Google Gemini (GenAI)** to generate structured learning paths (nodes and edges).
  - **Context-Aware:** The AI acts as a "Senior Engineering Mentor," taking into account:
      - Your current skill level (1-3).
      - Your performance in adaptive quizzes.
      - Skills you have already verified via GitHub.
  - **DAG Structure:** Generates a graph where topics depend on prerequisites.

### 2\. GitHub Skill Verification

  - Syncs with your GitHub profile to analyze your repositories.
  - Automatically detects languages and technologies you have used.
  - **SmartSkipping:** If the AI detects you already possess a skill (via GitHub), it automatically marks that node (and its prerequisites) as "Completed" in your roadmap.

### 3\. Adaptive Quiz System

  - **Dynamic Difficulty:** The system adjusts question difficulty based on your performance.
      - Answer correctly? The next question gets harder (up to Level 3).
      - Answer incorrectly? The next question gets easier.
  - **Smart Sampling:** Fetches questions specifically for the domain you are learning, ensuring you haven't answered them before.

### 4\. Gamified Progression

  - **Lock/Unlock System:**
      - **Completed:** Topics you have finished.
      - **Pending:** Immediate next steps (unlocked).
      - **Locked:** Future topics that require prerequisites to be finished first.
  - Completing a node automatically checks the graph to unlock dependent nodes.

-----

## Tech Stack

### Backend

  - **Runtime:** Node.js
  - **Framework:** Express.js
  - **Database:** MongoDB (via Mongoose)
  - **AI Integration:** Google GenAI SDK (`gemini-2.5-flash`)
  - **Validation:** Zod
  - **Authentication:** JWT (JSON Web Tokens) & Bcrypt
  - **External APIs:** GitHub API

### Frontend

  - **Framework:** React.js
  - **Build Tool:** Vite
  - **Styling:** TailwindCSS

-----

## Installation & Setup

### Prerequisites

  - Node.js (v18+)
  - MongoDB (Local or Atlas)
  - Google Gemini API Key

### 1\. Clone the Repository

```bash
git clone <repository-url>
cd road-is-taken
```

### 2\. Backend Setup

Navigate to the backend folder and install dependencies:

```bash
cd backend
npm install
```

**Environment Variables:**
Create a `.env` file in the `backend` directory:

```env
MONGO_URI=your_mongodb_connection_string
JWT_USER_PASSWORD=your_jwt_secret
GEMINI_API_KEY=your_google_genai_key
```

**Seed the Database:**
Populate the database with initial assessment questions (React, JS, etc.):

```bash
node seed.js
```

**Start the Server:**

```bash
node index.js
```

*Server runs on port 3000 by default.*

### 3\. Frontend Setup

Navigate to the frontend folder:

```bash
cd ../frontend
npm install
npm run dev
```

-----

## API Documentation

### User & Auth

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/user/sign-up` | Register a new user. |
| `POST` | `/api/v1/user/sign-in` | Login and receive a JWT. |
| `GET` | `/api/v1/user/me` | Get current user details. |
| `POST` | `/api/v1/user/update-score` | Update user level/quiz score manually. |

### GitHub Integration

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/fetchGithub/username` | Analyzes GitHub repos and updates verified skills. |

### Roadmap Management

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/roadmap/generate` | Generates a new AI roadmap for a specific domain. |
| `GET` | `/api/v1/roadmap/view` | Fetches the user's current roadmap. |
| `PUT` | `/api/v1/roadmap/update` | Updates a node status (e.g., mark as completed) and unlocks new nodes. |
| `GET` | `/api/v1/roadmap/all` | Fetch all roadmaps for the user. |

### Assessments

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/questions/next` | Fetches the next question based on difficulty logic. |

-----

## Project Structure

```text
road-is-taken/
├── backend/
│   ├── data/             # Static assessment data (seeds)
│   ├── db/               # Mongoose schemas (User, Roadmap, Question)
│   ├── middleware/       # Auth middleware
│   ├── routes/           # API Routes (Github, Questions, Roadmap, User)
│   ├──Qm config.js         # Configuration exports
│   ├── index.js          # Entry point
│   └── seed.js           # Database seeding script
└── frontend/
    ├── src/              # React components and logic
    ├── public/           # Static assets
    └── vite.config.js    # Vite configuration
```

