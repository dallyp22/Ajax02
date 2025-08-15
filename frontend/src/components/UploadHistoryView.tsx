import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Button,
  TextField,
  MenuItem,
  Stack,
  Card,
  CardContent,
  LinearProgress,
  Alert,
  Collapse,
  Grid,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { usePropertySelection } from '@/contexts/PropertySelectionContext';
import uploadService from '../services/uploadService';

interface UploadRecord {
  upload_id: string;
  property_id: string;
  user_id: string;
  file_type: 'rent_roll' | 'competition';
  original_filename: string;
  upload_date: string;
  data_month: string;
  row_count: number;
  validation_status: string;
  processing_status: string;
  quality_score?: number;
  validation_warnings?: string[];
  validation_errors?: string[];
  processing_error?: string;
  created_at: string;
}

const UploadHistoryView: React.FC = () => {
  const [filterFileType, setFilterFileType] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const { selectedProperties } = usePropertySelection();

  const { data: uploadsData, isLoading, error, refetch } = useQuery({
    queryKey: ['upload-history', selectedProperties, filterFileType],
    queryFn: () => uploadService.getUploadHistory({
      propertyId: selectedProperties.length > 0 ? selectedProperties[0] : undefined,
      fileType: filterFileType === 'all' ? undefined : filterFileType,
      limit: 50,
    }),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const handleExpandRow = (uploadId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(uploadId)) {
      newExpanded.delete(uploadId);
    } else {
      newExpanded.add(uploadId);
    }
    setExpandedRows(newExpanded);
  };

  const getStatusIcon = (status: string, hasErrors: boolean) => {
    if (hasErrors) return <ErrorIcon sx={{ color: '#f44336', fontSize: 20 }} />;
    
    switch (status) {
      case 'completed':
        return <CheckCircle sx={{ color: '#4CAF50', fontSize: 20 }} />;
      case 'processing':
        return <ScheduleIcon sx={{ color: '#ff9800', fontSize: 20 }} />;
      case 'failed':
        return <ErrorIcon sx={{ color: '#f44336', fontSize: 20 }} />;
      default:
        return <ScheduleIcon sx={{ color: '#2196f3', fontSize: 20 }} />;
    }
  };

  const getStatusColor = (status: string, hasErrors: boolean) => {
    if (hasErrors) return 'error';
    
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'info';
    }
  };

  const getQualityColor = (score?: number) => {
    if (!score) return 'default';
    if (score >= 0.8) return 'success';
    if (score >= 0.6) return 'warning';
    return 'error';
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return dateString;
    }
  };

  const formatDataMonth = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM yyyy');
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 2 }}>
          Loading upload history...
        </Typography>
        <LinearProgress 
          sx={{
            background: 'rgba(1, 209, 209, 0.2)',
            '& .MuiLinearProgress-bar': {
              background: 'linear-gradient(90deg, #01D1D1, #2A9D8F)',
            },
          }}
        />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        Failed to load upload history. Please try again.
      </Alert>
    );
  }

  const uploads = uploadsData?.uploads || [];

  return (
    <Box>
      {/* Filters and Stats */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            select
            size="small"
            value={filterFileType}
            onChange={(e) => setFilterFileType(e.target.value)}
            sx={{
              minWidth: 150,
              '& .MuiOutlinedInput-root': {
                background: 'rgba(1, 209, 209, 0.1)',
                '& fieldset': {
                  borderColor: 'rgba(1, 209, 209, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(1, 209, 209, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#01D1D1',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'rgba(255, 255, 255, 0.7)',
              },
              '& .MuiSelect-root': {
                color: 'rgba(255, 255, 255, 0.9)',
              },
            }}
            label="File Type"
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="rent_roll">Rent Roll</MenuItem>
            <MenuItem value="competition">Competition</MenuItem>
          </TextField>

          <Tooltip title="Refresh">
            <IconButton
              onClick={() => refetch()}
              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          {uploads.length} upload{uploads.length !== 1 ? 's' : ''} found
        </Typography>
      </Box>

      {/* Quick Stats */}
      {uploads.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'rgba(76, 175, 80, 0.1)', border: '1px solid rgba(76, 175, 80, 0.3)' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Successful Uploads
                </Typography>
                <Typography variant="h6" sx={{ color: '#4CAF50' }}>
                  {uploads.filter(u => u.processing_status === 'completed' && !u.processing_error).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'rgba(1, 209, 209, 0.1)', border: '1px solid rgba(1, 209, 209, 0.3)' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Total Rows
                </Typography>
                <Typography variant="h6" sx={{ color: '#01D1D1' }}>
                  {uploads.reduce((sum, u) => sum + (u.row_count || 0), 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'rgba(42, 157, 143, 0.1)', border: '1px solid rgba(42, 157, 143, 0.3)' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Avg. Quality
                </Typography>
                <Typography variant="h6" sx={{ color: '#2A9D8F' }}>
                  {uploads.filter(u => u.quality_score).length > 0
                    ? Math.round(uploads.filter(u => u.quality_score).reduce((sum, u) => sum + (u.quality_score || 0), 0) / uploads.filter(u => u.quality_score).length * 100)
                    : 0}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ background: 'rgba(255, 193, 7, 0.1)', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  With Warnings
                </Typography>
                <Typography variant="h6" sx={{ color: '#FFC107' }}>
                  {uploads.filter(u => u.validation_warnings && u.validation_warnings.length > 0).length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Upload History Table */}
      {uploads.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <AssessmentIcon sx={{ fontSize: 64, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.6)', mb: 1 }}>
            No upload history found
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
            {selectedProperties.length === 0 
              ? 'Select a property to view its upload history'
              : 'Upload your first file to see history here'
            }
          </Typography>
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            background: 'rgba(42, 42, 48, 0.6)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(1, 209, 209, 0.2)',
            borderRadius: '12px',
            maxHeight: 600,
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ background: 'rgba(31, 31, 35, 0.8)', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                  Status
                </TableCell>
                <TableCell sx={{ background: 'rgba(31, 31, 35, 0.8)', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                  File
                </TableCell>
                <TableCell sx={{ background: 'rgba(31, 31, 35, 0.8)', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                  Type
                </TableCell>
                <TableCell sx={{ background: 'rgba(31, 31, 35, 0.8)', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                  Data Month
                </TableCell>
                <TableCell sx={{ background: 'rgba(31, 31, 35, 0.8)', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                  Rows
                </TableCell>
                <TableCell sx={{ background: 'rgba(31, 31, 35, 0.8)', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                  Quality
                </TableCell>
                <TableCell sx={{ background: 'rgba(31, 31, 35, 0.8)', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                  Uploaded
                </TableCell>
                <TableCell sx={{ background: 'rgba(31, 31, 35, 0.8)', color: 'rgba(255, 255, 255, 0.9)', fontWeight: 600 }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {uploads.map((upload) => {
                const hasErrors = upload.processing_error || (upload.validation_errors && upload.validation_errors.length > 0);
                const isExpanded = expandedRows.has(upload.upload_id);
                
                return (
                  <React.Fragment key={upload.upload_id}>
                    <TableRow
                      sx={{
                        '& td': { 
                          borderBottom: isExpanded ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                          color: 'rgba(255, 255, 255, 0.8)',
                        },
                        '&:hover': {
                          background: 'rgba(1, 209, 209, 0.05)',
                        },
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getStatusIcon(upload.processing_status, !!hasErrors)}
                          <Chip
                            label={hasErrors ? 'Error' : upload.processing_status}
                            size="small"
                            color={getStatusColor(upload.processing_status, !!hasErrors)}
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {upload.original_filename}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={upload.file_type === 'rent_roll' ? 'Rent Roll' : 'Competition'}
                          size="small"
                          sx={{
                            backgroundColor: upload.file_type === 'rent_roll' 
                              ? 'rgba(1, 209, 209, 0.2)' 
                              : 'rgba(42, 157, 143, 0.2)',
                            color: upload.file_type === 'rent_roll' ? '#01D1D1' : '#2A9D8F',
                            fontSize: '0.7rem',
                            height: 20,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {formatDataMonth(upload.data_month)}
                      </TableCell>
                      <TableCell>
                        {upload.row_count?.toLocaleString() || '-'}
                      </TableCell>
                      <TableCell>
                        {upload.quality_score !== undefined ? (
                          <Chip
                            label={`${Math.round(upload.quality_score * 100)}%`}
                            size="small"
                            color={getQualityColor(upload.quality_score)}
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(upload.created_at)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          by {upload.user_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title={isExpanded ? 'Hide details' : 'Show details'}>
                            <IconButton
                              size="small"
                              onClick={() => handleExpandRow(upload.upload_id)}
                              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                            >
                              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Download report">
                            <IconButton
                              size="small"
                              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                    
                    <TableRow>
                      <TableCell colSpan={8} sx={{ p: 0, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <Collapse in={isExpanded}>
                          <Box sx={{ p: 3, background: 'rgba(1, 209, 209, 0.02)' }}>
                            <Typography variant="subtitle2" sx={{ color: '#01D1D1', mb: 2, fontWeight: 600 }}>
                              Upload Details
                            </Typography>
                            
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                                  Upload ID: {upload.upload_id}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 1 }}>
                                  Property: {upload.property_id}
                                </Typography>
                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                  Validation Status: {upload.validation_status}
                                </Typography>
                              </Grid>
                              
                              {(upload.validation_warnings || upload.validation_errors || upload.processing_error) && (
                                <Grid item xs={12} md={6}>
                                  {upload.validation_warnings && upload.validation_warnings.length > 0 && (
                                    <Alert severity="warning" sx={{ mb: 1, fontSize: '0.8rem' }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                        Warnings:
                                      </Typography>
                                      {upload.validation_warnings.map((warning, index) => (
                                        <Typography key={index} variant="body2" sx={{ ml: 1, fontSize: '0.8rem' }}>
                                          • {warning}
                                        </Typography>
                                      ))}
                                    </Alert>
                                  )}
                                  
                                  {upload.validation_errors && upload.validation_errors.length > 0 && (
                                    <Alert severity="error" sx={{ mb: 1, fontSize: '0.8rem' }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                        Validation Errors:
                                      </Typography>
                                      {upload.validation_errors.map((error, index) => (
                                        <Typography key={index} variant="body2" sx={{ ml: 1, fontSize: '0.8rem' }}>
                                          • {error}
                                        </Typography>
                                      ))}
                                    </Alert>
                                  )}
                                  
                                  {upload.processing_error && (
                                    <Alert severity="error" sx={{ fontSize: '0.8rem' }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                        Processing Error:
                                      </Typography>
                                      <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                        {upload.processing_error}
                                      </Typography>
                                    </Alert>
                                  )}
                                </Grid>
                              )}
                            </Grid>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default UploadHistoryView;
