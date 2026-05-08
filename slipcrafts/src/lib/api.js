const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const TOKEN_STORAGE_KEY = 'transferly_api_token';
const LEGACY_TOKEN_STORAGE_KEY = 'slipcraft_api_token';

function buildUrl(path) {
  if (!path.startsWith('/')) {
    throw new Error(`API path must start with "/": ${path}`);
  }

  return `${API_BASE_URL}${path}`;
}

async function parseJsonSafely(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (_error) {
    return null;
  }
}

export function getStoredToken() {
  const currentToken = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  if (currentToken) {
    return currentToken;
  }

  const legacyToken = window.localStorage.getItem(LEGACY_TOKEN_STORAGE_KEY);
  if (legacyToken) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, legacyToken);
    return legacyToken;
  }

  return null;
}

export function setStoredToken(token) {
  if (!token) {
    clearStoredToken();
    return;
  }

  window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
}

export function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_TOKEN_STORAGE_KEY);
}

export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set('Accept', 'application/json');

  let body = options.body;
  if (body && typeof body === 'object' && !(body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
    body = JSON.stringify(body);
  }

  const token = getStoredToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(buildUrl(path), {
    ...options,
    headers,
    body
  });

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    const error = new Error(
      payload?.error?.message ||
        payload?.message ||
        `Request failed with status ${response.status}`
    );
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function getBootstrap() {
  return apiRequest('/api/bootstrap');
}

export function getMe() {
  return apiRequest('/api/me');
}

export function login(email, password) {
  return apiRequest('/api/auth/login', {
    method: 'POST',
    body: { email, password }
  });
}

export function register({ name, email, password, referralCode }) {
  return apiRequest('/api/auth/register', {
    method: 'POST',
    body: {
      name,
      email,
      password,
      referralCode: referralCode || undefined
    }
  });
}

export function generateReceipt(payload) {
  return apiRequest('/api/receipt/generate', {
    method: 'POST',
    body: payload
  });
}

export function getReferralStats() {
  return apiRequest('/api/referral', {
    method: 'POST',
    body: { action: 'stats' }
  });
}

export function updateProfile(payload) {
  return apiRequest('/api/user/me/profile', {
    method: 'PATCH',
    body: payload
  });
}

export function changePassword(newPassword) {
  return apiRequest('/api/user/me/password', {
    method: 'POST',
    body: { newPassword }
  });
}

export function deleteAccount() {
  return apiRequest('/api/user/me', {
    method: 'DELETE'
  });
}

export function listTopUpOrders() {
  return apiRequest('/api/user/me/top-up-orders');
}

export function createTopUpOrder(payload) {
  return apiRequest('/api/user/me/top-up-orders', {
    method: 'POST',
    body: payload
  });
}

export function updateTopUpOrderStatus(orderId, payload) {
  return apiRequest(`/api/user/me/top-up-orders/${encodeURIComponent(orderId)}/status`, {
    method: 'PATCH',
    body: payload
  });
}

export function listAdminTopUpOrders(params = {}) {
  const search = new URLSearchParams();
  if (params.status) {
    search.set('status', params.status);
  }
  if (params.userId) {
    search.set('userId', params.userId);
  }
  if (params.limit) {
    search.set('limit', String(params.limit));
  }
  const query = search.toString();
  return apiRequest(`/api/admin/top-up-orders${query ? `?${query}` : ''}`);
}

export function completeAdminTopUpOrder(orderId, notes) {
  return apiRequest(`/api/admin/top-up-orders/${encodeURIComponent(orderId)}/complete`, {
    method: 'POST',
    body: notes ? { notes } : {}
  });
}

export function cancelAdminTopUpOrder(orderId, notes) {
  return apiRequest(`/api/admin/top-up-orders/${encodeURIComponent(orderId)}/cancel`, {
    method: 'POST',
    body: notes ? { notes } : {}
  });
}

export function getAdminUsers() {
  return apiRequest('/api/admin/users');
}

export function listAdminInvoiceTemplates() {
  return apiRequest('/api/admin/invoice-templates');
}

export function listInvoiceReminderConfigurations(type) {
  const search = type ? `?type=${encodeURIComponent(type)}` : '';
  return apiRequest(`/api/admin/invoice-reminders${search}`);
}

export function updateInvoiceReminderConfiguration(configurationId, payload) {
  return apiRequest(`/api/admin/invoice-reminders/${encodeURIComponent(configurationId)}`, {
    method: 'PUT',
    body: payload
  });
}

export function suspendInvoiceReminderConfiguration(configurationId) {
  return apiRequest(`/api/admin/invoice-reminders/${encodeURIComponent(configurationId)}/suspend`, {
    method: 'POST'
  });
}

export function resumeInvoiceReminderConfiguration(configurationId) {
  return apiRequest(`/api/admin/invoice-reminders/${encodeURIComponent(configurationId)}/resume`, {
    method: 'POST'
  });
}

export function createAdminInvoiceTemplate(payload) {
  return apiRequest('/api/admin/invoice-templates', {
    method: 'POST',
    body: payload
  });
}

export function updateAdminInvoiceTemplate(templateId, payload) {
  return apiRequest(`/api/admin/invoice-templates/${encodeURIComponent(templateId)}`, {
    method: 'PATCH',
    body: payload
  });
}

export function deleteAdminInvoiceTemplate(templateId) {
  return apiRequest(`/api/admin/invoice-templates/${encodeURIComponent(templateId)}`, {
    method: 'DELETE'
  });
}

export function listPaymentOpsIssues() {
  return apiRequest('/api/admin/payment-issues');
}

export function acknowledgePaymentOpsIssue(issueId, note) {
  return apiRequest(`/api/admin/payment-issues/${encodeURIComponent(issueId)}/acknowledge`, {
    method: 'POST',
    body: note ? { note } : {}
  });
}

export function resolvePaymentOpsIssue(issueId, note) {
  return apiRequest(`/api/admin/payment-issues/${encodeURIComponent(issueId)}/resolve`, {
    method: 'POST',
    body: note ? { note } : {}
  });
}

export function reopenPaymentOpsIssue(issueId, note) {
  return apiRequest(`/api/admin/payment-issues/${encodeURIComponent(issueId)}/reopen`, {
    method: 'POST',
    body: note ? { note } : {}
  });
}

export function adjustUserPoints(userId, delta, reason) {
  return apiRequest(`/api/admin/users/${encodeURIComponent(userId)}/points`, {
    method: 'POST',
    body: { delta, reason }
  });
}

export function updatePlatformConfig(payload) {
  return apiRequest('/api/admin/config', {
    method: 'PATCH',
    body: payload
  });
}

export function createFaq(payload) {
  return apiRequest('/api/admin/faqs', {
    method: 'POST',
    body: payload
  });
}

export function updateFaq(faqId, payload) {
  return apiRequest(`/api/admin/faqs/${faqId}`, {
    method: 'PATCH',
    body: payload
  });
}

export function deleteFaq(faqId) {
  return apiRequest(`/api/admin/faqs/${faqId}`, {
    method: 'DELETE'
  });
}

export function createTestimonial(payload) {
  return apiRequest('/api/admin/testimonials', {
    method: 'POST',
    body: payload
  });
}

export function updateTestimonial(testimonialId, payload) {
  return apiRequest(`/api/admin/testimonials/${testimonialId}`, {
    method: 'PATCH',
    body: payload
  });
}

export function deleteTestimonial(testimonialId) {
  return apiRequest(`/api/admin/testimonials/${testimonialId}`, {
    method: 'DELETE'
  });
}

export function listInvoices() {
  return apiRequest('/api/invoices');
}

export function createInvoice(payload) {
  return apiRequest('/api/invoices', {
    method: 'POST',
    body: payload
  });
}

export function getInvoice(invoiceId) {
  return apiRequest(`/api/invoices/${encodeURIComponent(invoiceId)}`);
}

export function refreshInvoice(invoiceId) {
  return apiRequest(`/api/invoices/${encodeURIComponent(invoiceId)}/refresh`, {
    method: 'POST'
  });
}

export function sendInvoiceReminder(invoiceId) {
  return apiRequest(`/api/invoices/${encodeURIComponent(invoiceId)}/remind`, {
    method: 'POST'
  });
}

export function cancelInvoiceAutoReminders(invoiceId) {
  return apiRequest(`/api/invoices/${encodeURIComponent(invoiceId)}/cancel-reminders`, {
    method: 'POST'
  });
}

export function generateInvoiceQr(invoiceId) {
  return apiRequest(`/api/invoices/${encodeURIComponent(invoiceId)}/qr`, {
    method: 'POST'
  });
}

export function cancelInvoice(invoiceId) {
  return apiRequest(`/api/invoices/${encodeURIComponent(invoiceId)}/cancel`, {
    method: 'POST'
  });
}

export function getInvoiceTimeline(invoiceId, limit = 25) {
  return apiRequest(`/api/invoices/${encodeURIComponent(invoiceId)}/timeline?limit=${encodeURIComponent(limit)}`);
}

export function listPayouts() {
  return apiRequest('/api/payouts');
}

export function createPayout(payload) {
  return apiRequest('/api/payouts', {
    method: 'POST',
    body: payload
  });
}

export function getPayout(payoutId) {
  return apiRequest(`/api/payouts/${encodeURIComponent(payoutId)}`);
}

export function refreshPayout(payoutId) {
  return apiRequest(`/api/payouts/${encodeURIComponent(payoutId)}/refresh`, {
    method: 'POST'
  });
}

export function cancelUnclaimedPayout(payoutId) {
  return apiRequest(`/api/admin/payouts/${encodeURIComponent(payoutId)}/cancel-unclaimed`, {
    method: 'POST'
  });
}

export function getPayoutTimeline(payoutId, limit = 25) {
  return apiRequest(`/api/payouts/${encodeURIComponent(payoutId)}/timeline?limit=${encodeURIComponent(limit)}`);
}

export function runPaymentReconciliation(payload = {}) {
  return apiRequest('/api/admin/reconciliation/run', {
    method: 'POST',
    body: payload
  });
}
