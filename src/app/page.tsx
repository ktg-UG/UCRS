"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Typography,
  Box,
  Button,
  Stack,
  Container,
  CircularProgress,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import Calendar from "@/components/Calendar";
import BottomSheet from "@/components/BottomSheet";
import { ReservationEvent } from "@/types";

/**
 * ページのメインコンテンツをレンダリングするクライアントコンポーネント
 * `useSearchParams`を使用するため、`Suspense`の内側で呼び出す必要がある
 */
function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [allEvents, setAllEvents] = useState<ReservationEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // LIFFからのリダイレクト処理とデータ取得
  useEffect(() => {
    const liffState = searchParams.get("liff.state");
    if (liffState) {
      // liff.stateパラメータがあれば、そのパスにリダイレクト
      router.replace(liffState);
      // リダイレクトする場合は、これ以降の処理は不要
      return;
    }

    // 通常のデータ取得処理
    const fetchAllEvents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/reservation");
        if (!response.ok) throw new Error("Failed to fetch events");
        const data = await response.json();
        setAllEvents(data);
      } catch (error) {
        console.error("Failed to fetch all events:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllEvents();
  }, [searchParams, router]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleEventDelete = (deletedEventId: number) => {
    setAllEvents((prevEvents) =>
      prevEvents.filter((event) => event.id !== deletedEventId)
    );
    setSelectedDate(null);
  };

  const handleNewReservation = () => {
    router.push("/reserve/new");
  };

  // LIFFのリダイレクト処理中、またはデータ取得中はローディング画面を表示
  if (isLoading || searchParams.get("liff.state")) {
    return (
      <Container maxWidth="md" sx={{ py: 2, textAlign: "center" }}>
        <CircularProgress />
        <Typography>読み込み中...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 2 }}>
      <Typography variant="h4" component="h1" align="center" sx={{ mb: 2 }}>
        Unite Court Reserve
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: { xs: 1, sm: 2 },
          my: 2,
          flexWrap: "wrap",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: "#f44336",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <Typography variant="body2">プライベート</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: "#66bb6a",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <Typography variant="body2">満員</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: "#ffa726",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <Typography variant="body2">残り1人</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: "#ffeb3b",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />
          <Typography variant="body2">空きあり</Typography>
        </Stack>
      </Box>

      <Calendar events={allEvents} onDateSelect={handleDateSelect} />

      <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={<AddIcon />}
          onClick={handleNewReservation}
        >
          新規予約を作成
        </Button>
      </Box>

      <BottomSheet
        date={selectedDate}
        events={allEvents.filter((event) => event.date === selectedDate)}
        onClose={() => setSelectedDate(null)}
        onDelete={handleEventDelete}
      />
    </Container>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<CircularProgress />}>
      <HomePageContent />
    </Suspense>
  );
}
