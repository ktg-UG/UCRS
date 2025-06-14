'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';

import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

export default function ReserveNewPage() {
  const router = useRouter();

  // 日付
  const [date, setDate] = useState('2025-05-22'); // 初期値は適宜調整
  // 時間（開始・終了）
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  // 人数
  const [peopleCount, setPeopleCount] = useState(1);
  // メンバー（仮に名前のリストで複数追加できるイメージ）
  const [members, setMembers] = useState<string[]>([]);
  // 目的
  const [purpose, setPurpose] = useState('');

  const peopleOptions = [1, 2, 3, 4, 5, 6];

  // メンバー追加サンプル（簡易）
  const addMember = () => {
    const name = prompt('メンバー名を入力してください');
    if (name) setMembers([...members, name]);
  };

  const handleSubmit = () => {
    // TODO: バリデーションやAPI送信など実装
    alert(`予約日: ${date}\n時間: ${startTime}〜${endTime}\n人数: ${peopleCount}\nメンバー: ${members.join(', ')}\n目的: ${purpose}`);

    // 遷移
    router.push('/');  // 完了後トップなどに戻る例
  };

  return (
    <Box sx={{ maxWidth: 400, margin: 'auto', p: 2 }}>
      <Typography variant="h5" align="center" gutterBottom>
        コート予約
      </Typography>

      {/* 日付 */}
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Typography>日付</Typography>
        <Typography sx={{ flexGrow: 1, textAlign: 'right' }}>{date}</Typography>
        <IconButton onClick={() => alert('カレンダー選択UIはここに実装予定')}>
          <CalendarTodayIcon />
        </IconButton>
      </Stack>

      {/* 時間 */}
      <Stack direction="row" alignItems="center" spacing={1} mb={2}>
        <Typography>時間</Typography>
        <TextField
          type="time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          inputProps={{ step: 300 }}
        />
        <Typography>〜</Typography>
        <TextField
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          inputProps={{ step: 300 }}
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
                bgcolor: 'grey.300',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: 12,
              }}
            >
              {member}
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
      <Button fullWidth variant="contained" onClick={handleSubmit}>
        予約する
      </Button>
    </Box>
  );
}
