# Dokument wymagań produktu (PRD) - Sisyflow

## 1. Przegląd produktu

Sisyflow to aplikacja typu "issue tracker" w wersji MVP (Minimum Viable Product), zaprojektowana w celu rozwiązania powszechnego problemu niekompletnych lub niejasnych zgłoszeń zadań. Głównym celem systemu jest usprawnienie komunikacji w zespołach poprzez integrację z mechanizmem AI, który analizuje opisy ticketów i proaktywnie sugeruje autorom, jakie informacje warto dodać, aby zgłoszenie było kompletne i zrozumiałe dla wykonawcy.

## 2. Problem użytkownika

W obecnych systemach do śledzenia zadań, użytkownicy często tworzą zgłoszenia (błędy, usprawnienia, zadania) bez dostarczania wystarczającego kontekstu. Prowadzi to do sytuacji, w której osoba przypisana do zadania musi prowadzić dodatkową komunikację z autorem zgłoszenia, aby uzyskać niezbędne informacje. Ten proces generuje opóźnienia, obniża produktywność i może prowadzić do frustracji po obu stronach. Brakuje narzędzia, które wspierałoby zgłaszającego w tworzeniu wyczerpujących opisów już na etapie tworzenia ticketa.

## 3. Wymagania funkcjonalne

### 3.1. System użytkowników i ról

- Aplikacja obsługuje dwie role: Administrator i Użytkownik.
- Pierwszy zarejestrowany użytkownik automatycznie otrzymuje rolę Administratora.
- Administrator jest odpowiedzialny za ręczne dodawanie nowych użytkowników i ustawianie im haseł początkowych.
- System uniemożliwia dodanie użytkownika z adresem e-mail, który już istnieje w bazie danych.
- Uprawnienia:
  - _Użytkownik_: Może tworzyć tickety, edytować zgłoszone przez siebie tickety (z wyjątkiem pola "Osoba zgłaszająca"), przypisywać się do ticketów bez przypisanej osoby, zmieniać statusy ticketów, których jest autorem lub osobą przypisaną.
  - _Administrator_: Posiada pełne uprawnienia użytkownika oraz dodatkowo może modyfikować wszystkie pola każdego ticketa, zarządzać dokumentacją projektu, dodawać/usuwać użytkowników oraz usuwać dowolne tickety.

### 3.2. Zarządzanie ticketami (CRUD)

- Użytkownicy mogą tworzyć tickety trzech typów: `Bug`, `Improvement`, `Task`.
- Każdy ticket składa się z następujących pól:
  - Tytuł (pole wymagane).
  - Opis (plain text w MVP, future: obsługuje formatowanie Markdown).
  - Typ (pole wymagane, wybór z predefiniowanej listy).
  - Osoba zgłaszająca (ustawiana automatycznie).
  - Osoba przypisana.
- Tickety posiadają trzy statusy: `Otwarty`, `W toku`, `Zamknięty`.
- Głównym interfejsem do zarządzania ticketami jest tablica Kanban z kolumnami odpowiadającymi statusom.
- Zmiana statusu ticketa odbywa się poprzez przeciągnięcie go do odpowiedniej kolumny (drag and drop).

### 3.3. Integracja z AI (Future MVP Step)

W formularzu tworzenia/edycji ticketa dostępny będzie dedykowany przycisk uruchamiający analizę AI (via backend z Openrouter.ai, kontekst z Supabase project_documentation).

- AI analizuje tytuł i opis ticketa w kontekście dokumentacji projektu (zarządzanej przez Admin w Supabase table).
- Dokumentacja projektu jest zarządzana przez Administratora w jednym polu tekstowym (limit 20 000 znaków).
- System generuje dwa typy sugestii:
  - _Sugestie do wstawienia_: Konkretne fragmenty tekstu z przyciskiem "Dodaj", który wstawia je do opisu.
  - _Pytania otwarte_: Pytania kontrolne z checkboxem "Zastosowano", który użytkownik może zaznaczyć.
