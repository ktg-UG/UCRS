'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import IconButton from '@mui/material/IconButton';

export default function ReserveDetailPage() {
  const router = useRouter();
  const pathname = usePathname();
  const id = pathname.split('/').pop();

  const [detail, setDetail] = useState<any>(null);
  const [editMode, setEditMode] = useState(false);

  // 編集用フォーム状態
  const [form, setForm] = useState({
    time: '',
    members: 0,
    capacity: 0,
    owner: '',
    purpose: '',
  });

  useEffect(() => {
    // TODO: API取得（ここはモック）
    setDetail({
      id,
      time: '12:30〜15:30',
      members: 3,
      capacity: 4,
      owner: 'ゆうじ',
      purpose: '練習',
    });
  }, [id]);

  useEffect(() => {
    if (detail) {
      setForm({
        time: detail.time,
        members: detail.members,
        capacity: detail.capacity,
        owner: detail.owner,
        purpose: detail.purpose,
      });
    }
  }, [detail]);

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // TODO: API更新処理
    setDetail((prev: any) => ({ ...prev, ...form }));
    setEditMode(false);
  };

  const handleDelete = () => {
    // TODO: API削除処理
    alert('募集を削除しました');
    router.push('/'); // 削除後トップに戻る例
  };

  // 戻る処理
  const handleBack = () => {
    router.back(); // 1つ前の履歴に戻る
  };

  if (!detail) return <Typography>読み込み中...</Typography>;

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', p: 2 }}>
         <IconButton onClick={handleBack} sx={{ mb: 2 }}>
        <ArrowBackIcon />
      </IconButton>

      <Typography variant="h5" gutterBottom>
        募集詳細
      </Typography>

      <Stack spacing={2}>
        {/* 時間 */}
        <TextField
          label="時間"
          value={form.time}
          disabled={!editMode}
          onChange={(e) => handleChange('time', e.target.value)}
        />

        {/* 参加人数 */}
        <TextField
          label="参加人数"
          type="number"
          value={form.members}
          disabled={!editMode}
          onChange={(e) => handleChange('members', Number(e.target.value))}
        />

        {/* 定員 */}
        <TextField
          label="定員"
          type="number"
          value={form.capacity}
          disabled={!editMode}
          onChange={(e) => handleChange('capacity', Number(e.target.value))}
        />

        {/* オーナー */}
        <TextField
          label="オーナー"
          value={form.owner}
          disabled={!editMode}
          onChange={(e) => handleChange('owner', e.target.value)}
        />

        {/* 目的 */}
        <TextField
          label="目的"
          value={form.purpose}
          disabled={!editMode}
          onChange={(e) => handleChange('purpose', e.target.value)}
        />

        {/* ボタン群 */}
        {!editMode ? (
          <Button variant="contained" onClick={() => setEditMode(true)}>
            編集
          </Button>
        ) : (
          <>
            <Button variant="contained" color="primary" onClick={handleSave}>
              保存
            </Button>
            <Button variant="outlined" color="secondary" onClick={() => setEditMode(false)}>
              キャンセル
            </Button>
          </>
        )}

        <Button variant="contained" color="error" onClick={handleDelete}>
          削除
        </Button>
      </Stack>
    </Box>
  );
}
