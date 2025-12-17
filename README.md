# BANDITS AI Mapper

An AI-first data normalization tool built with Next.js, Shadcn UI, and OpenAI. This application ingests CSV files of arbitrary structure, uses an LLM to map them to a canonical product model, and enriches the data with AI-generated descriptions.

## 🚀 Features

- **Smart CSV Parsing:** Client-side parsing via PapaParse with lightweight heuristics:
  - delimiter detection (comma/semicolon)
  - header row detection (handles preambles/junk lines before the header)
  - automatic transpose for pivoted CSVs (attributes as rows, entities as columns)
- **AI-First Mapping:** Uses OpenAI (GPT-5-mini) to semantically analyze column headers and map them to a strict canonical schema.
- **Local Transformation:** Applies the mapping logic locally in the browser to handle large datasets efficiently without excessive token usage.
- **Type Safety:** Automatically parses and cleans numeric fields (Cost, Price, Year) from raw string data.
- **Bonus: AI Enrichment:** Generates engaging e-commerce descriptions for the top 10 products using context-aware LLM prompts.

## 🛠️ Tech Stack

- **Framework:** Next.js 16.0.10 (App Router)
- **UI/Styling:** Tailwind CSS, Shadcn UI
- **AI Integration:** OpenAI API - GPT 5 Mini
- **Data Handling:** PapaParse

## 📦 How to Run

1.  **Clone the repository:**

    ```bash
    git clone [https://github.com/Soptik1290/bandits-csv-mapper.git](https://github.com/Soptik1290/bandits-csv-mapper.git)
    cd bandits-csv-mapper
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env.local` file in the root directory and add your OpenAI API key:

    ```env
    OPENAI_API_KEY=sk-proj-....
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🧠 How AI Mapping Works

To ensure efficiency and strictly follow the "AI-first, but optimized" requirement:

1.  **Sampling:** The app extracts only the **headers** and the **first 5 rows** of the CSV.
2.  **Reasoning:** This lightweight payload is sent to the LLM. The prompt instructs the AI to act as a "Data Mapping Expert" and return a JSON object mapping CSV columns to the Canonical Model fields (e.g., `set_id` → `id`, `US_retailPrice` → `price`).
3.  **Execution (Token Efficient):** The returned mapping logic is applied to the full dataset **locally in the browser**. This adheres to the requirement to minimize token usage, as we never send the full dataset (which could be millions of rows) to the API.

## ✨ Bonus: Data Enrichment

I implemented the enrichment feature for the first 10 items:

- Users can click "Enrich First 10".
- The app sends the normalized data to the LLM.
- The LLM generates a 1-3 sentence factual description based strictly on available attributes (avoiding hallucinations).

## 🔮 Future Improvements (Production)

If this were a production app, I would add:

- **More robust CSV ingestion:** Support tabs/pipes, quoted multiline fields, and stricter detection for edge-case files.
- **Batch Processing:** For enrichment of thousands of rows, I would implement a queue system (e.g., BullMQ).
- **User Feedback Loop:** Allow users to manually correct the AI's suggested mapping before applying it.
