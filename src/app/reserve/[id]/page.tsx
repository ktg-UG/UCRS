'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

// APIから返されるデータの型。purposeなどのフィールドを追加。
// 実際のデータベーススキーマに合わせて調整してください。
type Reservation = {
  id: number; // number型と仮定
  date: string;
  startTime: string;
  endTime: string;
  maxMembers: number;
  memberNames: string[];
  purpose?: string;
};

// フォームで管理するデータの型
type ReservationForm = {
  startTime: string;
  endTime: string;
  maxMembers: number;
  memberNames: string[];
  purpose: string;
};


export default function ReserveDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split('/').pop();

  const [detail, setDetail] = useState<Reservation | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 編集用フォームの状態
  const [form, setForm] = useState<ReservationForm>({
    startTime: '09:00',
    endTime: '12:00',
    maxMembers: 1,
    memberNames: [],
    purpose: '',
  });

  const peopleOptions = [1, 2, 3, 4, 5, 6];

  // 1. APIからデータを取得する
  useEffect(() => {
    if (id) {
      const fetchDetail = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(`/api/reservation/id/${id}`);
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'データの取得に失敗しました');
          }
          const data: Reservation = await response.json();
          setDetail(data);
        } catch (err: any) {
          console.error(err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchDetail();
    }
  }, [id]);

  // 2. 取得したデータをフォームに反映する
  useEffect(() => {
    if (detail) {
      setForm({
        startTime: detail.startTime,
        endTime: detail.endTime,
        maxMembers: detail.maxMembers,
        memberNames: detail.memberNames,
        purpose: detail.purpose || '', // purposeがnullの場合も考慮
      });
    }
  }, [detail]);

  // フォームの値を更新する汎用ハンドラ
  const handleChange = (field: keyof ReservationForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  
  // メンバー追加
  const addMember = () => {
    const name = prompt('追加するメンバー名を入力してください');
    if (name) {
        handleChange('memberNames', [...form.memberNames, name]);
    }
  };

  // メンバー削除
  const removeMember = (index: number) => {
    const newMembers = form.memberNames.filter((_, idx) => idx !== index);
    handleChange('memberNames', newMembers);
  };
  
  // 編集をキャンセルして元の状態に戻す
  const handleCancel = () => {
      if(detail) {
          // detailのデータでフォームをリセット
          setForm({
              startTime: detail.startTime,
              endTime: detail.endTime,
              maxMembers: detail.maxMembers,
              memberNames: detail.memberNames,
              purpose: detail.purpose || '',
          });
      }
      setEditMode(false);
  };

  // 3. データを保存（更新）する
  const handleSave = async () => {
    try {
      const res = await fetch(`/api/reservation/id/${id}`, {
        method: 'PUT', // または 'PATCH'
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const updatedData = await res.json();
        setDetail(updatedData); // 画面の表示を更新
        alert('予約を更新しました');
        setEditMode(false); // 編集モードを終了
      } else {
        const error = await res.json();
        alert(`更新失敗: ${error.error}`);
      }
    } catch (err) {
      alert('更新処理中にエラーが発生しました');
    }
  };

  // 4. データを削除する
  const handleDelete = async () => {
    if (window.confirm('本当にこの募集を削除しますか？')) {
      try {
        const res = await fetch(`/api/reservation/id/${id}`, { method: 'DELETE' });
        if(res.ok) {
            alert('募集を削除しました');
            router.push('/');
        } else {
            const error = await res.json();
            alert(`削除失敗: ${error.error}`);
        }
      } catch (err) {
        alert('削除処理中にエラーが発生しました');
      }
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (error) return <Typography color="error" align="center" p={4}>エラー: {error}</Typography>;
  if (!detail) return <Typography align="center" p={4}>指定された予約は見つかりませんでした。</Typography>;

  return (
    <Box sx={{ maxWidth: 400, margin: 'auto', p: 2 }}>
      <Stack direction="row" alignItems="center" mb={2}>
         <IconButton onClick={handleBack}>
            <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ flexGrow: 1, textAlign: 'center' }}>
            募集詳細
        </Typography>
        <Box sx={{ width: 40 }} /> {/* 中央揃えのためのスペーサー */}
      </Stack>

      {/* 日付 */}
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Typography>日付: {detail.date}</Typography>
      </Stack>

      {/* 時間 */}
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Typography>時間</Typography>
        <TextField type="time" value={form.startTime} disabled={!editMode} onChange={(e) => handleChange('startTime', e.target.value)} />
        <Typography>〜</Typography>
        <TextField type="time" value={form.endTime} disabled={!editMode} onChange={(e) => handleChange('endTime', e.target.value)} />
      </Stack>

      {/* 定員 */}
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Typography>定員</Typography>
        <TextField select value={form.maxMembers} disabled={!editMode} onChange={(e) => handleChange('maxMembers', Number(e.target.value))} sx={{ minWidth: 100 }}>
          {peopleOptions.map((num) => (<MenuItem key={num} value={num}>{num}人</MenuItem>))}
        </TextField>
      </Stack>

      {/* メンバー */}
      <Box mb={2}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <Typography>メンバー ({form.memberNames.length}人)</Typography>
          {editMode && <Button size="small" variant="outlined" onClick={addMember}>＋</Button>}
        </Stack>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {form.memberNames.map((member, idx) => (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', bgcolor: 'grey.200', px: 1, py: 0.5, borderRadius: 1 }}>
              {member}
              {editMode && <IconButton size="small" onClick={() => removeMember(idx)} sx={{ ml: 0.5 }}>×</IconButton>}
            </Box>
          ))}
        </Box>
      </Box>

      {/* 目的 */}
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <Typography>目的</Typography>
        <TextField select value={form.purpose} disabled={!editMode} onChange={(e) => handleChange('purpose', e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="">選択してください</MenuItem>
          <MenuItem value="練習">練習</MenuItem>
          <MenuItem value="試合">試合</MenuItem>
          <MenuItem value="レッスン">レッスン</MenuItem>
        </TextField>
      </Stack>

      {/* ボタン群 */}
      <Stack spacing={2}>
        {!editMode ? (
          <Button fullWidth variant="contained" onClick={() => setEditMode(true)}>
            編集する
          </Button>
        ) : (
          <>
            <Button fullWidth variant="contained" color="primary" onClick={handleSave}>
              この内容で保存する
            </Button>
            <Button fullWidth variant="outlined" color="secondary" onClick={handleCancel}>
              キャンセル
            </Button>
          </>
        )}
        <Button fullWidth variant="contained" color="error" onClick={handleDelete} sx={{ mt: 1 }}>
          この募集を削除する
        </Button>
      </Stack>
    </Box>
  );
}