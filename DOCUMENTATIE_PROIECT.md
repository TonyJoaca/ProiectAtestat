# Documentație Proiect: LifeOS - Asistent Personal

## 1. Introducere
**LifeOS** este o aplicație web de tip "Personal Assistant" dezvoltată pentru a ajuta utilizatorii să își gestioneze eficient timpul și finanțele personale. Aplicația oferă o interfață modernă și intuitivă pentru monitorizarea bugetului lunar și planificarea activităților zilnice.

Proiectul a fost realizat ca lucrare de atestat, având ca scop demonstrarea competențelor de programare web (Full Stack).

## 2. Tehnologii Utilizate

### Backend (Server)
*   **Node.js**: Mediul de execuție pentru serverul de aplicație.
*   **Express.js**: Framework web rapid și minimalist pentru crearea serverului și a API-urilor REST.
*   **SQLite3**: Sistem de gestiune a bazei de date (SQL), ales pentru simplitate și portabilitate (stocare în fișier local).
*   **Bcrypt**: Bibliotecă pentru criptarea (hashing) parolelor utilizatorilor, asigurând securitatea datelor.
*   **Express-Session**: Middleware pentru gestionarea sesiunilor de autentificare.

### Frontend (Interfață)
*   **HTML5**: Structura semantică a paginilor web.
*   **CSS3**: Stilizare modernă folosind variabile CSS, Flexbox, Grid și efecte de **Glassmorphism** (transparență, blur).
*   **JavaScript (Vanilla)**: Logica de pe partea de client pentru interacțiunea cu utilizatorul și apelarea API-urilor (fetch).
*   **Biblioteci Externe**:
    *   *Flatpickr*: Pentru selectarea modernă a datei și orei.
    *   *Google Fonts (Inter)*: Pentru tipografie.

## 3. Funcționalități Principale

### A. Autentificare Securizată
*   **Înregistrare**: Utilizatorii își pot crea un cont. Există opțiunea de a crea un cont de **Administrator** prin introducerea unei chei speciale de securitate.
*   **Autentificare**: Acces securizat pe bază de email și parolă.
*   **Sesiuni**: Utilizatorul rămâne logat pe durata vizitei.

### B. Hub Central (Dashboard)
Pagina principală oferă o privire de ansamblu rapidă:
*   **Rezumat Financiar**: Afișează bugetul rămas și o bară de progres vizuală (verde/galben/roșu) în funcție de cheltuieli.
*   **Timeline**: Lista următoarelor 3 activități planificate, ordonate cronologic.
*   **Acțiuni Rapide**: Butoane pentru acces imediat la adăugarea de cheltuieli sau activități.

### C. Modul Economic (Buget)
*   **Setare Buget**: Utilizatorul definește suma disponibilă pentru luna curentă.
*   **Urmărire Cheltuieli**: Adăugarea cheltuielilor zilnice cu descriere și sumă.
*   **Statistici**:
    *   Calcul automat al sumei rămase.
    *   Calculul **Bugetului Zilnic Recomandat** (suma rămasă împărțită la zilele rămase din lună).
    *   Istoricul ultimelor cheltuieli.

### D. Modul Management Timp (Orar)
*   **Calendar Săptămânal**: Vizualizare tip grilă a săptămânii (Luni-Duminică).
*   **Tipuri de Activități**:
    1.  **Dată Fixă**: Evenimente unice (ex: "Examen Mate" pe 15 Iunie la 10:00).
    2.  **Recurente**: Activități care se repetă săptămânal (ex: "Antrenament" în fiecare Marți la 18:00).
*   **Sugestii Inteligente**: Un algoritm simplu care propune intervale orare libere pentru activități noi.

## 4. Arhitectura Aplicației
Aplicația este structurată pe modelul **Client-Server**:
1.  **Frontend-ul** (fișierele din `public/`) rulează în browser și trimite cereri (requests) către server.
2.  **Serverul** (`main.js`) primește cererile, interoghează baza de date (`database.db`) și returnează datele în format JSON.
3.  **Baza de Date** este relațională, având tabele pentru `users`, `budgets`, `expenses` și `activities`.

## 5. Instalare și Rulare
1.  Instalare dependențe: `npm install` (sau `pnpm install`).
2.  Pornire server dezvoltare: `npm run dev`.
3.  Accesarea aplicației: Deschideți browserul la `http://localhost:3000`.
