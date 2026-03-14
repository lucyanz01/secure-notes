const API = 'https://securenotes-ma55.onrender.com';

const token = localStorage.getItem('token');
if (!token) location.href = 'login.html';

function headers() {
  return { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token };
}

function logout() {
  localStorage.removeItem('token');
  location.href = 'login.html';
}

// show user id from token
try {
  const payload = JSON.parse(atob(token.split('.')[1]));
  document.getElementById('sidebarUser').textContent = payload.sub ? 'User #' + payload.sub : '';
} catch {}

let notes   = [];
let current = null;

// ── SIDEBAR (mobile) ──
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('show');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
}

// ── TOAST ──
let tt;
function toast(msg, type = 'ok') {
  clearTimeout(tt);
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + type;
  tt = setTimeout(() => el.classList.remove('show'), 2500);
}

// ── UTILS ──
function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function fmtDate(s) {
  if (!s) return '';
  return new Date(s).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

// ── VIEWS ──
function showHome() {
  document.getElementById('viewHome').style.display   = 'flex';
  document.getElementById('viewEditor').style.display = 'none';
  document.getElementById('pageTitle').textContent    = 'Dashboard';
  document.getElementById('navDashboard').classList.add('active');
  document.getElementById('navNew').classList.remove('active');
  document.getElementById('searchInput').style.display = 'block';
  closeSidebar();
  loadNotes();
}

function showEditor() {
  document.getElementById('viewHome').style.display   = 'none';
  document.getElementById('viewEditor').style.display = 'flex';
  document.getElementById('navDashboard').classList.remove('active');
  document.getElementById('navNew').classList.add('active');
  document.getElementById('searchInput').style.display = 'none';
  closeSidebar();
}

// ── RENDER GRID ──
function renderGrid(list) {
  const grid = document.getElementById('notesGrid');
  if (!list.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <div class="empty-text">${notes.length ? 'No results found' : 'No notes yet'}</div>
        <div class="empty-sub">${notes.length ? '' : 'Click "+ New" to create your first note'}</div>
      </div>`;
    return;
  }
  grid.innerHTML = list.map((n, i) => `
    <div class="note-card" style="animation-delay:${i * 0.04}s" onclick="openEditor(${n.id})">
      <div class="note-card-title">${esc(n.title)}</div>
      <div class="note-card-preview">${esc(n.content)}</div>
      <div class="note-card-date">${fmtDate(n.updated_at || n.created_at)}</div>
    </div>
  `).join('');
}

function filterNotes(q) {
  const lq = q.toLowerCase();
  renderGrid(notes.filter(n =>
    n.title.toLowerCase().includes(lq) || n.content.toLowerCase().includes(lq)
  ));
}

// ── LOAD NOTES ──
async function loadNotes() {
  try {
    const res = await fetch(API + '/notes/', { headers: headers() });
    if (res.status === 401) { logout(); return; }
    notes = await res.json();
    notes.sort((a,b) => new Date(b.updated_at||b.created_at) - new Date(a.updated_at||a.created_at));
    renderGrid(notes);
  } catch { toast('Failed to load notes', 'err'); }
}

// ── OPEN EDITOR ──
function openEditor(id) {
  if (id === null) {
    current = null;
    document.getElementById('noteTitle').value   = '';
    document.getElementById('noteContent').value = '';
    document.getElementById('btnDelete').style.display = 'none';
    document.getElementById('pageTitle').textContent   = 'New Note';
    setStatus(false);
  } else {
    current = notes.find(n => n.id === id);
    document.getElementById('noteTitle').value   = current.title;
    document.getElementById('noteContent').value = current.content;
    document.getElementById('btnDelete').style.display = 'block';
    document.getElementById('pageTitle').textContent   = current.title;
    setStatus(true, fmtDate(current.updated_at || current.created_at));
  }
  showEditor();
  ['noteTitle', 'noteContent'].forEach(fid => {
    document.getElementById(fid).oninput = () => {
      setStatus(false);
      document.getElementById('pageTitle').textContent =
        document.getElementById('noteTitle').value || 'New Note';
    };
  });
}

function setStatus(saved, dateStr) {
  document.getElementById('statusDot').className = 'status-dot' + (saved ? ' saved' : '');
  document.getElementById('statusText').textContent =
    saved ? (dateStr ? 'Saved · ' + dateStr : 'Saved') : 'Unsaved changes';
}

// ── SAVE ──
async function saveNote() {
  const title   = document.getElementById('noteTitle').value.trim();
  const content = document.getElementById('noteContent').value.trim();
  if (!title || !content) { toast('Please add a title and content', 'err'); return; }

  const btn = document.getElementById('btnSave');
  btn.disabled    = true;
  btn.textContent = 'Saving...';

  try {
    let res;
    if (current) {
      res = await fetch(`${API}/notes/${current.id}`, {
        method: 'PATCH', headers: headers(),
        body: JSON.stringify({ title, content })
      });
    } else {
      res = await fetch(`${API}/notes/`, {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ title, content })
      });
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save');

    toast(current ? '✓ Note updated' : '✓ Note created');

    const r2 = await fetch(API + '/notes/', { headers: headers() });
    notes = await r2.json();
    notes.sort((a,b) => new Date(b.updated_at||b.created_at) - new Date(a.updated_at||a.created_at));

    if (!current) {
      current = notes[0];
      if (current) document.getElementById('btnDelete').style.display = 'block';
    } else {
      current = notes.find(n => n.id === current.id) || null;
    }
    setStatus(true, current ? fmtDate(current.updated_at || current.created_at) : '');
    document.getElementById('pageTitle').textContent = current?.title || 'New Note';
  } catch(ex) {
    toast(ex.message, 'err');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Save';
  }
}

// ── DELETE ──
function openDialog()  { document.getElementById('overlay').classList.add('show'); }
function closeDialog() { document.getElementById('overlay').classList.remove('show'); }

async function deleteNote() {
  if (!current) return;
  closeDialog();
  try {
    const res  = await fetch(`${API}/notes/${current.id}`, { method: 'DELETE', headers: headers() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete');
    toast('✓ Note deleted');
    current = null;
    showHome();
  } catch(ex) { toast(ex.message, 'err'); }
}

// ── KEYBOARD ──
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    if (document.getElementById('viewEditor').style.display !== 'none') saveNote();
  }
  if (e.key === 'Escape') {
    closeDialog();
    closeSidebar();
  }
});

// ── INIT ──
showHome();