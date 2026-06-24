import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CalendarDays,
  ClipboardCheck,
  Coins,
  Download,
  Edit3,
  FileDown,
  FileImage,
  LayoutDashboard,
  LogIn,
  MapPin,
  MessageSquare,
  PackageCheck,
  Search,
  Send,
  Trash2,
  UserCog,
  UserPlus,
  UsersRound,
  Warehouse
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
const money = new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 });

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Request failed');
  return data;
}

function StatusPill({ value }) {
  return <span className={`pill ${String(value).toLowerCase().replace(/\s/g, '-')}`}>{value}</span>;
}

function Stat({ icon: Icon, label, value, hint }) {
  return <div className="stat"><Icon size={19} /><div><strong>{value}</strong><span>{label}</span>{hint && <small>{hint}</small>}</div></div>;
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function ProfilePanel({ currentUser, setCurrentUser, reload, setToast }) {
  const [profile, setProfile] = useState({ name: '', email: '', password: '' });
  useEffect(() => { setProfile({ name: currentUser?.name || '', email: currentUser?.email || '', password: '' }); }, [currentUser?.id]);

  async function saveProfile(event) {
    event.preventDefault();
    const patch = { name: profile.name, email: profile.email };
    if (profile.password.trim()) patch.password = profile.password;
    const updated = await request(`/users/${currentUser.id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    setCurrentUser(updated);
    setProfile({ name: updated.name, email: updated.email, password: '' });
    setToast('Profile updated');
    reload();
  }

  return <section className="panel profile-box">
    <div className="section-head"><div><h2>My Profile</h2><p>Edit the account currently signed in to this workspace.</p></div><StatusPill value={currentUser.role === 'owner' ? 'Venue Owner' : currentUser.role} /></div>
    <form onSubmit={saveProfile} className="toolbar">
      <Field label="Name"><input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required /></Field>
      <Field label="Email"><input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} required /></Field>
      <Field label="New password"><input type="password" value={profile.password} onChange={(e) => setProfile({ ...profile, password: e.target.value })} placeholder="Leave blank to keep current" /></Field>
      <button><Edit3 size={16} /> Save profile</button>
    </form>
  </section>;
}

function downloadFile(filename, text, type = 'text/plain') {
  const blob = new Blob([text], { type });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function AuthScreen({ onAuthenticated, setToast }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: 'nour@layali.test', password: 'demo123', role: 'organizer' });

  async function submit(event) {
    event.preventDefault();
    const result = await request(mode === 'login' ? '/auth/login' : '/auth/signup', {
      method: 'POST',
      body: JSON.stringify(mode === 'login' ? { email: form.email, password: form.password } : form)
    });
    onAuthenticated(result.user);
    setToast(mode === 'login' ? 'Logged in successfully' : 'Account created successfully');
  }

  return <main className="auth-page">
    <section className="auth-hero">
      <div className="brand auth-brand"><span>LE</span><div><strong>Layali Events</strong><small>Full-stack event platform</small></div></div>
      <h1>Plan, coordinate, and run events from one workspace.</h1>
      <p>Sign in as an organizer, staff member, vendor, guest, or venue owner to continue into the matching dashboard.</p>
      <div className="auth-demo"><strong>Demo login</strong><span>Organizer: nour@layali.test</span><span>Staff: omar@layali.test</span><span>Vendor: sales@cairobloom.test</span><span>Password: demo123</span></div>
    </section>
    <section className="auth-card">
      <div className="auth-tabs">
        <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')} type="button"><LogIn size={18} /> Log in</button>
        <button className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')} type="button"><UserPlus size={18} /> Sign up</button>
      </div>
      <form onSubmit={submit} className="stacked">
        {mode === 'signup' && <Field label="Full name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>}
        <Field label="Email"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></Field>
        <Field label="Password"><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></Field>
        {mode === 'signup' && <Field label="Account type"><select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}><option value="organizer">Organizer</option><option value="staff">Staff</option><option value="vendor">Vendor</option><option value="guest">Guest</option><option value="owner">Venue Owner</option></select></Field>}
        <button>{mode === 'login' ? 'Log in' : 'Create account'}</button>
      </form>
    </section>
  </main>;
}

function LayoutEditor({ data, reload, setToast }) {
  const layout = data.layouts?.[0];
  const [tool, setTool] = useState('Seating');
  const [dragId, setDragId] = useState(null);
  if (!layout) return null;

  async function saveElements(elements) {
    await request(`/layouts/${layout.id}`, { method: 'PATCH', body: JSON.stringify({ elements }) });
    reload();
  }

  async function addElement(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    const elements = [...layout.elements, { id: `LE${Date.now()}`, type: tool, x: Math.round(((event.clientX - rect.left) / rect.width) * 100), y: Math.round(((event.clientY - rect.top) / rect.height) * 100) }];
    await saveElements(elements);
    setToast(`${tool} added to layout`);
  }

  async function moveElement(event, droppedId = dragId) {
    event.preventDefault();
    if (!droppedId) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(4, Math.min(96, Math.round(((event.clientX - rect.left) / rect.width) * 100)));
    const y = Math.max(6, Math.min(94, Math.round(((event.clientY - rect.top) / rect.height) * 100)));
    await saveElements(layout.elements.map((item) => item.id === droppedId ? { ...item, x, y } : item));
    setDragId(null);
    setToast('Layout element moved');
  }

  async function removeElement(id) {
    await saveElements(layout.elements.filter((item) => item.id !== id));
    setToast('Layout element removed');
  }

  function exportSvg() {
    const items = layout.elements.map((item) => `<rect x="${item.x * 8 - 45}" y="${item.y * 4 - 15}" width="90" height="30" rx="5" fill="#2d4f73"/><text x="${item.x * 8}" y="${item.y * 4 + 5}" text-anchor="middle" font-family="Arial" font-size="12" fill="white">${item.type}</text>`).join('');
    downloadFile('layali-floor-plan.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><rect width="800" height="400" fill="#f8f6ee"/><g>${items}</g></svg>`, 'image/svg+xml');
  }

  return <section className="panel span">
    <div className="section-head"><h3>Drag Layout Designer</h3><LayoutDashboard size={18} /></div>
    <div className="toolbar">
      <Field label="Element"><select value={tool} onChange={(e) => setTool(e.target.value)}><option>Seating</option><option>Stage</option><option>Buffet</option><option>Welcome Desk</option><option>Vendor Bay</option><option>Photo Wall</option></select></Field>
      <button type="button" onClick={exportSvg}><FileImage size={16} /> Export image</button>
      <button type="button" onClick={() => window.print()}><FileDown size={16} /> Print PDF</button>
    </div>
    <div
      className="floorplan designer"
      onDoubleClick={addElement}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => moveElement(event, event.dataTransfer.getData('text/plain') || dragId)}
    >
      {layout.elements.map((item) => <button
        key={item.id}
        draggable
        title="Drag to move. Double click the plan to add."
        onDoubleClick={(event) => event.stopPropagation()}
        onDragStart={(event) => { setDragId(item.id); event.dataTransfer.setData('text/plain', item.id); event.dataTransfer.effectAllowed = 'move'; }}
        style={{ left: `${item.x}%`, top: `${item.y}%` }}
      >{item.type}</button>)}
    </div>
    <div className="mini-table">{layout.elements.map((item) => <div key={item.id}><span>{item.type}</span><span>{item.x}%, {item.y}%</span><button className="icon danger" onClick={() => removeElement(item.id)}><Trash2 size={15} /></button></div>)}</div>
  </section>;
}