- Ticket, w którym użyto sugestii AI, jest oznaczony specjalną ikoną ("magiczna różdżka") i odpowiednią flagą w bazie danych.
- Zgłaszający ma możliwość oceny jakości podpowiedzi w skali od 1 do 5 gwiazdek (przechowywanych w bazie danych).
- Jeśli AI nie znajdzie potencjalnych braków w opisie, wyświetli stosowny komunikat.

### 3.4. Panel Administratora

- Dostępna jest dedykowana sekcja do zarządzania systemem.
- Funkcje panelu:
  - Zarządzanie użytkownikami (dodawanie/usuwanie).
  - Zarządzanie dokumentacją projektu używaną jako kontekst dla AI.

## 4. Granice produktu

Następujące funkcjonalności nie wchodzą w zakres wersji MVP:

- Wielokrotne wywoływanie AI dla tego samego opisu w ramach jednej sesji edycji.
- Obsługa więcej niż jednego projektu w ramach jednej instancji aplikacji.
- Możliwość istnienia więcej niż jednego Administratora.
- Integracje z zewnętrznymi systemami (np. Git, inne issue trackery).
- Aplikacje desktopowe lub mobilne (MVP jest wyłącznie aplikacją webową).
- System powiadomień (np. e-mail, w aplikacji).
- Zaawansowane wyszukiwanie i filtrowanie na tablicy Kanban.
- System załączników oraz komentarzy

## 5. Historyjki użytkowników

### 5.1. Uwierzytelnianie i autoryzacja

- ID: US-001
- Tytuł: Rejestracja pierwszego użytkownika jako Administrator
- Opis: Jako pierwszy użytkownik aplikacji, chcę założyć konto, które automatycznie otrzyma uprawnienia Administratora, abym mógł zacząć konfigurować system.
- Kryteria akceptacji:
  1.  Gdy baza użytkowników jest pusta, formularz rejestracji jest dostępny.
  2.  Po poprawnym wypełnieniu formularza (e-mail, hasło) i jego zatwierdzeniu, tworzone jest nowe konto użytkownika.
  3.  Stworzone konto ma przypisaną rolę "Administrator".
  4.  Po rejestracji użytkownik jest automatycznie zalogowany (US-002) i przekierowany do głównego widoku aplikacji, w którym widzi top bara.

- ID: US-002
- Tytuł: Logowanie do systemu
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się do aplikacji przy użyciu mojego adresu e-mail i hasła, aby uzyskać dostęp do swoich zadań.
- Kryteria akceptacji:
  1.  Na stronie logowania znajdują się pola na e-mail i hasło.
  2.  Po wprowadzeniu poprawnych danych i zatwierdzeniu formularza, użytkownik uzyskuje dostęp do aplikacji i jest przekierowywany do głównego widoku aplikacji, w którym widzi top bara.
  3.  Po wprowadzeniu niepoprawnych danych, wyświetlany jest komunikat o błędzie.
  4.  Użytkownik NIE MOŻE dostać się do innych zabezpieczonych stron aplikacji (takich jak `/board` czy `/`) bez uprzedniego zalogowania się.

### 5.2. Zarządzanie użytkownikami (Administrator)

- ID: US-003
- Tytuł: Dodawanie nowego użytkownika
- Opis: Jako Administrator, chcę móc dodać nowego użytkownika do systemu, podając jego adres e-mail i hasło początkowe, aby mógł on zacząć korzystać z aplikacji.
- Kryteria akceptacji:
  1.  W panelu Administratora znajduje się formularz do dodawania użytkowników.
  2.  Formularz wymaga podania adresu e-mail, nazwy użytkownika i hasła.
  3.  Hasło musi spełniać określone wymagania: minimum 8 znaków, co najmniej jedna duża litera, jedna mała litera i jedna cyfra.
  4.  Po zatwierdzeniu formularza, w systemie tworzone jest nowe konto z rolą "Użytkownik".
  5.  Nie można utworzyć użytkownika z adresem e-mail, bądź nazwą użytkownika które już istnieją w systemie. W takim przypadku wyświetlany jest błąd.
  6.  Nowy użytkownik pojawia się na liście użytkowników w panelu Administratora.
  7.  Wejście na stronę panelu administratora NIE JEST możliwe bez uprzedniego zalogowania się i posiadania roli ADMIN.

