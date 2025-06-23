import { Suspense } from 'react';
import ReserveForm from './ReserveForm';
import { Box, CircularProgress, Typography } from '@mui/material';

// フォームが読み込まれるまでの待機中に表示するコンポーネント
const LoadingFallback = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
    <CircularProgress />
    <Typography sx={{ ml: 2 }}>読み込み中...</Typography>
  </Box>
);

export default function ReserveNewPage() {
  return (
    // Suspenseでラップし、fallbackに待機中のUIを指定
    <Suspense fallback={<LoadingFallback />}>
      <ReserveForm />
    </Suspense>
  );
}