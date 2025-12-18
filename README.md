# Road Is Taken

**Road Is Taken** is an intelligent, personalized learning roadmap generator designed to help developers master new technologies. Unlike static tutorials, this application uses Groq AI to create dynamic Directed Acyclic Graphs (DAGs) tailored to your specific needs. It features three distinct modes for generating roadmaps: tailored to your current skills, based on an open-source repository, or derived from your resume.

## Key Features

### 1. Multiple Roadmap Modes

*   **Normal Mode (Topic-Based):**
    *   Generates a structured learning path for any given topic (e.g., "Full Stack Development").
    *   Smart Input automatically filters out concepts you likely already know based on your user profile.
*   **OSS Mode (Repo Decoder):**
    *   Analyzes a GitHub repository URL to reverse-engineer its tech stack and architecture.
    *   Creates a roadmap to help you understand and contribute to that specific open-source project.
    *   Detects languages and frameworks automatically (e.g., finding `package.json` for JS/TS, `go.mod` for Go).
*   **Resume Mode (Career Path):**
    *   Upload your resume (PDF) to get a personalized roadmap.
    *   Analyzes your existing skills and compares them against a target domain (e.g., "Senior Backend Engineer").
    *   Identifies knowledge gaps and estimates time required to bridge them.

### 2. AI-Powered & Context-Aware

*   **Groq AI Integration:** Acts as a "Senior Engineering Mentor" to break down complex topics into manageable nodes.
*   **Smart Skipping:** Syncs with your GitHub profile to verify your existing skills and automatically marks relevant roadmap nodes as "Completed," allowing you to focus on what's new.

### 3. Interactive Roadmap UI

*   **Visual DAG Structure:** Powered by React Flow, visualizing dependencies between topics.
*   **Gamified Progression:**
    *   **Completed:** Topics you have mastered.
    *   **Pending:** The next logical steps (unlocked).
    *   **Locked:** Advanced topics that require prerequisites to be finished first.
*   **Optimistic Updates:** Immediate UI feedback when marking nodes as completed.
*   **Modern Design:** Features a dark grid aesthetic, "Instrument Serif" typography, and smooth animations.

## Tech Stack

### Frontend
*   **Framework:** React.js (Vite)
*   **Styling:** TailwindCSS
*   **Visualization:** React Flow
*   **Icons & UI:** Lucide React, Framer Motion

### Backend
*   **Runtime:** Node.js, Express.js
*   **Database:** MongoDB (Mongoose)
*   **AI:** Groq SDK
*   **File Processing:** `pdf2json` (for Resume parsing)
*   **Authentication:** JWT & Bcrypt
*   **Validation:** Zod

## Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   MongoDB (Local or Atlas)
*   Groq API Key

### 1. Clone the Repository
```bash
git clone <repository-url>
cd road-is-taken
```

### 2. Backend Setup
Navigate to the backend folder and install dependencies:
```bash
cd backend
npm install
```

**Environment Variables:**
Create a `.env` file in the `backend` directory:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_USER_PASSWORD=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
GITHUB_TOKEN=your_github_token
```
*Note: GITHUB_TOKEN is required for OSS mode repository analysis.*

**Start the Server:**
```bash
node index.js
```
*Server runs on port 3000 by default.*

### 3. Frontend Setup
Navigate to the frontend folder:
```bash
cd ../frontend
npm install
npm run dev
```

## API Documentation

### User & Auth
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/user/sign-up` | Register a new user. |
| `POST` | `/api/v1/user/sign-in` | Login and receive a JWT. |
| `GET` | `/api/v1/user/me` | Get current user details. |

### Roadmap Generation
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/roadmap/generate` | Generates a roadmap for a given topic (Normal Mode). |
| `POST` | `/api/v1/oss/decode` | Generates a roadmap from a GitHub Repo URL (OSS Mode). |
| `POST` | `/api/v1/resume/analyse` | Generates a roadmap by analyzing an uploaded Resume PDF (Resume Mode). |

### Roadmap Interaction
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/roadmap/view` | Fetches the specific roadmap details. |
| `GET` | `/api/v1/roadmap/all` | Fetch all roadmaps for the user. |
| `PUT` | `/api/v1/roadmap/update` | Updates a node status (e.g., mark as completed). |

### GitHub Integration
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/fetchGithub/username` | Analyzes GitHub repos to update verified skills and smart-skip roadmap nodes. |

## Credits

*   **Background Pattern:** [PatternCraft](https://www.patterncraft.io/)
