# Basera ⚡

Basera is a Next.js-powered direct relocation engine designed to streamline home search and moving in India. It enables users to bypass brokers, connect directly with verified listings, utilize AI-driven neighborhood profiling, and simulate rent negotiations with virtual landlord personas.

---

## 🚀 Key Features

- **Direct Relocation Engine**: Access direct, verified listings without broker interference.
- **AI-Assisted Search & Re-ranking**: Integrates LLM semantic search re-ranking using Groq/Anthropic to find the most relevant homes based on detailed queries.
- **Landlord Negotiation Simulator**: Interact with virtual landlords possessing unique personalities (firm, flexible, business-like) and negotiate rent in real-time.
- **Geospatial Map Search**: Filter listings using ray-casting point-in-polygon drawings directly on a Leaflet map.
- **Neighborhood Scorer**: Dynamic compatibility score showing locality advantages tailored to your user profile (transit preference, cooking choice, etc.).
- **AI Review Summarization**: Automatically highlights pros and cons from user reviews using advanced summarization.

---

## 🛠️ Tech Stack

- **Framework**: Next.js (App Router)
- **UI & Styling**: React, Tailwind CSS / Vanilla CSS, Leaflet Maps
- **Database**: MongoDB (Mongoose ODM)
- **AI/LLM**: Groq / Anthropic integrations
- **Authentication**: NextAuth.js
- **Media Storage**: Cloudinary

---

## 📦 Getting Started

### 1. Prerequisites
Ensure you have Node.js (v18+) and MongoDB installed locally or access to a MongoDB Atlas cluster.

### 2. Environment Setup
Create a `.env.local` file inside the `basera` directory (referencing `.env.example`):
```env
MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
GROQ_API_KEY=your_groq_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 3. Installation
Install all dependencies:
```bash
cd basera
npm install
```

### 4. Database Seeding (Optional)
To populate the database with mock cities, categories, and listings:
```bash
npm run seed
```

### 5. Running the Application
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Verification & Linting

To run ESLint check:
```bash
npm run lint
```

To compile production build:
```bash
npm run build
```
