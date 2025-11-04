# API Endpoint Implementation Plan: PATCH /api/ai-suggestion-sessions/:id/ticket-id

## 1. Przegląd punktu końcowego

Endpoint umożliwia aktualizację identyfikatora ticketu w istniejącej sesji sugestii AI. Pozwala na przypisanie lub zmianę powiązania sesji z konkretnym ticketem w systemie. Operacja wymaga uwierzytelnienia i sprawdza uprawnienia użytkownika - tylko właściciel sesji może ją modyfikować.

## 2. Szczegóły żądania

- **Metoda HTTP**: PATCH
- **Struktura URL**: `/api/ai-suggestion-sessions/:id/ticket-id`
  - `:id` - UUID identyfikujący sesję sugestii AI
- **Parametry**:
  - **Wymagane**:
    - `id` (path parameter): UUID sesji sugestii AI
    - `ticket_id` (request body): UUID ticketu do przypisania
  - **Opcjonalne**: brak
- **Request Body**:

```json
{
  "ticket_id": "uuid-string"
}
```

## 3. Wykorzystywane typy

- **UpdateAISuggestionSessionTicketIdCommand**:

```typescript
interface UpdateAISuggestionSessionTicketIdCommand {
  ticket_id: string;
}
```

- **updateAISuggestionSessionTicketIdSchema** (Zod):

```typescript
const updateAISuggestionSessionTicketIdSchema = z.object({
  ticket_id: z.string().uuid("Invalid ticket ID format - must be a valid UUID"),
});
```

## 4. Szczegóły odpowiedzi

- **Sukces (200 OK)**: Pusta odpowiedź (brak body)
- **Błędy**:
  - `400 Bad Request`: Nieprawidłowy format UUID lub JSON
  - `401 Unauthorized`: Brak uwierzytelnienia
  - `403 Forbidden`: Brak uprawnień do modyfikacji sesji
  - `404 Not Found`: Sesja lub ticket nie istnieje
  - `500 Internal Server Error`: Błąd serwera

## 5. Przepływ danych

1. **Uwierzytelnienie**: Sprawdź czy użytkownik jest zalogowany
2. **Walidacja parametrów**: Sprawdź format UUID dla id i ticket_id
3. **Autoryzacja**: Pobierz sesję i sprawdź czy należy do aktualnego użytkownika
4. **Walidacja biznesowa**: Sprawdź czy ticket istnieje (jeśli podany)
5. **Aktualizacja**: Wykonaj UPDATE w tabeli ai_suggestion_sessions
6. **Odpowiedź**: Zwróć sukces lub odpowiedni błąd

## 6. Względy bezpieczeństwa

- **Uwierzytelnienie**: Wymagane - tylko zalogowani użytkownicy mogą wykonywać operację
- **Autoryzacja**: Tylko właściciel sesji może ją modyfikować (sprawdzenie user_id sesji)
- **Walidacja danych**: UUID format validation, sprawdzenie istnienia ticketu
- **RLS**: Korzysta z Row-Level Security Supabase do dodatkowej ochrony - tylko użytkownik który utworzył daną sesję lub administrator ma uprawnienia do dokonania zmian
- **SQL Injection**: Zapobiega przez używanie parameterized queries Supabase

## 7. Obsługa błędów

- **400 Bad Request**:
  - Nieprawidłowy format JSON w request body
  - Nieprawidłowy format UUID dla ticket_id
- **401 Unauthorized**: Użytkownik nie jest uwierzytelniony
- **403 Forbidden**: Próba modyfikacji sesji innego użytkownika
- **404 Not Found**:
  - Sesja o podanym ID nie istnieje
  - Ticket o podanym ID nie istnieje
- **500 Internal Server Error**: Błędy połączenia z bazą danych lub nieoczekiwane błędy serwera

Wszystkie błędy są logowane do konsoli z odpowiednim kontekstem.

## 8. Rozważania dotyczące wydajności

- **Optymalizacja zapytań**: Używa indeksów na kluczach obcych (ticket_id, user_id)
- **Minimalne zapytania**: Wykonuje tylko niezbędne SELECT i UPDATE operacje
- **Buforowanie**: Nie dotyczy - operacja modyfikująca dane
- **Skalowalność**: Korzysta z istniejącej infrastruktury Supabase

## 9. Etapy wdrożenia

1. **Dodaj schemat walidacji Zod** w `src/lib/validation/schemas/ai.ts`:
   - Dodaj `updateAISuggestionSessionTicketIdSchema`
   - Export typu `UpdateAISuggestionSessionTicketIdCommand`

2. **Rozszerz typy** w `src/types.ts`:
   - Dodaj interface `UpdateAISuggestionSessionTicketIdCommand`

3. **Rozszerz service** w `src/lib/services/ai-suggestion-sessions.service.ts`:
   - Dodaj metodę `updateAISuggestionSessionTicketId`
   - Zaimplementuj sprawdzenie uprawnień i walidację

4. **Utwórz endpoint API** w `src/pages/api/ai-suggestion-sessions/[id]/ticket-id.ts`:
   - Implementuj obsługę PATCH zgodnie ze wzorcem istniejących endpointów
   - Dodaj odpowiednie nagłówki `export const prerender = false`

5. **Przetestuj endpoint**:
   - Testy jednostkowe dla service
   - Testy integracyjne dla endpointu
   - Testy bezpieczeństwa (autoryzacja, walidacja)
