# LifeOS - Atestat Informatică (Clasa a XII-a)

**LifeOS** este o aplicație web de tip "Personal Assistant" care integrează gestiunea bugetului personal și planificarea timpului într-o interfață modernă și prietenoasă.

![Dashboard Preview](doc/dashboard-preview.png)
*(Notă: Încarcă o captură de ecran aici dacă dorești)*

## 🚀 Funcționalități

### 🔐 Autentificare
- Sistem de Login & Înregistrare securizat.
- Sesiuni persistente.
- Opțiune pentru conturi de Administrator.

### 💰 Modul Economic (Buget)
- Setarea bugetului lunar.
- Adăugarea cheltuielilor zilnice.
- **Vizualizare Grafică**: Diagramă (Pie Chart) pentru distribuția bugetului.
- Calcul automat al bugetului zilnic recomandat.
- Bara de progres pentru cheltuieli.

### 📅 Modul Time Management (Orar)
- Calendar săptămânal interactiv.
- Adăugare activități:
  - **Fixe** (Ex: "Teză" pe 20 Mai la 10:00).
  - **Recurente** (Ex: "Antrenament" în fiecare Luni la 18:00).
- Sistem de ștergere a activităților cu confirmare inline.

## 🛠️ Tehnologii Utilizate

- **Backend**: Node.js, Express.js, SQLite3.
- **Frontend**: HTML5, CSS3 (Glassmorphism), JavaScript Vanilla.
- **Librării**:
  - `chart.js` - Pentru grafice.
  - `flatpickr` - Pentru selectorul de dată/oră.
  - `bcrypt` - Pentru securitatea parolelor.
- **Design**: Google Fonts (Inter), CSS Grid/Flexbox.

## 📦 Instalare și Rulare

1.  Clonează repository-ul:
    ```bash
    git clone https://github.com/user/LifeOS.git
    cd LifeOS
    ```

2.  Instalează dependențele:
    ```bash
    npm install
    # sau
    pnpm install
    ```

3.  Pornește serverul:
    ```bash
    npm run start
    # sau pentru dezvoltare
    npm run dev
    ```

4.  Deschide browserul la `http://localhost:3000`.

## 📄 Documentație
Pentru detalii tehnice complete, consultă fișierele din folderul rădăcină:
- [Documentație Proiect](DOCUMENTATIE_PROIECT.md) - Descriere generală.
- [Documentație Cod](DOCUMENTATIE_COD.md) - Detalii de implementare.

---
Proiect realizat pentru Atestatul de Competențe Profesionale la Informatică.
