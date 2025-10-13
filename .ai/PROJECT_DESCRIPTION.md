# Aplikacja - Sisyflow (MVP)

## Główny problem

Użytkownicy systemów typu "issue tracker" często zgłaszają problemy/zadania/usprawnienia bez wyczerpującego opisu o co chodzi. Dochodzi do sytuacji gdzie osoba która pochyla się nad takim zadaniem i tak musi wprost zapytać osoby zgłaszającej o co chodzi, bo brak kontekstu uniemożliwia wykonanie zadania.

## Najmniejszy zestaw funkcjonalności

- Tworzenie ticketów 3 typów - bug, improvement, task
- Prosty system konto użytkowników do powiązania z ticketami jako zgłaszający i pracujący nad ticketami
- Użytkownicy to albo administratorzy albo zwykli użytkownicy
- Tickety zawierające: tytuł, opis, typ, osobę zgłaszającą, osobę przypisaną
- Podczas tworzenia ticketa użytkownik ma możliwość poproszenia AI o listę punktów które zgodnie z kontekstem projektu mogą być istotne dla osoby implementującej - taki ticket jest dodatkowo oznaczony jeśli użytkownik użył podanego przez AI kontekstu
- Zgłaszający ma możliwość oceny jakości podpowiedzi w formie gwiazdek - od 1 do 5, oceniając trafność wymogu rozszerzenia opisu
- Podpowiedź pojawia się tylko gdy AI wykryje potrzebę dodatkowego opisu, w przeciwnym razie informuje użytkownika że nie widzi potrzeby zmian
- Załadowanie dokumentacji projektu by AI miało kontekst tego czego może brakować w ticketach lub co wymaga doprecyzowania
- Możliwość zmiany przez zgłaszającego wszystkich aspektów ticketa - prócz kto go zgłosił
- Tylko administratorzy mają możliwość modyfikowania dokumentów projektu

## Co NIE wchodzi w zakres MVP

- powtarzalne wywoływanie AI przy kolejnych iteracjach opisu
- utrzymywanie referencji do więcej niż jednego projektu
- więcej niż jeden administrator (pierwszy użytkownik jest zarazem administratorem)
- integracje z innymi issue trackerami badz systemami wersjonowania kodu
- aplikacja desktopowa/mobilna (dla MVP - tylko web)
- Importowanie jako dokumentacji oraz referencji w formatach innych niż tekstowe .md oraz .txt
- System komentarzy oraz załączników do ticketów

## Kryteria sukcesu

- 70% wygenerowanych przez AI podpowiedzi ma ocenę 4 lub 5
- 90% ticketów w których AI wykryło potrzebę doprecyzowania opisu zostało zmodyfikowanych i rozszerzonych
