'use client';

import { useState, useEffect } from 'react';
import Typography from '@mui/material/Typography';
import Calendar from '@/components/Calendar';
import BottomSheet from '@/components/BottomSheet';
import { ReservationEvent } from '@/types'; // 共通の型をインポート

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // ★ 1. アプリ全体の予約データをここで一元管理する
  const [allEvents, setAllEvents] = useState<ReservationEvent[]>([]);

  // ★ 2. 初回読み込み時に全データを取得する
  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        // 全予約を取得するAPIを想定 (このAPIは別途作成が必要な場合があります)
        const response = await fetch('/api/reservation'); 
        if (!response.ok) throw new Error('Failed to fetch events');
        const data = await response.json();
        setAllEvents(data);
      } catch (error) {
        console.error("Failed to fetch all events:", error);
      }
    };
    fetchAllEvents();
  }, []);

  // ★ 3. 選択された日付に該当するイベントをフィルタリング
  const selectedEvents = selectedDate
    ? allEvents.filter(event => event.date === selectedDate)
    : [];

  // ★ 4. Calendarコンポーネントからの日付選択を処理
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };
  
  // ★ 5. BottomSheetから削除通知を受け取り、全データリストを更新する
  const handleEventDelete = (deletedEventId: number) => {
    setAllEvents(prevEvents => prevEvents.filter(event => event.id !== deletedEventId));
    // ボトムシートも自動的に閉じる
    setSelectedDate(null);
  };

  return (
    <>
      <Typography variant="h4" component="h1" align="center" sx={{ mb: 0 }}>
        Unite Court Reserve
      </Typography>

      {/* ★ 6. Calendarに全データを渡す */}
      <Calendar 
        events={allEvents} 
        onDateSelect={handleDateSelect} 
      />

      {/* ★ 7. BottomSheetにフィルタリングしたデータと削除用関数を渡す */}
      <BottomSheet 
        date={selectedDate} 
        events={selectedEvents}
        onClose={() => setSelectedDate(null)} 
        onDelete={handleEventDelete}
      />
    </>
  );
}