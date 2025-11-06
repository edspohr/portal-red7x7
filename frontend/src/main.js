const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

const state = {
  token: localStorage.getItem('red7x7_token'),
  user: null,
  announcements: [],
  meetings: [],
  members: [],
  contactRequests: [],
  meetingParticipantSelection: new Set(),
};

const elements = {
  loadingScreen: document.getElementById('loading-screen'),
  authContainer: document.getElementById('auth-container'),
  appScreen: document.getElementById('app-screen'),
  profileScreen: document.getElementById('profile-screen'),
  loginForm: document.getElementById('login-form'),
  registerForm: document.getElementById('register-form'),
  forgotPasswordForm: document.getElementById('forgot-password-form'),
  loginFormContainer: document.getElementById('login-form-container'),
  registerFormContainer: document.getElementById('register-form-container'),
  forgotPasswordFormContainer: document.getElementById('forgot-password-form-container'),
  authTitle: document.getElementById('auth-title'),
  announcementsList: document.getElementById('announcements-list'),
  meetingsList: document.getElementById('meetings-list'),
  membersList: document.getElementById('members-list'),
  contactRequestsList: document.getElementById('contact-requests-list'),
  adminPanelsContainer: document.getElementById('admin-panels-container'),
  adminMeetingPanel: document.getElementById('admin-meeting-panel'),
  announcementText: document.getElementById('announcement-text'),
  pinAnnouncement: document.getElementById('pin-announcement'),
  submitAnnouncement: document.getElementById('submit-announcement'),
  addUserForm: document.getElementById('add-user-form'),
  meetingNotesText: document.getElementById('meeting-notes-text'),
  processMeetingAi: document.getElementById('process-meeting-ai'),
  meetingTitle: document.getElementById('meeting-title'),
  meetingAgenda: document.getElementById('meeting-agenda'),
  meetingSummary: document.getElementById('meeting-summary'),
  meetingDate: document.getElementById('meeting-date'),
  meetingParticipants: document.getElementById('meeting-participants'),
  aiLoader: document.getElementById('ai-loader'),
  createMeetingForm: document.getElementById('create-meeting-form'),
  refreshMeetings: document.getElementById('refresh-meetings'),
  memberSearch: document.getElementById('member-search'),
  userInfo: document.querySelector('#user-info p'),
  userEmailRole: document.getElementById('user-email-role'),
  userAvatar: document.getElementById('user-avatar'),
  upgradeButton: document.getElementById('upgrade-to-pro-btn'),
  profileButton: document.getElementById('profile-button'),
  logoutButton: document.getElementById('logout-button'),
  profileName: document.getElementById('profile-name'),
  profileEmail: document.getElementById('profile-email'),
  profileRoleBadge: document.getElementById('profile-role'),
  profileNameInput: document.getElementById('profile-name-input'),
  profileCompanyInput: document.getElementById('profile-company-input'),
  profilePositionInput: document.getElementById('profile-position-input'),
  profilePhoneInput: document.getElementById('profile-phone-input'),
  profileForm: document.getElementById('profile-form'),
  profileAvatar: document.getElementById('profile-avatar'),
  closeProfile: document.getElementById('close-profile'),
  cancelProfile: document.getElementById('cancel-profile'),
  profileNameHeader: document.querySelector('#user-info .font-semibold'),
};

const notificationContainer = (() => {
  const container = document.createElement('div');
  container.id = 'notification-container';
  container.className = 'fixed top-4 right-4 space-y-2 z-[1001]';
  document.body.appendChild(container);
  return container;
})();

const refreshIcons = () => {
  if (window.lucide?.createIcons) {
    window.lucide.createIcons();
  }
};

const showNotification = (message, type = 'success') => {
  const colors = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    info: 'bg-gray-800 text-white',
  };

  const toast = document.createElement('div');
  toast.className = `px-4 py-2 rounded shadow ${colors[type] || colors.info}`;
  toast.style.transition = 'opacity 0.2s ease';
  toast.textContent = message;
  notificationContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('opacity-0');
    toast.addEventListener('transitionend', () => toast.remove());
  }, 3000);
};

