'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format } from 'date-fns';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Autocomplete from '@mui/material/Autocomplete';

const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minuteOptions = ['00', '15', '30', '45'];

export default function ReserveForm() {
  const router = useRouter();

  const [date, setDate] = useState<Date | null>(null);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [peopleCount, setPeopleCount] = useState(1);
  // --- ▼メンバーを複数保持するための配列(string[])として定義▼ ---
  const [members, setMembers] = useState<string[]>([]);
  // --- ▲ここまで▲ ---
  const [purpose, setPurpose] = useState('');
  
  const [allMembers, setAllMembers] = useState<string[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const peopleOptions = [1, 2, 3, 4, 5, 6];

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

  const handleTimeChange = (
    setTime: React.Dispatch<React.SetStateAction<string>>,
    currentValue: string,
    part: 'hour' | 'minute',
    value: string
  ) => {
    const [hour, minute] = currentValue.split(':');
    const newTime = part === 'hour' ? `${value}:${minute}` : `${hour}:${value}`;
    setTime(newTime);
  };

  const handleSubmit = async () => {
    if (!date) {
      alert('日付を選択してください。');
      return;
    }

    const res = await fetch('/api/reservation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: format(date, 'yyyy-MM-dd'),
        startTime,
        endTime,
        maxMembers: peopleCount,
        memberNames: members, // 配列を送信
        purpose,
      }),
    });

    if (res.ok) {
      const result = await res.json();
      alert(`予約成功！ID: ${result.id}`);
      router.push('/');
    } else {
      const error = await res.json();
      alert(`予約失敗: ${error.error}`);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <Box sx={{ maxWidth: 400, margin: 'auto', p: 2 }}>
      <Stack direction="row" alignItems="center" mb={2}>
        <IconButton onClick={handleCancel}>
            <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" sx={{ flexGrow: 1, textAlign: 'center' }}>
            コート予約
        </Typography>
        <Box sx={{ width: 40 }} />
      </Stack>

      <Stack direction="row" alignItems="center" spacing={2} mb={2}>
        <Typography>日付</Typography>
        <DatePicker value={date} onChange={(newDate) => setDate(newDate)} minDate={new Date()} format="yyyy/MM/dd" slotProps={{ textField: { fullWidth: true, variant: 'outlined', placeholder: '日付を選択' } }} sx={{ flexGrow: 1 }} />
      </Stack>

      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Typography>時間</Typography>
        <TextField select value={startTime.split(':')[0]} onChange={(e) => handleTimeChange(setStartTime, startTime, 'hour', e.target.value)} sx={{ minWidth: 80 }} aria-label="開始時間（時）">
          {hourOptions.map((h) => (<MenuItem key={`start-h-${h}`} value={h}>{h}</MenuItem>))}
        </TextField>
        <Typography>:</Typography>
        <TextField select value={startTime.split(':')[1]} onChange={(e) => handleTimeChange(setStartTime, startTime, 'minute', e.target.value)} sx={{ minWidth: 80 }} aria-label="開始時間（分）">
          {minuteOptions.map((m) => (<MenuItem key={`start-m-${m}`} value={m}>{m}</MenuItem>))}
        </TextField>
        <Typography>〜</Typography>
        <TextField select value={endTime.split(':')[0]} onChange={(e) => handleTimeChange(setEndTime, endTime, 'hour', e.target.value)} sx={{ minWidth: 80 }} aria-label="終了時間（時）">
          {hourOptions.map((h) => (<MenuItem key={`end-h-${h}`} value={h}>{h}</MenuItem>))}
        </TextField>
        <Typography>:</Typography>
        <TextField select value={endTime.split(':')[1]} onChange={(e) => handleTimeChange(setEndTime, endTime, 'minute', e.target.value)} sx={{ minWidth: 80 }} aria-label="終了時間（分）">
          {minuteOptions.map((m) => (<MenuItem key={`end-m-${m}`} value={m}>{m}</MenuItem>))}
        </TextField>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Typography>人数</Typography>
        <TextField select value={peopleCount} onChange={(e) => setPeopleCount(Number(e.target.value))} sx={{ minWidth: 100 }}>
          {peopleOptions.map((num) => (<MenuItem key={num} value={num}>{num}人</MenuItem>))}
        </TextField>
      </Stack>

      <Autocomplete
        // --- ▼ 複数選択を許可するプロパティ ▼ ---
        multiple
        // --- ▲ ここが重要です ▲ ---
        freeSolo
        options={allMembers}
        value={members}
        onChange={(event, newValue) => {
          setMembers(newValue); // 新しい配列でstateを更新
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
        <TextField select value={purpose} onChange={(e) => setPurpose(e.target.value)} sx={{ minWidth: 150 }}>
          <MenuItem value="">選択してください</MenuItem>
          <MenuItem value="練習">練習</MenuItem>
          <MenuItem value="試合">試合</MenuItem>
          <MenuItem value="レッスン">レッスン</MenuItem>
        </TextField>
      </Stack>

      <Stack spacing={2}>
        <Button fullWidth variant="contained" onClick={handleSubmit} disabled={!date}>
          予約する
        </Button>
        <Button fullWidth variant="outlined" onClick={handleCancel}>
            キャンセル
        </Button>
      </Stack>
    </Box>
  );
}