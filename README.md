# PrepWise

<div align="center">
  <img src="https://github.com/user-attachments/assets/1c0131c7-9f2d-4e3b-b47c-9679e76d8f9a" alt="PrepWise Banner" width="1000" />
  <br />
  <img src="https://img.shields.io/badge/-Next.js-black?style=for-the-badge&logoColor=white&logo=nextdotjs&color=black" alt="Next.js" />
  <img src="https://img.shields.io/badge/-Vapi-white?style=for-the-badge&color=5dfeca" alt="Vapi" />
  <img src="https://img.shields.io/badge/-Tailwind_CSS-black?style=for-the-badge&logoColor=white&logo=tailwindcss&color=06B6D4" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/-Firebase-black?style=for-the-badge&logoColor=white&logo=firebase&color=DD2C00" alt="Firebase" />
  <br />
  <h3>AI-powered interview practice for real-world hiring prep</h3>
</div>

PrepWise is a modern interview preparation platform built with Next.js, Firebase, Tailwind CSS, and Vapi AI voice agents. It helps users practice technical and behavioral interviews, receive AI-generated feedback, and track progress over time.

## ✨ Features

- AI-powered interview generation based on role, experience level, tech stack, and interview type
- Voice-based mock interviews using Vapi AI assistants
- Real-time transcript capture and analysis
- Personalized feedback with strengths and improvement areas
- Secure authentication with Firebase
- Dashboard to manage, review, and retake interviews
- Responsive UI built for desktop and mobile devices

## 🧰 Tech Stack

| Category | Stack |
| --- | --- |
| Frontend | Next.js, Tailwind CSS |
| Backend | Next.js API routes |
| Authentication | Firebase Auth |
| Database | Firebase Firestore |
| AI / Voice | Vapi AI, Google Gemini |
| Validation | Zod |
| UI Components | shadcn/ui |

## 🚀 Getting Started

### Prerequisites

Before you begin, make sure you have the following installed:

- [Node.js](https://nodejs.org/en)
- [npm](https://www.npmjs.com/)
- [Git](https://git-scm.com/)

### 1. Clone the repository

```bash
git clone https://github.com/adrianhajdin/ai_mock_interviews.git
cd ai_mock_interviews
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the project root and add the following values:

```env
NEXT_PUBLIC_VAPI_WEB_TOKEN=
NEXT_PUBLIC_VAPI_ASSISTANT_ID=
GOOGLE_GENERATIVE_AI_API_KEY=
NEXT_PUBLIC_BASE_URL=

NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

> Replace the placeholders with your actual Firebase and Vapi credentials.

### 4. Run the app

```bash
npm run dev
```

Then open <http://localhost:3000> in your browser.

## 🔐 Vapi Setup

Vapi retired its legacy Workflow system. This project now uses a single assistant for both the generate and interview flows.

1. Create one assistant in the [Vapi Dashboard](https://dashboard.vapi.ai).
2. Use the `mode` variable to branch the system prompt:
   - `generate`: collect interview details and call the Gather tool
   - `interview`: run the mock interview using the generated `questions`
3. Attach the Gather function tool to `POST <NEXT_PUBLIC_BASE_URL>/api/vapi/generate` with parameters such as `role`, `level`, `type`, `techstack`, `amount`, and `userid`.
4. Add the `end_interview_session` tool to end the call.
5. Set `NEXT_PUBLIC_VAPI_ASSISTANT_ID` in both `.env.local` and your deployed environment variables.

## 📁 Project Structure

```bash
.
├── app/
├── components/
├── constants/
├── lib/
├── public/
├── .env.local
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## 📚 Learning Resources

This repository is part of a tutorial series from [JavaScript Mastery](https://www.youtube.com/@javascriptmastery/videos). For a step-by-step walkthrough, check out the video tutorial.

<a href="https://www.youtube.com/watch?v=8GK8R77Bd7g" target="_blank">
  <img src="https://github.com/sujatagunale/EasyRead/assets/151519281/1736fca5-a031-4854-8c09-bc110e3bc16d" alt="Tutorial Banner" width="100%" />
</a>

## 🔗 Assets

Public assets used in the project can be found [here](https://drive.google.com/drive/folders/1DuQ9bHH3D3ZAN_CFKfBgsaB8DEhEdnog?usp=sharing).

## 🚀 More

Advance your skills with [Next.js Pro Course](https://jsmastery.pro/next15).

<a href="https://jsmastery.pro/next15" target="_blank">
  <img src="https://github.com/user-attachments/assets/b8760e69-1f81-4a71-9108-ceeb1de36741" alt="Next.js Pro Course Banner" width="100%" />
</a>

## ⭐ Acknowledgements

Built with inspiration from the JavaScript Mastery community and the AI interview prep workflow experience.
