# 🔗 Elbfunkeln API Endpunkte - Vollständige Übersicht

## Legende
- ✅ Implementiert
- 🔒 Authentifizierung erforderlich
- 👨‍💼 Admin/Shop Owner Rolle erforderlich

---

## 🔐 1. Authentifizierung & Benutzerverwaltung

### 1.1 Authentifizierung
| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| POST | `/api/auth/register` | ✅ | - | Benutzerregistrierung |
| POST | `/api/auth/login` | ✅ | - | Benutzeranmeldung |
| POST | `/api/auth/logout` | ⏳ | 🔒 | Benutzerabmeldung |
| POST | `/api/auth/refresh` | ⏳ | 🔒 | Token erneuern |
| POST | `/api/auth/reset-password` | ⏳ | - | Passwort zurücksetzen |
| POST | `/api/auth/verify-email` | ⏳ | - | E-Mail-Verifizierung |

### 1.2 Benutzerprofil
| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| GET | `/api/users/profile` | ✅ | 🔒 | Benutzerprofil abrufen |
| PUT | `/api/users/profile` | ✅ | 🔒 | Benutzerprofil aktualisieren |
| DELETE | `/api/users/profile` | ✅ | 🔒 | Benutzerkonto löschen |
| GET | `/api/users/orders` | ✅ | 🔒 | Bestellhistorie |
| GET | `/api/users/favorites` | ✅ | 🔒 | Favoriten abrufen |

### 1.3 Admin Benutzerverwaltung
| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| GET | `/api/admin/users` | ⏳ | 👨‍💼 | Alle Benutzer |
| GET | `/api/admin/users/[id]` | ⏳ | 👨‍💼 | Benutzer Details |
| PUT | `/api/admin/users/[id]` | ⏳ | 👨‍💼 | Benutzer bearbeiten |
| DELETE | `/api/admin/users/[id]` | ⏳ | 👨‍💼 | Benutzer löschen |
| POST | `/api/admin/users/[id]/ban` | ⏳ | 👨‍💼 | Benutzer sperren |

---

## 🛍️ 2. Produktverwaltung & Shop

### 2.1 Produktkatalog (Öffentlich)
| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| GET | `/api/products` | ✅ | - | Alle Produkte |
| GET | `/api/products/[id]` | ✅ | - | Produktdetails |
| GET | `/api/products/featured` | ⏳ | - | Featured Produkte |
| GET | `/api/products/categories` | ⏳ | - | Kategorien |
| GET | `/api/products/search` | ✅ | - | Produktsuche (via query) |

### 2.2 Produktverwaltung (Admin/Shop-Owner)
| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| GET | `/api/admin/products` | ✅ | 👨‍💼 | Alle Produkte (inkl. inaktive) |
| POST | `/api/admin/products` | ✅ | 👨‍💼 | Produkt erstellen |
| GET | `/api/admin/products/[id]` | ✅ | 👨‍💼 | Produkt Details |
| PUT | `/api/admin/products/[id]` | ✅ | 👨‍💼 | Produkt aktualisieren |
| DELETE | `/api/admin/products/[id]` | ✅ | 👨‍💼 | Produkt löschen |
| POST | `/api/admin/products/[id]/images` | ⏳ | 👨‍💼 | Produktbilder hochladen |
| DELETE | `/api/admin/products/[id]/images/[imageId]` | ⏳ | 👨‍💼 | Produktbild löschen |

### 2.3 Kategorien
| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| GET | `/api/admin/categories` | ✅ | 👨‍💼 | Alle Kategorien |
| POST | `/api/admin/categories` | ✅ | 👨‍💼 | Kategorie erstellen |
| PUT | `/api/admin/categories/[id]` | ✅ | 👨‍💼 | Kategorie aktualisieren |
| DELETE | `/api/admin/categories/[id]` | ✅ | 👨‍💼 | Kategorie löschen |

