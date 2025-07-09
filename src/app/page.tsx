"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
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
import SpecialEventDialog from "@/components/SpecialEventDialog";
import { ReservationEvent, SpecialEvent, CombinedEvent } from "@/types";
import { useAdmin } from "@/contexts/AdminContext";

function HomePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAdmin } = useAdmin();

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [allEvents, setAllEvents] = useState<CombinedEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [specialEventDialogOpen, setSpecialEventDialogOpen] = useState(false);

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reservationsRes, specialEventsRes] = await Promise.all([
        fetch("/api/reservation"),
        fetch("/api/special-events"),
      ]);

      if (!reservationsRes.ok || !specialEventsRes.ok) {
        throw new Error("データの取得に失敗しました");
      }

      const reservations: Omit<ReservationEvent, "type">[] =
        await reservationsRes.json();
      const specialEvents: SpecialEvent[] = await specialEventsRes.json();

      const combinedData: CombinedEvent[] = [
        ...reservations.map(
          (r): ReservationEvent => ({ ...r, type: "reservation" })
        ),
        ...specialEvents,
      ];

      setAllEvents(combinedData);
    } catch (error) {
      console.error("イベントデータの取得に失敗:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const liffState = searchParams.get("liff.state");
    if (liffState) {
      router.replace(liffState);
      return;
    }
    fetchAllData();
  }, [searchParams, router, fetchAllData]);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleEventDelete = (
    deletedEventId: number,
    type: "reservation" | "special_event"
  ) => {
    setAllEvents((prevEvents) =>
      prevEvents.filter((event) => {
        if (event.type === "reservation" && type === "reservation") {
          return event.id !== deletedEventId;
        }
        if (event.type !== "reservation" && type === "special_event") {
          return event.id !== deletedEventId;
        }
        return true;
      })
    );
    setSelectedDate(null);
  };

  const handleNewReservation = () => {
    router.push("/reserve/new");
  };

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
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 1,
          alignItems: "center",
        }}
      >
        {isAdmin && (
          <Button
            variant="contained"
            color="secondary"
            onClick={() => setSpecialEventDialogOpen(true)}
          >
            イベント追加
          </Button>
        )}
        <Button
          variant="outlined"
          color="primary"
          onClick={() => router.push("/contact")}
          sx={{
            ml: "auto",
            px: { xs: 1.5, sm: 2 },
            py: { xs: 0.5, sm: 1 },
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
          }}
        >
          お問い合わせ
        </Button>
      </Box>

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
              backgroundColor: "#a5d6a7",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />{" "}
          <Typography variant="body2">新球</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: "#e0e0e0",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />{" "}
          <Typography variant="body2">イベント</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: "#f44336",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />{" "}
          <Typography variant="body2">ボール予約</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 16,
              height: 16,
              backgroundColor: "#4caf50",
              borderRadius: "4px",
              border: "1px solid #ccc",
            }}
          />{" "}
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
          />{" "}
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
          />{" "}
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
      <SpecialEventDialog
        open={specialEventDialogOpen}
        onClose={() => setSpecialEventDialogOpen(false)}
        onEventAdd={fetchAllData}
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
