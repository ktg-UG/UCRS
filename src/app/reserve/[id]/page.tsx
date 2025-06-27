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
import Autocomplete from '@mui/material/Autocomplete';

const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minuteOptions = ['00', '15', '30', '45'];

type Reservation = {
  id: number;
  date: string;
  startTime: string;
  endTime: string;
  maxMembers: number;
  memberNames: string[];
  purpose?: string;
};

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
  
  const [form, setForm] = useState<ReservationForm>({
    startTime: '09:00',
    endTime: '12:00',
    maxMembers: 1,
    memberNames: [],
    purpose: '',
  });

  const [allMembers, setAllMembers] = useState<string[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const peopleOptions = [1, 2, 3, 4, 5, 6];

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
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchDetail();
    }
  }, [id]);

  useEffect(() => {
    if (detail) {
      setForm({
        startTime: detail.startTime,
        endTime: detail.endTime,
        maxMembers: detail.maxMembers,
        memberNames: detail.memberNames,
        purpose: detail.purpose || '',
      });
    }
  }, [detail]);
  
  useEffect(() => {
    const fetchMembers = async () => {
      setLoadingMembers(true);
      try {
        const res = await fetch('/api/members');
        if (!res.ok) throw new Error('メンバーの取得に失敗しました');
        const data = await res.json();
        setAllMembers(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingMembers(false);
      }
    };
    fetchMembers();
  }, []);

  const handleChange = (field: keyof ReservationForm, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleTimeChange = (
    timeField: 'startTime' | 'endTime',
    part: 'hour' | 'minute',
    value: string
  ) => {
    const currentTime = form[timeField];
    const [hour, minute] = currentTime.split(':');
    const newTime = part === 'hour' ? `${value}:${minute}` : `${hour}:${value}`;
    handleChange(timeField, newTime);
  };

  const handleCancel = () => {
    if (detail) {
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

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/reservation/id/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        const updatedData = await res.json();
        setDetail(updatedData);
        alert('予約を更新しました');
        setEditMode(false);
      } else {
        const error = await res.json();
        alert(`更新失敗: ${error.error}`);
      }
    } catch (err) {
      alert('更新処理中にエラーが発生しました');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('本当にこの募集を削除しますか？')) {
      try {
        const res = await fetch(`/api/reservation/id/${id}`, { method: 'DELETE' });
        if (res.ok) {
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
        <Box sx={{ width: 40 }} />
      </Stack>

      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Typography>日付: {detail.date}</Typography>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Typography>時間</Typography>
        <TextField select value={form.startTime.split(':')[0]} onChange={(e) => handleTimeChange('startTime', 'hour', e.target.value)} disabled={!editMode} sx={{ minWidth: 80 }} aria-label="開始時間（時）">
          {hourOptions.map((h) => (<MenuItem key={`start-h-${h}`} value={h}>{h}</MenuItem>))}
        </TextField>
        <Typography>:</Typography>
        <TextField select value={form.startTime.split(':')[1]} onChange={(e) => handleTimeChange('startTime', 'minute', e.target.value)} disabled={!editMode} sx={{ minWidth: 80 }} aria-label="開始時間（分）">
          {minuteOptions.map((m) => (<MenuItem key={`start-m-${m}`} value={m}>{m}</MenuItem>))}
        </TextField>
        <Typography>〜</Typography>
        <TextField select value={form.endTime.split(':')[0]} onChange={(e) => handleTimeChange('endTime', 'hour', e.target.value)} disabled={!editMode} sx={{ minWidth: 80 }} aria-label="終了時間（時）">
          {hourOptions.map((h) => (<MenuItem key={`end-h-${h}`} value={h}>{h}</MenuItem>))}
        </TextField>
        <Typography>:</Typography>
        <TextField select value={form.endTime.split(':')[1]} onChange={(e) => handleTimeChange('endTime', 'minute', e.target.value)} disabled={!editMode} sx={{ minWidth: 80 }} aria-label="終了時間（分）">
          {minuteOptions.map((m) => (<MenuItem key={`end-m-${m}`} value={m}>{m}</MenuItem>))}
        </TextField>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Typography>定員</Typography>
        <TextField select value={form.maxMembers} disabled={!editMode} onChange={(e) => handleChange('maxMembers', Number(e.target.value))} sx={{ minWidth: 100 }}>
          {peopleOptions.map((num) => (<MenuItem key={num} value={num}>{num}人</MenuItem>))}
        </TextField>
      </Stack>

      <Autocomplete
        // --- ▼ 複数選択を許可するプロパティ ▼ ---
        multiple
        // --- ▲ ここが重要です ▲ ---
        freeSolo
        options={allMembers}
        value={form.memberNames}
        disabled={!editMode}
        onChange={(event, newValue) => {
          handleChange('memberNames', newValue); // 新しい配列でstateを更新
        }}
        loading={loadingMembers}
        loadingText="メンバー読込中..."
        noOptionsText="該当メンバーなし"
        renderInput={(params) => (
          <TextField
            {...params}
            variant="outlined"
            label="メンバー"
            placeholder="名前を入力 or 選択"
          />
        )}
        sx={{ mb: 2 }}
      />
      
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <Typography>目的</Typography>
        <TextField select value={form.purpose} disabled={!editMode} onChange={(e) => handleChange('purpose', e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="">選択してください</MenuItem>
          <MenuItem value="練習">練習</MenuItem>
          <MenuItem value="試合">試合</MenuItem>
          <MenuItem value="レッスン">レッスン</MenuItem>
        </TextField>
      </Stack>

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