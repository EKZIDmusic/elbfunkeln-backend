# 🛍️ Elbfunkeln E-Commerce Backend

REST-API für das Elbfunkeln E-Commerce-System mit Fokus auf handgemachten Drahtschmuck.

## 🚀 Features

### ✅ Implementiert

- **Authentifizierung & Benutzerverwaltung**
  - Registrierung & Login mit JWT
  - Benutzerprofil (GET, PUT, DELETE)
  - Role-based Access Control (Customer, Shop Owner, Admin)

- **Produktverwaltung**
  - Öffentliche Produktliste mit Suche, Filter & Pagination
  - Produktdetails mit Reviews
  - Admin: CRUD Operationen für Produkte
  - Kategorieverwaltung

- **Warenkorb**
  - Items hinzufügen, aktualisieren, entfernen
  - Automatische Steuerberechnung (19% MwSt)
  - Versandkostenberechnung (kostenlos ab 50€)

- **Bestellungen**
  - Bestellung aus Warenkorb erstellen
  - Rabattcodes anwenden
  - Bestellhistorie
  - Bestellung stornieren
  - Admin: Alle Bestellungen verwalten

- **Zahlungen (Stripe)**
  - Payment Intent erstellen
  - Webhook Handler für Events
  - Unterstützte Zahlungsmethoden: Kreditkarte, SEPA, Sofort

- **Email Service**
  - Bestellbestätigungen
  - Versandbenachrichtigungen
  - Password Reset

- **Zusätzliche Features**
  - Adressverwaltung
  - Favoriten/Wishlist
  - Produktbewertungen
  - Newsletter System
  - Health Check Endpoint

---

## 🛠️ Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Datenbank:** MariaDB
- **ORM:** Prisma
- **Authentifizierung:** JWT (jsonwebtoken)
- **Zahlungen:** Stripe
- **Email:** Nodemailer
- **Validierung:** Zod
- **Sprache:** TypeScript

---

## 📋 Voraussetzungen

- Node.js 18+ 
- MariaDB 10.6+
- npm oder yarn
- Stripe Account (für Zahlungen)
- SMTP Server (für E-Mails)

---

## 🚀 Installation

### 1. Repository klonen & Dependencies installieren

```bash
cd elbfunkeln-backend
npm install
```

### 2. Datenbank erstellen

```bash
mysql -u root -p
CREATE DATABASE elbfunkeln CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 3. Umgebungsvariablen konfigurieren

Erstelle eine `.env` Datei im Root-Verzeichnis:

```env
# Database
DATABASE_URL="mysql://username:password@localhost:3306/elbfunkeln"

# JWT
JWT_SECRET="dein-super-geheimer-jwt-schluessel-mindestens-32-zeichen"
JWT_EXPIRES_IN="7d"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="deine-email@gmail.com"
SMTP_PASSWORD="dein-app-passwort"
SMTP_FROM="Elbfunkeln <noreply@elbfunkeln.de>"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

### 4. Prisma Setup

```bash
# Prisma Client generieren
npx prisma generate

# Datenbank Schema pushen
npx prisma db push

# Prisma Studio öffnen (optional)
npx prisma studio
```

### 5. Server starten

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

Der Server läuft auf: `http://localhost:3000`

---

## 📚 API Dokumentation

### Base URL

```
http://localhost:3000/api
```

### Authentifizierung

Die meisten Endpunkte erfordern einen JWT Token im Authorization Header:

```
Authorization: Bearer <token>
```

---

## 🔐 Authentifizierung

### POST /api/auth/register
Neuen Benutzer registrieren

```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "Max",
  "lastName": "Mustermann"
}
```

### POST /api/auth/login
Benutzer anmelden

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

---

## 👤 Benutzerprofil

### GET /api/users/profile
Aktuelles Benutzerprofil abrufen (🔒 Auth erforderlich)

### PUT /api/users/profile
Profil aktualisieren (🔒 Auth erforderlich)

### DELETE /api/users/profile
Account löschen (🔒 Auth erforderlich)

---

## 🛍️ Produkte

### GET /api/products
Alle Produkte abrufen

**Query Parameter:**
- `page` - Seitenzahl (default: 1)
- `limit` - Anzahl pro Seite (default: 20, max: 100)
- `category` - Kategorie ID
- `featured` - Nur Featured Produkte (true/false)
- `search` - Suchbegriff
- `minPrice` - Minimaler Preis
- `maxPrice` - Maximaler Preis
- `sortBy` - Sortierung (price, name, createdAt)
- `sortOrder` - Reihenfolge (asc, desc)

### GET /api/products/[id]
Produktdetails abrufen

---

## 🛒 Warenkorb

### GET /api/cart
Warenkorb abrufen (🔒 Auth erforderlich)

### POST /api/cart/items
Artikel zum Warenkorb hinzufügen (🔒 Auth erforderlich)

```json
{
  "productId": "uuid",
  "quantity": 2
}
```

### PUT /api/cart/items/[id]
Artikelmenge ändern (🔒 Auth erforderlich)

### DELETE /api/cart/items/[id]
Artikel entfernen (🔒 Auth erforderlich)

