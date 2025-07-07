'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ReservationEvent } from '@/types';
import { Box, Typography, Button, Stack, CircularProgress, Container, List, ListItem, ListItemText, Divider, IconButton, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useLiff } from '@/hooks/useLiff'; // 作成したフックをインポート

export default function ReservationDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname?.split('/').pop();

  const [reservation, setReservation] = useState<ReservationEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // useLiffフックからLIFFオブジェクト、エラー、プロフィールを取得
  const { liffObject, liffError, liffProfile } = useLiff();

  const fetchReservation = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/reservation/id/${id}`);
      if (!response.ok) throw new Error('予約情報の取得に失敗しました');
      const data: ReservationEvent = await response.json();
      setReservation(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);
  
  useEffect(() => {
    // LIFFの準備ができたら予約情報を取得
    if(liffObject) {
      fetchReservation();
    }
  }, [liffObject, fetchReservation]);

  const handleJoin = async () => {
    if (!reservation || !liffProfile) return;
    
    // ログインしていない場合はログインを促す
    if (!liffObject.isLoggedIn()) {
      liffObject.login();
      return;
    }

    if (reservation.memberNames.includes(liffProfile.displayName)) {
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
          lineUserId: liffProfile.userId,
          lineUserName: liffProfile.displayName,
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
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (liffError) return <Container sx={{py:2}}><Alert severity="error">LIFFの初期化に失敗しました: {liffError}</Alert></Container>;
  if (error) return <Container sx={{py:2}}><Alert severity="error">エラー: {error}</Alert></Container>;
  if (!reservation) return <Typography align="center" p={4}>指定された予約は見つかりませんでした。</Typography>;

  const isFull = reservation.maxMembers && reservation.memberNames.length >= reservation.maxMembers;
  const isAlreadyJoined = liffProfile ? reservation.memberNames.includes(liffProfile.displayName) : false;

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Stack direction="row" alignItems="center" mb={2}>
        <IconButton onClick={() => liffObject?.closeWindow()}><ArrowBackIcon /></IconButton>
        <Typography variant="h5" sx={{ flexGrow: 1, textAlign: 'center' }}>募集詳細</Typography>
        <Box sx={{ width: 40 }} />
      </Stack>
      {/* (以下、表示部分は変更なし) */}
      <Stack spacing={2}><Typography variant="h6">日付: {reservation.date}</Typography><Typography variant="h6">時間: {reservation.startTime.slice(0, 5)} 〜 {reservation.endTime.slice(0, 5)}</Typography><Typography variant="h6">目的: {reservation.purpose}</Typography></Stack><Divider sx={{ my: 3 }} /><Typography variant="h6">メンバー ({reservation.memberNames.length} / {reservation.maxMembers || 'N/A'}人)</Typography><List>{reservation.memberNames.length > 0 ? reservation.memberNames.map((name, index) => (<ListItem key={index}><ListItemText primary={name} /></ListItem>)) : (<ListItem><ListItemText primary="まだ参加者がいません" sx={{ color: 'text.secondary' }} /></ListItem>)}</List>
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button 
          variant="contained" size="large" onClick={handleJoin}
          disabled={!liffProfile || isFull || isAlreadyJoined || isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={24} color="inherit" /> : isAlreadyJoined ? '参加済みです' : isFull ? '定員です' : `「${liffProfile?.displayName || ''}」として参加する`}
        </Button>
      </Box>
    </Container>
  );
}