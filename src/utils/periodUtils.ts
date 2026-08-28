/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Given a start year-month string (e.g., '2026-05'),
 * calculates the end year-month string for a given duration (3 or 6 months).
 * In therapy planning (e.g. 6-month period starting in May: May, Jun, Jul, Aug, Sep, Oct -> end is '2026-10', i.e. start + 5 months inclusive).
 * If duration is 3 months starting May: May, Jun, Jul -> end is '2026-07' (start + 2 months inclusive).
 */
export function calculateTherapyPeriodEnd(startYearMonth: string, durationMonths: 3 | 6): string {
  if (!startYearMonth) return '';
  const parts = startYearMonth.split('-');
  if (parts.length < 2) return '';
  
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10); // 1-12

  if (isNaN(year) || isNaN(month)) return '';

  // Inclusive duration: 6 months means start month + 5 months; 3 months means start month + 2 months
  const totalMonths = month - 1 + (durationMonths - 1);
  const endYear = year + Math.floor(totalMonths / 12);
  const endMonth = (totalMonths % 12) + 1;

  return `${endYear}-${String(endMonth).padStart(2, '0')}`;
}

/**
 * Checks if a therapy period is expired or expiring soon (within current month or already past).
 */
export function checkTherapyPeriodStatus(endYearMonth: string): { isExpired: boolean; isExpiringSoon: boolean; daysRemainingText: string } {
  if (!endYearMonth) return { isExpired: false, isExpiringSoon: false, daysRemainingText: '' };
  
  const parts = endYearMonth.split('-');
  if (parts.length < 2) return { isExpired: false, isExpiringSoon: false, daysRemainingText: '' };

  const endYear = parseInt(parts[0], 10);
  const endMonth = parseInt(parts[1], 10); // 1-12

  // End of the target month
  const endDate = new Date(endYear, endMonth, 0, 23, 59, 59);
  const now = new Date();

  // Current year & month comparison
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const currentYearMonthVal = currentYear * 12 + currentMonth;
  const endYearMonthVal = endYear * 12 + endMonth;

  const isExpired = currentYearMonthVal > endYearMonthVal || now > endDate;
  const isExpiringSoon = !isExpired && currentYearMonthVal === endYearMonthVal;

  let daysRemainingText = '';
  if (isExpired) {
    daysRemainingText = '期程已屆滿';
  } else if (isExpiringSoon) {
    daysRemainingText = '本月即將屆滿';
  }

  return { isExpired, isExpiringSoon, daysRemainingText };
}