function OrganizerView({ data, reload, setToast, currentUser }) {
  const [venueFilter, setVenueFilter] = useState({ location: 'Cairo', date: '2026-07-10', minCapacity: '100' });
  const [venues, setVenues] = useState([]);
  const [eventDate, setEventDate] = useState('');
  const [taskFilter, setTaskFilter] = useState({ status: '', speciality: '', assigned: '' });
  const [guestFilter, setGuestFilter] = useState({ rsvp: '', checkedIn: '', dietary: '', q: '' });
  const [staffFilter, setStaffFilter] = useState({ employmentType: '', speciality: '' });
  const [vendorSearch, setVendorSearch] = useState('');
  const [budgetForm, setBudgetForm] = useState({ eventId: 'E001', category: '', planned: '', actual: '' });
  const [taskForm, setTaskForm] = useState({ title: '', assigneeId: '', status: 'Pending', dueDate: '2026-07-09', speciality: 'General' });
  const [accountForm, setAccountForm] = useState({ name: '', email: '', role: 'staff', password: 'demo123', speciality: '', employmentType: 'part-time' });
  const [vendorForm, setVendorForm] = useState({ vendorId: 'VN001', items: '', quantity: 1, deliveryDate: '2026-07-10' });
  const [message, setMessage] = useState('');
  const [reminders, setReminders] = useState([]);

  const filteredTasks = data.tasks?.filter((task) => (!taskFilter.status || task.status === taskFilter.status) && (!taskFilter.speciality || task.speciality === taskFilter.speciality) && (!taskFilter.assigned || String(Boolean(task.assigneeId)) === taskFilter.assigned)) || [];
  const filteredGuests = data.guests?.filter((guest) => (!guestFilter.rsvp || guest.rsvp === guestFilter.rsvp) && (!guestFilter.checkedIn || String(guest.checkedIn) === guestFilter.checkedIn) && (!guestFilter.dietary || guest.dietary.toLowerCase().includes(guestFilter.dietary.toLowerCase())) && (!guestFilter.q || `${guest.name} ${guest.email}`.toLowerCase().includes(guestFilter.q.toLowerCase()))) || [];
  const filteredStaff = data.users?.filter((user) => user.role === 'staff' && (!staffFilter.employmentType || user.employmentType === staffFilter.employmentType) && (!staffFilter.speciality || user.speciality === staffFilter.speciality)) || [];
  const organizerEvents = data.events?.filter((event) => event.organizerId === currentUser?.id && (!eventDate || event.date === eventDate)) || [];
  const organizerBookings = data.bookings?.filter((booking) => booking.organizerId === currentUser?.id) || [];
  const filteredVendors = data.vendors?.filter((vendor) => !vendorSearch || `${vendor.companyName} ${vendor.location} ${vendor.supplies?.join(' ')}`.toLowerCase().includes(vendorSearch.toLowerCase())) || [];

  async function searchVenues() { setVenues(await request(`/venues?${new URLSearchParams(venueFilter).toString()}`)); }
  useEffect(() => { searchVenues(); }, []);
  useEffect(() => { request('/reminders?eventId=E001&today=2026-07-09').then(setReminders).catch(() => setReminders([])); }, [data.tasks]);

  async function addBudget(event) {
    event.preventDefault();
    await request('/budget', { method: 'POST', body: JSON.stringify(budgetForm) });
    setBudgetForm({ eventId: 'E001', category: '', planned: '', actual: '' });
    setToast('Budget item saved');
    reload();
  }

  async function addTask(event) {
    event.preventDefault();
    await request('/tasks', { method: 'POST', body: JSON.stringify({ eventId: 'E001', ...taskForm }) });
    setTaskForm({ title: '', assigneeId: '', status: 'Pending', dueDate: '2026-07-09', speciality: 'General' });
    setToast('Task assigned');
    reload();
  }

  async function createAccount(event) {
    event.preventDefault();
    await request('/users', { method: 'POST', body: JSON.stringify(accountForm) });
    setAccountForm({ name: '', email: '', role: 'staff', password: 'demo123', speciality: '', employmentType: 'part-time' });
    setToast('Stakeholder account created');
    reload();
  }

  async function updateUser(id, patch, toast) {
    await request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
    setToast(toast);
    reload();
  }

  async function sendSourcingRequest(event) {
    event.preventDefault();
    await request('/sourcing-requests', { method: 'POST', body: JSON.stringify({ eventId: 'E001', ...vendorForm }) });
    setVendorForm({ vendorId: 'VN001', items: '', quantity: 1, deliveryDate: '2026-07-10' });
    setToast('Sourcing request sent');
    reload();
  }

  async function sendMessage(event) {
    event.preventDefault();
    await request('/communications', { method: 'POST', body: JSON.stringify({ eventId: 'E001', body: message }) });
    setMessage('');
    setToast('Guest communication sent');
    reload();
  }

  async function sendFollowUp() {
    await request('/communications/follow-up', { method: 'POST', body: JSON.stringify({ eventId: 'E001', body: 'Follow-up: please check the latest event update.' }) });
    setToast('Follow-up sent to guests with unseen updates');
    reload();
  }

  async function sendInvitation(guest) {
    await request(`/guests/${guest.id}/invite`, { method: 'POST', body: JSON.stringify({ channel: 'Email' }) });
    setToast(`Invitation sent to ${guest.name}`);
    reload();
  }

  async function exportReport() {
    const report = await request('/reports/event/E001');
    downloadFile('layali-event-report.txt', [
      'Layali Events Report',
      `Event: ${report.event.name}`,
      `Attendance: ${report.attendance.arrived}/${report.attendance.invited}`,
      `Budget planned: ${money.format(report.costs.planned)}`,
      `Budget actual: ${money.format(report.costs.actual)}`,
      `Budget difference: ${money.format(report.costs.difference)}`,
      `Feedback overall: ${report.outcomes.feedbackOverall}/5`,
      `Tasks completed: ${report.outcomes.completedTasks}/${report.outcomes.totalTasks}`
    ].join('\n'));
  }

  return <div className="grid two">
    <section className="panel span">
      <div className="section-head"><div><h2>Organizer Command Center</h2><p>Nile Makers Night planning snapshot</p></div><StatusPill value={data.dashboard?.event?.status || 'Planning'} /></div>
      <div className="stats">
        <Stat icon={UsersRound} label="Guests arrived" value={`${data.dashboard?.arrivedGuests || 0}/${data.dashboard?.guestCount || 0}`} hint="Day-of operations" />
        <Stat icon={Coins} label="Actual spend" value={money.format(data.dashboard?.budget?.actual || 0)} hint={`${money.format((data.dashboard?.budget?.planned || 0) - (data.dashboard?.budget?.actual || 0))} remaining`} />
        <Stat icon={MessageSquare} label="Unseen updates" value={data.dashboard?.unseenMessages || 0} hint="Follow-up target" />
        <Stat icon={Bell} label="Due reminders" value={reminders.length} hint="Pending tasks due soon" />
      </div>
    </section>

    <section className="panel">
      <div className="section-head"><h3>Events and Booking Status</h3><CalendarDays size={18} /></div>
      <Field label="Filter events by date"><input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} /></Field>
      <div className="list top-gap">{organizerEvents.map((event) => <article className="list-item" key={event.id}><div><strong>{event.name}</strong><span>{event.date} - {event.type}</span></div><StatusPill value={event.status} /></article>)}</div>
      <div className="mini-table top-gap">{organizerBookings.map((booking) => {
        const venue = data.venues?.find((item) => item.id === booking.venueId);
        return <div key={booking.id}><span>{booking.eventName}</span><span>{venue?.name || booking.venueId} - {booking.eventDate}</span><StatusPill value={booking.counterProposal || booking.status} /></div>;
      })}</div>
    </section>

    <section className="panel">
      <div className="section-head"><h3>Venue Search</h3><Search size={18} /></div>
      <div className="form-row"><Field label="City"><input value={venueFilter.location} onChange={(e) => setVenueFilter({ ...venueFilter, location: e.target.value })} /></Field><Field label="Date"><input type="date" value={venueFilter.date} onChange={(e) => setVenueFilter({ ...venueFilter, date: e.target.value })} /></Field><Field label="Capacity"><input type="number" value={venueFilter.minCapacity} onChange={(e) => setVenueFilter({ ...venueFilter, minCapacity: e.target.value })} /></Field><button onClick={searchVenues}>Search</button></div>
      <div className="list">{venues.map((venue) => <article className="list-item" key={venue.id}><div><strong>{venue.name}</strong><span>{venue.location} - {venue.capacity} guests - {money.format(venue.pricePerDay)}</span><small>{venue.availableDates?.join(', ')}</small></div><button onClick={async () => { await request('/bookings', { method: 'POST', body: JSON.stringify({ organizerId: 'U001', venueId: venue.id, eventName: 'Pop-up Showcase', eventDate: venueFilter.date, attendees: venueFilter.minCapacity, message: 'Request created from organizer search.' }) }); setToast('Booking application submitted'); reload(); }}>Apply</button></article>)}</div>
    </section>

    <section className="panel">
      <div className="section-head"><h3>Task Reminders</h3><Bell size={18} /></div>
      <div className="list compact">{reminders.map((reminder) => <article className="notice" key={reminder.id}>{reminder.message}<StatusPill value={reminder.status} /></article>)}</div>
      {!reminders.length && <p className="muted">No due reminders for this event.</p>}
    </section>

    <section className="panel">
      <div className="section-head"><h3>Tasks and Staff</h3><ClipboardCheck size={18} /></div>
      <form onSubmit={addTask} className="stacked"><Field label="Task title"><input value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} required /></Field><div className="form-row"><Field label="Assignee"><select value={taskForm.assigneeId} onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}><option value="">Unassigned</option>{data.users?.filter((user) => user.role === 'staff' && user.active).map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}</select></Field><Field label="Status"><select value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}><option>Pending</option><option>In Progress</option><option>Done</option></select></Field></div><div className="form-row"><Field label="Speciality"><input value={taskForm.speciality} onChange={(e) => setTaskForm({ ...taskForm, speciality: e.target.value })} /></Field><Field label="Due date"><input type="date" value={taskForm.dueDate} onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })} /></Field></div><button>Assign task</button></form>
      <div className="toolbar"><Field label="Status filter"><select value={taskFilter.status} onChange={(e) => setTaskFilter({ ...taskFilter, status: e.target.value })}><option value="">All</option><option>Not Assigned</option><option>Pending</option><option>In Progress</option><option>Done</option></select></Field><Field label="Speciality"><input value={taskFilter.speciality} onChange={(e) => setTaskFilter({ ...taskFilter, speciality: e.target.value })} /></Field><Field label="Assigned"><select value={taskFilter.assigned} onChange={(e) => setTaskFilter({ ...taskFilter, assigned: e.target.value })}><option value="">All</option><option value="true">Assigned</option><option value="false">Unassigned</option></select></Field></div>
      <div className="list compact">{filteredTasks.map((task) => <article className="list-item" key={task.id}><div><strong>{task.title}</strong><span>{task.speciality} - due {task.dueDate}</span></div><select value={task.status} onChange={async (e) => { await request(`/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify({ status: e.target.value }) }); reload(); }}><option>Not Assigned</option><option>Pending</option><option>In Progress</option><option>Done</option></select></article>)}</div>
    </section>

    <section className="panel">
      <div className="section-head"><h3>Stakeholder Accounts</h3><UserCog size={18} /></div>
      <form onSubmit={createAccount} className="stacked"><Field label="Name"><input value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} required /></Field><Field label="Email"><input type="email" value={accountForm.email} onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })} required /></Field><div className="form-row"><Field label="Role"><select value={accountForm.role} onChange={(e) => setAccountForm({ ...accountForm, role: e.target.value })}><option value="staff">Staff</option><option value="vendor">Vendor</option><option value="guest">Guest</option></select></Field><Field label="Employment"><select value={accountForm.employmentType} onChange={(e) => setAccountForm({ ...accountForm, employmentType: e.target.value })}><option>part-time</option><option>full-time</option></select></Field></div><Field label="Speciality"><input value={accountForm.speciality} onChange={(e) => setAccountForm({ ...accountForm, speciality: e.target.value })} /></Field><button>Create account</button></form>
      <div className="toolbar"><Field label="Staff type"><select value={staffFilter.employmentType} onChange={(e) => setStaffFilter({ ...staffFilter, employmentType: e.target.value })}><option value="">All</option><option>part-time</option><option>full-time</option></select></Field><Field label="Staff speciality"><input value={staffFilter.speciality} onChange={(e) => setStaffFilter({ ...staffFilter, speciality: e.target.value })} /></Field></div>
      <div className="mini-table">{filteredStaff.map((user) => <div key={user.id}><span>{user.name}</span><span>{user.age || '-'} yrs - {user.speciality || user.role}</span><button className={user.active ? 'icon danger' : 'icon'} onClick={() => updateUser(user.id, { active: !user.active }, user.active ? 'Account deactivated' : 'Account reactivated')}>{user.active ? 'Deactivate' : 'Activate'}</button></div>)}</div>
    </section>

    <section className="panel">
      <div className="section-head"><h3>Guest Filters</h3><UsersRound size={18} /></div>
      <div className="toolbar"><Field label="Search"><input value={guestFilter.q} onChange={(e) => setGuestFilter({ ...guestFilter, q: e.target.value })} /></Field><Field label="RSVP"><select value={guestFilter.rsvp} onChange={(e) => setGuestFilter({ ...guestFilter, rsvp: e.target.value })}><option value="">All</option><option>Attending</option><option>Maybe</option><option>Not Attending</option></select></Field><Field label="Checked in"><select value={guestFilter.checkedIn} onChange={(e) => setGuestFilter({ ...guestFilter, checkedIn: e.target.value })}><option value="">All</option><option value="true">Arrived</option><option value="false">Not arrived</option></select></Field><Field label="Dietary"><input value={guestFilter.dietary} onChange={(e) => setGuestFilter({ ...guestFilter, dietary: e.target.value })} /></Field></div>
      <div className="mini-table">{filteredGuests.map((guest) => <div key={guest.id}><span>{guest.name}</span><span>{guest.rsvp} - {guest.dietary} - {guest.invitationSent ? 'Invited' : 'Not invited'}</span><button onClick={() => sendInvitation(guest)} disabled={guest.invitationSent}>{guest.invitationSent ? 'Sent' : 'Send invite'}</button></div>)}</div>
    </section>

    <section className="panel">
      <div className="section-head"><h3>Budget Control</h3><Coins size={18} /></div>
      <form onSubmit={addBudget} className="stacked"><Field label="Category"><input value={budgetForm.category} onChange={(e) => setBudgetForm({ ...budgetForm, category: e.target.value })} required /></Field><div className="form-row"><Field label="Planned"><input type="number" value={budgetForm.planned} onChange={(e) => setBudgetForm({ ...budgetForm, planned: e.target.value })} required /></Field><Field label="Actual"><input type="number" value={budgetForm.actual} onChange={(e) => setBudgetForm({ ...budgetForm, actual: e.target.value })} required /></Field></div><button>Save expense</button></form>
      <div className="mini-table">{data.budget?.items?.map((item) => <div key={item.id}><span>{item.category}</span><span>{money.format(item.actual)}</span><StatusPill value={item.actual <= item.planned ? 'On Track' : 'Over'} /></div>)}</div>
    </section>

    <section className="panel">
      <div className="section-head"><h3>Vendor Coordination</h3><PackageCheck size={18} /></div>
      <form onSubmit={sendSourcingRequest} className="stacked"><Field label="Vendor"><select value={vendorForm.vendorId} onChange={(e) => setVendorForm({ ...vendorForm, vendorId: e.target.value })}>{data.vendors?.map((vendor) => <option key={vendor.id} value={vendor.id}>{vendor.companyName}</option>)}</select></Field><Field label="Requested items"><input value={vendorForm.items} onChange={(e) => setVendorForm({ ...vendorForm, items: e.target.value })} required /></Field><div className="form-row"><Field label="Quantity"><input type="number" value={vendorForm.quantity} onChange={(e) => setVendorForm({ ...vendorForm, quantity: Number(e.target.value) })} required /></Field><Field label="Delivery"><input type="date" value={vendorForm.deliveryDate} onChange={(e) => setVendorForm({ ...vendorForm, deliveryDate: e.target.value })} required /></Field></div><button>Send request</button></form>
      <Field label="Search vendors"><input value={vendorSearch} onChange={(e) => setVendorSearch(e.target.value)} placeholder="Name, supply, or location" /></Field>
      <div className="list top-gap">{filteredVendors.map((vendor) => <article className="list-item" key={vendor.id}><div><strong>{vendor.companyName}</strong><span>{vendor.location} - {vendor.supplies?.join(', ')}</span><small>{vendor.contact} - {vendor.pricing}</small></div><StatusPill value={`${vendor.rating || '-'} Rating`} /></article>)}</div>
      <div className="mini-table top-gap">{data.invoices?.map((item) => {
        const vendor = data.vendors?.find((vendorItem) => vendorItem.id === item.vendorId);
        return <div key={item.id}><span>{vendor?.companyName || item.vendorId}</span><span>{money.format(item.amount)} - {item.breakdown}</span><select value={item.status} onChange={async (e) => { await request(`/invoices/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status: e.target.value }) }); setToast('Invoice review updated'); reload(); }}><option>Pending Review</option><option>Approved</option><option>Paid</option></select></div>;
      })}</div>
    </section>

    <section className="panel">
      <div className="section-head"><h3>Guest Messages</h3><MessageSquare size={18} /></div>
      <form onSubmit={sendMessage} className="stacked"><Field label="Message"><textarea value={message} onChange={(e) => setMessage(e.target.value)} required /></Field><button>Send live update</button></form>
      <div className="actions top-gap"><button onClick={sendFollowUp}><Send size={16} /> Follow up unseen</button><button onClick={exportReport}><Download size={16} /> Export report</button></div>
      <div className="mini-table">{data.messages?.map((item) => <div key={item.id}><span>{item.body}</span><span>{item.audience}</span><StatusPill value={`${item.seenBy?.length || 0}/${data.guests?.length || 0} Seen`} /></div>)}</div>
      <div className="mini-table top-gap">{data.guests?.map((guest) => <div key={guest.id}><span>{guest.name}</span><span>{guest.email}</span><StatusPill value={guest.messageSeen ? 'Seen' : 'Received'} /></div>)}</div>
    </section>

    <LayoutEditor data={data} reload={reload} setToast={setToast} />
  </div>;
}

