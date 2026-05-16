# SOP: Gemini API Integration (Planned)

## Goal
Add AI-powered financial insights using Google's Gemini API.

## Package
```
npm install @google/genai
```

## Client Setup
```typescript
// src/lib/gemini.ts
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export default ai;
```

## Environment Variables
```
VITE_GEMINI_API_KEY=<your-api-key>
```

## Usage Pattern
```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.0-flash',
  contents: prompt,
});
const text = response.text;
```

## Planned Features
| Feature | Prompt Strategy |
|---|---|
| Spending Insights | Send monthly transaction summary → get analysis |
| Budget Recommendations | Send spending patterns → get suggested limits |
| NLP Expense Entry | User types "$45 lunch yesterday" → parse into Transaction |
| Anomaly Detection | Send category trends → flag unusual spikes |

## Security (IMPORTANT)
- **Development**: Client-side API key is acceptable for prototyping
- **Production**: Route all Gemini calls through a Supabase Edge Function or backend proxy
- **Never** include raw API keys in version control — use `.env.local`

## Edge Cases
- **API rate limits**: Implement debouncing and caching for insight requests
- **API downtime**: Show cached insights, disable AI features gracefully
- **Hallucination**: Validate parsed transaction data (amounts, dates) before saving
- **Token limits**: Summarize transaction data before sending — never send raw full history

## Prompt Engineering Notes
- Always include the user's currency in prompts
- Struct output: request JSON responses for parseable data
- System instruction: "You are a personal finance advisor. Be concise and actionable."
