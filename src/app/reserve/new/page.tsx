// src/app/reserve/new/page.tsx
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { Box, Typography, Button, Stack, IconButton, CircularProgress, Container } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReservationForm, { ReservationFormData } from '@/components/ReservationForm';

// --- ▼ フォームの本体となるクライアントコンポーネントを定義 ▼ ---
function ReserveNewForm() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Suspenseの内側でフックを呼び出す
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  const [formData, setFormData] = useState<ReservationFormData>({
    date: null,
    startTime: '09:00',
    endTime: '12:00',
    maxMembers: 4,
    memberNames: [],
    purpose: '練習',
    lineNotify: false, // ★ 追加: 初期値をfalseに設定
    lineGroupIds: [],   // ★ 追加: 初期値を空配列に設定
  });

  // URLに日付パラメータがあれば初期値として設定
  useEffect(() => {
    const dateFromParams = searchParams.get('date');
    if (dateFromParams) {
      setFormData(prev => ({ ...prev, date: new Date(dateFromParams + 'T00:00:00') }));
    }
  }, [searchParams]);

  // スイッチが切り替わったときにフォームのデータをリセット
  useEffect(() => {
    if (isPrivate) {
      setFormData(prev => ({ ...prev, maxMembers: 1, purpose: 'プライベート', memberNames: [], lineNotify: false, lineGroupIds: [] })); // ★ lineNotifyとlineGroupIdsもリセット
    } else {
      setFormData(prev => ({ ...prev, maxMembers: 4, purpose: '練習', memberNames: [] }));
    }
  }, [isPrivate]);

  const handleSubmit = async () => {
    if (!formData.date) {
      alert('日付を選択してください。');
      return;
    }
    if (isPrivate && (!formData.memberNames[0] || formData.memberNames[0].trim() === '')) {
      alert('代表者名を入力してください。');
      return;
    }
    if (formData.lineNotify && (!formData.lineGroupIds || formData.lineGroupIds.length === 0)) { // ★ LINE通知がオンなのにグループIDがない場合
      alert('LINEグループ通知がオンです。通知先のLINEグループIDを入力してください。');
      return;
    }
    
    setIsSubmitting(true);
    
    const payload = {
      ...formData,
      date: format(formData.date, 'yyyy-MM-dd'),
      purpose: isPrivate ? 'プライベート' : formData.purpose,
      maxMembers: isPrivate ? 1 : formData.maxMembers,
      // lineNotify と lineGroupIds はペイロードから除外（データベースに保存しないため）
      // 必要であれば、別途データベースに保存する設計も可能
      lineNotify: undefined, // 送信しないようにundefinedを設定
      lineGroupIds: undefined, // 送信しないようにundefinedを設定
    };

    const res = await fetch('/api/reservation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const result = await res.json();
      alert('予約を作成しました');

      // ★ ここから追加: LINE通知がオンの場合、LINEメッセージ送信APIを呼び出す ★
      if (!isPrivate && formData.lineNotify && formData.lineGroupIds && formData.lineGroupIds.length > 0) {
          try {
              await fetch('/api/line/send-message', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                      reservationDetails: {
                          id: result.id,
                          date: format(formData.date, 'yyyy/MM/dd'),
                          startTime: formData.startTime,
                          maxMembers: formData.maxMembers,
                          ownerName: formData.memberNames[0] || '名無し', // 募集者名（先頭のメンバー）
                          purpose: formData.purpose,
                      },
                      lineGroupIds: formData.lineGroupIds,
                  }),
              });
              console.log('LINE通知リクエストを送信しました');
          } catch (lineError) {
              console.error('LINE通知の送信に失敗しました:', lineError);
              alert('LINE通知の送信に失敗しました。詳細はコンソールを確認してください。'); // 予約成功とは別に通知
          }
      }
      // ★ ここまで追加 ★

      router.push('/');
      router.refresh();
    } else {
      const error = await res.json();
      alert(`予約作成失敗: ${error.error}`);
    }
    setIsSubmitting(false);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 2}}>
      <Stack direction="row" alignItems="center" mb={2}>
        <IconButton onClick={() => router.back()}>
            <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ flexGrow: 1, textAlign: 'center' }}>
            新規コート予約
        </Typography>
        <Box sx={{ width: 40 }} />
      </Stack>

      <ReservationForm
        formData={formData}
        setFormData={setFormData}
        isPrivate={isPrivate}
        setIsPrivate={setIsPrivate}
      />

      <Stack spacing={2} mt={3}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmit}
          disabled={!formData.date || isSubmitting}
        >
          {isSubmitting ? <CircularProgress size={24} /> : 'この内容で予約する'}
        </Button>
        <Button fullWidth variant="outlined" onClick={() => router.back()}>
            キャンセル
        </Button>
      </Stack>
    </Container>
  );
}

const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
    <CircularProgress />
    <Typography sx={{ ml: 2 }}>フォームを読み込み中...</Typography>
  </Box>
);


export default function ReserveNewPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ReserveNewForm />
    </Suspense>
  );
}