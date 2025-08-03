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
  } = usePropertySelection();

  // Debug logging
  React.useEffect(() => {
    console.log('🏠 PropertySelector - All properties:', allProperties);
    console.log('✅ PropertySelector - Selected properties:', selectedProperties);
  }, [allProperties, selectedProperties]);

  const handleSelectAllToggle = () => {
    if (isAllSelected) {
      deselectAll();
    } else {
      selectAll();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
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
          <Chip
            label={`${selectedProperties.length} of ${allProperties.length} selected`}
            size="small"
            sx={{
              backgroundColor: 'rgba(1, 209, 209, 0.1)',
              color: '#01D1D1',
              border: '1px solid rgba(1, 209, 209, 0.3)',
            }}
          />
        </Box>
        <IconButton
          onClick={onClose}
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
            onClick={selectAll}
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
              onClick={() => toggleProperty(property)}
            >
              <ListItemIcon>
                <Checkbox
                  checked={isPropertySelected(property)}
                  onChange={() => toggleProperty(property)}
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
          {selectedProperties.length > 0
            ? `Analysis will include ${selectedProperties.length} propert${selectedProperties.length === 1 ? 'y' : 'ies'}`
            : 'No properties selected - analysis will be empty'
          }
        </Typography>
        <Button
          onClick={onClose}
          variant="contained"
          sx={{
            backgroundColor: '#01D1D1',
            color: '#0F1419',
            fontWeight: 600,
            px: 3,
            '&:hover': {
              backgroundColor: '#00B5B5',
            },
          }}
        >
          Apply Selection
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PropertySelector; 