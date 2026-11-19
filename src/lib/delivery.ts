export function deliveryFeePaise(pin: string): number | null {
  if (!/^[1-9][0-9]{5}$/.test(pin)) return null;
  try {
    const areas = JSON.parse(process.env.DELIVERY_FEES_PAISE ?? '{}');
    const fee = areas[pin];
    return Number.isSafeInteger(fee) && fee >= 0 && fee <= 99999999 ? fee : null;
  } catch {
    return null;
  }
}
