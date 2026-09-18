// Cognito pre-sign-up trigger: only Google accounts on the allow-list may join.
// ALLOWED_EMAILS is a comma-separated list; "*" allows everyone (not advised).
export const handler = async (event) => {
  const allowed = (process.env.ALLOWED_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  const email = (event.request?.userAttributes?.email || '').toLowerCase();
  if (allowed.includes('*') || (email && allowed.includes(email))) {
    // Federated users are confirmed by their identity provider.
    event.response.autoConfirmUser = true;
    event.response.autoVerifyEmail = true;
    return event;
  }
  throw new Error(`This Google account (${email || 'unknown'}) is not on the allowed list for Pixel Pals.`);
};
