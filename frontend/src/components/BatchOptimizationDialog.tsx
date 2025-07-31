import React from 'react';
import { Dialog, DialogTitle, DialogContent, Button } from '@mui/material';

interface BatchOptimizationDialogProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const BatchOptimizationDialog: React.FC<BatchOptimizationDialogProps> = ({
  open,
  onClose,
  onComplete,
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Batch Optimization</DialogTitle>
      <DialogContent>
        <p>Batch optimization dialog - to be implemented</p>
        <Button onClick={onComplete}>Complete</Button>
      </DialogContent>
    </Dialog>
  );
};

export default BatchOptimizationDialog; 