function StaffView({ data, reload, setToast, currentUser }) {
  const [taskStatus, setTaskStatus] = useState('');
  const [guestStatus, setGuestStatus] = useState('');
  const [eventDate, setEventDate] = useState('');
  const tasks = data.tasks?.filter((task) => (!taskStatus || task.status === taskStatus) && (!currentUser?.id || task.assigneeId === currentUser.id || !task.assigneeId)) || [];
  const staffEventIds = new Set(tasks.map((task) => task.eventId));
  const staffEvents = data.events?.filter((event) => (!staffEventIds.size || staffEventIds.has(event.id)) && (!eventDate || event.date === eventDate)) || [];
  const guests = data.guests?.filter((guest) => !guestStatus || String(guest.checkedIn) === guestStatus) || [];
  return <div className="grid two">
    <section className="panel"><div className="section-head"><h2>Assigned Events</h2><CalendarDays size={18} /></div><Field label="Date filter"><input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} /></Field><div className="list top-gap">{staffEvents.map((event) => <article className="list-item" key={event.id}><div><strong>{event.name}</strong><span>{event.date} - {event.type}</span></div><StatusPill value={event.status} /></article>)}</div></section>
    <section className="panel"><div className="section-head"><h2>Staff Board</h2><ClipboardCheck size={18} /></div><Field label="Status filter"><select value={taskStatus} onChange={(e) => setTaskStatus(e.target.value)}><option value="">All</option><option>Pending</option><option>In Progress</option><option>Done</option></select></Field><div className="list top-gap">{tasks.map((task) => <article className="list-item" key={task.id}><div><strong>{task.title}</strong><span>{task.status} - {task.speciality}</span></div><button onClick={async () => { await request(`/tasks/${task.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'Done' }) }); setToast('Task marked done'); reload(); }}>Done</button></article>)}</div></section>
    <section className="panel"><div className="section-head"><h2>Guest Check-In</h2><UsersRound size={18} /></div><Field label="Check-in filter"><select value={guestStatus} onChange={(e) => setGuestStatus(e.target.value)}><option value="">All</option><option value="true">Arrived</option><option value="false">Not arrived</option></select></Field><div className="list top-gap">{guests.map((guest) => <article className="list-item" key={guest.id}><div><strong>{guest.name}</strong><span>{guest.rsvp} - {guest.qrCode}</span></div><button disabled={guest.checkedIn} onClick={async () => { await request(`/guests/${guest.id}`, { method: 'PATCH', body: JSON.stringify({ checkedIn: true }) }); setToast(`${guest.name} checked in`); reload(); }}>{guest.checkedIn ? 'Arrived' : 'Check in'}</button></article>)}</div></section>
    <section className="panel"><div className="section-head"><h2>Vendor Arrivals</h2><PackageCheck size={18} /></div><div className="list">{data.sourcing?.map((item) => <article className="list-item" key={item.id}><div><strong>{item.items}</strong><span>{item.deliveryStatus}</span></div><button onClick={async () => { await request(`/sourcing-requests/${item.id}`, { method: 'PATCH', body: JSON.stringify({ deliveryStatus: 'Delivered' }) }); setToast('Vendor marked arrived'); reload(); }}>Arrived</button></article>)}</div></section>
    <section className="panel"><div className="section-head"><h2>Operations Dashboard</h2><UsersRound size={18} /></div><div className="stats single"><Stat icon={UsersRound} label="Arrived guests" value={`${data.dashboard?.arrivedGuests || 0}/${data.dashboard?.guestCount || 0}`} /><Stat icon={ClipboardCheck} label="Open tasks" value={data.dashboard?.dueTasks?.length || 0} /></div></section>
    <section className="panel span"><div className="section-head"><h2>Shared Layout</h2><MapPin size={18} /></div><div className="floorplan wide">{data.layouts?.[0]?.elements?.map((item) => <button key={item.id} style={{ left: `${item.x}%`, top: `${item.y}%` }}>{item.type}</button>)}</div></section>
  </div>;
}

function VendorView({ data, reload, setToast }) {
  const vendor = data.vendors?.[0];
  const [profile, setProfile] = useState({ companyName: vendor?.companyName || '', location: vendor?.location || '', pricing: vendor?.pricing || '', supplies: vendor?.supplies?.join(', ') || '', contact: vendor?.contact || '' });
  const [invoice, setInvoice] = useState({ vendorId: 'VN001', eventId: 'E001', amount: '', breakdown: '', attachment: '' });
  const [note, setNote] = useState('');
  useEffect(() => { if (vendor) setProfile({ companyName: vendor.companyName, location: vendor.location, pricing: vendor.pricing, supplies: vendor.supplies.join(', '), contact: vendor.contact }); }, [vendor?.id]);

  async function saveProfile(event) {
    event.preventDefault();
    await request(`/vendors/${vendor.id}`, { method: 'PATCH', body: JSON.stringify(profile) });
    setToast('Vendor profile updated');
    reload();
  }

  async function submitInvoice(event) {
    event.preventDefault();
    await request('/invoices', { method: 'POST', body: JSON.stringify(invoice) });
    setInvoice({ vendorId: 'VN001', eventId: 'E001', amount: '', breakdown: '', attachment: '' });
    setToast('Invoice submitted');
    reload();
  }

  return <div className="grid two">
    <section className="panel"><div className="section-head"><h2>Vendor Profile</h2><UserCog size={18} /></div><form onSubmit={saveProfile} className="stacked"><Field label="Company"><input value={profile.companyName} onChange={(e) => setProfile({ ...profile, companyName: e.target.value })} /></Field><Field label="Supplies"><input value={profile.supplies} onChange={(e) => setProfile({ ...profile, supplies: e.target.value })} /></Field><div className="form-row"><Field label="Location"><input value={profile.location} onChange={(e) => setProfile({ ...profile, location: e.target.value })} /></Field><Field label="Contact"><input value={profile.contact} onChange={(e) => setProfile({ ...profile, contact: e.target.value })} /></Field></div><Field label="Pricing list"><input value={profile.pricing} onChange={(e) => setProfile({ ...profile, pricing: e.target.value })} /></Field><button><Edit3 size={16} /> Save profile</button></form></section>
    <section className="panel"><div className="section-head"><h2>Sourcing Requests</h2><PackageCheck size={18} /></div><div className="list">{data.sourcing?.map((item) => <article className="list-item" key={item.id}><div><strong>{item.items}</strong><span>{item.quantity} units - {item.deliveryDate}</span><StatusPill value={item.status} /></div><div className="actions"><button onClick={async () => { await request(`/sourcing-requests/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'Accepted' }) }); reload(); }}>Accept</button><button onClick={async () => { await request(`/sourcing-requests/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'Declined' }) }); reload(); }}>Decline</button></div></article>)}</div><div className="top-gap"><Field label="Clarification note"><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Message to organizer" /></Field><button onClick={async () => { await request(`/sourcing-requests/${data.sourcing?.[0]?.id}`, { method: 'PATCH', body: JSON.stringify({ note }) }); setNote(''); setToast('Clarification note sent'); reload(); }}>Send note</button></div></section>
    <section className="panel"><div className="section-head"><h2>Delivery Tracking</h2><PackageCheck size={18} /></div><div className="list">{data.sourcing?.map((item) => <article className="list-item" key={item.id}><div><strong>{item.items}</strong><span>{item.deliveryStatus}</span></div><select value={item.deliveryStatus} onChange={async (e) => { await request(`/sourcing-requests/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'Accepted', deliveryStatus: e.target.value }) }); reload(); }}><option>Not Scheduled</option><option>Preparing</option><option>Out for Delivery</option><option>Delivered</option></select></article>)}</div></section>
    <section className="panel"><div className="section-head"><h2>Invoice Desk</h2><Coins size={18} /></div><form onSubmit={submitInvoice} className="stacked"><Field label="Amount"><input type="number" value={invoice.amount} onChange={(e) => setInvoice({ ...invoice, amount: e.target.value })} required /></Field><Field label="Breakdown"><textarea value={invoice.breakdown} onChange={(e) => setInvoice({ ...invoice, breakdown: e.target.value })} required /></Field><Field label="Supporting document"><input value={invoice.attachment} onChange={(e) => setInvoice({ ...invoice, attachment: e.target.value })} placeholder="invoice-breakdown.pdf" /></Field><button>Submit invoice</button></form><div className="mini-table">{data.invoices?.map((item) => <div key={item.id}><span>{money.format(item.amount)}</span><span>{item.attachment || item.breakdown}</span><StatusPill value={item.status} /></div>)}</div></section>
  </div>;
}

