# Layali Events

Layali Events is a full-stack event management platform built for CSEN B503 Milestone 2. It implements the provided user journeys with a different concept and interface: a Cairo pop-up and creative events operations platform.

## Team members and contributions

- Team Member 1: React frontend, organizer and guest screens.
- Team Member 2: Node.js backend APIs and validation.
- Team Member 3: Dummy data, seed script, README, testing.

Update these names before submitting to GitHub. Each member should make at least one meaningful commit.

## Technologies used

- Frontend: React, Vite, lucide-react icons, CSS
- Backend: Node.js, Express, CORS
- Database: JSON file database for local milestone testing, with a seed script

## Implemented user journeys

- Organizer: dashboard, account creation/update/deactivation, venue search, venue booking applications, filtered event tasks, due-task reminders, budget tracking, drag-and-drop floor plan design, image/PDF-style layout export, vendor requests, guest filtering, day-of communications, unseen-message follow-ups, feedback and reporting metrics.
- Staff: filtered assigned task board, task completion updates, filtered guest check-in, shared floor plan, vendor arrival updates, day-of event dashboard data.
- Vendor: editable vendor profile, sourcing request review, clarification notes, delivery status updates, invoice creation with supporting document references and invoice status tracking.
- Guest: invitation view, RSVP update, QR code display, live message visibility, post-event feedback submission.
- Venue owner: venue listing creation with amenities, availability dates, photo and floor-plan references; listing activation/deactivation; filtered booking history; booking request approval or decline; invoice review; revenue report export.
- Authentication: login and signup route users into only their own role workspace.
- Reporting: organizer can export a text report and print the floor plan layout.

## Demo accounts

All demo accounts use password `demo123`.

- Organizer: `nour@layali.test`
- Staff: `omar@layali.test`
- Staff: `mariam@layali.test`
- Vendor: `sales@cairobloom.test`
- Venue owner: `owner@zamalekwarehouse.test`
- Guest: `farah@example.test`

## Setup

Open two terminals.

### Backend

```bash
cd backend
npm install
npm run seed
npm start
```

The backend runs on `http://localhost:4000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on the Vite URL shown in the terminal, usually `http://localhost:5173`.

If your backend runs on a different port, create `frontend/.env`:

```bash
VITE_API_URL=http://localhost:4000/api
```

## Database and dummy data

The database is stored in `backend/data/db.json`. The seed script in `backend/seed.js` generates realistic dummy data for users, venues, events, booking requests, staff tasks, budgets, vendors, sourcing requests, invoices, guests, live communications, feedback, and floor plan layout elements.

To reset the demo data:

```bash
cd backend
npm run seed
```

## Main API endpoints

- `GET /api/dashboard?eventId=E001`
- `GET /api/venues?location=Cairo&date=2026-07-10&minCapacity=100`
- `POST /api/bookings`
- `PATCH /api/bookings/:id`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `GET /api/reminders?eventId=E001&today=2026-07-09`
- `GET /api/budget/:eventId`
- `POST /api/budget`
- `GET /api/vendors`
- `PATCH /api/vendors/:id`
- `GET /api/sourcing-requests`
- `PATCH /api/sourcing-requests/:id`
- `POST /api/invoices`
- `PATCH /api/invoices/:id`
- `GET /api/guests`
- `PATCH /api/guests/:id`
- `POST /api/communications`
- `POST /api/communications/follow-up`
- `POST /api/feedback`
- `GET /api/layouts`
- `GET /api/reports/event/:eventId`

## Assumptions

- Authentication is simplified for local demo purposes. Passwords are stored in the JSON seed data, not hashed, so this is not production-ready security.
- The database is a JSON file to keep local setup simple. It can be replaced with MongoDB, PostgreSQL, or SQLite later without changing the user journeys.
- Floor plan export is implemented as downloadable SVG image export plus browser print for PDF output.
- Email and messaging delivery are simulated with database records and status fields.
- Venue photos, floor plans, invoice attachments, and vendor documents are represented as filename/document references for local demo purposes.

## AI usage disclosure

AI was used to generate an initial implementation, structure the API endpoints, create dummy data, write the README, and align the app with the user journey document. The code should be reviewed, tested, and understood by the submitting team.
