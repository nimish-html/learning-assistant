## PRD

### 1. Purpose & Scope

Tutorati v0.1 is a no‑auth web app that **generates** and then **verifies** STEM practice questions for key competitive exams in 🇮🇳 India (JEE, NEET), 🇺🇸 US (SAT, MCAT), 🇪🇺 EU (German Abitur ‑ STEM track, French Baccalauréat Série S), and 🇦🇪 UAE (EmSAT Physics/Math, EmSAT Chemistry).
The flow is always two‑step:

1. **GenerateQuestions** → returns a **JSON array** of N questions (MCQ or Subjective).
2. **VerifyQuestions** → flags duplicates, syllabus mismatch, wrong keys.
   All traffic streams; zero page reloads.

### 2. Functional Requirements

| #    | Requirement                                                                                                                                                                                                                   |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FR‑1 | Collect six user inputs **before** any LLM call:<br/>1) Exam by country  2) Class/Standard (11 th / 12 th)  3) #Questions  4) Difficulty (Beginner/Amateur/Ninja)  5) Type (MCQ/Subjective)  6) Preferred Source (free‑text). |
| FR‑2 | **/api/generate** (POST) → streaming response using `streamObject` with `maxSteps:3` and a Zod schema enforcing `[QuestionSchema]`.                                                                                           |
| FR‑3 | **/api/verify** (POST) → streaming response; re‑runs LLM with tool‑call “validator” to ensure unique Q‑ids, answer in options etc.                                                                                            |
| FR‑4 | UI shows a minimal black‑on‑white chat; new messages append in real time via `useChat`.                                                                                                                                       |
| FR‑5 | Retry malformed JSON **once**, then surface error toast.                                                                                                                                              |
| FR‑6 | Abort controller kills requests > 30 s (matching `maxDuration`).                                                                                                                                                              |

### 3. Non‑Functional

* **Stack** Next 15 (App Router) · TypeScript 5 · TailwindCSS 4 · Vercel AI SDK v4.
* **Model** `grok‑4‑0709` via `@ai-sdk/xai`.
* **Performance** p95 end‑to‑end < 4 s for 10 questions; streamed tokens must start < 1 s.
* **Security** Only `XAI_API_KEY` env; no PII stored.
* **Accessibility** WCAG AA colour contrast.

### 4. Edge Cases & Guardrails

* Invalid instructor input (empty fields, unsupported exam) → Zod form errors.
* Duplicate questions from LLM → caught in Verify step using a Set on `stem`.
* Answer not in options (MCQ) → verifier flags & removes.
* LLM timeout or 502 → exponential back‑off (×3) then user‑visible error.


---

## Step‑by‑Step Implementation Plan

1. **Bootstrap deps**

   ```bash
   npm i @ai-sdk/xai ai @ai-sdk/react zod tailwindcss@4 jest ts-jest @testing-library/react --save - DONE
   ```
2. **Env** Add `XAI_API_KEY` to `.env.local`; git‑ignore already set. - DONE
3. **src/lib/ai.ts** – export `xai` instance & helper `grokModel = xai('grok-4-0709')`. - DONE
4. **src/lib/schema.ts** – define `QuestionSchema` & `GeneratePayloadSchema` with Zod. (One‑liner reason: centralises validation.) - DONE
5. **/api/generate** route - DONE

   * Parse body with `GeneratePayloadSchema.safeParse`.
   * Call `streamObject` with `maxSteps:3`, tool `questionGenerator` (description"); attach fallback retry.
6. **/api/verify** route - DONE

   * Accept raw question list; run `streamObject` with tool `questionVerifier`.
7. **React components** - Done

   * `QuestionForm.tsx` – controlled form, onSubmit → `/api/generate`.
   * `ChatStream.tsx` – consumes ReadableStream via `useChat`.
8. **Tailwind** – update `globals.css` dark variables; ensure premium white/black.
9. **Error handling** – toast using simple `useState`.
10. **Tests** – set up Jest & ts‑jest; write unit tests first, then integration (see suite).
11. **npm scripts** – update `package.json`:

    ```json
    { "test":"jest --coverage" }
    ```
12. **Deploy** – `vercel deploy --prod` (CI omitted for v0.1).

---

## Final File Structure

```text
public/ … (unchanged)
src/
  app/
    api/
      generate/route.ts      # step 1
      verify/route.ts        # step 2
    page.tsx                # wraps <QuestionForm><ChatStream/>
  components/
    QuestionForm.tsx
    ChatStream.tsx
  hooks/
    useStream.ts            # helper for generic SSE
  lib/
    ai.ts
    schema.ts
  tests/
    api-generate.test.ts
    api-verify.test.ts
    questionform.test.tsx
    e2e-flow.test.ts
.env.local
jest.config.js
```

---

## Key Pseudocode / Code Snippets

```ts
// src/lib/schema.ts
import { z } from 'zod';
export const QuestionSchema = z.object({
  id: z.string().uuid(),
  stem: z.string(),
  options: z.array(z.string()).min(2).max(6).optional(),
  answer: z.string(),
  explanation: z.string().optional(),
  difficulty: z.enum(['Beginner','Amateur','Ninja']),
  subject: z.string(),
});
export type Question = z.infer<typeof QuestionSchema>;

// src/app/api/generate/route.ts (excerpt)
import { streamObject, tool } from 'ai';
import { QuestionSchema } from '@/lib/schema';

const generateTool = tool({
  description:'Create N exam‑prep questions',
  parameters: z.object({
    payload: z.object({ /* same as GeneratePayloadSchema */ })
  }),
  execute: async ({ payload }) => {/* generation logic or delegate */},
});

export async function POST(req:Request){
  const body = await req.json();
  const parsed = GeneratePayloadSchema.parse(body);
  const result = streamObject({
    model: grokModel,
    maxSteps:3,
    tools:{ generate:generateTool },
    schema: z.array(QuestionSchema),
    prompt:`Generate ${parsed.count} ${parsed.type} questions …`,
  });
  return result.toDataStreamResponse();
}
```

---

## Automated Test Suite

* **Coverage goal** ≥ 90 % lines.
* **Unit Tests**

  * `schema.test.ts` – Zod schema guards invalid question/object.
  * `ai.test.ts` – mocks `grokModel` call + retries on malformed JSON.
* **Integration Tests (Jest + @testing-library/react)**

  * `api-generate.test.ts` – hit route with sample payload, expect stream & valid JSON.
  * `api-verify.test.ts` – feed duplicate Qs, expect flagged errors.
  * `questionform.test.tsx` – fill form, assert POST fired.
* **E2E Happy Path** (optional Playwright) – create 5 MCQs and verify output displayed.

---

<!-- CURRENT_FILE_STRUCTURE_PLACEHOLDER -->

<!-- VERCEL_AI_SDK_DOC_SNIPPETS -->