function GuestView({ data, reload, setToast, currentUser }) {
  const guest = data.guests?.find((item) => item.email === currentUser?.email) || data.guests?.[0];
  const guestMessages = data.messages?.filter((message) => !message.targetGuestIds || message.targetGuestIds.includes(guest?.id)) || [];
  const [dietary, setDietary] = useState(guest?.dietary || '');
  const [feedback, setFeedback] = useState({ overall: 5, food: 4, venue: 5, organization: 5, comments: '' });
  useEffect(() => { if (guest?.dietary !== undefined) setDietary(guest.dietary); }, [guest?.id]);
  useEffect(() => {
    const unseen = guestMessages.filter((message) => guest?.id && !message.seenBy?.includes(guest.id));
    if (!unseen.length) return;
    Promise.all(unseen.map((message) => request(`/communications/${message.id}/seen`, { method: 'PATCH', body: JSON.stringify({ guestId: guest.id }) }))).then(reload).catch(() => {});
  }, [guest?.id, guestMessages.length]);
  async function updateRsvp(value) {
    await request(`/guests/${guest.id}`, { method: 'PATCH', body: JSON.stringify({ rsvp: value, dietary }) });
    setToast('RSVP updated');
    reload();
  }
  async function submitFeedback(event) {
    event.preventDefault();
    await request('/feedback', { method: 'POST', body: JSON.stringify({ eventId: guest.eventId, guestId: guest.id, ...feedback }) });
    setToast('Thank you for your feedback');
  }
  return <div className="grid two"><section className="panel invite"><h2>Nile Makers Night</h2><p>July 10, 2026 at Zamalek Glasshouse</p><p>Dress code: Smart casual. Agenda: demos, live showcase, networking.</p><StatusPill value={guest?.invitationSent ? 'Invitation Received' : 'Invitation Pending'} /><div className="qr">{guest?.qrCode}</div><Field label="Dietary or special requirements"><input value={dietary} onChange={(e) => setDietary(e.target.value)} /></Field><div className="segmented"><button onClick={() => updateRsvp('Attending')}>Attending</button><button onClick={() => updateRsvp('Maybe')}>Maybe</button><button onClick={() => updateRsvp('Not Attending')}>Decline</button></div><p className="muted">Current RSVP: {guest?.rsvp}. Check-in: {guest?.checkedIn ? 'Confirmed' : 'Not arrived yet'}.</p></section><section className="panel"><div className="section-head"><h2>Live Updates</h2><MessageSquare size={18} /></div>{guestMessages.map((msg) => <article className="notice" key={msg.id}>{msg.body}<StatusPill value={msg.seenBy?.includes(guest?.id) ? 'Seen' : 'Received'} /></article>)}<form onSubmit={submitFeedback} className="stacked"><div className="form-row"><Field label="Overall"><input type="number" min="1" max="5" value={feedback.overall} onChange={(e) => setFeedback({ ...feedback, overall: Number(e.target.value) })} /></Field><Field label="Food"><input type="number" min="1" max="5" value={feedback.food} onChange={(e) => setFeedback({ ...feedback, food: Number(e.target.value) })} /></Field></div><div className="form-row"><Field label="Venue"><input type="number" min="1" max="5" value={feedback.venue} onChange={(e) => setFeedback({ ...feedback, venue: Number(e.target.value) })} /></Field><Field label="Organization"><input type="number" min="1" max="5" value={feedback.organization} onChange={(e) => setFeedback({ ...feedback, organization: Number(e.target.value) })} /></Field></div><Field label="Post-event comments"><textarea value={feedback.comments} onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })} placeholder="Share your experience" /></Field><button>Send feedback</button></form></section></div>;
}

