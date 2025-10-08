# Aplikacja - Sisyflow

## Główny problem

Użytkownicy systemów typu "issue tracker" często zgłaszają problemy/zadania/usprawnienia bez wyczerpującego opisu o co chodzi. Dochodzi do sytuacji gdzie osoba która pochyla się nad takim zadaniem i tak musi wprost zapytać osoby zgłaszającej o co chodzi, bo brak kontekstu uniemożliwia wykonanie zadania.

## Najmniejszy zestaw funkcjonalności

- Tworzenie ticketów 3 typów - bug, improvement, task
- Tickety zawierające: tytuł, opis, typ, załączniki (pliki txt i md), osobę zgłaszającą, osobę przypisaną, komentarze
- AI odpowiadający w komentarzu na ticket z prośbą o rozszerzenie kontekstu jeśli jest on niewyczerpujący
- Załadowanie dokumentacji projektu by AI miało kontekst do dodawania komentarzy do ticketów
- Możliwość zmiany przez zgłaszającego wszystkich aspektów ticketa - prócz komentarzy od innych oraz kto go zgłosił
- zgłaszający oraz wykonujący ticket ma możliwość oceny komentarza od LLMa w formie gwiazdek - od 1 do 5, oceniając trafność wymogu rozszerzenia opisu

## Co NIE wchodzi w zakres MVP

- powtarzalne wywoływanie AI po kolejnych iteracjach
- utrzymywanie referencji do więcej niż jednego projektu
- więcej niż jeden administrator (pierwszy użytkownik jest zarazem administratorem)
- integracje z innymi issue trackerami badz systemami wersjonowania kodu
- aplikacja desktopowa/mobilna (dla MVP - tylko web)
- Importowanie jako dokumentacji oraz referencji w formatach innych niż tekstowe .md oraz .txt

## Kryteria sukcesu

- 70% wygenerowanych przez AI komentarzy ma ocenę 4 lub 5
- 90% ticketów w których AI wykryło potrzebę doprecyzowania opisu zostało zmodyfikowanych i rozszerzonych
