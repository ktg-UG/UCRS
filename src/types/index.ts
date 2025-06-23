export type ReservationEvent = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  maxMembers: number;
  memberNames: string[];
  purpose?: string;
};