- ID: US-004
- Tytuł: Usuwanie użytkownika
- Opis: Jako Administrator, chcę móc usunąć istniejące konto użytkownika, aby odebrać mu dostęp do systemu.
- Kryteria akceptacji:
  1.  Na liście użytkowników w panelu Administratora przy każdym użytkowniku (oprócz mnie) znajduje się opcja usunięcia.
  2.  Po wybraniu opcji usunięcia, system prosi o potwierdzenie operacji.
  3.  Po potwierdzeniu, konto użytkownika jest trwale usuwane z systemu.
  4.  Usunięty użytkownik znika z listy.

### 5.3. Zarządzanie ticketami

- ID: US-005
- Tytuł: Tworzenie nowego ticketa
- Opis: Jako użytkownik, chcę móc stworzyć nowy ticket, podając jego tytuł, opis i typ, aby zgłosić problem, zadanie lub usprawnienie.
- Kryteria akceptacji:
  1.  Dostępny jest przycisk umożliwiający otwarcie formularza tworzenia nowego ticketa.
  2.  Formularz zawiera pola na tytuł, opis (z obsługą Markdown) i wybór typu (`Bug`, `Improvement`, `Task`).
  3.  Pola "Tytuł" i "Typ" są wymagane do zapisania ticketa.
  4.  Po zapisaniu, jestem automatycznie ustawiany jako "Osoba zgłaszająca".
  5.  Nowy ticket pojawia się w kolumnie "Otwarty" na tablicy Kanban.
  6.  Użytkownik który nie jest zalogowany nie może tworzyć ticketów.

- ID: US-006
- Tytuł: Przeglądanie ticketów na tablicy Kanban
- Opis: Jako użytkownik, chcę widzieć wszystkie tickety na tablicy Kanban podzielonej na statusy, aby mieć szybki wgląd w postęp prac.
- Kryteria akceptacji:
  1.  Głównym widokiem aplikacji jest tablica z kolumnami: `Otwarty`, `W toku`, `Zamknięty`.
  2.  Wszystkie istniejące tickety są wyświetlane jako karty w odpowiednich kolumnach.
  3.  Każda karta na tablicy wyświetla co najmniej tytuł ticketa, osobę przypisaną i "magiczną różdżkę" jeśli AI zostało użyte do poprawienia opisu.
  4.  Użytkownik który nie jest zalogowany nie ma dostępu do widoku ticketów.

- ID: US-007
- Tytuł: Zmiana statusu ticketa
- Opis: Jako osoba przypisana, zgłaszający lub Administrator, chcę móc zmienić status ticketa, przeciągając go do innej kolumny na tablicy Kanban, aby odzwierciedlić postęp prac.
- Kryteria akceptacji:
  1.  Karty ticketów na tablicy Kanban można przeciągać i upuszczać (drag and drop).
  2.  Przeniesienie karty do innej kolumny powoduje aktualizację statusu ticketa w bazie danych.
  3.  Użytkownik, który nie jest ani zgłaszającym, ani przypisanym, ani Administratorem, nie może zmienić statusu ticketa.
  4.  Użytkownik który nie jest zalogowany nie ma uprawnień do zmiany statusu ticketa.

- ID: US-008
- Tytuł: Przypisywanie osoby do ticketa
- Opis: Jako użytkownik, chcę móc przypisać się do ticketa, który nie ma jeszcze przypisanej osoby, aby poinformować innych, że rozpoczynam nad nim pracę.
- Kryteria akceptacji:
  1.  W widoku szczegółów ticketa, jeśli nie ma osoby przypisanej, dostępna jest opcja "Przypisz mnie".
  2.  Po jej kliknięciu, moje konto zostaje ustawione jako "Osoba przypisana".
  3.  Osoba już przypisana może się "odpisać" od ticketa.
  4.  Administrator może przypisać dowolnego użytkownika do dowolnego ticketa.
  5.  Użytkownik któy nie jest zalogowany nie może przypisać się do ticketa.

