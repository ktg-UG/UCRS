'use client';

import React, { useState, useEffect } from 'react';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Stack, TextField, Typography, MenuItem, Box, Autocomplete, FormGroup, FormControlLabel, Switch, IconButton, List, ListItem, ListItemText } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export type ReservationFormData = {
  date: Date | null;
  startTime: string;
  endTime: string;
  maxMembers: number;
  memberNames: string[];
  purpose: string;
  lineNotify?: boolean;
};

type Props = {
  formData: ReservationFormData;
  setFormData: React.Dispatch<React.SetStateAction<ReservationFormData>>;
  isPrivate: boolean;
  setIsPrivate?: React.Dispatch<React.SetStateAction<boolean>>;
  disabled?: boolean;
  isEditMode?: boolean;
};

const hourOptions = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const minuteOptions = ['00', '15', '30', '45'];
const peopleOptions = [1, 2, 3, 4, 5, 6];

export default function ReservationForm({ formData, setFormData, isPrivate, setIsPrivate, disabled = false, isEditMode = false }: Props) {
  const [allMembers, setAllMembers] = useState<string[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

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

  const handleChange = (field: keyof ReservationFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTimeChange = (
    timeField: 'startTime' | 'endTime',
    part: 'hour' | 'minute',
    value: string
  ) => {
    const currentTime = formData?.[timeField] || '00:00';
    const [hour, minute] = currentTime.split(':');
    const newTime = part === 'hour' ? `${value}:${minute}` : `${hour}:${value}`;
    handleChange(timeField, newTime);
  };

  const handleRemoveMember = (memberNameToRemove: string) => {
    if (window.confirm(`「${memberNameToRemove}」さんをメンバーから削除しますか？`)) {
      const updatedMembers = formData.memberNames.filter(name => name !== memberNameToRemove);
      handleChange('memberNames', updatedMembers);
    }
  };

  return (
    <Stack spacing={3}>
      {!isEditMode && setIsPrivate && (<FormGroup><FormControlLabel control={<Switch checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} />} label={isPrivate ? "プライベート予約" : "メンバー募集"} /></FormGroup>)}
      {!isPrivate && !isEditMode && (<FormGroup><FormControlLabel control={<Switch checked={formData.lineNotify || false} onChange={(e) => { handleChange('lineNotify', e.target.checked);}} disabled={disabled}/>} label="LINEグループに募集を通知"/></FormGroup>)}
      <Stack direction="row" alignItems="center" spacing={2}><Typography sx={{ minWidth: 60 }}>日付</Typography><DatePicker value={formData.date} onChange={(newDate) => handleChange('date', newDate)} minDate={new Date()} format="yyyy/MM/dd" disabled={isEditMode || disabled} slotProps={{ textField: { fullWidth: true, variant: 'outlined', placeholder: '日付を選択' } }} sx={{ flexGrow: 1 }}/></Stack>
      <Stack direction="row" alignItems="center" spacing={1}><Typography sx={{ minWidth: 60 }}>開始時刻</Typography><TextField select disabled={disabled} value={formData.startTime.split(':')[0]} onChange={(e) => handleTimeChange('startTime', 'hour', e.target.value)} sx={{ flexGrow: 1 }} aria-label="開始時間（時）">{hourOptions.map((h) => (<MenuItem key={`start-h-${h}`} value={h}>{h}</MenuItem>))}</TextField><Typography variant="h6">:</Typography><TextField select disabled={disabled} value={formData.startTime.split(':')[1]} onChange={(e) => handleTimeChange('startTime', 'minute', e.target.value)} sx={{ flexGrow: 1 }} aria-label="開始時間（分）">{minuteOptions.map((m) => (<MenuItem key={`start-m-${m}`} value={m}>{m}</MenuItem>))}</TextField></Stack>
      <Stack direction="row" alignItems="center" spacing={1}><Typography sx={{ minWidth: 60 }}>終了時刻</Typography><TextField select disabled={disabled} value={formData.endTime.split(':')[0]} onChange={(e) => handleTimeChange('endTime', 'hour', e.target.value)} sx={{ flexGrow: 1 }} aria-label="終了時間（時）">{hourOptions.map((h) => (<MenuItem key={`end-h-${h}`} value={h}>{h}</MenuItem>))}</TextField><Typography variant="h6">:</Typography><TextField select disabled={disabled} value={formData.endTime.split(':')[1]} onChange={(e) => handleTimeChange('endTime', 'minute', e.target.value)} sx={{ flexGrow: 1 }} aria-label="終了時間（分）">{minuteOptions.map((m) => (<MenuItem key={`end-m-${m}`} value={m}>{m}</MenuItem>))}</TextField></Stack>
      
      {isPrivate ? (
        <Stack direction="row" alignItems="center" spacing={1}><Typography sx={{ minWidth: 60 }}>代表者</Typography><TextField fullWidth label="代表者名" value={formData.memberNames?.[0] || ''} disabled={disabled} onChange={(e) => handleChange('memberNames', [e.target.value])}/></Stack>
      ) : (
        <>
          <Stack direction="row" alignItems="center" spacing={1}><Typography sx={{ minWidth: 60 }}>定員</Typography><TextField select disabled={disabled} value={formData.maxMembers} onChange={(e) => handleChange('maxMembers', Number(e.target.value))} sx={{ minWidth: 100 }}>{peopleOptions.map((num) => (<MenuItem key={num} value={num}>{num}人</MenuItem>))}</TextField></Stack>
          
          <Autocomplete
            multiple
            options={allMembers.filter(name => !formData.memberNames.includes(name))}
            disabled={disabled}
            value={formData.memberNames}
            onChange={(event, newValue) => {
              handleChange('memberNames', newValue);
            }}
            loading={loadingMembers}
            loadingText="メンバー読込中..."
            noOptionsText="選択できるメンバーがいません"
            renderInput={(params) => (
              <TextField {...params} variant="outlined" label="参加メンバーを追加" placeholder="リストから選択" />
            )}
            // ★★★ この一行を追加 ★★★
            renderTags={() => null} 
          />
          
          {formData.memberNames.length > 0 && (
            <Box sx={{ border: '1px solid #ccc', borderRadius: '4px', p: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>参加予定メンバー:</Typography>
              <List dense>
                {formData.memberNames.map((name, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      !disabled && (
                        <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveMember(name)}>
                          <CloseIcon />
                        </IconButton>
                      )
                    }
                  >
                    <ListItemText primary={name} />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          <Stack direction="row" alignItems="center" spacing={1}><Typography sx={{ minWidth: 60 }}>目的</Typography><TextField select disabled={disabled} value={formData.purpose} onChange={(e) => handleChange('purpose', e.target.value)} sx={{ minWidth: 150 }}><MenuItem value="練習">練習</MenuItem><MenuItem value="試合">試合</MenuItem><MenuItem value="レッスン">レッスン</MenuItem></TextField></Stack>
        </>
      )}
    </Stack>
  );
}