const setScreen = (view) => {
  elements.loadingScreen.style.display = view === 'loading' ? 'flex' : 'none';
  elements.authContainer.style.display = view === 'auth' ? 'flex' : 'none';
  elements.appScreen.style.display = view === 'app' ? 'block' : 'none';
  elements.profileScreen.style.display = view === 'profile' ? 'flex' : 'none';
};

const setAuthView = (view) => {
  const views = ['login', 'register', 'forgot'];
  views.forEach((name) => {
    const container = {
      login: elements.loginFormContainer,
      register: elements.registerFormContainer,
      forgot: elements.forgotPasswordFormContainer,
    }[name];

    if (view === name) {
      container.classList.remove('hidden');
      container.classList.add('form-fade-in');
    } else {
      container.classList.add('hidden');
      container.classList.remove('form-fade-in');
    }
  });

  const titleMap = {
    login: 'Iniciar Sesión',
    register: 'Crear cuenta',
    forgot: 'Recuperar contraseña',
  };

  elements.authTitle.textContent = titleMap[view];
};

const setToken = (token) => {
  if (token) {
    localStorage.setItem('red7x7_token', token);
  } else {
    localStorage.removeItem('red7x7_token');
  }
  state.token = token;
};

const apiRequest = async (endpoint, options = {}) => {
  const config = {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body,
  };

  if (config.body === undefined) {
    delete config.body;
  }

  if (state.token) {
    config.headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    let errorMessage = 'Error inesperado';
    try {
      const error = await response.json();
      errorMessage = error.message || JSON.stringify(error);
    } catch (parseError) {
      errorMessage = response.statusText;
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const fetchAllData = async () => {
  const [user, announcements, meetings, members, contactRequests] = await Promise.all([
    apiRequest('/auth/me'),
    apiRequest('/announcements'),
    apiRequest('/meetings'),
    apiRequest('/users/directory'),
    apiRequest('/contact-requests'),
  ]);

  state.user = user;
  state.announcements = announcements;
  state.meetings = meetings;
  state.members = members;
  state.contactRequests = contactRequests;
  sortAnnouncements();
  state.meetingParticipantSelection.clear();
};

const sortAnnouncements = () => {
  state.announcements.sort((a, b) => {
    if (a.pinned === b.pinned) {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return a.pinned ? -1 : 1;
  });
};

const badgeForRole = (role, membership) => {
  const classes = {
    MEMBER: 'badge badge-socio7x7',
    PRO: 'badge badge-pro',
    ADMIN: 'badge badge-admin',
  };
  const label = {
    MEMBER: membership === 'PRO' ? 'Miembro Pro' : 'Socio 7x7',
    PRO: 'Plan Pro',
    ADMIN: 'Admin',
  };
  return `<span class="${classes[role] || 'badge'}">${label[role] || role}</span>`;
};

const renderAnnouncements = () => {
  elements.announcementsList.innerHTML = '';

  if (!state.announcements.length) {
    elements.announcementsList.innerHTML = '<p class="text-sm text-gray-500">No hay anuncios por el momento.</p>';
    return;
  }

  state.announcements.forEach((announcement) => {
    const card = document.createElement('div');
    card.className = 'border border-gray-200 rounded-lg p-4 bg-white shadow-sm';

    const adminControls = state.user.role === 'ADMIN'
      ? `<div class="flex space-x-2">
            <button data-action="toggle-pin" data-id="${announcement.id}" class="btn btn-secondary text-xs">
              <i data-lucide="pin" class="w-4 h-4 mr-1"></i>${announcement.pinned ? 'Quitar' : 'Fijar'}
            </button>
            <button data-action="delete" data-id="${announcement.id}" class="btn btn-secondary text-xs">
              <i data-lucide="trash-2" class="w-4 h-4 mr-1"></i>Eliminar
            </button>
          </div>`
      : '';

    card.innerHTML = `
      <div class="flex justify-between items-start">
        <div>
          <p class="text-gray-800 whitespace-pre-line">${announcement.content}</p>
          <p class="mt-2 text-xs text-gray-500">Publicado por ${announcement.author?.name || 'Equipo Red7x7'} · ${new Date(announcement.createdAt).toLocaleString()}</p>
        </div>
        <div class="flex flex-col items-end space-y-2">
          ${announcement.pinned ? '<span class="badge badge-admin">Fijado</span>' : ''}
          ${adminControls}
        </div>
      </div>
    `;

    elements.announcementsList.appendChild(card);
  });

  refreshIcons();
};

const renderMeetings = () => {
  elements.meetingsList.innerHTML = '';

  if (!state.meetings.length) {
    elements.meetingsList.innerHTML = '<p class="text-sm text-gray-500">Aún no hay reuniones registradas.</p>';
    return;
  }

  state.meetings.forEach((meeting) => {
    const canEdit = state.user.role === 'ADMIN' || meeting.createdById === state.user.id;
    const participantsList = meeting.participants
      .map((participant) => `
        <li class="flex items-center justify-between text-sm">
          <span>${participant.user.name}</span>
          <span class="text-xs text-gray-400">${participant.user.email}</span>
        </li>
      `)
      .join('');

    const card = document.createElement('div');
    card.className = 'border border-gray-200 rounded-lg p-4 bg-white shadow-sm';

    card.innerHTML = `
      <div class="flex flex-col space-y-2">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-lg font-semibold text-gray-800">${meeting.title}</h3>
            <p class="text-xs text-gray-500">Programada: ${meeting.scheduledAt ? new Date(meeting.scheduledAt).toLocaleString() : 'Por definir'}</p>
          </div>
          ${canEdit ? `<button class="btn btn-secondary text-xs" data-action="edit-meeting" data-id="${meeting.id}">
              <i data-lucide="edit" class="w-4 h-4 mr-1"></i>Editar
            </button>` : ''}
        </div>
        ${meeting.summary ? `<p class="text-sm text-gray-700 whitespace-pre-line">${meeting.summary}</p>` : '<p class="text-sm text-gray-500 italic">Sin resumen aún.</p>'}
        ${meeting.agenda ? `<div class="bg-gray-50 border rounded p-3">
            <h4 class="text-xs uppercase tracking-wide text-gray-400 mb-1">Agenda</h4>
            <p class="text-sm text-gray-700 whitespace-pre-line">${meeting.agenda}</p>
          </div>` : ''}
        <div>
          <h4 class="text-xs uppercase tracking-wide text-gray-400 mb-1">Participantes</h4>
          <ul class="space-y-1">${participantsList}</ul>
        </div>
      </div>
    `;

    elements.meetingsList.appendChild(card);
  });

  refreshIcons();
};

const canViewContactInfo = (member) => {
  if (state.user.role === 'ADMIN' || member.id === state.user.id) {
    return true;
  }
  const request = state.contactRequests.find(
    (req) =>
      (req.requesterId === state.user.id && req.targetId === member.id) ||
      (req.targetId === state.user.id && req.requesterId === member.id),
  );
  return request?.status === 'APPROVED';
};

const renderMembers = (filter = '') => {
  elements.membersList.innerHTML = '';

  const normalizedFilter = filter.trim().toLowerCase();
  const members = state.members.filter((member) =>
    member.name.toLowerCase().includes(normalizedFilter) ||
    (member.company || '').toLowerCase().includes(normalizedFilter),
  );

  if (!members.length) {
    elements.membersList.innerHTML = '<p class="text-sm text-gray-500">No se encontraron miembros.</p>';
    return;
  }

  members.forEach((member) => {
    const card = document.createElement('div');
    card.className = 'border border-gray-200 rounded-lg p-4 bg-white shadow-sm';
    const canRequest = state.user.id !== member.id && (state.user.membership === 'PRO' || state.user.role === 'ADMIN');
    const request = state.contactRequests.find(
      (req) => req.requesterId === state.user.id && req.targetId === member.id,
    );

    const phoneSection = canViewContactInfo(member)
      ? `<p class="text-sm text-gray-700">Teléfono: ${member.phone || 'No registrado'}</p>`
      : '<p class="text-sm text-gray-500 italic">Solicita acceso para ver contacto</p>';

    const adminControls = state.user.role === 'ADMIN' && member.id !== state.user.id
      ? `<div class="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <select data-role="${member.id}" class="p-2 border rounded">
            <option value="MEMBER" ${member.role === 'MEMBER' ? 'selected' : ''}>Miembro</option>
            <option value="PRO" ${member.role === 'PRO' ? 'selected' : ''}>Pro</option>
            <option value="ADMIN" ${member.role === 'ADMIN' ? 'selected' : ''}>Admin</option>
          </select>
          <select data-membership="${member.id}" class="p-2 border rounded">
            <option value="SOCIO7X7" ${member.membership === 'SOCIO7X7' ? 'selected' : ''}>Socio 7x7</option>
            <option value="PRO" ${member.membership === 'PRO' ? 'selected' : ''}>Plan Pro</option>
          </select>
          <button class="btn btn-secondary text-xs" data-save-member="${member.id}">
            <i data-lucide="save" class="w-4 h-4 mr-1"></i>Guardar
          </button>
        </div>`
      : '';

    const requestLabel = request?.status === 'PENDING' ? 'Solicitud enviada' : request?.status === 'APPROVED' ? 'Contacto aprobado' : 'Solicitar contacto';
    const requestDisabled = request?.status === 'PENDING' || request?.status === 'APPROVED';

    const requestButton = canRequest
      ? `<button class="btn btn-primary text-xs" data-request-contact="${member.id}" ${requestDisabled ? 'disabled' : ''}>
          <i data-lucide="share-2" class="w-4 h-4 mr-1"></i>${requestLabel}
        </button>`
      : '';

    card.innerHTML = `
      <div class="flex flex-col space-y-2">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-sm font-semibold text-gray-800">${member.name}</h3>
            <p class="text-xs text-gray-500">${member.position || 'Cargo no registrado'} · ${member.company || 'Empresa no registrada'}</p>
          </div>
          ${badgeForRole(member.role, member.membership)}
        </div>
        <p class="text-sm text-gray-700">Email: ${member.email}</p>
        ${phoneSection}
        <div class="flex flex-wrap gap-2">
          ${requestButton}
        </div>
        ${adminControls}
      </div>
    `;

    elements.membersList.appendChild(card);
  });

  refreshIcons();
};

const renderContactRequests = () => {
  elements.contactRequestsList.innerHTML = '';

  if (!state.contactRequests.length) {
    elements.contactRequestsList.innerHTML = '<p class="text-sm text-gray-500">No tienes solicitudes aún.</p>';
    return;
  }

  state.contactRequests.forEach((request) => {
    const card = document.createElement('div');
    card.className = 'border border-gray-200 rounded-lg p-3 bg-white shadow-sm';

    const isTarget = request.targetId === state.user.id;
    const canManage = state.user.role === 'ADMIN' || isTarget;

    const requesterInfo = `<span class="font-medium">${request.requester.name}</span> (${request.requester.email})`;
    const targetInfo = `<span class="font-medium">${request.target.name}</span>`;

    const statusBadge = {
      PENDING: '<span class="badge badge-admin">Pendiente</span>',
      APPROVED: '<span class="badge badge-pro">Aprobada</span>',
      REJECTED: '<span class="badge badge-socio7x7">Rechazada</span>',
    }[request.status] || request.status;

    card.innerHTML = `
      <div class="flex flex-col space-y-2">
        <p class="text-sm text-gray-700">${requesterInfo} solicitó contacto de ${targetInfo}</p>
        <div class="flex justify-between items-center text-xs text-gray-500">
          <span>${new Date(request.createdAt).toLocaleString()}</span>
          <span>${statusBadge}</span>
        </div>
        ${canManage && request.status === 'PENDING'
        ? `<div class="flex gap-2">
            <button class="btn btn-primary text-xs" data-request-update="${request.id}" data-status="APPROVED">
              <i data-lucide="check" class="w-4 h-4 mr-1"></i>Aprobar
            </button>
            <button class="btn btn-secondary text-xs" data-request-update="${request.id}" data-status="REJECTED">
              <i data-lucide="x" class="w-4 h-4 mr-1"></i>Rechazar
            </button>
          </div>`
        : ''}
      </div>
    `;

    elements.contactRequestsList.appendChild(card);
  });

  refreshIcons();
};

const renderMeetingParticipantSelector = () => {
  if (!elements.meetingParticipants) return;
  elements.meetingParticipants.innerHTML = '';

  state.members
    .filter((member) => member.id !== state.user.id)
    .forEach((member) => {
      const wrapper = document.createElement('label');
      wrapper.className = 'flex items-center space-x-2 p-2 border rounded hover:bg-gray-50';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = member.id;
      checkbox.checked = state.meetingParticipantSelection.has(member.id);
      checkbox.addEventListener('change', (event) => {
        if (event.target.checked) {
          state.meetingParticipantSelection.add(member.id);
        } else {
          state.meetingParticipantSelection.delete(member.id);
        }
      });

      const info = document.createElement('div');
      info.className = 'flex flex-col';
      info.innerHTML = `<span class="text-sm font-medium text-gray-700">${member.name}</span><span class="text-xs text-gray-500">${member.email}</span>`;

      wrapper.appendChild(checkbox);
      wrapper.appendChild(info);
      elements.meetingParticipants.appendChild(wrapper);
    });
};

const populateDashboard = () => {
  elements.profileNameHeader.textContent = state.user.name;
  elements.userEmailRole.textContent = `${state.user.email} · ${state.user.role}`;
  const avatarUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(state.user.name)}`;
  elements.userAvatar.src = avatarUrl;
  if (elements.profileAvatar) {
    elements.profileAvatar.src = avatarUrl;
  }
  elements.profileName.textContent = state.user.name;
  elements.profileEmail.textContent = state.user.email;
  elements.profileRoleBadge.innerHTML = badgeForRole(state.user.role, state.user.membership);
  elements.profileNameInput.value = state.user.name;
  elements.profileCompanyInput.value = state.user.company || '';
  elements.profilePositionInput.value = state.user.position || '';
  elements.profilePhoneInput.value = state.user.phone || '';

  if (state.user.membership !== 'PRO' && state.user.role === 'MEMBER') {
    elements.upgradeButton.classList.remove('hidden');
  } else {
    elements.upgradeButton.classList.add('hidden');
  }

  if (state.user.role === 'ADMIN') {
    elements.adminPanelsContainer.classList.remove('hidden');
    elements.adminMeetingPanel.classList.remove('hidden');
  } else {
    elements.adminPanelsContainer.classList.add('hidden');
    elements.adminMeetingPanel.classList.add('hidden');
  }

  renderAnnouncements();
  renderMeetings();
  renderMembers(elements.memberSearch.value || '');
  renderContactRequests();
  renderMeetingParticipantSelector();
  refreshIcons();
};

const handleLogin = async (event) => {
  event.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();

  try {
    setScreen('loading');
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(response.token);
    await fetchAllData();
    populateDashboard();
    setScreen('app');
    showNotification('Sesión iniciada correctamente');
  } catch (error) {
    setScreen('auth');
    showNotification(error.message, 'error');
  }
};

const handleRegister = async (event) => {
  event.preventDefault();
  const payload = {
    name: document.getElementById('register-name').value.trim(),
    email: document.getElementById('register-email').value.trim(),
    password: document.getElementById('register-password').value.trim(),
    company: document.getElementById('register-company').value.trim() || undefined,
    position: document.getElementById('register-position').value.trim() || undefined,
    phone: document.getElementById('register-phone').value.trim() || undefined,
  };

  try {
    setScreen('loading');
    const response = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setToken(response.token);
    await fetchAllData();
    populateDashboard();
    setScreen('app');
    showNotification('Registro exitoso, ¡bienvenido a Red7x7!');
  } catch (error) {
    setScreen('auth');
    showNotification(error.message, 'error');
  }
};

const handleForgotPassword = async (event) => {
  event.preventDefault();
  const email = document.getElementById('forgot-email').value.trim();

  try {
    await apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    showNotification('Si el correo existe, recibirás instrucciones en tu bandeja.');
    setAuthView('login');
  } catch (error) {
    showNotification(error.message, 'error');
  }
};

const handleLogout = () => {
  setToken(null);
  state.user = null;
  state.announcements = [];
  state.meetings = [];
  state.members = [];
  state.contactRequests = [];
  setAuthView('login');
  setScreen('auth');
};

const handleSubmitAnnouncement = async () => {
  const content = elements.announcementText.value.trim();
  if (!content) {
    showNotification('Escribe un anuncio antes de publicar', 'info');
    return;
  }

  try {
    const announcement = await apiRequest('/announcements', {
      method: 'POST',
      body: JSON.stringify({ content, pinned: elements.pinAnnouncement.checked }),
    });
    state.announcements = [announcement, ...state.announcements];
    sortAnnouncements();
    elements.announcementText.value = '';
    elements.pinAnnouncement.checked = false;
    renderAnnouncements();
    showNotification('Anuncio publicado');
  } catch (error) {
    showNotification(error.message, 'error');
  }
};

const handleAnnouncementAction = async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const { action } = button.dataset;
  const id = Number(button.dataset.id);

  try {
    if (action === 'toggle-pin') {
      const announcement = state.announcements.find((item) => item.id === id);
      if (!announcement) return;
      const updated = await apiRequest(`/announcements/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ pinned: !announcement.pinned }),
      });
      state.announcements = state.announcements.map((item) => (item.id === id ? updated : item));
      sortAnnouncements();
      showNotification('Anuncio actualizado');
    } else if (action === 'delete') {
      await apiRequest(`/announcements/${id}`, { method: 'DELETE' });
      state.announcements = state.announcements.filter((item) => item.id !== id);
      sortAnnouncements();
      showNotification('Anuncio eliminado');
    }
    renderAnnouncements();
  } catch (error) {
    showNotification(error.message, 'error');
  }
};