### DELETE /api/cart
Warenkorb leeren (🔒 Auth erforderlich)

---

## 📦 Bestellungen

### POST /api/orders
Bestellung erstellen (🔒 Auth erforderlich)

```json
{
  "shippingAddressId": "uuid",
  "billingAddressId": "uuid",
  "shippingMethod": "DHL_PAKET",
  "discountCode": "SUMMER2024",
  "notes": "Bitte klingeln"
}
```

### GET /api/orders
Bestellhistorie (🔒 Auth erforderlich)

### GET /api/orders/[id]
Bestelldetails (🔒 Auth erforderlich)

### PUT /api/orders/[id]/cancel
Bestellung stornieren (🔒 Auth erforderlich)

---

## 💳 Zahlungen

### POST /api/payments/create-intent
Payment Intent erstellen (🔒 Auth erforderlich)

```json
{
  "orderId": "uuid",
  "amount": 49.99,
  "currency": "eur"
}
```

### GET /api/payments/intent/[id]
Payment Intent Status (🔒 Auth erforderlich)

### POST /api/webhooks/stripe
Stripe Webhook Handler

---

## 📍 Adressen

### GET /api/addresses
Alle Adressen (🔒 Auth erforderlich)

### POST /api/addresses
Neue Adresse erstellen (🔒 Auth erforderlich)

### PUT /api/addresses/[id]
Adresse aktualisieren (🔒 Auth erforderlich)

### DELETE /api/addresses/[id]
Adresse löschen (🔒 Auth erforderlich)

---

## ❤️ Favoriten

### GET /api/favorites
Favoriten abrufen (🔒 Auth erforderlich)

### POST /api/favorites
Produkt zu Favoriten hinzufügen (🔒 Auth erforderlich)

### DELETE /api/favorites/[id]
Von Favoriten entfernen (🔒 Auth erforderlich)

---

## ⭐ Bewertungen

### GET /api/reviews
Bewertungen abrufen (optional: ?productId=uuid)

### POST /api/reviews
Bewertung erstellen (🔒 Auth erforderlich)

---

## 📧 Newsletter

### POST /api/newsletter/subscribe
Newsletter abonnieren

### POST /api/newsletter/unsubscribe
Newsletter abbestellen

---

## 👨‍💼 Admin Routen

**Alle Admin-Routen erfordern Shop Owner oder Admin Rolle**

### Produkte
- `GET /api/admin/products` - Alle Produkte (inkl. inaktive)
- `POST /api/admin/products` - Produkt erstellen
- `PUT /api/admin/products/[id]` - Produkt bearbeiten
- `DELETE /api/admin/products/[id]` - Produkt löschen

### Kategorien
- `GET /api/admin/categories` - Alle Kategorien
- `POST /api/admin/categories` - Kategorie erstellen
- `PUT /api/admin/categories/[id]` - Kategorie bearbeiten
- `DELETE /api/admin/categories/[id]` - Kategorie löschen

### Bestellungen
- `GET /api/admin/orders` - Alle Bestellungen
- `PUT /api/admin/orders/[id]` - Bestellstatus ändern

---

## 🏥 System

### GET /api/health
Health Check

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "version": "1.0.0",
  "environment": "development"
}
```

---

## 🧪 Testing mit Postman/Thunder Client

### 1. Admin-Benutzer erstellen

```bash
# In MySQL Console
INSERT INTO User (id, email, password, role, emailVerified) 
VALUES (
  UUID(), 
  'admin@elbfunkeln.de', 
  '$2a$12$...',  -- Gehashtes Passwort
  'ADMIN', 
  1
);
```

Oder nutze die Register API und ändere die Rolle in der Datenbank.

### 2. Login & Token erhalten

POST `http://localhost:3000/api/auth/login`

### 3. Token in Headers verwenden

```
Authorization: Bearer <dein-token>
```

---

## 📊 Datenbankstruktur

Wichtigste Tabellen:
- `User` - Benutzer
- `Product` - Produkte
- `Category` - Kategorien
- `Cart` & `CartItem` - Warenkorb
- `Order` & `OrderItem` - Bestellungen
- `Address` - Adressen
- `Favorite` - Favoriten
- `Review` - Bewertungen
- `NewsletterSubscription` - Newsletter
- `Discount` - Rabattcodes
- `GiftCard` - Gutscheine

---

## 🔧 Entwicklung

### Prisma Studio öffnen
```bash
npx prisma studio
```

### Datenbank zurücksetzen
```bash
npx prisma db push --force-reset
```

### TypeScript Type Checking
```bash
npm run build
```

---

## 🐛 Troubleshooting

### Datenbankverbindung fehlgeschlagen
- Prüfe DATABASE_URL in `.env`
- Stelle sicher, dass MariaDB läuft
- Teste Verbindung: `mysql -u username -p`

### Prisma Fehler
```bash
npx prisma generate
npx prisma db push
```

### JWT Token ungültig
- Prüfe JWT_SECRET in `.env`
- Token könnte abgelaufen sein (7 Tage)

---

## 📝 Lizenz

Proprietary - Elbfunkeln © 2024

---

## 👥 Kontakt

Bei Fragen oder Problemen: support@elbfunkeln.de