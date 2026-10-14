import handler from '../server/router.js';

// We read the raw body ourselves (needed for webhook signature checks).
export const config = { api: { bodyParser: false } };
export default handler;
