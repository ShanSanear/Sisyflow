<conversation_summary>
<decisions>
Interfejs nawigacyjny będzie składał się z górnego, stałego paska zawierającego linki do "Tablicy Kanban", "Mojego profilu" oraz przyciski "Utwórz" (ticket) i "Wyloguj".
Zarządzanie stanem aplikacji będzie oparte o wbudowane mechanizmy React (Context API, useState), bez wprowadzania zewnętrznych bibliotek do zarządzania stanem serwera w ramach MVP.
Obsługa błędów będzie realizowana przez globalne powiadomienia ("toasts") dla błędów serwera oraz komunikaty "inline" dla błędów walidacji w formularzach.
Tablica Kanban załaduje wszystkie tickety przy starcie, bez paginacji i "infinite scroll". Funkcjonalność "przeciągnij i upuść" zostanie zaimplementowana przy użyciu dnd-kit.
Projekt będzie realizowany w podejściu "desktop-first". Widok na urządzeniach mobilnych dla tablicy Kanban zostanie zrealizowany poprzez horyzontalne przewijanie.
Tworzenie, edycja i podgląd szczegółów ticketów będą odbywać się w oknach modalnych, aby nie opuszczać widoku tablicy Kanban. Modal do edycji będzie tym samym komponentem co modal do tworzenia.
Zostanie zaimplementowany przełącznik motywu (jasny/ciemny) umieszczony w widoku "Mój profil".
Długie tytuły ticketów na kartach będą skracane z wielokropkiem, a pełna treść będzie widoczna w tooltipie po najechaniu myszą.
Wszelkie akcje destrukcyjne (usuwanie użytkownika/ticketa) będą wymagały dodatkowego potwierdzenia w oknie dialogowym typu AlertDialog.
Aplikacja nie będzie implementować specjalnych widoków dla pustych stanów tablicy Kanban.
Zostaną zaimplementowane subtelne animacje i przejścia dla okien modalnych i powiadomień.
Następujące funkcjonalności zostały jawnie przeniesione poza zakres MVP: filtrowanie ticketów po stronie klienta, wyświetlanie statystyk w panelu admina, lista ticketów w profilu użytkownika.
</decisions>
<matched_recommendations>
Kluczowe komponenty interfejsu zostaną zbudowane w oparciu o bibliotekę Shadcn/ui, w tym: Dialog (okna modalne), Button, DropdownMenu, Select, Input, Textarea, Badge (etykiety typów ticketów) oraz AlertDialog (potwierdzenia akcji).
Dostępność zostanie zapewniona poprzez stosowanie semantycznego HTML oraz implementację alternatywnej obsługi "przeciągnij i upuść" za pomocą klawiatury (menu kontekstowe).
Stany ładowania danych będą wizualizowane przy pomocy komponentów "skeleton" dla głównego widoku tablicy oraz wskaźników "spinner" wewnątrz okien modalnych.
Po pomyślnym utworzeniu ticketa, modal zamknie się automatycznie, a na ekranie pojawi się powiadomienie o sukcesie ("toast"), po czym tablica Kanban zostanie odświeżona.
Wizualna identyfikacja typów ticketów na kartach będzie oparta na kolorowych etykietach (Badge): Bug (czerwony), Improvement (niebieski), Task (szary).
W przypadku wygaśnięcia sesji użytkownika (błąd API 401), aplikacja automatycznie przekieruje go na stronę logowania z odpowiednim komunikatem.
Formatowanie Markdown w opisach ticketów będzie renderowane w trybie tylko do odczytu przy użyciu biblioteki react-markdown.
Interaktywność kart na tablicy Kanban będzie sygnalizowana wizualnie poprzez zmianę cienia i koloru tła po najechaniu kursorem.
Ikona "magicznej różdżki" oznaczająca użycie AI będzie zawierała tooltip wyjaśniający jej znaczenie.
Logika przełączania między formularzem rejestracji a logowania będzie oparta na zapytaniu do API sprawdzającym, czy w systemie istnieją jacykolwiek użytkownicy.
</matched_recommendations>
<ui_architecture_planning_summary>
Na podstawie przeprowadzonej dyskusji, architektura interfejsu użytkownika dla MVP Sisyflow została zaplanowana w następujący sposób:
a. Główne wymagania dotyczące architektury UI
Architektura będzie oparta na frameworku Astro z wykorzystaniem React do komponentów interaktywnych. Głównym założeniem jest prostota i szybkość wdrożenia, z wykorzystaniem gotowych, dostępnych komponentów z biblioteki Shadcn/ui. Projekt będzie realizowany w podejściu "desktop-first", z zapewnieniem podstawowej użyteczności na urządzeniach mobilnych. Aplikacja będzie posiadała tryb jasny i ciemny.
b. Kluczowe widoki, ekrany i przepływy użytkownika
Uwierzytelnianie: Osobne widoki dla logowania i rejestracji. Aplikacja dynamicznie wybierze odpowiedni widok przy pierwszym uruchomieniu.
Główny widok (Tablica Kanban): Centralny punkt aplikacji wyświetlający tickety w trzech kolumnach (Otwarty, W toku, Zamknięty). Użytkownicy mogą zmieniać status ticketów metodą "przeciągnij i upuść".
Przepływ zarządzania ticketami: Użytkownik tworzy, przegląda i edytuje tickety za pomocą okien modalnych, nie opuszczając widoku tablicy Kanban. Interakcja z AI również odbywa się w tym samym modalu.
Panel Administratora: Dedykowany widok z nawigacją (zakładki lub menu boczne) prowadzącą do dwóch podsekcji: Zarządzanie Użytkownikami (widok tabelaryczny) i Zarządzanie Dokumentacją Projektu (pole tekstowe).
Profil Użytkownika: Prosty widok umożliwiający zmianę nazwy użytkownika oraz przełączanie motywu kolorystycznego.
c. Strategia integracji z API i zarządzania stanem
Zarządzanie stanem: Wykorzystane zostaną wbudowane mechanizmy React: Context API do przechowywania globalnych danych (np. informacje o zalogowanym użytkowniku) oraz useState do zarządzania stanem lokalnym komponentów. MVP nie będzie korzystać z zewnętrznych bibliotek do zarządzania stanem serwera.
Komunikacja z API: Bezpośrednie wywołania do API REST z obsługą stanów ładowania (skeleton/spinner) i błędów (toasts/inline messages).
Odświeżanie danych: Po każdej operacji zapisu (utworzenie/edycja ticketa), dane na tablicy Kanban będą odświeżane w celu natychmiastowego odzwierciedlenia zmian.
d. Kwestie dotyczące responsywności, dostępności i bezpieczeństwa
Responsywność: Aplikacja jest projektowana z myślą o desktopach. Na urządzeniach mobilnych tablica Kanban będzie przewijana horyzontalnie.
Dostępność: Wykorzystanie semantycznego HTML. Funkcjonalność "przeciągnij i upuść" będzie posiadała alternatywną obsługę z klawiatury za pomocą menu kontekstowego.
Bezpieczeństwo: Ochrona tras będzie realizowana przez Astro middleware. Interfejs będzie dynamicznie ukrywał lub blokował kontrolki administracyjne (np. przycisk usuwania użytkownika) w oparciu o rolę zalogowanego użytkownika. Administrator nie będzie miał możliwości usunięcia własnego konta z poziomu UI.
</ui_architecture_planning_summary>
<unresolved_issues>
Wszystkie kluczowe kwestie dotyczące architektury UI dla wersji MVP zostały omówione i rozstrzygnięte. Następujące punkty zostały świadomie zidentyfikowane jako funkcjonalności "post-MVP" i nie wymagają dalszych wyjaśnień na obecnym etapie:
Filtrowanie ticketów po tytule na tablicy Kanban.
Wyświetlanie list ticketów zgłoszonych i przypisanych na stronie profilu użytkownika.
Panel informacyjny ze statystykami w panelu Administratora.
</unresolved_issues>
</conversation_summary>
