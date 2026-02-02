# Timezone Architecture

CosmicForge RTC uses a **UTC-first** timezone strategy. All times are stored in UTC in the database. The frontend is responsible for converting UTC to each user's local timezone for display.

## Data Flow

```
Frontend (User's Local Time + IANA Timezone)
    │
    │  POST /meetings  { start_time: "2026-01-25T14:00:00", timezone: "Africa/Lagos" }
    ▼
Backend (Converts to UTC)
    │
    │  local_to_utc("2026-01-25T14:00:00", "Africa/Lagos") → "2026-01-25T13:00:00"
    ▼
Database (Stores UTC)
    │
    │  start_time = "2026-01-25T13:00:00" (TIMESTAMP column, no TZ info)
    ▼
Backend (Returns UTC with Z suffix)
    │
    │  Response: { start_time: "2026-01-25T13:00:00Z" }
    ▼
Frontend (Converts UTC to Viewer's Local Time)
    │
    │  new Date("2026-01-25T13:00:00Z").toLocaleTimeString() → "2:00 PM" (Africa/Lagos)
    │                                                        → "8:00 AM" (America/New_York)
    ▼
Display (Each user sees their own local time)
```

## Key Principles

1. **Database always stores UTC.** The `TIMESTAMP` column holds naive UTC times. The backend never stores the creator's timezone.

2. **Frontend sends the user's IANA timezone** (e.g., `"Africa/Lagos"`) with every create/update request. This is auto-detected via `Intl.DateTimeFormat().resolvedOptions().timeZone`.

3. **Backend converts to UTC before storage** using the `chrono-tz` crate. The `local_to_utc()` function handles DST-aware conversion.

4. **All API responses return UTC times** with a `Z` suffix (e.g., `"2026-01-25T13:00:00Z"`).

5. **Frontend converts UTC to local time for display** using JavaScript's native `Date` object and `toLocaleTimeString()` / `toLocaleDateString()`. This automatically adapts to each viewer's browser timezone.

## API Examples

### Create Meeting

```json
POST /api/v1/meetings
{
  "title": "Team Standup",
  "start_time": "2026-01-25T14:00:00",
  "end_time": "2026-01-25T15:00:00",
  "timezone": "Africa/Lagos",
  "is_private": false
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "...",
    "title": "Team Standup",
    "start_time": "2026-01-25T13:00:00Z",
    "end_time": "2026-01-25T14:00:00Z",
    "status": "scheduled",
    "created_at": "2026-01-20T10:30:00Z",
    "updated_at": "2026-01-20T10:30:00Z",
    "join_url": "..."
  }
}
```

Note: Africa/Lagos is UTC+1, so 14:00 local → 13:00 UTC.

### Update Meeting

```json
PUT /api/v1/meetings/{id}
{
  "start_time": "2026-01-25T16:00:00",
  "end_time": "2026-01-25T17:00:00",
  "timezone": "America/New_York"
}
```

The `timezone` field is required when updating `start_time` or `end_time`.

## Backend Implementation

### Key Files

| File | Purpose |
|------|---------|
| `backend/src/utils/datetime.rs` | `now_utc()`, `local_to_utc()`, `format_utc()` |
| `backend/src/dto/meetings.rs` | Request DTOs with `timezone` field, response DTOs with UTC strings |
| `backend/src/handlers/meetings.rs` | Conversion logic in create/update handlers |

### Functions

- **`now_utc()`** — Returns current time as `NaiveDateTime` in UTC.
- **`local_to_utc(naive, timezone)`** — Converts a local `NaiveDateTime` to UTC using an IANA timezone string. Uses `chrono-tz` for DST-aware conversion.
- **`format_utc(dt)`** — Formats a `NaiveDateTime` as `"2026-01-25T14:00:00Z"`.
- **`format_utc_opt(dt)`** — Same as `format_utc` but for `Option<NaiveDateTime>`.

### Dependencies

- `chrono` — DateTime manipulation
- `chrono-tz` — IANA timezone database (supports DST)

## Frontend Implementation

### Key Files

| File | Purpose |
|------|---------|
| `frontend/src/utils/timezone.ts` | Timezone detection and display formatting utilities |
| `frontend/src/types/meeting.ts` | TypeScript types with `timezone` field |
| `frontend/src/components/dashboard/ScheduleContent.tsx` | Sends timezone on create |
| `frontend/src/components/dashboard/MeetingsContent.tsx` | Sends timezone on update, displays local times |
| `frontend/src/components/dashboard/DashboardContent.tsx` | Displays local times |

### Functions (`utils/timezone.ts`)

- **`getUserTimezone()`** — Returns the user's IANA timezone (e.g., `"Africa/Lagos"`).
- **`formatDateForDisplay(utcString)`** — Formats UTC string as local date (e.g., `"January 25, 2026"`).
- **`formatShortDateForDisplay(utcString)`** — Short format (e.g., `"Wed, Jan 25, 2026"`).
- **`formatTimeForDisplay(utcString)`** — Formats UTC string as local time (e.g., `"2:00 PM"`).
- **`toLocalDateValue(utcString)`** — Extracts local date for `<input type="date">` (e.g., `"2026-01-25"`).
- **`toLocalTimeValue(utcString)`** — Extracts local time for `<input type="time">` (e.g., `"14:00"`).

### How Display Works

All UTC strings ending in `Z` are parsed by `new Date()` as UTC. JavaScript's `toLocaleTimeString()` and `toLocaleDateString()` then automatically convert to the browser's local timezone. No external libraries are needed.

## Valid Timezone Examples

| IANA Timezone | UTC Offset | Region |
|---------------|------------|--------|
| `Africa/Lagos` | UTC+1 | Nigeria (WAT) |
| `America/New_York` | UTC-5 / UTC-4 (DST) | US Eastern |
| `America/Los_Angeles` | UTC-8 / UTC-7 (DST) | US Pacific |
| `Europe/London` | UTC+0 / UTC+1 (DST) | UK |
| `Asia/Tokyo` | UTC+9 | Japan |
| `Australia/Sydney` | UTC+10 / UTC+11 (DST) | Australia Eastern |

The full list of valid IANA timezone identifiers is available at: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
