export const TIMEZONES = [
  { name: 'Eastern Time (ET)', value: 'America/New_York', offset: -5 },
  { name: 'Central Time (CT)', value: 'America/Chicago', offset: -6 },
  { name: 'Mountain Time (MT)', value: 'America/Denver', offset: -7 },
  { name: 'Pacific Time (PT)', value: 'America/Los_Angeles', offset: -8 },
  { name: 'Alaska Time (AKT)', value: 'America/Anchorage', offset: -9 },
  { name: 'Hawaii Time (HT)', value: 'Pacific/Honolulu', offset: -10 },
  { name: 'India Standard Time (IST)', value: 'Asia/Kolkata', offset: 5.5 },
  { name: 'Central European Time (CET)', value: 'Europe/Berlin', offset: 1 },
  { name: 'British Time (GMT)', value: 'Europe/London', offset: 0 },
  { name: 'Australian Eastern Time (AET)', value: 'Australia/Sydney', offset: 10 }
];

export const TIME_SLOTS_24H = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
  '15:00', '16:00', '17:00', '18:00'
];

export function convertToUTC(date: string, time: string, timezone: string): Date {
  const dateTimeString = `${date}T${time}:00`;

  const tempDate = new Date(dateTimeString);
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(tempDate);
  const getValue = (type: string) => parts.find(p => p.type === type)?.value || '';

  const localString = `${getValue('year')}-${getValue('month')}-${getValue('day')}T${getValue('hour')}:${getValue('minute')}:00`;
  const localDate = new Date(localString);
  const offset = tempDate.getTime() - localDate.getTime();

  return new Date(tempDate.getTime() - offset);
}

export function convertFromUTC(utcDate: Date, timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  return formatter.format(utcDate);
}

export function convertTimeToIST(date: string, time: string, fromTimezone: string): string {
  const utcDate = convertToUTC(date, time, fromTimezone);
  return convertFromUTC(utcDate, 'Asia/Kolkata');
}

export function formatTimeSlot(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTimeSlot(startTime)} - ${formatTimeSlot(endTime)}`;
}

export function getNextHour(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const nextHours = (hours + 1) % 24;
  return `${String(nextHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function getAvailableSlots(
  bookedSlotsUTC: Array<{ time_slot_utc: string }>,
  selectedDate: string,
  userTimezone: string
): string[] {
  const availableSlots: string[] = [];

  for (const slot of TIME_SLOTS_24H) {
    const userSlotUTC = convertToUTC(selectedDate, slot, userTimezone);

    const isBooked = bookedSlotsUTC.some(booked => {
      const bookedTime = new Date(booked.time_slot_utc);
      return Math.abs(bookedTime.getTime() - userSlotUTC.getTime()) < 60000;
    });

    if (!isBooked) {
      availableSlots.push(slot);
    }
  }

  return availableSlots;
}
