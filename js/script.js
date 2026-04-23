/* =============================================
   NEXUS CONTACTS — script.js
============================================= */

const STORAGE_KEY = 'nexus_contacts';

/* ---- Selectors ---- */
const form        = document.getElementById('contactForm');
const listEl      = document.getElementById('contactList');
const countBadge  = document.getElementById('contactCount');
const toast       = document.getElementById('toast');

const fields = {
  nombre:   document.getElementById('nombre'),
  apellido: document.getElementById('apellido'),
  ciudad:   document.getElementById('ciudad'),
  telefono: document.getElementById('telefono'),
  direccion:document.getElementById('direccion'),
};

/* ===================== STORAGE ===================== */

function loadContacts() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveContacts(contacts) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

/* ===================== VALIDATION ===================== */

function validateForm() {
  let valid = true;

  // Text / tel fields
  Object.entries(fields).forEach(([, input]) => {
    const fieldWrapper = input.closest('.field');
    if (!input.value.trim()) {
      fieldWrapper.classList.add('has-error');
      input.classList.add('invalid');
      valid = false;
    } else {
      fieldWrapper.classList.remove('has-error');
      input.classList.remove('invalid');
    }
  });

  // Radio gender
  const selected = form.querySelector('input[name="genero"]:checked');
  const genderField = document.querySelector('.gender-field');
  if (!selected) {
    genderField.classList.add('has-error');
    valid = false;
  } else {
    genderField.classList.remove('has-error');
  }

  return valid;
}

/* ===================== TOAST ===================== */

let toastTimer = null;

function showToast(msg, type = 'success') {
  toast.textContent = type === 'success' ? '✓  ' + msg : '✕  ' + msg;
  toast.className = 'toast' + (type === 'error' ? ' error' : '');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.className = 'toast hidden'; }, 3200);
}

/* ===================== RENDER ===================== */

function getInitials(nombre, apellido) {
  return (nombre[0] || '?').toUpperCase() + (apellido[0] || '').toUpperCase();
}