### 2.4 Inventar & Lagerbestand
| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| GET | `/api/admin/inventory` | ⏳ | 👨‍💼 | Lagerbestand anzeigen |
| PUT | `/api/admin/inventory/[id]` | ⏳ | 👨‍💼 | Lagerbestand aktualisieren |
| GET | `/api/admin/inventory/low` | ⏳ | 👨‍💼 | Niedrige Bestände |

---

## 🛒 3. Warenkorb & Checkout

### 3.1 Warenkorb
| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| GET | `/api/cart` | ✅ | 🔒 | Warenkorb abrufen |
| POST | `/api/cart/items` | ✅ | 🔒 | Artikel hinzufügen |
| PUT | `/api/cart/items/[id]` | ✅ | 🔒 | Artikelmenge ändern |
| DELETE | `/api/cart/items/[id]` | ✅ | 🔒 | Artikel entfernen |
| DELETE | `/api/cart` | ✅ | 🔒 | Warenkorb leeren |

### 3.2 Checkout & Bestellungen
| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| POST | `/api/checkout/validate` | ⏳ | 🔒 | Bestellung validieren |
| POST | `/api/orders` | ✅ | 🔒 | Bestellung erstellen |
| GET | `/api/orders` | ✅ | 🔒 | Bestellhistorie |
| GET | `/api/orders/[id]` | ✅ | 🔒 | Bestelldetails |
| PUT | `/api/orders/[id]/cancel` | ✅ | 🔒 | Bestellung stornieren |

### 3.3 Bestellverwaltung (Admin)
| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| GET | `/api/admin/orders` | ✅ | 👨‍💼 | Alle Bestellungen |
| PUT | `/api/admin/orders/[id]` | ✅ | 👨‍💼 | Bestellstatus ändern |
| GET | `/api/admin/orders/stats` | ⏳ | 👨‍💼 | Bestellstatistiken |
| POST | `/api/admin/orders/[id]/refund` | ⏳ | 👨‍💼 | Rückerstattung |

---

## 💳 4. Zahlungen (Stripe)

### 4.1 Payment Intents
| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| POST | `/api/payments/create-intent` | ✅ | 🔒 | Payment Intent erstellen |
| GET | `/api/payments/intent/[id]` | ✅ | 🔒 | Payment Intent Status |
| POST | `/api/payments/confirm` | ⏳ | 🔒 | Zahlung bestätigen |
| POST | `/api/payments/cancel` | ⏳ | 🔒 | Zahlung stornieren |

### 4.2 Stripe Webhooks
| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| POST | `/api/webhooks/stripe` | ✅ | - | Stripe Events verarbeiten |

### 4.3 Zahlungsmethoden
| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| GET | `/api/payments/methods` | ⏳ | 🔒 | Verfügbare Zahlungsmethoden |
| POST | `/api/payments/save-method` | ⏳ | 🔒 | Zahlungsmethode speichern |
| GET | `/api/payments/saved-methods` | ⏳ | 🔒 | Gespeicherte Zahlungsmethoden |
| DELETE | `/api/payments/methods/[id]` | ⏳ | 🔒 | Zahlungsmethode löschen |

---

## 📍 5. Adressen

| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| GET | `/api/addresses` | ✅ | 🔒 | Alle Adressen |
| POST | `/api/addresses` | ✅ | 🔒 | Adresse erstellen |
| GET | `/api/addresses/[id]` | ✅ | 🔒 | Adresse Details |
| PUT | `/api/addresses/[id]` | ✅ | 🔒 | Adresse aktualisieren |
| DELETE | `/api/addresses/[id]` | ✅ | 🔒 | Adresse löschen |

---

## ❤️ 6. Favoriten/Wishlist

| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| GET | `/api/favorites` | ✅ | 🔒 | Favoriten abrufen |
| POST | `/api/favorites` | ✅ | 🔒 | Favorit hinzufügen |
| DELETE | `/api/favorites/[id]` | ✅ | 🔒 | Favorit entfernen |

---

## ⭐ 7. Bewertungen/Reviews

| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| GET | `/api/reviews` | ✅ | - | Bewertungen abrufen |
| POST | `/api/reviews` | ✅ | 🔒 | Bewertung erstellen |
| PUT | `/api/reviews/[id]` | ⏳ | 🔒 | Bewertung aktualisieren |
| DELETE | `/api/reviews/[id]` | ⏳ | 🔒 | Bewertung löschen |

---

## 📧 8. Newsletter & E-Mail

### 8.1 Newsletter
| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| POST | `/api/newsletter/subscribe` | ✅ | - | Newsletter abonnieren |
| POST | `/api/newsletter/unsubscribe` | ✅ | - | Newsletter abbestellen |
| GET | `/api/newsletter/preferences` | ⏳ | 🔒 | Präferenzen abrufen |
| PUT | `/api/newsletter/preferences` | ⏳ | 🔒 | Präferenzen ändern |

### 8.2 E-Mail-Kampagnen (Admin)
| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| GET | `/api/admin/newsletter/subscribers` | ⏳ | 👨‍💼 | Abonnenten |
| POST | `/api/admin/newsletter/campaigns` | ⏳ | 👨‍💼 | Kampagne erstellen |
| GET | `/api/admin/newsletter/campaigns` | ⏳ | 👨‍💼 | Kampagnen anzeigen |
| POST | `/api/admin/newsletter/send` | ⏳ | 👨‍💼 | Kampagne senden |
| GET | `/api/admin/newsletter/stats` | ⏳ | 👨‍💼 | Newsletter-Statistiken |

---

## 🎫 9. Gutscheine & Rabatte

### 9.1 Gutscheine (Gift Cards)
| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| GET | `/api/gift-cards/templates` | ⏳ | - | Verfügbare Gutschein-Templates |
| POST | `/api/gift-cards/purchase` | ⏳ | 🔒 | Gutschein kaufen |
| GET | `/api/gift-cards/validate/[code]` | ⏳ | - | Gutschein validieren |

### 9.2 Rabattcodes (Discounts)
| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| POST | `/api/discounts/validate` | ⏳ | 🔒 | Rabattcode validieren |
| POST | `/api/discounts/apply` | ⏳ | 🔒 | Rabatt anwenden |

### 9.3 Admin Verwaltung
| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| GET | `/api/admin/discounts` | ⏳ | 👨‍💼 | Alle Rabatte |
| POST | `/api/admin/discounts` | ⏳ | 👨‍💼 | Rabatt erstellen |
| PUT | `/api/admin/discounts/[id]` | ⏳ | 👨‍💼 | Rabatt bearbeiten |
| DELETE | `/api/admin/discounts/[id]` | ⏳ | 👨‍💼 | Rabatt löschen |
| GET | `/api/admin/gift-cards` | ⏳ | 👨‍💼 | Alle Gutscheine |
| POST | `/api/admin/gift-cards` | ⏳ | 👨‍💼 | Gutschein erstellen |

---

## 🎟️ 10. Ticket-System

### 10.1 Tickets (Benutzer)
| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| GET | `/api/tickets` | ⏳ | 🔒 | Meine Tickets |
| POST | `/api/tickets` | ⏳ | 🔒 | Ticket erstellen |
| GET | `/api/tickets/[id]` | ⏳ | 🔒 | Ticket Details |
| POST | `/api/tickets/[id]/messages` | ⏳ | 🔒 | Nachricht hinzufügen |
| PUT | `/api/tickets/[id]/close` | ⏳ | 🔒 | Ticket schließen |

### 10.2 Ticket-Management (Admin/Support)
| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| GET | `/api/admin/tickets` | ⏳ | 👨‍💼 | Alle Tickets |
| PUT | `/api/admin/tickets/[id]` | ⏳ | 👨‍💼 | Ticket bearbeiten |
| POST | `/api/admin/tickets/[id]/assign` | ⏳ | 👨‍💼 | Ticket zuweisen |
| GET | `/api/admin/tickets/stats` | ⏳ | 👨‍💼 | Ticket-Statistiken |