function OwnerView({ data, reload, setToast, currentUser }) {
  const emptyVenue = { ownerId: currentUser?.id || 'U005', id: '', name: '', description: '', location: 'Cairo', capacity: '', size: '', pricePerDay: '', amenities: '', availableDates: '', photos: '', floorPlan: '' };
  const [venue, setVenue] = useState(emptyVenue);
  const [ownerProfile, setOwnerProfile] = useState({ name: currentUser?.name || '', email: currentUser?.email || '' });
  const [bookingFilter, setBookingFilter] = useState({ status: '', dateFrom: '', dateTo: '' });
  const approved = data.bookings?.filter((booking) => booking.status === 'Approved') || [];
  const bookings = data.bookings?.filter((booking) => (!bookingFilter.status || booking.status === bookingFilter.status) && (!bookingFilter.dateFrom || booking.eventDate >= bookingFilter.dateFrom) && (!bookingFilter.dateTo || booking.eventDate <= bookingFilter.dateTo)) || [];
  const revenue = approved.reduce((sum, booking) => sum + (data.venues?.find((item) => item.id === booking.venueId)?.pricePerDay || 0), 0);
  useEffect(() => { setOwnerProfile({ name: currentUser?.name || '', email: currentUser?.email || '' }); }, [currentUser?.id]);

  async function saveOwnerProfile(event) {
    event.preventDefault();
    await request(`/users/${currentUser.id}`, { method: 'PATCH', body: JSON.stringify(ownerProfile) });
    setToast('Venue owner profile updated');
    reload();
  }

  async function saveVenue(event) {
    event.preventDefault();
    const payload = { ...venue, ownerId: currentUser?.id || venue.ownerId, capacity: Number(venue.capacity), size: Number(venue.size), pricePerDay: Number(venue.pricePerDay) };
    if (venue.id) await request(`/venues/${venue.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
    else await request('/venues', { method: 'POST', body: JSON.stringify(payload) });
    setVenue(emptyVenue);
    setToast(venue.id ? 'Venue listing updated' : 'Venue listing created');
    reload();
  }

  function editVenue(item) {
    setVenue({ ...emptyVenue, ...item, amenities: item.amenities?.join(', ') || '', availableDates: item.availableDates?.join(', ') || '', photos: item.photos?.join(', ') || '' });
  }

  async function removeVenue(id) {
    await request(`/venues/${id}`, { method: 'DELETE' });
    setToast('Venue listing removed');
    reload();
  }

  function exportRevenue() {
    downloadFile('venue-revenue-report.csv', ['venue,booking,date,status,revenue', ...approved.map((booking) => {
      const venueItem = data.venues?.find((item) => item.id === booking.venueId);
      return `${venueItem?.name || ''},${booking.eventName},${booking.eventDate},${booking.status},${venueItem?.pricePerDay || 0}`;
    })].join('\n'), 'text/csv');
  }

  return <div className="grid two">
    <section className="panel span"><div className="stats"><Stat icon={Warehouse} label="Active venues" value={data.venues?.filter((item) => item.active).length || 0} /><Stat icon={CalendarDays} label="Approved bookings" value={approved.length} /><Stat icon={Coins} label="Estimated revenue" value={money.format(revenue)} /></div><div className="actions top-gap"><button onClick={exportRevenue}><Download size={16} /> Export revenue</button></div></section>
    <section className="panel"><div className="section-head"><h2>Owner Profile</h2><UserCog size={18} /></div><form onSubmit={saveOwnerProfile} className="stacked"><Field label="Name"><input value={ownerProfile.name} onChange={(e) => setOwnerProfile({ ...ownerProfile, name: e.target.value })} required /></Field><Field label="Email"><input type="email" value={ownerProfile.email} onChange={(e) => setOwnerProfile({ ...ownerProfile, email: e.target.value })} required /></Field><button>Save profile</button></form></section>
    <section className="panel"><div className="section-head"><h2>Venue Listings</h2><Warehouse size={18} /></div><form onSubmit={saveVenue} className="stacked"><Field label="Name"><input value={venue.name} onChange={(e) => setVenue({ ...venue, name: e.target.value })} required /></Field><Field label="Description"><textarea value={venue.description} onChange={(e) => setVenue({ ...venue, description: e.target.value })} /></Field><div className="form-row"><Field label="Capacity"><input type="number" value={venue.capacity} onChange={(e) => setVenue({ ...venue, capacity: e.target.value })} required /></Field><Field label="Price/day"><input type="number" value={venue.pricePerDay} onChange={(e) => setVenue({ ...venue, pricePerDay: e.target.value })} required /></Field></div><div className="form-row"><Field label="Size m2"><input type="number" value={venue.size} onChange={(e) => setVenue({ ...venue, size: e.target.value })} required /></Field><Field label="Availability dates"><input value={venue.availableDates} onChange={(e) => setVenue({ ...venue, availableDates: e.target.value })} placeholder="2026-08-09, 2026-08-15" /></Field></div><Field label="Amenities"><input value={venue.amenities} onChange={(e) => setVenue({ ...venue, amenities: e.target.value })} /></Field><div className="form-row"><Field label="Photo files"><input value={venue.photos} onChange={(e) => setVenue({ ...venue, photos: e.target.value })} /></Field><Field label="Floor plan file"><input value={venue.floorPlan} onChange={(e) => setVenue({ ...venue, floorPlan: e.target.value })} /></Field></div><div className="actions"><button>{venue.id ? 'Update listing' : 'Create listing'}</button>{venue.id && <button type="button" className="ghost" onClick={() => setVenue(emptyVenue)}>Cancel edit</button>}</div></form><div className="mini-table">{data.venues?.map((item) => <div key={item.id}><span>{item.name}</span><span>{item.availableDates?.join(', ')}</span><div className="actions"><button onClick={() => editVenue(item)}>Edit</button><button className={item.active ? 'icon danger' : 'icon'} onClick={async () => { await request(`/venues/${item.id}`, { method: 'PATCH', body: JSON.stringify({ active: !item.active }) }); setToast(item.active ? 'Venue deactivated' : 'Venue reactivated'); reload(); }}>{item.active ? 'Deactivate' : 'Activate'}</button><button className="icon danger" onClick={() => removeVenue(item.id)}><Trash2 size={15} /></button></div></div>)}</div></section>
    <section className="panel"><div className="section-head"><h2>Booking Requests</h2><CalendarDays size={18} /></div><div className="toolbar"><Field label="Status"><select value={bookingFilter.status} onChange={(e) => setBookingFilter({ ...bookingFilter, status: e.target.value })}><option value="">All</option><option>Pending</option><option>Approved</option><option>Declined</option></select></Field><Field label="From"><input type="date" value={bookingFilter.dateFrom} onChange={(e) => setBookingFilter({ ...bookingFilter, dateFrom: e.target.value })} /></Field><Field label="To"><input type="date" value={bookingFilter.dateTo} onChange={(e) => setBookingFilter({ ...bookingFilter, dateTo: e.target.value })} /></Field></div><div className="list">{bookings.map((booking) => <article className="list-item" key={booking.id}><div><strong>{booking.eventName}</strong><span>{booking.eventDate} - {booking.attendees} attendees</span><StatusPill value={booking.status} /></div><div className="actions"><button onClick={async () => { await request(`/bookings/${booking.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'Approved' }) }); setToast('Booking approved'); reload(); }}>Approve</button><button onClick={async () => { await request(`/bookings/${booking.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'Declined', counterProposal: 'Alternative dates are available.' }) }); reload(); }}>Decline</button></div></article>)}</div></section>
    <section className="panel"><div className="section-head"><h2>Invoice Review</h2><Coins size={18} /></div><div className="mini-table">{data.invoices?.map((item) => <div key={item.id}><span>{money.format(item.amount)}</span><span>{item.attachment || item.breakdown}</span><select value={item.status} onChange={async (e) => { await request(`/invoices/${item.id}`, { method: 'PATCH', body: JSON.stringify({ status: e.target.value }) }); reload(); }}><option>Pending Review</option><option>Approved</option><option>Paid</option></select></div>)}</div></section>
  </div>;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState('organizer');
  const [data, setData] = useState({});
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const [dashboard, tasks, budget, guests, layouts, sourcing, invoices, messages, bookings, venues, users, vendors, events] = await Promise.all([
      request('/dashboard?eventId=E001'),
      request('/tasks?eventId=E001'),
      request('/budget/E001'),
      request('/guests?eventId=E001'),
      request('/layouts'),
      request('/sourcing-requests'),
      request('/invoices'),
      request('/communications'),
      request('/bookings'),
      request('/venues?active=true'),
      request('/users'),
      request('/vendors'),
      request('/events')
    ]);
    const allVenues = role === 'owner' ? await request('/venues?active=false').then((inactive) => [...venues, ...inactive]).catch(() => venues) : venues;
    setData({ dashboard, tasks, budget, guests, layouts, sourcing, invoices, messages, bookings, venues: allVenues, users, vendors, events });
    setLoading(false);
  }

  useEffect(() => { if (currentUser) load().catch((error) => { setToast(error.message); setLoading(false); }); }, [currentUser, role]);
  useEffect(() => { if (!toast) return undefined; const id = setTimeout(() => setToast(''), 2800); return () => clearTimeout(id); }, [toast]);

  const screen = useMemo(() => ({
    organizer: <OrganizerView data={data} reload={load} setToast={setToast} currentUser={currentUser} />,
    staff: <StaffView data={data} reload={load} setToast={setToast} currentUser={currentUser} />,
    vendor: <VendorView data={data} reload={load} setToast={setToast} />,
    guest: <GuestView data={data} reload={load} setToast={setToast} currentUser={currentUser} />,
    owner: <OwnerView data={data} reload={load} setToast={setToast} currentUser={currentUser} />
  }), [data, role, currentUser]);

  if (!currentUser) return <><AuthScreen setToast={setToast} onAuthenticated={(user) => { setCurrentUser(user); setRole(user.role); }} />{toast && <div className="toast">{toast}</div>}</>;

  return <main>
    <aside>
      <div className="brand"><span>LE</span><div><strong>Layali Events</strong><small>Milestone 2 platform</small></div></div>
      <nav><button className="active">{role === 'owner' ? 'venue owner' : role}</button></nav>
      <div className="side-note"><Send size={17} /><span>Signed in as {currentUser.name}. Your account opens the {role === 'owner' ? 'venue owner' : role} workspace only.</span></div>
    </aside>
    <section className="workspace">
      <header>
        <div>
          <h1>{role === 'owner' ? 'Venue Owner' : role[0].toUpperCase() + role.slice(1)} Workspace</h1>
          <p>Role-based flows for event planning, operations, supplier coordination, RSVP, and venue bookings.</p>
          <div className="login-badge"><UserCog size={16} /> Logged in as <strong>{currentUser.name}</strong> <span>{currentUser.email}</span></div>
        </div>
        <div className="header-actions"><button onClick={load}>Refresh data</button><button className="ghost" onClick={() => setCurrentUser(null)}>Log out</button></div>
      </header>
      <ProfilePanel currentUser={currentUser} setCurrentUser={setCurrentUser} reload={load} setToast={setToast} />
      {loading ? <div className="loading">Loading platform data...</div> : screen[role]}
    </section>
    {toast && <div className="toast">{toast}</div>}
  </main>;
}