function renderContacts() {
  const contacts = loadContacts();

  // Badge
  countBadge.textContent = contacts.length === 1
    ? '1 contacto'
    : `${contacts.length} contactos`;

  if (contacts.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">◎</div>
        <p>Aún no tienes contactos.<br/>¡Agrega el primero!</p>
      </div>`;
    return;
  }

  listEl.innerHTML = '';

  contacts.forEach((c, index) => {
    const card = document.createElement('div');
    card.className = 'contact-card';
    card.dataset.index = index;

    card.innerHTML = `
      <div class="contact-avatar">${getInitials(c.nombre, c.apellido)}</div>
      <div class="contact-info">
        <div class="contact-name">${escapeHTML(c.nombre)} ${escapeHTML(c.apellido)}</div>
        <div class="contact-meta">
          <span class="meta-item"><span class="meta-icon">📍</span>${escapeHTML(c.ciudad)}</span>
          <span class="meta-item"><span class="meta-icon">📞</span>${escapeHTML(c.telefono)}</span>
          <span class="meta-item"><span class="meta-icon">🏠</span>${escapeHTML(c.direccion)}</span>
          <span class="meta-item"><span class="meta-icon">${c.genero === 'Femenino' ? '♀' : '♂'}</span>${escapeHTML(c.genero)}</span>
        </div>
      </div>
      <div class="card-actions">
        <button class="btn-edit" title="Editar contacto" data-index="${index}">✏</button>
        <button class="btn-delete" title="Eliminar contacto" data-index="${index}">✕</button>
      </div>
    `;

    listEl.appendChild(card);
  });
}

/* ===================== ADD ===================== */

function addContact(data) {
  const contacts = loadContacts();
  contacts.push(data);
  saveContacts(contacts);
  renderContacts();
}

/* ===================== DELETE ===================== */

function deleteContact(index) {
  const contacts = loadContacts();
  contacts.splice(index, 1);
  saveContacts(contacts);
}

/* ===================== HELPERS ===================== */

function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

let editIndexGlobal = null;

function resetForm() {
  form.reset();
  Object.values(fields).forEach(input => {
    input.classList.remove('invalid');
    input.closest('.field').classList.remove('has-error');
  });
  document.querySelector('.gender-field').classList.remove('has-error');
  const submitBtn = form.querySelector('.btn-add');
  submitBtn.textContent = 'Agregar Contacto';
  submitBtn.querySelector('.btn-icon').textContent = '+';
  editIndexGlobal = null;
}

function editContact(index) {
  const contacts = loadContacts();
  const contact = contacts[index];
  fields.nombre.value = contact.nombre;
  fields.apellido.value = contact.apellido;
  fields.ciudad.value = contact.ciudad;
  fields.telefono.value = contact.telefono;
  fields.direccion.value = contact.direccion;
  form.querySelector(`input[name="genero"][value="${contact.genero}"]`).checked = true;
  document.querySelector('.gender-field').classList.remove('has-error');
  const submitBtn = form.querySelector('.btn-add');
  submitBtn.innerHTML = '<span class="btn-icon">✏</span> Actualizar Contacto';
  editIndexGlobal = index;
  
  // Scroll to form
  document.querySelector('.form-panel').scrollIntoView({ behavior: 'smooth' });
}

/* ===================== EVENTS ===================== */

// Submit
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = form.querySelector('.btn-add');

  if (!validateForm()) {
    showToast('Completa todos los campos antes de continuar.', 'error');
    return;
  }

  // Spinner
  const isEdit = submitBtn.textContent.includes('Actualizar');
  const data = {
    nombre:    fields.nombre.value.trim(),
    apellido:  fields.apellido.value.trim(),
    ciudad:    fields.ciudad.value.trim(),
    telefono:  fields.telefono.value.trim(),
    direccion: fields.direccion.value.trim(),
    genero:    form.querySelector('input[name="genero"]:checked').value,
  };

  submitBtn.classList.add('loading');
  submitBtn.disabled = true;

  // Simulate async save
  await new Promise(resolve => setTimeout(resolve, 800));

  if (isEdit) {
    const editIndex = parseInt(editIndexGlobal, 10);
    const contacts = loadContacts();
    contacts[editIndex] = data;
    saveContacts(contacts);
    showToast(`${data.nombre} ${data.apellido} actualizado correctamente.`);
  } else {
    addContact(data);
    showToast(`${data.nombre} ${data.apellido} fue agregado exitosamente.`);
  }

  submitBtn.classList.remove('loading');
  submitBtn.disabled = false;
  if (isEdit) {
    submitBtn.textContent = 'Agregar Contacto';
    submitBtn.querySelector('.btn-icon').textContent = '+';
  }
  resetForm();
  renderContacts();
});

// Events delegation for edit/delete
listEl.addEventListener('click', (e) => {
  const editBtn = e.target.closest('.btn-edit');
  if (editBtn) {
    const index = parseInt(editBtn.dataset.index, 10);
    editContact(index);
    return;
  }

  const deleteBtn = e.target.closest('.btn-delete');
  if (deleteBtn) {
    const index = parseInt(deleteBtn.dataset.index, 10);
    if (confirm(`¿Desea eliminar a ${loadContacts()[index].nombre} ${loadContacts()[index].apellido}?`)) {
      const card = deleteBtn.closest('.contact-card');
      card.classList.add('removing');
      card.addEventListener('animationend', () => {
        deleteContact(index);
        renderContacts();
      }, { once: true });
    }
    return;
  }
});

// Live validation: remove error on input
Object.values(fields).forEach(input => {
  input.addEventListener('input', () => {
    if (input.value.trim()) {
      input.classList.remove('invalid');
      input.closest('.field').classList.remove('has-error');
    }
  });
});

// Live validation: gender radio
form.querySelectorAll('input[name="genero"]').forEach(radio => {
  radio.addEventListener('change', () => {
    document.querySelector('.gender-field').classList.remove('has-error');
  });
});

/* ===================== INIT ===================== */
renderContacts();