---

## 🚚 11. Versand & Rücksendungen

### 11.1 Versand
| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| GET | `/api/shipping/options` | ⏳ | - | Versandoptionen |
| GET | `/api/shipping/calculate` | ⏳ | - | Versandkosten berechnen |
| POST | `/api/shipping/track` | ⏳ | - | Sendungsverfolgung |

### 11.2 DHL Integration
| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| POST | `/api/shipping/dhl/label` | ⏳ | 👨‍💼 | Versandlabel erstellen |
| GET | `/api/shipping/dhl/track/[id]` | ⏳ | - | Sendungsverfolgung |
| POST | `/api/shipping/dhl/pickup` | ⏳ | 👨‍💼 | Abholung anfordern |

### 11.3 Rücksendungen
| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| POST | `/api/returns/request` | ⏳ | 🔒 | Rücksendung anfordern |
| GET | `/api/returns/[id]` | ⏳ | 🔒 | Rücksendung-Status |
| PUT | `/api/returns/[id]` | ⏳ | 👨‍💼 | Rücksendung bearbeiten |

---

## 📊 12. Analytics & Tracking

### 12.1 Analytics (Basis)
| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| POST | `/api/analytics/track` | ⏳ | - | Event tracken |
| GET | `/api/analytics/metrics` | ⏳ | 👨‍💼 | Grundlegende Metriken |

### 12.2 Analytics-Dashboard (Admin)
| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| GET | `/api/admin/analytics/dashboard` | ⏳ | 👨‍💼 | Dashboard-Daten |
| GET | `/api/admin/analytics/sales` | ⏳ | 👨‍💼 | Verkaufsstatistiken |
| GET | `/api/admin/analytics/traffic` | ⏳ | 👨‍💼 | Traffic-Statistiken |
| GET | `/api/admin/analytics/conversion` | ⏳ | 👨‍💼 | Conversion-Metriken |

---

## 🏥 13. System & Maintenance

| Method | Endpoint | Status | Auth | Beschreibung |
|--------|----------|--------|------|--------------|
| GET | `/api/health` | ✅ | - | API-Health-Check |
| GET | `/api/version` | ⏳ | - | API-Version |
| GET | `/api/status/database` | ⏳ | 👨‍💼 | Datenbank-Status |

---

## 📈 Implementierungsfortschritt

### Phase 1: Core E-Commerce ✅ (Abgeschlossen)
- ✅ Authentifizierung & Benutzer-Management
- ✅ Produktkatalog & Shop-Funktionen
- ✅ Warenkorb & Checkout
- ✅ Stripe-Payment-Integration
- ✅ Bestellungen
- ✅ Email Service

### Phase 2: Advanced Features ✅ (Abgeschlossen)
- ✅ Adressverwaltung
- ✅ Favoriten/Wishlist
- ✅ Produktbewertungen
- ✅ Newsletter System
- ✅ Admin Panel (Produkte & Kategorien)
- ✅ Admin Bestellverwaltung

### Phase 3: To-Do ⏳
- ⏳ DHL-Versandintegration
- ⏳ Ticket-System & Support
- ⏳ Gutschein-System
- ⏳ Analytics Dashboard
- ⏳ Rücksendungssystem
- ⏳ Social Media Integration
- ⏳ Buchhaltungsintegration
- ⏳ KPI & Business Intelligence

---

## 🎯 Prioritäten für nächste Implementierung

1. **Gutschein-System** - Wichtig für Marketing
2. **Ticket-System** - Support-Funktionalität
3. **DHL-Integration** - Versandautomatisierung
4. **Analytics Dashboard** - Business Intelligence
5. **Rücksendungssystem** - Kundenservice

---

**Insgesamt:** 
- ✅ **45 Endpunkte implementiert**
- ⏳ **~60 Endpunkte geplant**
- 📊 **Fortschritt: ~43%**