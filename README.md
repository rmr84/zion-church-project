# Zion Church care desk

Source: [github.com/rmr84/zion-church-project](https://github.com/rmr84/zion-church-project)

A private pastoral care-request desk for Zion Church. Anyone can ask for a hospital visit, a meal, a counseling referral, prayer support, or something else—with or without their name, and with or without an account. The server issues a reference code they can use to check the status later. The care team reviews, assigns, updates notes, and archives completed work. Care-team-only notes (`internalNote`) never appear on member-facing pages, the status API, or the outbound email stubs.

This is not an emergency line. Urgent form copy points people to 911 when needed. The site is marked `noindex` so it is not meant for public search engines.

## What each audience can do

| Audience | How they get in | What they do |
| --- | --- | --- |
| **Public** | No account | Read the home page, submit a care request, look up a request by reference code, leave feedback after a completed request |
| **Requester** | Firebase account at `/sign-in` or `/create-account` | Same as public, plus **My Requests**, request detail pages, and account settings (profile, photo, notification prefs) |
| **Care Team** (`careTeam`) | Firebase account invited into the desk, then `/staff/login` | Open queue, archive, assign, status and notes, email logs, in-app assignment notifications, own desk account |
| **Admin** (`Admin`) | Same desk login with Admin role | Everything Care Team can do, plus invite/delete pending desk users, moderate reviews, reopen completed requests, and see pending-review alerts |

## Tech stack

| Layer | Choice |
| --- | --- |
| Runtime | Node **24+** (see `package.json` `engines` and `.node-version`) |
| App | **Next.js** App Router (`next` ^16), React 19, ESM (`"type": "module"`), path alias `@/*` |
| Auth | **Firebase Auth** (web SDK) for email/password; Identity Toolkit helpers for invite/verify/delete |
| Sessions | App-owned **HMAC cookies** (`zion_staff`, `zion_requester`), not Firebase session cookies |
| Data | **MongoDB Atlas** via the official `mongodb` driver |
| Host | Built for a Node host such as Vercel (`npm run build` / `npm start`) |

There is no separate Express API, ORM, or real email provider. Outbound mail is stubbed: written to MongoDB and printed in the server console.

## Run it locally

```bash
npm install
cp .env.example .env
# Fill Firebase + Mongo values (see Environment below)
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

| Entry | URL |
| --- | --- |
| Home | http://localhost:3000/ |
| Submit a request | http://localhost:3000/request |
| Check status | http://localhost:3000/status |
| Requester sign-in | http://localhost:3000/sign-in |
| Care team sign-in | http://localhost:3000/staff/login |

Creating a requester account sends Firebase’s confirmation email. The person is saved in the `users` collection after signup. Sign-in is allowed only after that email is confirmed. Requests submitted while signed in are linked to the account and show under **My Requests**. Requests without an account are found with the reference code alone.

`STAFF_SESSION_SECRET` must be at least 16 characters (the example file includes a demo value).

### npm scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm test` | Node’s built-in test runner (`node --test`) with `.env` loaded |
| `npm run seed` | Seed/demo data script (`scripts/mongo_database.js`) |

## Environment

Copy `.env.example` to `.env`. Names only—never commit real secrets.

| Variable | Required | Purpose |
| --- | --- | --- |
| `STAFF_SESSION_SECRET` | Yes | HMAC secret for staff and requester session cookies (≥ 16 characters) |
| `MONGODB_URI` | Yes | Atlas connection string (`mongodb+srv://…`) |
| `MONGODB_DB` | Recommended | Database name. Example defaults to `production` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase web config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | Firebase web config |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase web config |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | Firebase web config |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase web config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | Firebase web config |

`NODE_ENV=production` makes session cookies `Secure`.

In a real-world scenario we might default the database name to `development` or similar, but since this project uses one shared Atlas database for the live desk, the example uses `production`.

Set the same variables on the deploy host. There is no `STAFF_PASSWORD` env var; desk access is Firebase accounts plus a `role` on the user document.

## MongoDB layout

Set `MONGODB_DB` (example: `production`). Most live modules fall back to `production` if unset. `lib/db.js` (used by the seed helper and tests that inject a `db`) falls back to `zion-care` if unset—set `MONGODB_DB` explicitly so everything points at the same place.

### Collections

| Collection | Used for |
| --- | --- |
| **`requests`** | **Live** care-request documents the desk and public forms read/write when no test `db` is injected |
| **`care_requests`** | Collection used by `getDb()` / migrate / `npm run seed` / many tests (with schema validator and indexes) |
| **`member_request_status`** | MongoDB **view** over `care_requests` for the narrower member projection used when a `db` handle is passed into request helpers |
| **`users`** | Firebase-linked accounts: `uid`, `email`, `role`, profile fields, photo binary, invite fields, notification prefs |
| **`reviews`** | Homepage carousel and desk moderation (`pending` / `approved` / `rejected`) |
| **`notifications`** | Stub **email log** entries shown on `/staff/email-logs` |
| **`desk_notifications`** | In-app **assignment** alerts for care team members |

Live request I/O goes through `lib/requests.js` → collection **`requests`**. The seed script reseeds **`care_requests`**. If you rely on demo codes in the live queue, make sure those documents exist in the collection the app is actually reading (`requests`), or copy/seed into that collection as needed for your environment.

### Care request fields

Typical document shape:

- Identity / content: `referenceCode`, `name`, `careType`, `description`, `contactMethod`, `contactDetail`, `urgency`
- Workflow: `status` (`received` | `in_review` | `completed`), `assignee`, `memberNote`, `internalNote`, `createdAt`, `updatedAt`, `completedAt`
- Account link (optional): `requesterUid`, `requesterEmail`

Legacy status value `assigned` is migrated to `in_review` on read/migrate.

### Care types, contact, urgency, status

Defined in `lib/constants.js`:

- **Care types:** Hospital Visit, Meal Delivery, Counseling Referral, Prayer Support, Other  
- **Contact:** Phone, Email, Text, In person, No contact needed  
- **Urgency:** Routine, Soon, Urgent  
- **Status:** Received (desk label **Needs Attention**), In Review, Completed  

### Users and roles

| `role` value | Access |
| --- | --- |
| `requester` | Member account surfaces |
| `careTeam` | Care desk |
| `Admin` | Care desk + admin actions (`admin` is normalized to `Admin`) |

Desk invite flow (Admin only): create Firebase user → write `users` with `inviteStatus: 'pending'` → Firebase password-reset email → first successful `/staff/login` marks the invite active. Pending invites can be deleted by an Admin. Only **active** desk members appear in the assignee picker.

### Photos

Profile photos are stored primarily as MongoDB Binary on the user document (`photoData` / `photoType`) and served from `/api/profile-photo`. Legacy files under `data/profile-photos/` are a fallback only.

## Auth and sessions

1. **Firebase** authenticates email/password (and verification / reset emails).
2. After a successful browser sign-in, a server action verifies the ID token and sets an app cookie:
   - `zion_requester` for requesters  
   - `zion_staff` for `careTeam` / `Admin`
3. Tokens are HMAC-signed (`lib/session-token.js`) with `STAFF_SESSION_SECRET`, TTL **12 hours**, `httpOnly`, `sameSite=lax`.
4. Establishing a staff session clears the requester cookie (and desk users who hit requester sign-in are steered into staff session when appropriate).
5. `app/staff/(desk)/layout.js` redirects to `/staff/login` when there is no staff session.

## Routes

### Public and member

| Path | Purpose |
| --- | --- |
| `/` | Landing, how it works, approved reviews carousel |
| `/request` | Multi-step care form (staff session redirects to the desk) |
| `/request/sent` | Confirmation with copyable reference code |
| `/status` | Look up by code; shows member-facing fields + optional feedback when completed |
| `/sign-in` | Requester sign-in |
| `/create-account` | Requester signup + verification |
| `/forgot-password` | Password reset |
| `/api/status?code=…` | JSON member lookup (`Cache-Control: no-store`) |
| `/api/reviews` | `POST` pending feedback after a completed request |
| `/api/profile-photo` | Serve profile image bytes |

### Requester account (requires requester session)

| Path | Purpose |
| --- | --- |
| `/account` | My Requests |
| `/account/requests/[code]` | Owned request detail |
| `/account/settings` | Profile, photo, notification preference toggles |

### Care desk (requires staff session)

| Path | Purpose |
| --- | --- |
| `/staff/login` | Care team / Admin sign-in |
| `/staff` | Open queue (not completed) |
| `/staff/archive` | Completed requests |
| `/staff/requests/[code]` | Full request editor |
| `/staff/reviews` | Review moderation (approve/reject is Admin) |
| `/staff/users` | Desk roster; Admin invite / delete pending |
| `/staff/email-logs` | Stub outbound emails from the `notifications` collection |
| `/staff/notifications` | Unseen assignment notifications (Admins also see pending reviews) |
| `/staff/account` | Desk profile settings |
| `/staff/account/renew` | Clear staff cookie and return to login |

## Product behavior

### Submitting a request

- Server validates care type, description, urgency, contact method, and contact detail (10-digit phone where phone/text; email format where email). Optional name. Length limits apply.
- Status is always stored as **Received**; assignee and both notes are forced empty. Client cannot smuggle staff fields through create.
- Reference codes look like `ZC-XXXX-XXXX`, generated on the server with collision retry.
- A confirmation **email stub** is logged (Mongo `notifications` + console).

### Status and privacy

Member-facing surfaces (`/status`, `/api/status`, requester detail) never expose `internalNote` (care team note). They also omit assignee and staff-only workflow fields.

What the status page **does** show for a matching code: name (or “Name not given”), care type, description, contact method/detail when relevant, urgency, status, member note (“Note for you”), and last updated time. After **Completed**, the person can submit one feedback review if none exists yet.

Email stubs may include the **member** note on status changes. They do not include the description, contact details, or the care team note.

### Desk queue and archive

- Open queue: `status !== completed`. Default sort is urgency (**Urgent → Soon → Routine**); within a level, oldest first. Newest / oldest sorts are also available.
- **Completed** moves the request to the archive. There is no delete path for care requests.
- When status is Completed, assignee and note fields are locked for editing. Only an **Admin** can reopen a completed request to a non-completed status.
- Changing the assignee creates a `desk_notifications` row for that person (skipped for self-assign / no-op). Pending users are not assignable.
- Desk search (command palette) can jump to requests and nav targets.

### Email stubs vs in-app notifications

These are separate:

| Surface | Collection / UI | When |
| --- | --- | --- |
| **Email Logs** | Mongo `notifications`, page `/staff/email-logs` | Confirmation on create; status update email on status change; desk invite stub |
| **Notifications** | Mongo `desk_notifications`, page `/staff/notifications` + header panel | Assignment alerts (and Admin pending-review badges) |

Stubs are prefixed `EMAIL (not sent)` in the console. Nothing is sent through an ESP.

### Reviews

- After a request is Completed, the member can leave one pending review tied to the reference code.
- Admins approve or reject on `/staff/reviews`.
- The home carousel needs at least **six** approved reviews before it is considered fully stocked (seed data covers this).

### Seed script behavior (`npm run seed`)

1. **Reviews** — insert seed reviews only if `reviews` is empty.  
2. **Email log notifications** — insert seed stubs only if `notifications` is empty.  
3. **Care requests** — delete all documents in `care_requests`, then insert the five demo rows (via `getDb()` / migrate).

## Demo reference codes

These codes are seeded into `care_requests` when that collection is empty (including via `getDb()` on first use of that path) and whenever `npm run seed` successfully reseeds care requests.

| Code | Who | Type | Urgency | Status | What to notice |
| --- | --- | --- | --- | --- | --- |
| ZC-OTHR-1005 | Samir Haddad | Other | Urgent | In Review | Older urgent request, so it sorts first. Member note names a driver time. Staff note names the driver |
| ZC-HOSP-1001 | Margaret Hale | Hospital Visit | Urgent | Received | Staff note mentions Pastor Ellis and a diagnosis. Neither appears as a care-team note on the status page |
| ZC-MEAL-1002 | Daniel Cho | Meal Delivery | Soon | In Review | Member note mentions the meal team. Staff note mentions Ruth Alvarez and must stay off member-facing care-team notes |
| ZC-ANON-1003 | Name not given | Prayer Support | Routine | In Review | Anonymous. The status page shows the prayer-team note, not the staff caution |
| ZC-COUN-1004 | Alicia Grant | Counseling Referral | Soon | Completed | Archive only. It is not on the open queue |

Member status for the hospital request: [http://localhost:3000/status?code=ZC-HOSP-1001](http://localhost:3000/status?code=ZC-HOSP-1001)

JSON lookup: [http://localhost:3000/api/status?code=ZC-HOSP-1001](http://localhost:3000/api/status?code=ZC-HOSP-1001). The JSON path uses the member view helpers, so it cannot include a staff (`internalNote`) field.

On the open queue (urgency sort), order is ZC-OTHR-1005, ZC-HOSP-1001, ZC-MEAL-1002, then ZC-ANON-1003. Urgent comes before Routine even when the routine request is older.

## How privacy is enforced in code

- `createRequest` ignores smuggled status, assignee, and notes; stores Received with empty notes.
- `internalNote` is only returned from staff-oriented helpers (`getStaffRequest`, `listRequests`, staff editor). Member helpers and the status UI never map that field.
- Email builders in `lib/notify.js` intentionally omit description, contact details, and internal notes.
- Schema validation on `care_requests` (when migrate runs) rejects urgency/status values outside the allowed lists.
- Reference codes are server-generated.

## Project map

```
app/
  page.js, layout.js, globals.css, robots.js
  request/, status/, sign-in/, create-account/, forgot-password/
  account/                  # My Requests, detail, settings
  staff/login/              # Desk login
  staff/(desk)/             # Auth-gated desk layout + pages
  actions/                  # Server actions (public, requester, staff, users, reviews, …)
  api/status, reviews, profile-photo
components/                 # Forms, desk UI, auth, reviews, notifications
lib/
  db.js                     # Mongo client, care_requests migrate/seed helpers
  requests.js               # Only module that reads/writes care requests
  notify.js                 # Email stubs → notifications collection
  desk-notifications.js     # Assignment alerts
  reviews.js, users.js, members.js, validate.js, constants.js
  session.js, session-token.js
  firebase.js, firebase-identity.js, firebase-auth-admin.js
  seed-data.js, reference.js, format.js, profile.js, …
scripts/mongo_database.js   # npm run seed
test/                       # node:test suite
public/                     # Brand images
```

Notable modules:

- `lib/requests.js` — create, list, member/staff get, update, archive split  
- `lib/notify.js` — confirmation / status / invite stub bodies; `logNotice` / `listEmailLogEntries`  
- `lib/session-token.js` — HMAC staff and requester cookies  
- `lib/firebase.js` — client SDK bootstrap for the Firebase web project  

## Tests

```bash
npm test
```

Coverage includes member vs staff field exposure, urgency and date sorting, archive behavior, smuggled staff fields on create, reference codes, validation (including phone/email), signed sessions, notification stub contents, users/roles helpers, profile helpers, password rules, and that this README still lists every seeded reference code. Request / notify / users tests that hit Mongo use the **`zion-care-test`** database (`MONGODB_DB` overridden in those files).

## Deploy

```bash
npm run build
npm start
```

Set `STAFF_SESSION_SECRET`, `MONGODB_URI`, `MONGODB_DB`, and all `NEXT_PUBLIC_FIREBASE_*` values on the host. Because the filesystem on typical serverless hosts is not durable for logs or uploads, email stubs and profile photos are stored in MongoDB—not under `logs/` or ephemeral disk.

If `care_requests` is empty when `getDb()` runs, it seeds the demo codes above. Later live traffic that uses the `requests` collection stays in Atlas independently of that helper path.

## A short review path

1. Submit an anonymous prayer request and save the reference code.
2. Open the hospital status link above and confirm Pastor Ellis and the diagnosis from the **staff** note are absent as care-team-only content. Open `ZC-MEAL-1002` and confirm the meal-team **member** note is present and Ruth Alvarez (staff note) is not.
3. Sign in with a care team account. Leave the sort on Urgency and confirm Samir Haddad is above Margaret Hale, and the anonymous prayer request is last among open items.
4. Open Margaret Hale, add a note for the member, and set the status to In Review.
5. Open **Email Logs** and confirm the logged email names the code, the new status, and the member note, and does not name the diagnosis.
6. Check `ZC-HOSP-1001` again on `/status` and confirm the member note is visible and the staff note is still absent.
7. Mark a request Completed and find it in the archive, gone from the open queue. Confirm notes/assignee lock for non-admins.
8. Assign a request to another active care team member and confirm it appears under **Notifications** for that person.
