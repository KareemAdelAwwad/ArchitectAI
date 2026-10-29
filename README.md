<div align="center">

# 🏛️ Architect AI

**AI-Powered Software Architecture & Project Planning Engine**

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Gemini API](https://img.shields.io/badge/Google_Gemini-3.1_Pro-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

*Architect AI transforms unstructured product ideas into production-ready software specifications, system architectures, database schemas, and AI-optimized coding prompts.*

</div>

---

## 📌 Overview

Building complex software requires rigorous planning: defining requirements, mapping relational schemas, designing REST/GraphQL API contracts, and structuring tasks. 

**Architect AI** automates this entire discovery phase. By leveraging **Google Gemini 3.1 Pro**, the engine synthesizes high-level project ideas into comprehensive Waterfall and Agile specifications, cutting down architecture planning time from days to minutes.

---

## ✨ Key Features

### 📋 1. Automated Waterfall Specification Engine
* Generates full **Product Requirement Documents (PRDs)** with user stories, edge cases, and acceptance criteria.
* Produces **Entity-Relationship Data Schemas** with relational types, indexes, and primary/foreign keys.
* Crafts **REST & GraphQL API Contracts** including request/response schemas, status codes, and auth requirements.
* Breaks down implementations into phased, actionable engineering tasks.

### ⚡ 2. "Vibe Coder" One-Shot Prompt Synthesizer
* Compiles complex, multi-tiered architectures into high-density **one-shot system prompts** optimized for AI coding assistants (Cursor, Claude, Copilot).
* Bridges the gap between high-level architectural intent and deterministic code generation.

### 🚀 3. Dynamic Quick-Start Scaffolder
* Automatically generates starter directory file trees tailored to the project stack.
* Produces production-ready `package.json` configurations with pinned dependencies.

### 👥 4. Collaborative Workspace & Export
* Shareable read/write invite links for cross-functional engineering teams.
* Export specifications to PDF via `pdf-lib` or raw structured JSON for integration into internal tooling.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    User([Developer / Product Manager]) -->|Inputs Concept & Constraints| Client[Next.js 14 App Router]
    
    subgraph Frontend["Frontend Layer"]
        Client --> UI[Radix UI + Tailwind CSS]
        Client --> Motion[Framer Motion + GSAP Animations]
    end

    subgraph AuthLayer["Authentication & Security"]
        Client -->|Session Verification| Auth[NextAuth.js]
        Auth -->|OAuth Flow| GitHub[GitHub OAuth Provider]
    end

    subgraph Engine["AI Planning Engine"]
        Client -->|API Route Handlers| Orchestrator[Prompt Engineering Pipeline]
        Orchestrator -->|OpenAI-Compatible SDK| Gemini[Google Gemini 3.1 Pro]
        Gemini -->|Streamed Structured Specs| Client
    end

    subgraph Storage["Persistence & Exports"]
        Client -->|Store Plans, Tasks, & Collaborators| DB[(MongoDB Atlas via MongoDB Adapter)]
        Client -->|Generate Document Artifacts| Exporter[PDF-Lib Engine]
    end
```

---

## 🛠️ Tech Stack

* **Framework:** Next.js 14 (App Router, Server Actions, Route Handlers)
* **Language:** TypeScript 5 (Strict Mode)
* **AI Model:** Google Gemini 3.1 Pro / Gemini 2.5 Pro via OpenAI SDK integration
* **Database:** MongoDB Atlas with `@auth/mongodb-adapter`
* **Authentication:** NextAuth.js (GitHub OAuth)
* **Styling & UI:** Tailwind CSS, Radix UI Primitives, Lucide Icons, Sonner toasts
* **Animations:** Framer Motion, GSAP, OGL (WebGL Canvas)
* **Document Generation:** `pdf-lib`, `prism-react-renderer`

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18.x or higher
* npm or pnpm
* MongoDB Atlas instance (or local MongoDB)
* Google Gemini API Key
* GitHub OAuth App (Client ID & Secret)

### 1. Clone the repository
```bash
git clone https://github.com/KareemAdelAwwad/ArchitectAI.git
cd ArchitectAI
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy `.env.example` to `.env.local` and populate the values:
```bash
cp .env.example .env.local
```

```env
# Database Configuration (MongoDB)
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/ArchitectAI

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# GitHub OAuth Provider
GITHUB_ID=your_github_client_id
GITHUB_SECRET=your_github_client_secret

# AI Model Configuration (Gemini API via OpenAI-compatible endpoint)
OPENAI_API_KEY=your_gemini_api_key
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai/
OPENAI_MODEL=gemini-2.5-pro
```

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔒 Security & Privacy

* **Zero-Credential Commits:** All secrets, keys, and connection strings are strictly managed via environment variables and prevented from being committed by `.gitignore`.
* **Database Access:** MongoDB access is isolated and authenticated through TLS-encrypted connections.

---

## 👨‍💻 Author

**Kareem Adel**
* Website: [kareem-adel.com](https://kareem-adel.com)
* GitHub: [@KareemAdelAwwad](https://github.com/KareemAdelAwwad)
* LinkedIn: [linkedin.com/in/kareem-adel-awwad](https://linkedin.com/in/kareem-adel-awwad)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
