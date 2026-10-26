# Zion Church care desk

Source: [github.com/rmr84/zion-church-project](https://github.com/rmr84/zion-church-project)

A private care-request desk for Zion Church. A member can ask for a hospital visit, a meal, a counseling referral, prayer, or something else, with or without their name, and with or without an account. The server returns a reference code they can use to check the status later. The care team reviews, assigns, and archives requests. Staff notes never appear on the member status page.

## Run it

Node 24 or newer. Care requests are stored in MongoDB. Set `MONGODB_URI` in `.env` to the Atlas connection string. `MONGODB_DB` defaults to `production`.

In a real-world scenario, we would default this to 'development' or similar jargon, but since this is the only database we will be using, I went with production. 

```bash
npm install
cp .env.example .env
npm test
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Care requester sign-in is at [http://localhost:3000/sign-in](http://localhost:3000/sign-in). An account is optional. Requests sent while signed in show up on My requests. Requests sent without an account are found with the reference code.

Creating an account sends Firebase's confirmation email. The person is saved in the `users` collection. Sign-in opens after that email is confirmed.

Care team sign-in is at [http://localhost:3000/staff/login](http://localhost:3000/staff/login). It uses the same email and password accounts. Each user document has a `role` of `requester`, `careTeam`, or `Admin`. A new requester account is stored as `requester`. `Admin` and `careTeam` open the desk. `STAFF_SESSION_SECRET` must be at least 16 characters and is in `.env.example`.

`npm run seed` replaces the care requests in MongoDB with the demo requests.

## Demo reference codes

These codes are seeded when the care-requests collection is empty, including a fresh database.

| Code | Who | Type | Urgency | Status | What to notice |
| --- | --- | --- | --- | --- | --- |
| ZC-OTHR-1005 | Samir Haddad | Other | Urgent | Assigned | Older urgent request, so it sorts first. Member note names a driver time. Staff note names the driver |
| ZC-HOSP-1001 | Margaret Hale | Hospital Visit | Urgent | Received | Staff note mentions Pastor Ellis and a diagnosis. Neither appears on the status page |
| ZC-MEAL-1002 | Daniel Cho | Meal Delivery | Soon | In Review | Member note mentions the meal team. Staff note mentions Ruth Alvarez and must stay off the status page |
| ZC-ANON-1003 | Name not given | Prayer Support | Routine | Assigned | Anonymous. The status page shows the prayer-team note, not the staff caution |
| ZC-COUN-1004 | Alicia Grant | Counseling Referral | Soon | Completed | Archive only. It is not on the open queue |

Member status for the hospital request: [http://localhost:3000/status?code=ZC-HOSP-1001](http://localhost:3000/status?code=ZC-HOSP-1001)

The same lookup is available as JSON at [http://localhost:3000/api/status?code=ZC-HOSP-1001](http://localhost:3000/api/status?code=ZC-HOSP-1001). That response uses the member view, so it cannot include a staff note.

On the open queue, urgency order is ZC-OTHR-1005, ZC-HOSP-1001, ZC-MEAL-1002, then ZC-ANON-1003. Urgent comes before Routine even when the routine request is older.

## Care team desk

- The open queue sorts by urgency or by date. Urgency order is Urgent, Soon, Routine. Inside a level, the oldest request is first.
- A new request logs the confirmation email we would send. A status change logs the update. Both go to `logs/notifications.log` and the server console. The log can include the note written for the member. It does not include the description, contact details, or the care team note.
- The same log is on the Notifications page after sign-in.
- Marking a request Completed removes it from the open queue and keeps the document in the archive. The desk has no delete path.

## How privacy is enforced

`getMemberRequest` reads the `member_request_status` MongoDB view, not the `care_requests` collection. That view projects the reference code, care type, status, member note, and updated time. Staff notes, the description, and contact details are not in the view. The returned object is also frozen to those fields.

Staff notes live on `internalNote` in `care_requests`. Only `getStaffRequest` and `listRequests` read that field, and only from the collection. Schema validation rejects an urgency or status outside the known lists.

A new submission cannot set status, assignee, or either note. Those fields are ignored and the row is stored as Received with empty notes. The reference code is generated on the server and retried if it collides.

## Tests

`npm test` covers the member view, urgency and date sorting, archive behavior, smuggled staff fields, reference codes, validation, the signed session, notification contents, and that this README still lists every seeded code. The request tests use the `zion-care-test` database.

## Deploy

```bash
npm run build
npm start
```

Set `STAFF_SESSION_SECRET` (16 characters or more). Set `MONGODB_URI`. The Firebase web app reads `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, and `NEXT_PUBLIC_FIREBASE_APP_ID` from the environment.

If the care-requests collection is empty, startup seeds the codes above. Later requests stay in Atlas.

## Project map

- Member pages live at `/`, `/request`, `/request/sent`, and `/status`
- `app/staff` is the care team desk, archive, and notification log
- `app/api/status` is the member lookup as JSON
- `lib/db.js` connects to MongoDB, validates each request, and creates the member view
- `lib/requests.js` is the only place that reads and writes requests
- `lib/notify.js` is the email stub
- `lib/session-token.js` is the HMAC-signed staff session and the separate requester session
- `/sign-in` is the care requester sign-in. `/staff/login` is the care team sign-in
- `lib/firebase.js` starts the Firebase web app for project `code-challenge-zion`

## A short review path

1. Submit an anonymous prayer request and save the reference code.
2. Open the hospital status link above and confirm Pastor Ellis and room 312 are absent. Open `ZC-MEAL-1002` and confirm the meal-team note is present and Ruth Alvarez is not.
3. Sign in with a care team account. Leave the sort on Urgency and confirm Samir Haddad is above Margaret Hale, and the anonymous prayer request is last.
4. Open Margaret Hale, add a note for the member, and set the status to In Review.
5. Open Notifications and confirm the logged email names the code, the new status, and the member note, and does not name the diagnosis.
6. Check `ZC-HOSP-1001` again and confirm the member note is visible and the staff note is still absent.
7. Mark a request Completed and find it in the archive, gone from the open queue.
