export const AUTH_CHANGED_EVENT = "casino_auth_changed";
export const BALANCE_UPDATED_EVENT = "casino_balance_updated";

export function emitAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function emitBalanceUpdated(balance: number) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(BALANCE_UPDATED_EVENT, {
      detail: {
        balance,
      },
    }),
  );
}