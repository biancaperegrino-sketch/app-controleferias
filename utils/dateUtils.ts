
import { Holiday, HolidayType } from '../types';

export const isWeekend = (date: Date): boolean => {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
};

export const getHolidaysInRange = (
  start: Date,
  end: Date,
  state: string,
  holidays: Holiday[]
): Holiday[] => {
  return holidays.filter(h => {
    const hDate = new Date(h.date + 'T00:00:00');
    const isWithinRange = hDate >= start && hDate <= end;
    const isRelevant = h.type === HolidayType.NACIONAL || h.state === state;
    return isWithinRange && isRelevant;
  });
};

export const calculateVacationMetrics = (
  startDateStr: string,
  endDateStr: string,
  state: string,
  holidays: Holiday[]
) => {
  if (!startDateStr || !endDateStr) return { calendarDays: 0, businessDays: 0, holidaysCount: 0 };

  const start = new Date(startDateStr + 'T00:00:00');
  const end = new Date(endDateStr + 'T00:00:00');
  
  if (end < start) return { calendarDays: 0, businessDays: 0, holidaysCount: 0 };

  // Calendar days: end - start + 1
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const calendarDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  let businessDays = 0;
  const holidaysInRange = getHolidaysInRange(start, end, state, holidays);
  const holidayDates = new Set(holidaysInRange.map(h => h.date));

  const current = new Date(start);
  while (current <= end) {
    const dateStr = current.toISOString().split('T')[0];
    const isWknd = isWeekend(current);
    const isHol = holidayDates.has(dateStr);

    if (!isWknd && !isHol) {
      businessDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  return {
    calendarDays,
    businessDays,
    holidaysCount: holidaysInRange.length
  };
};

export const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};
