/**
 * Formats a date string or object into a localized string for Asia/Jakarta (WIB).
 * Ensures robust parsing of UTC strings.
 */
export function formatToWIB(
  dateInput: string | Date | number | undefined | null,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }
) {
  if (!dateInput) return '-';
  
  try {
    let date: Date;
    if (typeof dateInput === 'string') {
      // Ensure ISO format and treat as UTC if no offset is present
      let isoStr = dateInput.includes('T') ? dateInput : dateInput.replace(' ', 'T');
      // Check if it has a timezone offset (ends with Z or +/-HH:mm)
      // We look for (+) or (-) only in the time part (after T)
      const timePart = isoStr.split('T')[1] || '';
      if (!timePart.includes('Z') && !timePart.includes('+') && !/(^|[^T])-\d{2}/.test(timePart)) {
        isoStr += 'Z';
      }
      date = new Date(isoStr);
    } else {
      date = new Date(dateInput);
    }

    if (isNaN(date.getTime())) return '-';

    const result = date.toLocaleString('id-ID', {
      ...options,
      timeZone: 'Asia/Jakarta'
    });

    // Fix Indonesian time separator (often '.' instead of ':') and ensure WIB
    return result.replace(/(\d{2})[.](\d{2})/, '$1:$2');
  } catch (e) {
    console.error("Format date error:", e);
    return typeof dateInput === 'string' ? dateInput : '-';
  }
}

/**
 * Formats time specifically in HH:mm WIB format
 */
export function formatTimeWIB(dateInput: string | Date | number | undefined | null) {
  return formatToWIB(dateInput, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }) + ' WIB';
}

/**
 * Gets current time in WIB for display
 */
export function getCurrentWIB() {
  return formatToWIB(new Date(), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }) + ' WIB';
}
