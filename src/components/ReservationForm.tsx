// src/components/ReservationForm.tsx
"use client";

import React, { useState, useEffect } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  Stack,
  TextField,
  Typography,
  MenuItem,
  Box,
  Autocomplete,
  FormGroup,
  FormControlLabel,
  Switch,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

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
  reservationType: string;
  setReservationType?: (value: string) => void;
  disabled?: boolean;
  isEditMode?: boolean;
};

const hourOptions = Array.from({ length: 24 }, (_, i) =>
  String(i).padStart(2, "0")
);
const minuteOptions = ["00", "15", "30", "45"];
// ★ 定員の選択肢を定義（「ボールのみ予約」で利用する1人も追加）
const peopleOptions = ["定員なし", "1人", "2人", "3人", "4人", "5人", "6人"];

export default function ReservationForm({
  formData,
  setFormData,
  reservationType,
  setReservationType,
  disabled = false,
  isEditMode = false,
}: Props) {
  const [allMembers, setAllMembers] = useState<string[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    const fetchMembers = async () => {
      setLoadingMembers(true);
      try {
        const res = await fetch("/api/members");
        if (!res.ok) throw new Error("メンバーの取得に失敗しました");
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

  const handleReservationTypeChange = (
    event: React.MouseEvent<HTMLElement>,
    newType: string | null
  ) => {
    if (newType !== null && setReservationType) {
      setReservationType(newType);
    }
  };

  const handleChange = (field: keyof ReservationFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ★ 定員の選択肢（文字列）を数値に変換してstateを更新する関数
  const handleMaxMembersChange = (value: string) => {
    if (value === "定員なし") {
      handleChange("maxMembers", 99); // 定員なしは99として扱う
    } else {
      handleChange("maxMembers", parseInt(value, 10));
    }
  };

  // ★ 定員の数値（state）を表示用の文字列に変換する関数
  const getMaxMembersLabel = (value: number): string => {
    if (value === 99) {
      return "定員なし";
    }
    return `${value}人`;
  };

  const handleTimeChange = (
    timeField: "startTime" | "endTime",
    part: "hour" | "minute",
    value: string
  ) => {
    const currentTime = formData?.[timeField] || "00:00";
    const [hour, minute] = currentTime.split(":");
    const newTime = part === "hour" ? `${value}:${minute}` : `${hour}:${value}`;
    handleChange(timeField, newTime);
  };

  const handleRemoveMember = (memberNameToRemove: string) => {
    if (
      window.confirm(
        `「${memberNameToRemove}」さんをメンバーから削除しますか？`
      )
    ) {
      const updatedMembers = formData.memberNames.filter(
        (name) => name !== memberNameToRemove
      );
      handleChange("memberNames", updatedMembers);
    }
  };

  return (
    <Stack spacing={3}>
      {!isEditMode && setReservationType && (
        <ToggleButtonGroup
          color="primary"
          value={reservationType}
          exclusive
          onChange={handleReservationTypeChange}
          aria-label="予約タイプ"
          fullWidth
        >
          <ToggleButton value="メンバー募集">メンバー募集</ToggleButton>
          <ToggleButton value="ボールのみ予約">ボールのみ予約</ToggleButton>
        </ToggleButtonGroup>
      )}

      {reservationType === "メンバー募集" && !isEditMode && (
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={formData.lineNotify || false}
                onChange={(e) => {
                  handleChange("lineNotify", e.target.checked);
                }}
                disabled={disabled}
              />
            }
            label="LINEグループに募集を通知"
          />
        </FormGroup>
      )}
      <Stack direction="row" alignItems="center" spacing={2}>
        <Typography sx={{ minWidth: 60 }}>日付</Typography>
        <DatePicker
          value={formData.date}
          onChange={(newDate) => handleChange("date", newDate)}
          minDate={new Date()}
          format="yyyy/MM/dd"
          disabled={isEditMode || disabled}
          slotProps={{
            textField: {
              fullWidth: true,
              variant: "outlined",
              placeholder: "日付を選択",
            },
          }}
          sx={{ flexGrow: 1 }}
        />
      </Stack>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography sx={{ minWidth: 60 }}>開始時刻</Typography>
        <TextField
          select
          disabled={disabled}
          value={formData.startTime.split(":")[0]}
          onChange={(e) =>
            handleTimeChange("startTime", "hour", e.target.value)
          }
          sx={{ flexGrow: 1 }}
          aria-label="開始時間（時）"
        >
          {hourOptions.map((h) => (
            <MenuItem key={`start-h-${h}`} value={h}>
              {h}
            </MenuItem>
          ))}
        </TextField>
        <Typography variant="h6">:</Typography>
        <TextField
          select
          disabled={disabled}
          value={formData.startTime.split(":")[1]}
          onChange={(e) =>
            handleTimeChange("startTime", "minute", e.target.value)
          }
          sx={{ flexGrow: 1 }}
          aria-label="開始時間（分）"
        >
          {minuteOptions.map((m) => (
            <MenuItem key={`start-m-${m}`} value={m}>
              {m}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      <Stack direction="row" alignItems="center" spacing={1}>
        <Typography sx={{ minWidth: 60 }}>終了時刻</Typography>
        <TextField
          select
          disabled={disabled}
          value={formData.endTime.split(":")[0]}
          onChange={(e) => handleTimeChange("endTime", "hour", e.target.value)}
          sx={{ flexGrow: 1 }}
          aria-label="終了時間（時）"
        >
          {hourOptions.map((h) => (
            <MenuItem key={`end-h-${h}`} value={h}>
              {h}
            </MenuItem>
          ))}
        </TextField>
        <Typography variant="h6">:</Typography>
        <TextField
          select
          disabled={disabled}
          value={formData.endTime.split(":")[1]}
          onChange={(e) =>
            handleTimeChange("endTime", "minute", e.target.value)
          }
          sx={{ flexGrow: 1 }}
          aria-label="終了時間（分）"
        >
          {minuteOptions.map((m) => (
            <MenuItem key={`end-m-${m}`} value={m}>
              {m}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {reservationType === "ボールのみ予約" ? (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography sx={{ minWidth: 60 }}>代表者</Typography>
          <TextField
            fullWidth
            label="代表者名"
            value={formData.memberNames?.[0] || ""}
            disabled={disabled}
            onChange={(e) => handleChange("memberNames", [e.target.value])}
          />
        </Stack>
      ) : (
        <>
          {/* ★★★ 定員選択部分のロジックを修正 ★★★ */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ minWidth: 60 }}>定員</Typography>
            <TextField
              select
              disabled={disabled}
              value={getMaxMembersLabel(formData.maxMembers)}
              onChange={(e) => handleMaxMembersChange(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              {peopleOptions.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
          {/* ★★★ ここまで修正 ★★★ */}

          <Autocomplete
            multiple
            options={allMembers.filter(
              (name) => !formData.memberNames.includes(name)
            )}
            disabled={disabled}
            value={formData.memberNames}
            onChange={(event, newValue) => {
              handleChange("memberNames", newValue);
            }}
            loading={loadingMembers}
            loadingText="メンバー読込中..."
            noOptionsText="選択できるメンバーがいません"
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="参加メンバーを追加"
                placeholder="リストから選択"
              />
            )}
            renderTags={() => null}
          />

          {formData.memberNames.length > 0 && (
            <Box sx={{ border: "1px solid #ccc", borderRadius: "4px", p: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                参加予定メンバー:
              </Typography>
              <List dense>
                {formData.memberNames.map((name, index) => (
                  <ListItem
                    key={index}
                    secondaryAction={
                      !disabled && (
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => handleRemoveMember(name)}
                        >
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

          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography sx={{ minWidth: 60 }}>目的</Typography>
            <TextField
              select
              disabled={disabled}
              value={formData.purpose}
              onChange={(e) => handleChange("purpose", e.target.value)}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="練習">練習</MenuItem>
              <MenuItem value="試合">試合</MenuItem>
            </TextField>
          </Stack>
        </>
      )}
    </Stack>
  );
}
