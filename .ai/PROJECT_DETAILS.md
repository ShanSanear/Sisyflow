<conversation_summary>
<decisions>

1.  **Role i Uprawnienia:**
    - **Administrator:** Może modyfikować wszystkie pola każdego ticketa, zarządzać dokumentacją projektu, dodawać/usuwać użytkowników oraz usuwać tickety.
    - **Użytkownik:** Widzi wszystkie tickety. Może modyfikować tylko tickety, które sam zgłosił.
    - **Pierwszy zarejestrowany użytkownik automatycznie staje się administratorem.**
2.  **Zarządzanie Użytkownikami:**
    - Administrator ręcznie dodaje nowych użytkowników do systemu i ustawia im hasła początkowe.
    - System uniemożliwia dodanie użytkownika z adresem e-mail, który już istnieje w bazie.
3.  **Zarządzanie Ticketami:**
    - **Typy:** Bug, Improvement, Task.
    - **Pola Wymagane:** Tytuł i Typ są obowiązkowe przy tworzeniu.
    - **Statusy:** Otwarty, W toku, Zamknięty. Zmiana statusu jest możliwa dla osoby przypisanej, zgłaszającego oraz administratora.
    - **Widok:** Główny interfejs to tablica Kanban z kolumnami odpowiadającymi statusom. Zmiana statusu odbywa się przez "drag and drop".
    - **Przypisywanie:** Każdy może przypisać się do ticketa który nie ma osoby przypisanej. Administrator może przypisać dowolną osobę. Osoba przypisana może się odpisać.
4.  **Funkcjonalność AI:**
    - **Uruchamianie:** Użytkownik klika dedykowany przycisk, aby uruchomić analizę AI. W trakcie analizy wyświetlany jest stan ładowania.
    - **Kontekst:** Cała dokumentacja projektu (wprowadzana przez admina w jednym polu tekstowym, limit 20 000 znaków) jest dołączana do zapytania do AI.
    - **Interfejs Sugestii:** System rozróżnia dwa typy podpowiedzi: te do wstawienia (z przyciskiem "Dodaj") i pytania otwarte (z checkboxem "Zastosowano").
    - **Oznaczenie Użycia:** Ticket, w którym użyto sugestii AI, jest oznaczony ikoną "magicznej różdżki".
5.  **Priorytety Rozwoju:**
    - **Etap 1:** Podstawowy system CRUD dla użytkowników i ticketów.
    - **Etap 2:** Integracja funkcjonalności sugestii AI.
6.  **Funkcje Poza MVP:**
    _ System powiadomień.
    _ Wyszukiwarka i zaawansowane filtrowanie na tablicy Kanban.
    </decisions>

<matched_recommendations>

1.  **Interfejs:** Głównym widokiem będzie tablica Kanban z funkcją "drag and drop", co jest standardem w tego typu narzędziach i ułatwia zarządzanie przepływem pracy.
2.  **Doświadczenie Użytkownika (AI):** Wprowadzono rozróżnienie na dwa typy sugestii (do wklejenia i otwarte), co czyni funkcję bardziej elastyczną. Ticket, w którym użyto AI, zostanie oznaczony ikoną "magicznej różdżki" dla lepszej widoczności.
3.  **Administracja:** Zarządzanie dokumentacją projektu odbywa się przez jedno pole tekstowe w panelu admina, co upraszcza implementację. Wprowadzono limit znaków (20 000) w celu kontroli kosztów i wydajności API.
4.  **Uprawnienia:** Zdefiniowano spójny model uprawnień, w którym administrator ma pełną kontrolę, a uprawnienia do kluczowych akcji (zmiana statusu, przypisania) są jasno określone.
5.  **Tekst:** Wprowadzono wsparcie dla formatowania Markdown w opisach ticketów, co znacząco podniesie czytelność treści.
6.  **Obsługa Błędów:** W przypadku problemów z AI, system wyświetli zrozumiały komunikat i pozwoli ponowić próbę, co jest lepszym rozwiązaniem niż pokazywanie technicznych błędów.
7.  **Zarządzanie Ticketami:** Określono, że `Tytuł` i `Typ` są polami wymaganymi, co zapewni spójność danych od samego początku.
    </matched_recommendations>

