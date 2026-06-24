const express = require('express');
const cors = require('cors');
const { readDb, writeDb, nextId } = require('./db');
const app = express();
const PORT = process.env.PORT || 4000;
app.use(cors());
app.use(express.json());
const byId = (collection, id) => collection.find((item) => item.id === id);
const includes = (value, query) => String(value || '').toLowerCase().includes(String(query || '').toLowerCase());
const asList = (value) => Array.isArray(value) ? value : String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
function requireFields(body, fields) {
  const missing = fields.filter((field) => body[field] === undefined || body[field] === '');
  if (missing.length) { const error = new Error(`Missing required fields: ${missing.join(', ')}`); error.status = 400; throw error; }
}
app.get('/api/health', (req, res) => res.json({ ok: true, app: 'Layali Events API' }));
app.get('/api/dashboard', (req, res) => {
  const db = readDb(); const eventId = req.query.eventId || db.events[0]?.id; const event = byId(db.events, eventId);
  const guests = db.guests.filter((guest) => guest.eventId === eventId); const feedback = db.feedback.filter((item) => item.eventId === eventId); const budget = db.budgetItems.filter((item) => item.eventId === eventId);
  const avg = (field) => feedback.length ? Number((feedback.reduce((sum, item) => sum + item[field], 0) / feedback.length).toFixed(1)) : 0;
  res.json({ event, todayEvents: db.events.filter((item) => item.date === event?.date), guestCount: guests.length, arrivedGuests: guests.filter((guest) => guest.checkedIn).length, unseenMessages: guests.filter((guest) => !guest.messageSeen).length, feedback: { overall: avg('overall'), food: avg('food'), venue: avg('venue'), organization: avg('organization') }, budget: { planned: budget.reduce((sum, item) => sum + item.planned, 0), actual: budget.reduce((sum, item) => sum + item.actual, 0) }, dueTasks: db.tasks.filter((task) => task.eventId === eventId && task.status !== 'Done') });
});
app.get('/api/users', (req, res) => {
  const db = readDb(); const { role, active, speciality, employmentType, q } = req.query;
  res.json(db.users.filter((user) =>
    (!role || user.role === role) &&
    (active === undefined || String(user.active) === active) &&
    (!speciality || user.speciality === speciality) &&
    (!employmentType || user.employmentType === employmentType) &&
    (!q || includes(user.name, q) || includes(user.email, q))
  ));
});
app.post('/api/users', (req, res, next) => { try { requireFields(req.body, ['name', 'email', 'role']); const db = readDb(); const user = { id: nextId(db.users, 'U'), active: true, ...req.body }; db.users.push(user); writeDb(db); res.status(201).json(user); } catch (error) { next(error); } });
app.patch('/api/users/:id', (req, res) => { const db = readDb(); const user = byId(db.users, req.params.id); if (!user) return res.status(404).json({ message: 'User not found' }); Object.assign(user, req.body); writeDb(db); res.json(user); });
app.post('/api/auth/login', (req, res, next) => {
  try {
    requireFields(req.body, ['email', 'password']);
    const db = readDb();
    const user = db.users.find((item) => item.email.toLowerCase() === req.body.email.toLowerCase() && item.active);
    if (!user || (user.password || 'demo123') !== req.body.password) return res.status(401).json({ message: 'Invalid email or password' });
    const { password, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (error) { next(error); }
});
app.post('/api/auth/signup', (req, res, next) => {
  try {
    requireFields(req.body, ['name', 'email', 'password', 'role']);
    const db = readDb();
    const exists = db.users.some((item) => item.email.toLowerCase() === req.body.email.toLowerCase());
    if (exists) return res.status(409).json({ message: 'An account with this email already exists' });
    const user = { id: nextId(db.users, 'U'), active: true, ...req.body };
    db.users.push(user);
    writeDb(db);
    const { password, ...safeUser } = user;
    res.status(201).json({ user: safeUser });
  } catch (error) { next(error); }
});
app.get('/api/venues', (req, res) => {
  const db = readDb(); const { location, date, minCapacity, ownerId, active, q } = req.query;
  res.json(db.venues.filter((venue) =>
    (active === undefined ? venue.active : String(venue.active) === active) &&
    (!ownerId || venue.ownerId === ownerId) &&
    (!location || includes(venue.location, location)) &&
    (!date || venue.availableDates.includes(date)) &&
    (!minCapacity || venue.capacity >= Number(minCapacity)) &&
    (!q || includes(venue.name, q) || includes(venue.amenities.join(' '), q))
  ));
});
app.post('/api/venues', (req, res, next) => { try { requireFields(req.body, ['ownerId', 'name', 'location', 'capacity', 'size', 'pricePerDay']); const db = readDb(); const venue = { id: nextId(db.venues, 'V'), active: true, amenities: [], availableDates: [], photos: [], floorPlan: '', ...req.body, amenities: asList(req.body.amenities), availableDates: asList(req.body.availableDates), photos: asList(req.body.photos) }; db.venues.push(venue); writeDb(db); res.status(201).json(venue); } catch (error) { next(error); } });
app.patch('/api/venues/:id', (req, res) => { const db = readDb(); const venue = byId(db.venues, req.params.id); if (!venue) return res.status(404).json({ message: 'Venue not found' }); Object.assign(venue, req.body, req.body.amenities ? { amenities: asList(req.body.amenities) } : {}, req.body.availableDates ? { availableDates: asList(req.body.availableDates) } : {}, req.body.photos ? { photos: asList(req.body.photos) } : {}); writeDb(db); res.json(venue); });
app.delete('/api/venues/:id', (req, res) => { const db = readDb(); const venue = byId(db.venues, req.params.id); if (!venue) return res.status(404).json({ message: 'Venue not found' }); db.venues = db.venues.filter((item) => item.id !== req.params.id); writeDb(db); res.json({ ok: true }); });
app.get('/api/bookings', (req, res) => {
  const db = readDb(); const { status, venueId, organizerId, dateFrom, dateTo } = req.query;
  res.json(db.bookingRequests.filter((request) =>
    (!status || request.status === status) &&
    (!venueId || request.venueId === venueId) &&
    (!organizerId || request.organizerId === organizerId) &&
    (!dateFrom || request.eventDate >= dateFrom) &&
    (!dateTo || request.eventDate <= dateTo)
  ));
});
app.post('/api/bookings', (req, res, next) => { try { requireFields(req.body, ['organizerId', 'venueId', 'eventName', 'eventDate', 'attendees']); const db = readDb(); const request = { id: nextId(db.bookingRequests, 'B'), status: 'Pending', message: '', counterProposal: '', ...req.body }; db.bookingRequests.push(request); writeDb(db); res.status(201).json(request); } catch (error) { next(error); } });
app.patch('/api/bookings/:id', (req, res) => { const db = readDb(); const request = byId(db.bookingRequests, req.params.id); if (!request) return res.status(404).json({ message: 'Booking request not found' }); Object.assign(request, req.body); writeDb(db); res.json(request); });
app.get('/api/events', (req, res) => { const db = readDb(); const { date, status, organizerId } = req.query; res.json(db.events.filter((event) => (!date || event.date === date) && (!status || event.status === status) && (!organizerId || event.organizerId === organizerId))); });
app.get('/api/tasks', (req, res) => { const db = readDb(); const { status, assigneeId, eventId, speciality, dueBefore, assigned } = req.query; res.json(db.tasks.filter((task) => (!status || task.status === status) && (!assigneeId || task.assigneeId === assigneeId) && (!eventId || task.eventId === eventId) && (!speciality || task.speciality === speciality) && (!dueBefore || task.dueDate <= dueBefore) && (assigned === undefined || String(Boolean(task.assigneeId)) === assigned))); });
app.post('/api/tasks', (req, res, next) => { try { requireFields(req.body, ['eventId', 'title', 'dueDate']); const db = readDb(); const task = { id: nextId(db.tasks, 'T'), status: 'Not Assigned', speciality: 'General', assigneeId: '', ...req.body }; db.tasks.push(task); writeDb(db); res.status(201).json(task); } catch (error) { next(error); } });
app.patch('/api/tasks/:id', (req, res) => { const db = readDb(); const task = byId(db.tasks, req.params.id); if (!task) return res.status(404).json({ message: 'Task not found' }); Object.assign(task, req.body); writeDb(db); res.json(task); });
app.get('/api/budget/:eventId', (req, res) => { const db = readDb(); const items = db.budgetItems.filter((item) => item.eventId === req.params.eventId); res.json({ items, totals: items.reduce((acc, item) => { acc.planned += item.planned; acc.actual += item.actual; acc.difference = acc.planned - acc.actual; return acc; }, { planned: 0, actual: 0, difference: 0 }) }); });
app.post('/api/budget', (req, res, next) => { try { requireFields(req.body, ['eventId', 'category', 'planned', 'actual']); const db = readDb(); const item = { id: nextId(db.budgetItems, 'P'), ...req.body, planned: Number(req.body.planned), actual: Number(req.body.actual) }; db.budgetItems.push(item); writeDb(db); res.status(201).json(item); } catch (error) { next(error); } });
app.patch('/api/budget/:id', (req, res) => { const db = readDb(); const item = byId(db.budgetItems, req.params.id); if (!item) return res.status(404).json({ message: 'Budget item not found' }); Object.assign(item, req.body, { planned: req.body.planned === undefined ? item.planned : Number(req.body.planned), actual: req.body.actual === undefined ? item.actual : Number(req.body.actual) }); writeDb(db); res.json(item); });
app.delete('/api/budget/:id', (req, res) => { const db = readDb(); const item = byId(db.budgetItems, req.params.id); if (!item) return res.status(404).json({ message: 'Budget item not found' }); db.budgetItems = db.budgetItems.filter((budgetItem) => budgetItem.id !== req.params.id); writeDb(db); res.json({ ok: true }); });
app.get('/api/vendors', (req, res) => { const db = readDb(); const { q, location, supply } = req.query; res.json(db.vendors.filter((vendor) => (!q || includes(vendor.companyName, q) || includes(vendor.supplies.join(' '), q)) && (!location || includes(vendor.location, location)) && (!supply || includes(vendor.supplies.join(' '), supply)))); });
app.patch('/api/vendors/:id', (req, res) => { const db = readDb(); const vendor = byId(db.vendors, req.params.id); if (!vendor) return res.status(404).json({ message: 'Vendor not found' }); Object.assign(vendor, req.body, req.body.supplies ? { supplies: asList(req.body.supplies) } : {}); writeDb(db); res.json(vendor); });
app.get('/api/sourcing-requests', (req, res) => { const db = readDb(); const { eventId, vendorId, status, deliveryStatus } = req.query; res.json(db.sourcingRequests.filter((request) => (!eventId || request.eventId === eventId) && (!vendorId || request.vendorId === vendorId) && (!status || request.status === status) && (!deliveryStatus || request.deliveryStatus === deliveryStatus))); });
app.post('/api/sourcing-requests', (req, res, next) => { try { requireFields(req.body, ['eventId', 'vendorId', 'items', 'quantity', 'deliveryDate']); const db = readDb(); const request = { id: nextId(db.sourcingRequests, 'SR'), status: 'Pending', deliveryStatus: 'Not Scheduled', note: '', ...req.body }; db.sourcingRequests.push(request); writeDb(db); res.status(201).json(request); } catch (error) { next(error); } });
app.patch('/api/sourcing-requests/:id', (req, res) => { const db = readDb(); const request = byId(db.sourcingRequests, req.params.id); if (!request) return res.status(404).json({ message: 'Sourcing request not found' }); Object.assign(request, req.body); writeDb(db); res.json(request); });
app.get('/api/invoices', (req, res) => { const db = readDb(); const { vendorId, eventId, status } = req.query; res.json(db.invoices.filter((invoice) => (!vendorId || invoice.vendorId === vendorId) && (!eventId || invoice.eventId === eventId) && (!status || invoice.status === status))); });
app.post('/api/invoices', (req, res, next) => { try { requireFields(req.body, ['vendorId', 'eventId', 'amount', 'breakdown']); const db = readDb(); const invoice = { id: nextId(db.invoices, 'I'), status: 'Pending Review', submittedAt: new Date().toISOString().slice(0, 10), ...req.body, amount: Number(req.body.amount) }; db.invoices.push(invoice); writeDb(db); res.status(201).json(invoice); } catch (error) { next(error); } });
app.patch('/api/invoices/:id', (req, res) => { const db = readDb(); const invoice = byId(db.invoices, req.params.id); if (!invoice) return res.status(404).json({ message: 'Invoice not found' }); Object.assign(invoice, req.body); writeDb(db); res.json(invoice); });
app.get('/api/guests', (req, res) => { const db = readDb(); const { eventId, rsvp, checkedIn, dietary, q, messageSeen } = req.query; res.json(db.guests.filter((guest) => (!eventId || guest.eventId === eventId) && (!rsvp || guest.rsvp === rsvp) && (checkedIn === undefined || String(guest.checkedIn) === checkedIn) && (!dietary || includes(guest.dietary, dietary)) && (!q || includes(guest.name, q) || includes(guest.email, q)) && (messageSeen === undefined || String(guest.messageSeen) === messageSeen))); });
app.post('/api/guests', (req, res, next) => { try { requireFields(req.body, ['eventId', 'name', 'email']); const db = readDb(); const guest = { id: nextId(db.guests, 'G'), rsvp: 'Invited', dietary: '', checkedIn: false, messageSeen: false, qrCode: `LAYALI-${Date.now()}`, ...req.body }; db.guests.push(guest); writeDb(db); res.status(201).json(guest); } catch (error) { next(error); } });
app.patch('/api/guests/:id', (req, res) => { const db = readDb(); const guest = byId(db.guests, req.params.id); if (!guest) return res.status(404).json({ message: 'Guest not found' }); Object.assign(guest, req.body); writeDb(db); res.json(guest); });
app.post('/api/guests/:id/invite', (req, res) => { const db = readDb(); const guest = byId(db.guests, req.params.id); if (!guest) return res.status(404).json({ message: 'Guest not found' }); Object.assign(guest, { invitationSent: true, invitedAt: new Date().toISOString(), invitationChannel: req.body.channel || 'Email' }); writeDb(db); res.json(guest); });
app.get('/api/communications', (req, res) => res.json(readDb().communications));
app.post('/api/communications', (req, res, next) => { try { requireFields(req.body, ['eventId', 'body']); const db = readDb(); const message = { id: nextId(db.communications, 'M'), sentAt: new Date().toISOString(), audience: 'All Guests', seenBy: [], ...req.body }; db.communications.push(message); writeDb(db); res.status(201).json(message); } catch (error) { next(error); } });
app.post('/api/communications/follow-up', (req, res, next) => { try { requireFields(req.body, ['eventId', 'body']); const db = readDb(); const unseenGuests = db.guests.filter((guest) => guest.eventId === req.body.eventId && !guest.messageSeen); const message = { id: nextId(db.communications, 'M'), sentAt: new Date().toISOString(), audience: 'Guests with unseen updates', seenBy: [], targetGuestIds: unseenGuests.map((guest) => guest.id), body: req.body.body, eventId: req.body.eventId }; db.communications.push(message); writeDb(db); res.status(201).json(message); } catch (error) { next(error); } });
app.patch('/api/communications/:id/seen', (req, res, next) => { try { requireFields(req.body, ['guestId']); const db = readDb(); const message = byId(db.communications, req.params.id); if (!message) return res.status(404).json({ message: 'Communication not found' }); message.seenBy = [...new Set([...(message.seenBy || []), req.body.guestId])]; const guest = byId(db.guests, req.body.guestId); if (guest) guest.messageSeen = true; writeDb(db); res.json(message); } catch (error) { next(error); } });
app.get('/api/feedback', (req, res) => res.json(readDb().feedback));
app.post('/api/feedback', (req, res, next) => { try { requireFields(req.body, ['eventId', 'guestId', 'overall', 'food', 'venue', 'organization']); const db = readDb(); const feedback = { id: nextId(db.feedback, 'F'), comments: '', ...req.body }; db.feedback.push(feedback); writeDb(db); res.status(201).json(feedback); } catch (error) { next(error); } });
app.get('/api/layouts', (req, res) => res.json(readDb().layouts));
app.patch('/api/layouts/:id', (req, res) => { const db = readDb(); const layout = byId(db.layouts, req.params.id); if (!layout) return res.status(404).json({ message: 'Layout not found' }); Object.assign(layout, req.body); writeDb(db); res.json(layout); });
app.get('/api/reminders', (req, res) => { const db = readDb(); const { eventId } = req.query; const today = req.query.today || new Date().toISOString().slice(0, 10); res.json(db.tasks.filter((task) => (!eventId || task.eventId === eventId) && task.status !== 'Done' && task.dueDate <= today).map((task) => ({ id: `R-${task.id}`, taskId: task.id, title: task.title, dueDate: task.dueDate, status: 'Due', message: `${task.title} is due by ${task.dueDate}` }))); });
app.get('/api/reports/event/:eventId', (req, res) => {
  const db = readDb(); const event = byId(db.events, req.params.eventId); if (!event) return res.status(404).json({ message: 'Event not found' });
  const guests = db.guests.filter((guest) => guest.eventId === event.id); const feedback = db.feedback.filter((item) => item.eventId === event.id); const budget = db.budgetItems.filter((item) => item.eventId === event.id); const tasks = db.tasks.filter((task) => task.eventId === event.id);
  const total = (field) => budget.reduce((sum, item) => sum + item[field], 0); const avg = (field) => feedback.length ? Number((feedback.reduce((sum, item) => sum + item[field], 0) / feedback.length).toFixed(1)) : 0;
  res.json({ event, attendance: { invited: guests.length, arrived: guests.filter((guest) => guest.checkedIn).length, rsvpAttending: guests.filter((guest) => guest.rsvp === 'Attending').length }, costs: { planned: total('planned'), actual: total('actual'), difference: total('planned') - total('actual') }, outcomes: { feedbackOverall: avg('overall'), completedTasks: tasks.filter((task) => task.status === 'Done').length, totalTasks: tasks.length }, feedback, budget, tasks });
});
app.use((error, req, res, next) => res.status(error.status || 500).json({ message: error.message || 'Server error' }));
app.listen(PORT, () => console.log(`Layali Events API running on http://localhost:${PORT}`));
