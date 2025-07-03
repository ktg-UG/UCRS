'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ReservationEvent } from '@/types';
import { Box, Typography, Button, Stack, CircularProgress, Container, List, ListItem, ListItemText, TextField, Divider, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function ReservationDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname?.split('/').pop();

  const [reservation, setReservation] = useState<ReservationEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isJoining, setIsJoining] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReservation = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/reservation/id/${id}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'データの取得に失敗しました');
      }
      const data: ReservationEvent = await response.json();
      setReservation(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReservation();
  }, [fetchReservation]);

  const handleJoin = async () => {
    if (!reservation || !newMemberName.trim()) {
      alert('参加者名を入力してください。');
      return;
    }
    if (reservation.memberNames.length >= reservation.maxMembers) {
      alert('申し訳ありません、定員に達しています。');
      return;
    }
    if (reservation.memberNames.includes(newMemberName.trim())) {
      alert('すでに追加されているメンバーです。');
      return;
    }

    setIsSubmitting(true);
    
    const updatedMemberNames = [...reservation.memberNames, newMemberName.trim()];
    
    const payload = { ...reservation, memberNames: updatedMemberNames };

    try {
      const res = await fetch(`/api/reservation/id/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert('参加登録が完了しました！');
        setNewMemberName('');
        setIsJoining(false);
        fetchReservation();
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

  // --- ▼ レンダリング部分を修正 ▼ ---
  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return <Typography color="error" align="center" p={4}>エラー: {error}</Typography>;
    }

    if (!reservation) {
      return <Typography align="center" p={4}>指定された予約は見つかりませんでした。</Typography>;
    }
    
    const isFull = reservation.memberNames.length >= reservation.maxMembers;

    return (
      <>
        <Stack spacing={2}>
          <Typography variant="h6">日付: {reservation.date}</Typography>
          <Typography variant="h6">時間: {reservation.startTime.slice(0, 5)} 〜 {reservation.endTime.slice(0, 5)}</Typography>
          <Typography variant="h6">目的: {reservation.purpose}</Typography>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6">メンバー ({reservation.memberNames.length} / {reservation.maxMembers}人)</Typography>
        <List>
          {reservation.memberNames.map((name, index) => (
            <ListItem key={index}><ListItemText primary={name} /></ListItem>
          ))}
          {reservation.memberNames.length === 0 && (
            <ListItem><ListItemText primary="まだ参加者がいません" sx={{ color: 'text.secondary' }} /></ListItem>
          )}
        </List>
        
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          {isJoining ? (
            <Stack spacing={2} direction="row" alignItems="center">
              <TextField fullWidth label="参加者名" variant="outlined" value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} disabled={isSubmitting} autoFocus />
              <Button variant="contained" onClick={handleJoin} disabled={isSubmitting || !newMemberName.trim()}>
                {isSubmitting ? <CircularProgress size={24} /> : '確定'}
              </Button>
              <Button variant="outlined" onClick={() => setIsJoining(false)} disabled={isSubmitting}>キャンセル</Button>
            </Stack>
          ) : (
            <Button variant="contained" size="large" onClick={() => setIsJoining(true)} disabled={isFull}>
              {isFull ? '定員です' : '参加する'}
            </Button>
          )}
        </Box>
      </>
    );
  };

  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Stack direction="row" alignItems="center" mb={2}>
        <IconButton onClick={() => router.push('/')}><ArrowBackIcon /></IconButton>
        <Typography variant="h5" sx={{ flexGrow: 1, textAlign: 'center' }}>募集詳細</Typography>
        <Box sx={{ width: 40 }} />
      </Stack>
      {renderContent()}
    </Container>
  );
  // --- ▲ レンダリング部分の修正ここまで ▲ ---
}