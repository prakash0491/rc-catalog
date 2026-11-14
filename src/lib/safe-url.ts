/** Allow local paths and web URLs, never executable or protocol-relative URLs. */
export function isSafeWebLink(value: string): boolean {
  if (/[\\\u0000-\u001f\u007f]/.test(value)) return false;
  if (value.startsWith('/')) return !value.startsWith('//');
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

export function getSafeCustomerRedirectPath(value: string | null | undefined): string {
  return value?.startsWith('/') && isSafeWebLink(value) ? value : '/account';
}
