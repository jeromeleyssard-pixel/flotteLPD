# Fleet Management PWA — Architecture & Data Model

## Vision
Build a responsive, installable web application (Next.js 16 + React 19 + Tailwind CSS 4) that manages a small-to-medium vehicle fleet for Les Petits Débrouillards. The UI must stay fast on smartphones, work offline for short periods, and rely on a zero-cost backend. Airtable (free tier) is used as the shared database because it provides:

- Low effort setup for non-technical admins (spreadsheet-like).  
- Built-in REST + metadata APIs.  
- Free tier supports +1,200 records / base, sufficient for 30 vehicles × history.

> NOTE: Supabase can be swapped in later without changing the UI because data access is isolated in `src/lib/data/*` services.

## High-Level Architecture

```
 ┌────────────┐     HTTPS     ┌───────────────┐
 │ React PWA  │<─────────────>│  Next.js API  │
 └────────────┘               │  Route Hand.  │
        ↑                     └──────┬────────┘
        │ Service hooks                │
        │ (`useVehicles`, ...)        │Airtable SDK (REST)
        │                              │
        │                      ┌───────▼─────────┐
        │                      │ Airtable Base   │
        │                      │  (Departements, │
        │                      │   Users, etc.)  │
        │                      └─────────────────┘
        │ Cache via PWA service worker + React Query (future)
```

- **App Router**: `/app` directory with server components for layout, client components for forms.
- **API Routes**: `/app/api/*` act as a thin proxy between the frontend and Airtable to hide API keys and enforce role checks.
- **State Management**: React hooks (`useQuery` / `useMutation` via TanStack Query once added) to cache data client-side.
- **PWA Enhancements**: manifest + service worker + offline cache for static assets and last-known lists.

## Data Model

| Table | Required Fields | Notes |
|-------|-----------------|-------|
| `departments` | `id` (text), `name`, `region`, `color` (optional) | Each user belongs to one department. Admins reference multiple IDs. |
| `users` | `id`, `full_name`, `email`, `role` (`driver`, `fleet_manager`, `admin`), `department_id`, `phone?`, `active` | Authentication handled by Airtable forms + magic link or Next.js auth provider later. |
| `vehicles` | `id`, `name`, `license_plate`, `model`, `year`, `department_id`, `current_km`, `ct_due_date`, `service_due_at_km`, `service_due_date`, `status` (`available`, `reserved`, `maintenance`), `fuel_type`, `notes` | Derived badges for CT / maintenance alerts. |
| `trips` | `id`, `vehicle_id`, `driver_id`, `department_id`, `start_datetime`, `end_datetime`, `start_km`, `end_km`, `fuel_start_level` (1–5), `fuel_end_level`, `cleanliness_start` (`ok`, `to_clean`, `dirty`), `cleanliness_end`, `incident_notes`, `photos[]` (Attachment) | `end_*` fields filled on checkout. Open trips have `end_datetime = null`. |
| `maintenance_logs` | `id`, `vehicle_id`, `department_id`, `type` (`ct`, `service`, `tires`, `repair`, `other`), `scheduled_date`, `performed_date`, `odo_at_service`, `notes`, `status` (`planned`, `done`) | When `status = planned`, vehicle can be marked `maintenance`. |
| `incidents` (optional view) | Virtual view aggregating repeated "dirty" or "incident" remarks from `trips`. |

### Relationships
- `departments` 1:N `users`, `vehicles`, `maintenance_logs`, `trips`.
- `vehicles` 1:N `trips` and `maintenance_logs`.
- `users` 1:N `trips` (drivers only).

### Business Rules
1. A user sees only data from their `department_id` unless `role=admin` or `fleet_manager` (department-level).  
2. A vehicle can have max one open trip. Attempting to start new trip on same vehicle requires closing previous one.  
3. CT & maintenance alerts: highlight if `ct_due_date < today + 30d` or `current_km >= service_due_at_km - 1000`.  
4. Checkout enforces `end_km >= start_km`.  
5. Trip durations cannot overlap for same vehicle.

## Screens & Flows (MVP)
1. **Dashboard (Home)**
   - For Drivers: cards per vehicle with status color, quick button "Prendre ce véhicule" (opens check-in).  
   - For Managers: same cards plus alert widgets (CT soon, maintenance).  
2. **Vehicles List & Detail**
   - Filtered by department automatically.  
   - Detail view shows quick facts, maintenance timeline, last trips, cleanliness trend.  
3. **Reservation / Trip Flow**
   - Step 1 (Check-in): pick vehicle (only available), capture km/fuel/cleanliness + note/photo.  
   - Step 2 (Check-out): list open trips for current user, fill return metrics, optionally flag issue (switch vehicle status to `maintenance`).
4. **Maintenance View** (Fleet Manager)
   - Table of upcoming CT/services, add intervention form, toggle vehicle status.  
5. **History / Exports**
   - Filter bar (dept/vehicle/driver/date range).  
   - Table view with export button (calls API route to CSV).  

## Role-Based Access Logic
| Action | Driver | Fleet Manager | Admin |
|--------|--------|---------------|-------|
|View vehicles (own department) | ✓ | ✓ | ✓ (all) |
|Start/close trip | ✓ (self) | ✓ | ✓ |
|See all trips of department | ✗ (only own + vehicle detail) | ✓ | ✓ |
|Edit vehicle metadata | ✗ | ✓ | ✓ |
|Manage maintenance entries | Add issues only | ✓ | ✓ |
|Manage departments | ✗ | ✗ | ✓ |

Implementation detail: a middleware (`src/middleware.ts`) will decode a session token (NextAuth or custom) storing `role` + `departmentIds`. API routes check `role` before hitting Airtable.

## Airtable Setup (Free Tier)
1. Create base `LPD Fleet` with tables named above.  
2. For lookups, use Single select / Linked record types: e.g., `vehicles.department` links to `departments`.  
3. Create shared views per role if you later want to expose them through Airtable interface.  
4. Generate a "Personal Access Token" with read/write rights limited to this base. Store as `AIRTABLE_API_KEY`.  
5. Record IDs map directly to our IDs (Airtable-style `recXXXX`).

## Environment Variables
```
AIRTABLE_API_KEY=pat_xxx
AIRTABLE_BASE_ID=appxxxx
AIRTABLE_DEPARTMENTS_TABLE=departments
AIRTABLE_USERS_TABLE=users
AIRTABLE_VEHICLES_TABLE=vehicles
AIRTABLE_TRIPS_TABLE=trips
AIRTABLE_MAINTENANCE_TABLE=maintenance_logs
```

## Next Steps
- Implement data access layer using Airtable REST.  
- Add auth (Clerk free tier, Supabase Auth, or NextAuth + Email magic links).  
- Layer offline cache + install prompt (PWA).  
- Automate exports via API route generating CSV from Airtable query.
