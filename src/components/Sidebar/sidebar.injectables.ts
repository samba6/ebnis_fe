export function onClickLogoutLinkCallback() {
  if (typeof window !== "undefined") {
    window.location.reload();
  }
}
