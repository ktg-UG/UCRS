'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ReservationEvent } from '@/types';
import { Box, Typography, Button, Stack, CircularProgress, Container, List, ListItem, ListItemText, Divider, IconButton, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

declare const liff: any;

export default function ReservationDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname?.split('/').pop();

  const [reservation, setReservation] = useState<ReservationEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [liffError, setLiffError] = useState<string | null>(null);
  const [lineProfile, setLineProfile] = useState<{ userId: string; displayName: string } | null>(null);

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
    if (!process.env.NEXT_PUBLIC_LIFF_ID) {
        setLiffError('LIFF IDが設定されていません。環境変数を確認してください。');
        setLoading(false);
        return;
    }
    const initializeLiff = async () => {
      try {
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID });
        if (!liff.isLoggedIn()) {
          liff.login();
        } else {
          const profile = await liff.getProfile();
          setLineProfile({
            userId: profile.userId,
            displayName: profile.displayName,
          });
        }
      } catch (e: any) {
        console.error('LIFF initialization failed', e);
        setLiffError('LINE連携に失敗しました。LINEアプリ内のブラウザで開いてください。');
        setLoading(false);
      }
    };
    initializeLiff();
  }, []);

  useEffect(() => {
    if (lineProfile) {
      fetchReservation().finally(() => setLoading(false));
    }
  }, [lineProfile, fetchReservation]);

  const handleJoin = async () => {
    if (!reservation || !lineProfile) return;
    if (reservation.memberNames.includes(lineProfile.displayName)) {
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
          lineUserId: lineProfile.userId,
          lineUserName: lineProfile.displayName,
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

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (liffError) return <Container sx={{py:2}}><Alert severity="error">{liffError}</Alert></Container>;
  if (error) return <Container sx={{py:2}}><Alert severity="error">エラー: {error}</Alert></Container>;
  if (!reservation) return <Typography align="center" p={4}>指定された予約は見つかりませんでした。</Typography>;

  const isFull = reservation.maxMembers && reservation.memberNames.length >= reservation.maxMembers;
  const isAlreadyJoined = lineProfile ? reservation.memberNames.includes(lineProfile.displayName) : false;

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Stack direction="row" alignItems="center" mb={2}>
        <IconButton onClick={() => router.push('/')}><ArrowBackIcon /></IconButton>
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
          variant="contained" 
          size="large" 
          onClick={handleJoin}
          disabled={!lineProfile || isFull || isAlreadyJoined || isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> :
           isAlreadyJoined ? '参加済みです' :
           isFull ? '定員です' :
           `「${lineProfile?.displayName || ''}」として参加する`}
        </Button>
      </Box>
    </Container>
  );
}