// 通常の予約イベントの型
export type ReservationEvent = {
  type: 'reservation';
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  maxMembers: number;
  memberNames: string[];
  purpose?: string;
  comment?: string;
};

// 新球入荷・イベント用の型
export type SpecialEvent = {
  type: 'new_balls' | 'event';
  id: number;
  date: string;
  eventName: string | null;
  memo: string | null;
};

export type CombinedEvent = ReservationEvent | SpecialEvent;