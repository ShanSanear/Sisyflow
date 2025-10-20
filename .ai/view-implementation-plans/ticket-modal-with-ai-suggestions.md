# Plan implementacji widoku Ticket Modal View z Integracją AI (Future Feature w MVP)

Ten dokument zawiera elementy integracji AI (sugestie, analiza, rating, ai_enhanced flag) dla Ticket Modal View, które są częścią szerszego MVP ale implementowane w kolejnym kroku po basic CRUD. Core modal bez AI: patrz ticket-modal.md. Używa Openrouter.ai dla AI calls (via backend API), react-markdown dla preview (dodaj dependency jeśli potrzeba, npm i react-markdown).

## Przeniesione Sekcje z ticket-modal.md

### 4.4 AIAnalysisButton (Future)

- Opis komponentu: Przycisk do uruchamiania analizy AI (po basic form fill).
- Główne elementy: `<Button onClick={handleAnalyze}>Poproś o sugestie AI <Loader if loading /></Button>` (Shadcn, z Spinner).
- Obsługiwane zdarzenia: onClick – POST /ai-suggestion-sessions/analyze z {title, description}, set loading, handle response (set suggestions).
- Typy: `AnalyzeTicketCommand`.
- Propsy: `{ onAnalyze: () => void, isLoading: boolean }`. Po analizie: pokaż AISuggestionsList.

### 4.5 AISuggestionsList (Future)

- Opis komponentu: Dynamiczna lista sugestii AI z przyciskami „Dodaj” i checkboxami (po analizie).
- Główne elementy: `<ul className="mt-4 space-y-2">` z itemami: dla INSERT – `<Button size="sm" onClick={() => onApplyInsert(content)}>Dodaj</Button>` (wstawia do description na końcu + \n\n); dla QUESTION – `<Checkbox onCheckedChange={() => onApplyQuestion(index)}>Zastosowano</Checkbox>`.
- Obsługiwane zdarzenia: onClick/onCheckedChange – apply (set applied=true, ai_enhanced=true w ticket), update formData.
- Obsługiwana walidacja: Brak, ale track applied (jeśli any applied → show AIRating).
- Typy: `AISuggestionSessionDTO['suggestions']` (array<{type: 'INSERT'|'QUESTION', content: string, applied: boolean}>).
- Propsy: `{ suggestions: AISuggestionSessionDTO['suggestions'], onApplyInsert: (content: string) => void, onApplyQuestion: (index: number) => void }`.

### 4.6 AIRating (Future)

- Opis komponentu: Komponent oceny gwiazdkami 1-5 po zastosowaniu sugestii AI.
- Główne elementy: Custom StarRating (5 Button variant="ghost" z StarIcon z lucide-react, clickable) lub Shadcn Rating.
- Obsługiwane zdarzenia: onClick – set rating (1-5), PUT /ai-suggestion-sessions/:id/rating na submit.
- Obsługiwana walidacja: Opcjonalna, ale required jeśli suggestions applied.
- Typy: `RateAISuggestionCommand` ({rating: number | null}).
- Propsy: `{ rating: number | null, onRate: (rating: number) => void, sessionId: string }`. Zapisz z ticket submit.

### DescriptionEditor z Markdown Preview (Future Enhancement)

- Opis komponentu: Ulepszone pole z podglądem Markdown.
- Główne elementy: `<div className="grid md:grid-cols-2 gap-4"> <Textarea onChange={updatePreview} /> <div className="prose max-h-96 overflow-auto"> <MarkdownPreview value={markdownValue} /> </div> </div>` (użyj react-markdown dla preview, import Markdown from 'react-markdown';).
- Obsługiwane zdarzenia: onChange – update value i live preview.
- Typy: `string` (Markdown-supported).
- Propsy: `{ value: string, onChange: (value: string) => void, error?: string }`. W 'view': render full Markdown via Markdown component. Dodaj dependency: npm i react-markdown rehype-raw (dla raw HTML w MD).

## 7. Integracja API (AI Parts, Future)

- **POST /ai-suggestion-sessions/analyze**: Analiza AI – request: `AnalyzeTicketCommand` ({title, description}), response: `AISuggestionSessionDTO` (200), z loading spinnerem (Openrouter.ai via backend, fetch project docs z GET /project-documentation).
- **PUT /ai-suggestion-sessions/:id/rating**: Ocena – request: `{rating: number | null}`, brak response body (200).

Calls via fetch do /api, error handling (log to ai_errors table via Supabase insert jeśli 500).

## 8. Interakcje użytkownika (AI Flow, Future)

- Analiza AI: Klik „Poproś o sugestie AI” po fill title/desc – loading, potem lista sugestii. Jeśli brak – toast „Opis kompletny”.
- Zastosowanie sugestii: „Dodaj” wstawia tekst na końcu opisu (+2 nowe linie), checkbox oznacza applied i set ai_enhanced=true w ticket (update formData lub separate state).
- Ocena: Wybór gwiazdek po sugestiach, zapisz przy submit (jeśli applied).
- Ticket z AI: Set ai_enhanced=true w POST/PUT /tickets, render ikonę w TicketCard (lucide MagicWand).

## 11.2 Kroki implementacji AI (Future Step w MVP)

1. Dodaj AIAnalysisButton po TicketForm.
2. Implementuj AISuggestionsList i AIRating z logiką apply/rate (update description, set ai_enhanced).
3. Integruj API calls (POST analyze, PUT rating) z error handling (toast + insert to ai_errors).
4. Ulepsz DescriptionEditor z Markdown preview (react-markdown).
5. Uruchom `npm run lint:fix` i `npm run format`.
6. Testuj: analiza, apply, rating, edge cases (błędy AI, brak docs).

## 12. Kroki implementacji w drugiej rundzie - AI (Future)

1. Zaimplementuj `AISuggestionsList` i `AIRating` z logiką apply/rate.
2. Zaimplementuj obsługę błędów i ich zapisywanie do tabeli ai_errors (Supabase insert on 500).
3. Uruchom `npm run lint:fix` i `npm run format`.
4. Przetestuj edge cases: błędy, mobile, permissions (AI tylko dla logged users).