const handleCreateUser = async (event) => {
  event.preventDefault();
  const formData = new FormData(elements.addUserForm);
  const payload = {};
  formData.forEach((value, key) => {
    const trimmed = value.trim();
    if (trimmed) {
      payload[key] = trimmed;
    }
  });

  try {
    const response = await apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    showNotification(`Usuario creado. Contraseña temporal: ${response.temporaryPassword}`);
    elements.addUserForm.reset();
    await fetchAllData();
    populateDashboard();
  } catch (error) {
    showNotification(error.message, 'error');
  }
};

const handleProcessMeetingAI = async () => {
  const notes = elements.meetingNotesText.value.trim();
  if (!notes) {
    showNotification('Pega notas de la reunión para analizarlas', 'info');
    return;
  }

  try {
    elements.aiLoader?.classList.remove('hidden');
    const response = await apiRequest('/meetings/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
    elements.meetingSummary.value = response.summary || '';
    if (Array.isArray(response.actionItems)) {
      elements.meetingAgenda.value = response.actionItems.map((item) => `• ${item}`).join('\n');
    }
    if (Array.isArray(response.participants)) {
      const participantEmails = new Set(response.participants.map((email) => email.toLowerCase()));
      state.meetingParticipantSelection.clear();
      state.members.forEach((member) => {
        if (participantEmails.has(member.email.toLowerCase())) {
          state.meetingParticipantSelection.add(member.id);
        }
      });
      renderMeetingParticipantSelector();
    }
    showNotification('Análisis de IA completado');
  } catch (error) {
    showNotification(error.message, 'error');
  } finally {
    elements.aiLoader?.classList.add('hidden');
  }
};

const handleCreateMeeting = async (event) => {
  event.preventDefault();

  const payload = {
    title: elements.meetingTitle.value.trim(),
    agenda: elements.meetingAgenda.value.trim() || undefined,
    summary: elements.meetingSummary.value.trim() || undefined,
    scheduledAt: elements.meetingDate.value ? new Date(elements.meetingDate.value).toISOString() : undefined,
    participantIds: Array.from(state.meetingParticipantSelection),
  };

  try {
    const meeting = await apiRequest('/meetings', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    state.meetings = [meeting, ...state.meetings];
    elements.createMeetingForm.reset();
    elements.meetingNotesText.value = '';
    state.meetingParticipantSelection.clear();
    renderMeetings();
    renderMeetingParticipantSelector();
    showNotification('Reunión creada correctamente');
  } catch (error) {
    showNotification(error.message, 'error');
  }
};

const handleMeetingsContainerClick = async (event) => {
  const button = event.target.closest('button[data-action="edit-meeting"]');
  if (!button) return;
  const id = Number(button.dataset.id);
  const meeting = state.meetings.find((item) => item.id === id);
  if (!meeting) return;

  const newSummary = prompt('Actualiza el resumen de la reunión', meeting.summary || '');
  if (newSummary === null) return;

  try {
    const updated = await apiRequest(`/meetings/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ summary: newSummary }),
    });
    state.meetings = state.meetings.map((item) => (item.id === id ? updated : item));
    renderMeetings();
    showNotification('Reunión actualizada');
  } catch (error) {
    showNotification(error.message, 'error');
  }
};

const handleMemberActions = async (event) => {
  const requestBtn = event.target.closest('button[data-request-contact]');
  if (requestBtn) {
    const targetId = Number(requestBtn.dataset.requestContact);
    try {
      const request = await apiRequest('/contact-requests', {
        method: 'POST',
        body: JSON.stringify({ targetId }),
      });
      state.contactRequests = [request, ...state.contactRequests];
      renderMembers(elements.memberSearch.value || '');
      renderContactRequests();
      showNotification('Solicitud enviada');
    } catch (error) {
      showNotification(error.message, 'error');
    }
    return;
  }

  const saveBtn = event.target.closest('button[data-save-member]');
  if (saveBtn) {
    const memberId = Number(saveBtn.dataset.saveMember);
    const roleSelect = elements.membersList.querySelector(`select[data-role="${memberId}"]`);
    const membershipSelect = elements.membersList.querySelector(`select[data-membership="${memberId}"]`);
    try {
      const updated = await apiRequest(`/users/${memberId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: roleSelect.value, membership: membershipSelect.value }),
      });
      state.members = state.members.map((member) => (member.id === updated.id ? updated : member));
      renderMembers(elements.memberSearch.value || '');
      showNotification('Miembro actualizado');
    } catch (error) {
      showNotification(error.message, 'error');
    }
  }
};

