// Verification can happen in another tab while this session still has old data.
// Refresh both the account and its token before evaluating protected access.
export async function loadAdminIdentity(user) {
  await user.reload();
  let result = await user.getIdTokenResult();
  if (result.claims.email_verified !== user.emailVerified)
    result = await user.getIdTokenResult(true);
  return result;
}

export function sessionNeedsLogin(error) {
  return [
    "auth/user-token-expired",
    "auth/invalid-user-token",
    "auth/user-disabled",
    "auth/user-not-found",
  ].includes(error?.code);
}