<prd_planning_summary>

### Podsumowanie Planowania PRD

Celem projektu jest stworzenie systemu do śledzenia zadań (issue tracker), który rozwiązuje problem niekompletnych i niejasnych zgłoszeń poprzez integrację z AI, sugerującą, jak można wzbogacić opis ticketa.

#### Główne Wymagania Funkcjonalne

1.  **System Użytkowników:** Dwie role (Użytkownik, Administrator). Administrator manualnie zarządza kontami użytkowników.
2.  **Zarządzanie Ticketami (CRUD):**
    - Tworzenie ticketów 3 typów: Bug, Improvement, Task.
    - Pola: Tytuł (wymagany), Opis (Markdown), Typ (wymagany), Zgłaszający (wymagany, domyślnie osoba która go tworzy), Osoba przypisana (niewymagany).
    - Widok główny w formie tablicy Kanban (Otwarty, W toku, Zamknięty) z obsługą "drag and drop".
    - Wszyscy użytkownicy widzą wszystkie tickety.
3.  **Integracja z AI:**
    - Przycisk w formularzu ticketa uruchamiający analizę opisu.
    - AI na podstawie opisu i dokumentacji projektu (dostarczanej przez admina) generuje listę sugestii.
    - Sugestie są dwojakiego rodzaju: konkretne frazy do wstawienia do opisu oraz pytania otwarte, które użytkownik może oznaczyć jako zastosowane.
4.  **Panel Administratora:**
    - Zarządzanie użytkownikami (dodawanie/usuwanie).
    - Edycja dokumentacji projektu w jednym polu tekstowym.
    - Możliwość usuwania ticketów.

#### Kluczowe Historie Użytkownika i Ścieżki Korzystania

- **Tworzenie Zgłoszenia:** Użytkownik tworzy nowy ticket, wypełniając tytuł i typ. Następnie dodaje opis i klika przycisk "Poproś o sugestie AI". Po otrzymaniu listy podpowiedzi, dodaje brakujące informacje do opisu i zapisuje ticket.
- **Zarządzanie Pracą:** Użytkownik przegląda tablicę Kanban. Przypisuje się do wolnego zadania, przeciągając je do kolumny "W toku". Po zakończeniu pracy, przeciąga je do kolumny "Zamknięty".
- **Zarządzanie użytkownikami:** Administrator dodaje nowego użytkownika do systemu.
- **Konfiguracja kontekstu dla AI:** Administrator przechodzi do panelu, aby zaktualizować dokumentację projektu, która będzie używana jako kontekst dla AI.

#### Kryteria Sukcesu i Sposoby Ich Mierzenia

1.  **Jakość Sugestii:** 70% wygenerowanych przez AI podpowiedzi ma ocenę 4 lub 5 gwiazdek.
    - **Pomiar:** System będzie zbierał oceny (1-5) od użytkowników dla każdej wygenerowanej sugestii.
2.  **Wpływ na Jakość Ticketów:** 90% ticketów, w których AI wykryło potrzebę doprecyzowania, zostało zmodyfikowanych i rozszerzonych.
    - **Pomiar:** System odnotuje, czy po wygenerowaniu sugestii dokonano edycji opisu ticketa, a jego długość wzrosła o co najmniej 10%.

</prd_planning_summary>

<unresolved_issues>
Na podstawie przeprowadzonej serii pytań i odpowiedzi, wszystkie kluczowe aspekty wymagane do stworzenia PRD dla MVP zostały zdefiniowane. Obecnie nie ma istotnych, nierozwiązanych kwestii.
</unresolved_issues>
</conversation_summary>
