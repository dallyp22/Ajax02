import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Close as CloseIcon,
  SelectAll as SelectAllIcon,
  Clear as DeselectAllIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { usePropertySelection } from '../contexts/PropertySelectionContext';

interface PropertySelectorProps {
  open: boolean;
  onClose: () => void;
}

const PropertySelector: React.FC<PropertySelectorProps> = ({ open, onClose }) => {
  const {
    selectedProperties,
    allProperties,
    isAllSelected,
    toggleProperty,
    selectAll,
    deselectAll,
    isPropertySelected,
    pendingProperties,
    applyPendingChanges,
    hasPendingChanges,
    resetPendingChanges,
  } = usePropertySelection();

  // Track modal open state changes for debugging
  React.useEffect(() => {
    if (open) {
      console.log('🔄 PropertySelector modal opened');
    } else {
      console.log('❌ PropertySelector modal closed');
    }
  }, [open]);

  // Debug logging
  React.useEffect(() => {
    console.log('🏠 PropertySelector - All properties:', allProperties);
    console.log('✅ PropertySelector - Selected properties:', selectedProperties);
    console.log('⏳ PropertySelector - Pending properties:', pendingProperties);
  }, [allProperties, selectedProperties, pendingProperties]);

  // Prevent closing during property changes by using a ref
  const isProcessingChange = React.useRef(false);

  const handleToggleProperty = (property: string) => {
    isProcessingChange.current = true;
    console.log('🔄 Toggling property:', property);
    toggleProperty(property);
    
    // Reset the flag after a small delay
    setTimeout(() => {
      isProcessingChange.current = false;
    }, 100);
  };

  const handleSelectAllToggle = () => {
    isProcessingChange.current = true;
    console.log('🔄 Toggle select all, current state:', isAllSelected);
    if (isAllSelected) {
      deselectAll();
    } else {
      selectAll();
    }
    
    setTimeout(() => {
      isProcessingChange.current = false;
    }, 100);
  };

  const handleApplyChanges = () => {
    console.log('✅ Applying property changes');
    applyPendingChanges();
    onClose();
  };

  const handleCancelChanges = () => {
    console.log('❌ Cancelling property changes');
    resetPendingChanges();
    onClose();
  };

  // Override onClose to prevent accidental closing during property changes
  const handleClose = () => {
    if (isProcessingChange.current) {
      console.log('⚠️ Prevented modal close during property change');
      return;
    }
    onClose();
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          background: 'linear-gradient(135deg, #0F1419 0%, #1A1F25 100%)',
          border: '1px solid rgba(1, 209, 209, 0.3)',
          borderRadius: '12px',
          backdropFilter: 'blur(10px)',
        }
      }}
    >
      <DialogTitle
        sx={{
          background: 'linear-gradient(135deg, rgba(1, 209, 209, 0.1) 0%, rgba(1, 209, 209, 0.05) 100%)',
          borderBottom: '1px solid rgba(1, 209, 209, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#01D1D1',
          fontWeight: 600,
        }}
      >
        <Box display="flex" alignItems="center" gap={2}>
          <BusinessIcon />
          <Typography variant="h6" component="span" sx={{ color: '#01D1D1', fontWeight: 600 }}>
            Property Selection
          </Typography>
          <Box display="flex" gap={1}>
            <Chip
              label={`${pendingProperties.length} selected`}
              size="small"
              sx={{
                backgroundColor: hasPendingChanges ? 'rgba(244, 162, 97, 0.2)' : 'rgba(1, 209, 209, 0.1)',
                color: hasPendingChanges ? '#F4A261' : '#01D1D1',
                border: hasPendingChanges ? '1px solid rgba(244, 162, 97, 0.3)' : '1px solid rgba(1, 209, 209, 0.3)',
              }}
            />
            {hasPendingChanges && (
              <Chip
                label="unsaved"
                size="small"
                sx={{
                  backgroundColor: 'rgba(244, 162, 97, 0.1)',
                  color: '#F4A261',
                  border: '1px solid rgba(244, 162, 97, 0.3)',
                  fontSize: '0.65rem',
                }}
              />
            )}
          </Box>
        </Box>
        <IconButton
          onClick={handleClose}
          sx={{
            color: '#888',
            '&:hover': {
              color: '#01D1D1',
              backgroundColor: 'rgba(1, 209, 209, 0.1)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, backgroundColor: '#0F1419' }}>
        {/* Bulk Actions */}
        <Box
          sx={{
            p: 2,
            borderBottom: '1px solid rgba(1, 209, 209, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            backgroundColor: 'rgba(1, 209, 209, 0.02)',
          }}
        >
          <Typography variant="body2" sx={{ color: '#888', flexGrow: 1 }}>
            Select properties to include in your analysis across all pages
          </Typography>
          <Button
            startIcon={<SelectAllIcon />}
            onClick={handleSelectAllToggle}
            disabled={isAllSelected}
            sx={{
              color: '#01D1D1',
              borderColor: 'rgba(1, 209, 209, 0.3)',
              '&:hover': {
                borderColor: '#01D1D1',
                backgroundColor: 'rgba(1, 209, 209, 0.1)',
              },
            }}
            variant="outlined"
            size="small"
          >
            Select All
          </Button>
          <Button
            startIcon={<DeselectAllIcon />}
            onClick={deselectAll}
            disabled={selectedProperties.length === 0}
            sx={{
              color: '#888',
              borderColor: 'rgba(136, 136, 136, 0.3)',
              '&:hover': {
                borderColor: '#888',
                backgroundColor: 'rgba(136, 136, 136, 0.1)',
              },
              '&:disabled': {
                borderColor: 'rgba(136, 136, 136, 0.1)',
                color: 'rgba(136, 136, 136, 0.3)',
              },
            }}
            variant="outlined"
            size="small"
          >
            Clear All
          </Button>
        </Box>

        {/* Property List */}
        <List sx={{ maxHeight: '400px', overflow: 'auto' }}>
          {allProperties.map((property, index) => (
            <ListItem
              key={property}
              sx={{
                borderBottom: index < allProperties.length - 1 ? '1px solid rgba(1, 209, 209, 0.05)' : 'none',
                '&:hover': {
                  backgroundColor: 'rgba(1, 209, 209, 0.05)',
                },
                cursor: 'pointer',
              }}
              onClick={() => handleToggleProperty(property)}
            >
              <ListItemIcon>
                <Checkbox
                  checked={isPropertySelected(property)}
                  onChange={() => handleToggleProperty(property)}
                  sx={{
                    color: 'rgba(1, 209, 209, 0.5)',
                    '&.Mui-checked': {
                      color: '#01D1D1',
                    },
                    '&:hover': {
                      backgroundColor: 'rgba(1, 209, 209, 0.1)',
                    },
                  }}
                />
              </ListItemIcon>
              <ListItemText
                primary={property}
                sx={{
                  '& .MuiListItemText-primary': {
                    color: isPropertySelected(property) ? '#01D1D1' : '#ccc',
                    fontWeight: isPropertySelected(property) ? 500 : 400,
                    transition: 'color 0.2s ease',
                  },
                }}
              />
            </ListItem>
          ))}
        </List>

        {allProperties.length === 0 && (
          <Box
            sx={{
              p: 4,
              textAlign: 'center',
              color: '#888',
            }}
          >
            <BusinessIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="body1" sx={{ mb: 1 }}>
              No properties available
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Properties will appear here once data is loaded
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          borderTop: '1px solid rgba(1, 209, 209, 0.1)',
          backgroundColor: 'rgba(1, 209, 209, 0.02)',
          gap: 2,
        }}
      >
        <Typography variant="body2" sx={{ color: '#888', flexGrow: 1 }}>
          {pendingProperties.length > 0
            ? `Analysis will include ${pendingProperties.length} propert${pendingProperties.length === 1 ? 'y' : 'ies'}`
            : 'No properties selected - analysis will be empty'
          }
          {hasPendingChanges && (
            <span style={{ color: '#F4A261', fontWeight: 500 }}> • Changes pending</span>
          )}
        </Typography>
        <Button
          onClick={handleCancelChanges}
          variant="outlined"
          sx={{
            color: '#888',
            borderColor: 'rgba(136, 136, 136, 0.3)',
            fontWeight: 500,
            px: 2,
            '&:hover': {
              borderColor: '#888',
              backgroundColor: 'rgba(136, 136, 136, 0.1)',
            },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleApplyChanges}
          variant="contained"
          disabled={!hasPendingChanges}
          sx={{
            backgroundColor: hasPendingChanges ? '#01D1D1' : 'rgba(1, 209, 209, 0.3)',
            color: '#0F1419',
            fontWeight: 600,
            px: 3,
            '&:hover': {
              backgroundColor: hasPendingChanges ? '#00B5B5' : 'rgba(1, 209, 209, 0.3)',
            },
            '&:disabled': {
              backgroundColor: 'rgba(1, 209, 209, 0.1)',
              color: 'rgba(0, 0, 0, 0.3)',
            },
          }}
        >
          {hasPendingChanges ? 'Apply Changes' : 'No Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PropertySelector; 