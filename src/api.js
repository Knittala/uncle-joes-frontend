// Base URL of the deployed FastAPI backend on Cloud Run.
// Update this string when the backend URL changes.
const BASE_URL = 'https://uncle-joes-setup-380537702637.us-central1.run.app';

// Shared fetch helper that returns parsed JSON or throws a readable error.
export async function fetchJSON(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  let response;
  try {
    response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options
    });
  } catch (e) {
    throw new Error("Couldn't reach the server. Check your internet connection.");
  }
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = await response.json();
      if (body && body.detail) detail = body.detail;
    } catch (_) { /* non-JSON body — use default */ }
    throw new Error(detail);
  }
  return response.json();
}

export default BASE_URL;