- ID: US-009
- Tytuł: Edycja własnego ticketa
- Opis: Jako autor zgłoszenia, chcę mieć możliwość edycji wszystkich pól mojego ticketa, aby móc zaktualizować informacje w nim zawarte.
- Kryteria akceptacji:
  1.  W widoku ticketa, którego jestem autorem, widzę opcję "Edytuj".
  2.  Mogę modyfikować tytuł, opis, typ i osobę przypisaną.
  3.  Nie mogę zmienić pola "Osoba zgłaszająca".
  4.  Użytkownik, który nie jest autorem, nie widzi opcji edycji (chyba, że jest Administratorem).

### 5.4. Future MVP Step: Funkcjonalność AI

- ID: US-010
- Tytuł: Uzyskiwanie sugestii AI do opisu ticketa (Future)
- Opis: Jako użytkownik tworzący ticket, chcę móc poprosić AI o sugestie dotyczące uzupełnienia opisu, aby upewnić się, że zawarłem wszystkie kluczowe informacje.
- Kryteria akceptacji:
  1.  W formularzu tworzenia/edycji ticketa znajduje się przycisk "Poproś o sugestie AI".
  2.  Po kliknięciu przycisku, system wysyła zapytanie do AI z tytułem, opisem i dokumentacją projektu.
  3.  W trakcie analizy wyświetlany jest wskaźnik ładowania.
  4.  Po zakończeniu analizy, pod polem opisu pojawia się lista sugestii (do wstawienia i/lub pytań otwartych).
  5.  W przypadku błędu komunikacji z AI, wyświetlany jest stosowny komunikat z możliwością ponowienia próby.
  6.  Użytkownik który nie jest zalogowany, nie może prosić o analizę ticketa pod względem sugestii AI.

- ID: US-011
- Tytuł: Aplikowanie sugestii AI (Future)
- Opis: Jako użytkownik, po otrzymaniu sugestii od AI, chcę móc w łatwy sposób zastosować je w opisie mojego ticketa.
- Kryteria akceptacji:
  1.  Przy każdej sugestii "do wstawienia" znajduje się przycisk "Dodaj", który wstawia tekst w odpowiednie miejsce opisu.
  2.  Przy każdym "pytaniu otwartym" znajduje się checkbox "Zastosowano", który mogę zaznaczyć.
  3.  Zastosowanie co najmniej jednej sugestii (dodanie tekstu lub zaznaczenie checkboxa) powoduje oznaczenie ticketa ikoną "magicznej różdżki".

- ID: US-012
- Tytuł: Ocena jakości sugestii AI (Future)
- Opis: Jako użytkownik, chcę móc ocenić jakość otrzymanych sugestii w skali 1-5 gwiazdek, aby dostarczyć feedback na temat trafności podpowiedzi.
- Kryteria akceptacji:
  1.  Po wygenerowaniu sugestii, widoczny jest system oceny (np. 5 gwiazdek).
  2.  Mogę wybrać ocenę od 1 do 5.
  3.  Ocena jest zapisywana w systemie w celach analitycznych.
  4.  Ocena może być zmieniana, do momentu zapisania ticketa.
  5.  Ocenę może modyfikować tylko użytkownik który ją wygenerował (czyli zgłaszający dany ticket)