const handleContactRequestActions = async (event) => {
  const button = event.target.closest('button[data-request-update]');
  if (!button) return;

  const id = Number(button.dataset.requestUpdate);
  const status = button.dataset.status;

  try {
    const updated = await apiRequest(`/contact-requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    state.contactRequests = state.contactRequests.map((request) => (request.id === id ? updated : request));
    renderMembers(elements.memberSearch.value || '');
    renderContactRequests();
    showNotification('Solicitud actualizada');
  } catch (error) {
    showNotification(error.message, 'error');
  }
};

const openProfile = () => {
  elements.profileScreen.style.display = 'flex';
};

const closeProfile = () => {
  elements.profileScreen.style.display = 'none';
  elements.profileNameInput.value = state.user.name;
  elements.profileCompanyInput.value = state.user.company || '';
  elements.profilePositionInput.value = state.user.position || '';
  elements.profilePhoneInput.value = state.user.phone || '';
};

const handleProfileSubmit = async (event) => {
  event.preventDefault();

  const payload = {
    name: elements.profileNameInput.value.trim(),
    company: elements.profileCompanyInput.value.trim() || undefined,
    position: elements.profilePositionInput.value.trim() || undefined,
    phone: elements.profilePhoneInput.value.trim() || undefined,
  };

  try {
    const user = await apiRequest('/users/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    state.user = { ...state.user, ...user };
    populateDashboard();
    closeProfile();
    showNotification('Perfil actualizado');
  } catch (error) {
    showNotification(error.message, 'error');
  }
};

const bootstrap = async () => {
  refreshIcons();
  setAuthView('login');

  if (state.token) {
    try {
      setScreen('loading');
      await fetchAllData();
      populateDashboard();
      setScreen('app');
      return;
    } catch (error) {
      setToken(null);
      showNotification('Tu sesión expiró, ingresa nuevamente', 'info');
    }
  }

  setScreen('auth');
};

// Event listeners

document.getElementById('register-link').addEventListener('click', (event) => {
  event.preventDefault();
  setAuthView('register');
});

document.getElementById('login-link-from-register').addEventListener('click', (event) => {
  event.preventDefault();
  setAuthView('login');
});

document.getElementById('forgot-password-link').addEventListener('click', (event) => {
  event.preventDefault();
  setAuthView('forgot');
});

document.getElementById('login-link-from-forgot').addEventListener('click', (event) => {
  event.preventDefault();
  setAuthView('login');
});

elements.loginForm.addEventListener('submit', handleLogin);
if (elements.registerForm) {
  elements.registerForm.addEventListener('submit', handleRegister);
}
if (elements.forgotPasswordForm) {
  elements.forgotPasswordForm.addEventListener('submit', handleForgotPassword);
}
if (elements.logoutButton) {
  elements.logoutButton.addEventListener('click', handleLogout);
}
if (elements.submitAnnouncement) {
  elements.submitAnnouncement.addEventListener('click', handleSubmitAnnouncement);
}
if (elements.addUserForm) {
  elements.addUserForm.addEventListener('submit', handleCreateUser);
}
if (elements.processMeetingAi) {
  elements.processMeetingAi.addEventListener('click', handleProcessMeetingAI);
}
if (elements.createMeetingForm) {
  elements.createMeetingForm.addEventListener('submit', handleCreateMeeting);
}
if (elements.refreshMeetings) {
  elements.refreshMeetings.addEventListener('click', async () => {
    try {
      const meetings = await apiRequest('/meetings');
      state.meetings = meetings;
      renderMeetings();
      showNotification('Reuniones actualizadas');
    } catch (error) {
      showNotification(error.message, 'error');
    }
  });
}
if (elements.memberSearch) {
  elements.memberSearch.addEventListener('input', (event) => {
    renderMembers(event.target.value);
  });
}
if (elements.meetingsList) {
  elements.meetingsList.addEventListener('click', handleMeetingsContainerClick);
}
if (elements.membersList) {
  elements.membersList.addEventListener('click', handleMemberActions);
}
if (elements.contactRequestsList) {
  elements.contactRequestsList.addEventListener('click', handleContactRequestActions);
}
if (elements.profileButton) {
  elements.profileButton.addEventListener('click', openProfile);
}
if (elements.closeProfile) {
  elements.closeProfile.addEventListener('click', closeProfile);
}
if (elements.cancelProfile) {
  elements.cancelProfile.addEventListener('click', closeProfile);
}
if (elements.profileForm) {
  elements.profileForm.addEventListener('submit', handleProfileSubmit);
}

elements.announcementsList.addEventListener('click', handleAnnouncementAction);

bootstrap();
