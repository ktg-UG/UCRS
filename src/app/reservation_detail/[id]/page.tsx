'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ReservationEvent } from '@/types';
import { Box, Typography, Button, Stack, CircularProgress, Container, List, ListItem, ListItemText, Divider, IconButton, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useLiff } from '@/contexts/LiffContext';

export default function ReservationDetailPage() {
  const pathname = usePathname();
  const id = pathname?.split('/').pop();

  const [reservation, setReservation] = useState<ReservationEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // useLiffフックから必要な情報を取得
  const { liff, profile, isLoggedIn, error: liffError } = useLiff();

  const fetchReservation = useCallback(async () => {
    if (!id) return;
    try {
      const response = await fetch(`/api/reservation/id/${id}`);
      if (!response.ok) throw new Error('予約情報の取得に失敗しました');
      const data: ReservationEvent = await response.json();
      setReservation(data);
    } catch (err: any) {
      setError(err.message);
    }
  }, [id]);
  
  useEffect(() => {
    // LIFFの準備（liffオブジェクトの取得）ができたら予約情報を取得
    if(liff) {
      setLoading(true);
      fetchReservation().finally(() => setLoading(false));
    }
  }, [liff, fetchReservation]);

  const handleJoin = async () => {
    // ボタンが無効化されているはずだが、念のため二重チェック
    if (!reservation || !profile) return;
    
    // ログインしていない場合はログインを促す
    if (!isLoggedIn) {
      liff?.login({ redirectUri: window.location.href });
      return;
    }

    if (reservation.memberNames.includes(profile.displayName)) {
      alert('既に参加済みです。');
      return;
    }
    if (reservation.maxMembers && reservation.memberNames.length >= reservation.maxMembers) {
      alert('申し訳ありません、定員に達しています。');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/reservation/id/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          lineUserId: profile.userId,
          lineUserName: profile.displayName,
        }),
      });
      if (res.ok) {
        alert('参加登録が完了しました！');
        await fetchReservation();
      } else {
        const errorData = await res.json();
        alert(`参加登録に失敗しました: ${errorData.error}`);
      }
    } catch (err) {
      alert('参加処理中にエラーが発生しました。');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // === 表示ロジック ===
  if (liffError) return <Container sx={{py:2}}><Alert severity="error">LIFFの初期化に失敗しました: {liffError}</Alert></Container>;
  if (loading || !liff) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (error) return <Container sx={{py:2}}><Alert severity="error">エラー: {error}</Alert></Container>;
  if (!reservation) return <Typography align="center" p={4}>指定された予約は見つかりませんでした。</Typography>;

  const isFull = reservation.maxMembers && reservation.memberNames.length >= reservation.maxMembers;
  const isAlreadyJoined = profile ? reservation.memberNames.includes(profile.displayName) : false;

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Stack direction="row" alignItems="center" mb={2}>
        <IconButton onClick={() => liff?.closeWindow()}><ArrowBackIcon /></IconButton>
        <Typography variant="h5" sx={{ flexGrow: 1, textAlign: 'center' }}>募集詳細</Typography>
        <Box sx={{ width: 40 }} />
      </Stack>
      <Stack spacing={2}>
        <Typography variant="h6">日付: {reservation.date}</Typography>
        <Typography variant="h6">時間: {reservation.startTime.slice(0, 5)} 〜 {reservation.endTime.slice(0, 5)}</Typography>
        <Typography variant="h6">目的: {reservation.purpose}</Typography>
      </Stack>
      <Divider sx={{ my: 3 }} />
      <Typography variant="h6">メンバー ({reservation.memberNames.length} / {reservation.maxMembers || 'N/A'}人)</Typography>
      <List>
        {reservation.memberNames.map((name, index) => (
          <ListItem key={index}><ListItemText primary={name} /></ListItem>
        ))}
        {reservation.memberNames.length === 0 && (
          <ListItem><ListItemText primary="まだ参加者がいません" sx={{ color: 'text.secondary' }} /></ListItem>
        )}
      </List>
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button 
          variant="contained" size="large" onClick={handleJoin}
          disabled={!profile || isFull || isAlreadyJoined || isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> :
           isAlreadyJoined ? '参加済みです' :
           isFull ? '定員です' :
           `「${profile?.displayName || ''}」として参加する`}
        </Button>
      </Box>
    </Container>
  );
}