- ID: US-013
- Tytuł: Zarządzanie dokumentacją projektu (Administrator) (Future)
- Opis: Jako Administrator, chcę móc edytować dokumentację projektu w jednym miejscu, aby zapewnić AI aktualny kontekst do analizy ticketów.
- Kryteria akceptacji:
  1.  W panelu Administratora znajduje się pole tekstowe do zarządzania dokumentacją projektu.
  2.  Pole ma limit 20 000 znaków.
  3.  Mogę wkleić lub napisać tekst, a następnie go zapisać.
  4.  Zapisana treść będzie używana we wszystkich przyszłych zapytaniach do AI.
  5.  Tylko użytkownik z rolą ADMIN ma dostęp do zarządzania dokumentacją projektu. Użytkownik który nie jest zalogowany nie ma do tego dostępu.

- ID: US-014
- Tytuł: Wyświetlanie i diagnozowanie błędów AI
- Opis: Jako Administrator, chcę mieć dostęp do szczegółowego widoku błędów generowanych przez integracje AI, aby móc monitorować stabilność systemu, diagnozować problemy i rozumieć kontekst ich występowania.
- Kryteria akceptacji:
  1.  W panelu Administratora dostępna jest dedykowana sekcja (zakładka "Błędy AI") prowadząca do widoku `/admin/ai-errors`.
  2.  Widok zawiera tabelę prezentującą listę zarejestrowanych błędów AI.
  3.  Tabela zawiera następujące kolumny: Data i Czas wystąpienia, Użytkownik (który napotkał błąd), ID powiązanego Ticketa (jeśli dotyczy), Wiadomość błędu oraz Kod statusu HTTP.
  4.  Istnieje możliwość wyświetlenia pełnych szczegółów technicznych błędu (np. poprzez kliknięcie wiersza lub przycisk "Szczegóły"), które prezentują surowe dane z pola `error_details`.
  5.  Dostęp do całej sekcji `/admin/ai-errors` jest ściśle ograniczony do użytkowników z rolą `ADMIN`. Użytkownicy bez tej roli oraz niezalogowani nie mogą uzyskać dostępu do tego widoku.

### 5.5. Profil użytkownika

- ID: US-014
- Tytuł: Wyświetlanie profilu użytkownika
- Opis: Jako użytkownik, chcę móc edytować swoją nazwę użytkownika oraz podejrzeć informace związane z moim profilem.
- Kryteria akceptacji:
  1. Widok "mój profil" w którym użytkownik może zobaczyć informacje o swoim profilu.
  2. Profil dla MVP zawiera cztery pola - nazwę użytkownika (którą można edytować), rolę (tylko do odczytu) oraz możliwość zmiany hasła (pole "hasło" oraz "powtórz hasło").
  3. Użytkownik może zmodyfikować swoją nazwę użytkownika i/lub hasło z poziomu tego widoku.
  4. Użytkownik może widzieć tylko swój własny profil w tym widoku.
  5. Użytkownik który nie jest zalogowany nie jest w stanie wyświetlić profilu.

## 6. Metryki sukcesu

Sukces wdrożenia wersji MVP będzie mierzony za pomocą dwóch kluczowych wskaźników, które bezpośrednio odnoszą się do głównego celu projektu - poprawy jakości zgłoszeń.

1.  _Jakość sugestii AI_:
    - Cel: 70% wygenerowanych przez AI podpowiedzi uzyskuje ocenę 4 lub 5 gwiazdek.
    - Pomiar: System będzie agregował oceny (w skali 1-5) wystawiane przez użytkowników dla każdej sesji generowania sugestii. Metryka będzie obliczana jako stosunek liczby ocen 4 i 5 do całkowitej liczby ocenionych sugestii.

2.  _Wpływ na jakość ticketów_:
    - Cel: 90% ticketów, dla których AI zasugerowało zmiany, zostaje zmodyfikowanych przez użytkownika.
    - Pomiar: System będzie śledził, czy po wygenerowaniu sugestii przez AI nastąpiła edycja opisu ticketa, która zwiększyła jego długość o co najmniej 10%. Metryka będzie obliczana jako stosunek liczby tak zmodyfikowanych ticketów do całkowitej liczby ticketów, w których AI wykryło potrzebę doprecyzowania opisu.
