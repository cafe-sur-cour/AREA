# Translation Guide

This guide explains how to work with the internationalization (i18n) system in AREA, including backend API routes and URL-based language switching.

## Backend API Routes

### GET /api/language

Retrieves the current language setting.

**Response:**
```json
{
  "language": "en"
}
```

**Example:**
```bash
curl -X GET "http://localhost:3001/api/language" \
  -H "Content-Type: application/json"
```

### POST /api/language

Changes the current language setting.

**Request Body:**
```json
{
  "language": "fr"
}
```

**Parameters:**
- `language`: ISO 639-1 language code (`en` or `fr`)

**Response:**
```json
{
  "language": "fr"
}
```

**Example:**
```bash
curl -X POST "http://localhost:3001/api/language" \
  -H "Content-Type: application/json" \
  -d '{"language": "fr"}'
```

**Error Response (400):**
```json
{
  "error": "Invalid language. Must be \"en\" or \"fr\""
}
```

## URL-Based Language Method

### About Endpoint with Language Parameter

The `/about.json` endpoint supports language switching via URL parameter for retrieving translated service information.

**Syntax:**
```
GET /about.json?lang={language_code}
```

**Parameters:**
- `lang`: ISO 639-1 language code (`en`, `fr`, etc.)

**Examples:**
```bash
# Get services in English
curl "http://localhost:3001/about.json?lang=en"

# Get services in French
curl "http://localhost:3001/about.json?lang=fr"

# Default language (English if not specified)
curl "http://localhost:3001/about.json"
```

**Response Structure:**
```json
{
  "client": {
    "host": "192.168.1.1"
  },
  "server": {
    "current_time": 1697123456,
    "services": [
      {
        "name": "GitHub", // Translated name
        "icon": "<svg>...</svg>",
        "id": "github",
        "actions": [
          {
            "id": 1,
            "name": "Push on repository", // Translated name
            "description": "Triggers when a push occurs" // Translated description
          }
        ],
        "reactions": [
          {
            "id": 2,
            "name": "Create issue", // Translated name
            "description": "Creates a new issue" // Translated description
          }
        ]
      }
    ]
  }
}
```

## Frontend Integration

### Language Switcher Component

The frontend includes a language switcher that:
1. Calls `GET /api/language` to retrieve current language on load
2. Calls `POST /api/language` to change language
3. Sends `accept-language` header in all API requests
4. Stores language preference in localStorage
5. Reloads the page after language change to apply translations

### API Headers

All frontend API requests include the `accept-language` header with the current language:

```javascript
headers: {
  'Content-Type': 'application/json',
  'accept-language': 'fr' // or 'en'
}
```

This ensures that backend responses are properly translated based on user preference.

## Supported Languages

- `en` - English (default)
- `fr` - French

## Translation Files

Service translations are stored in:
- `backend/locales/{lang}.json` - General translations
- `backend/src/services/services/{service}/locales/{lang}.json` - Service-specific translations

## Development Notes

- Language changes are applied per request via i18next middleware
- The system uses `i18next-http-middleware` for automatic language detection
- Order of language detection: header → querystring → cookie
- Default fallback language is English
