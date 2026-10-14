export class ApiError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'offline', 'OFFLINE');
  }
  const data = await res.json().catch(() => null);
  if (!data) throw new ApiError(res.status, 'offline', 'OFFLINE'); // proxy 502 / HTML error page: API unreachable
  if (!res.ok) throw new ApiError(res.status, data.error || 'error', data.code);
  return data;
}
