'use client';

// 元の page.tsx にあったコードをここに移動します
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';

// ★関数名を ReserveForm に変更
export default function ReserveForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [peopleCount, setPeopleCount] = useState(1);
  const [members, setMembers] = useState<string[]>([]);
  const [purpose, setPurpose] = useState('');

  const peopleOptions = [1, 2, 3, 4, 5, 6];

  useEffect(() => {
    const selectedDate = searchParams.get('date');
    if (selectedDate) {
      setDate(selectedDate);
    }
  }, [searchParams]);

  const addMember = () => {
    const name = prompt('メンバー名を入力してください');
    if (name) setMembers([...members, name]);
  };

  const removeMember = (index: number) => {
    const newMembers = members.filter((_, idx) => idx !== index);
    setMembers(newMembers);
  };

  const handleSubmit = async () => {
    const res = await fetch('/api/reservation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        startTime,
        endTime,
        maxMembers: peopleCount,
        memberNames: members,
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
      <Typography variant="h5" align="center" gutterBottom>
        コート予約
      </Typography>

      {/* 日付 */}
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Typography>日付: {date}</Typography>
      </Stack>

      {/* 時間 */}
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Typography>時間</Typography>
        <TextField
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          inputProps={{ step: 900 }} // 15分単位
        />
        <Typography>〜</Typography>
        <TextField
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          inputProps={{ step: 900 }} // 15分単位
        />
      </Stack>

      {/* 人数 */}
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Typography>人数</Typography>
        <TextField
          select
          value={peopleCount}
          onChange={(e) => setPeopleCount(Number(e.target.value))}
          sx={{ minWidth: 100 }}
        >
          {peopleOptions.map((num) => (
            <MenuItem key={num} value={num}>
              {num}人
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {/* メンバー */}
      <Box mb={2}>
        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
          <Typography>メンバー</Typography>
          <Button size="small" variant="outlined" onClick={addMember}>＋</Button>
        </Stack>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {members.map((member, idx) => (
            <Box
              key={idx}
              sx={{
                display: 'flex',
                alignItems: 'center',
                bgcolor: 'grey.300',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: 12,
              }}
            >
              {member}
              <IconButton
                size="small"
                onClick={() => removeMember(idx)}
                sx={{ ml: 1, fontSize: 12 }}
              >
                ×
              </IconButton>
            </Box>
          ))}
        </Box>
      </Box>

      {/* 目的 */}
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <Typography>目的</Typography>
        <TextField
          select
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">選択してください</MenuItem>
          <MenuItem value="練習">練習</MenuItem>
          <MenuItem value="試合">試合</MenuItem>
          <MenuItem value="レッスン">レッスン</MenuItem>
        </TextField>
      </Stack>

      {/* 予約ボタン */}
      <Stack spacing={2}>
        <Button fullWidth variant="contained" onClick={handleSubmit}>
          予約する
        </Button>
        <Button fullWidth variant="outlined" onClick={handleCancel}>
            キャンセル
        </Button>
      </Stack>
    </Box>
  );
}