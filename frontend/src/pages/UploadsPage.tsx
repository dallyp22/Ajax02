import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Tab,
  Tabs,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  Stack,
  Button,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  CloudUpload,
  History as HistoryIcon,
  CheckCircle,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  FileUpload,
  Assessment,
  Schedule,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { usePropertySelection } from '@/contexts/PropertySelectionContext';
import UploadHistoryView from '@/components/UploadHistoryView';
import uploadService from '../services/uploadService';

console.log('🔍 uploadService imported:', uploadService);
console.log('🔍 uploadService.uploadFile:', uploadService?.uploadFile);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`upload-tabpanel-${index}`}
      aria-labelledby={`upload-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface UploadResult {
  success: boolean;
  upload_id: string;
  message: string;
  row_count?: number;
  quality_score?: number;
  warnings?: string[];
  errors?: string[];
  processing_time_seconds?: number;
}

const UploadsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [uploadResults, setUploadResults] = useState<UploadResult[]>([]);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [currentResult, setCurrentResult] = useState<UploadResult | null>(null);
  const { selectedProperties } = usePropertySelection();
  const queryClient = useQueryClient();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const uploadMutation = useMutation({
    mutationFn: (params: any) => {
      console.log('🎯 Mutation function called with:', params);
      return uploadService.uploadFile(params);
    },
    onSuccess: (result: UploadResult) => {
      console.log('✅ Upload successful:', result);
      setUploadResults(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 results
      setCurrentResult(result);
      setShowResultDialog(true);
      // Refresh upload history
      queryClient.invalidateQueries({ queryKey: ['upload-history'] });
    },
    onError: (error: any) => {
      console.error('❌ Upload failed:', error);
      console.error('❌ Error details:', error.stack);
      const errorResult: UploadResult = {
        success: false,
        upload_id: '',
        message: error.message || 'Upload failed',
        errors: [error.message || 'Unknown error occurred'],
      };
      setCurrentResult(errorResult);
      setShowResultDialog(true);
    },
  });

  const UploadZone: React.FC<{ fileType: 'rent_roll' | 'competition' }> = ({ fileType }) => {
    const [dataMonth, setDataMonth] = useState(() => {
      const now = new Date();
      return format(now, 'yyyy-MM');
    });

    const onDrop = useCallback((acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      
      // For rent roll files, use 'portfolio' as property ID since they contain all properties
      // For competition files, require a specific property selection
      let propertyId: string;
      
      if (fileType === 'rent_roll') {
        propertyId = 'portfolio'; // Rent roll contains all properties
      } else {
        if (selectedProperties.length === 0) {
          alert('Please select a property first for competition data');
          return;
        }
        propertyId = selectedProperties[0];
      }

      uploadMutation.mutate({
        file,
        fileType,
        propertyId,
        dataMonth,
        userId: 'current_user', // TODO: Get from auth context
      });
    }, [fileType, dataMonth, selectedProperties]);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
      onDrop,
      accept: {
        'text/csv': ['.csv'],
        'application/vnd.ms-excel': ['.xls'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      },
      maxFiles: 1,
      maxSize: 10 * 1024 * 1024, // 10MB
    });

    const title = fileType === 'rent_roll' ? 'Rent Roll Upload' : 'Competition Data Upload';
    const description = fileType === 'rent_roll' 
      ? 'Upload your monthly rent roll CSV file (contains all properties)'
      : 'Upload your competition data CSV file (for selected property)';

    const getDropzoneStyles = () => {
      if (isDragReject) {
        return {
          borderColor: '#f44336',
          backgroundColor: 'rgba(244, 67, 54, 0.05)',
        };
      }
      if (isDragActive) {
        return {
          borderColor: '#01D1D1',
          backgroundColor: 'rgba(1, 209, 209, 0.1)',
          transform: 'scale(1.02)',
        };
      }
      return {
        borderColor: 'rgba(1, 209, 209, 0.3)',
        backgroundColor: 'rgba(1, 209, 209, 0.02)',
      };
    };

    return (
      <Card
        sx={{
          height: '100%',
          background: 'rgba(42, 42, 48, 0.6)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(1, 209, 209, 0.2)',
          borderRadius: '16px',
        }}
      >
        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#01D1D1', fontWeight: 600, mb: 1 }}>
              {title}
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {description}
            </Typography>
          </Box>

          {/* Data Month Selector */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', mb: 1 }}>
              Data Month:
            </Typography>
            <input
              type="month"
              value={dataMonth}
              onChange={(e) => setDataMonth(e.target.value)}
              style={{
                background: 'rgba(1, 209, 209, 0.1)',
                border: '1px solid rgba(1, 209, 209, 0.3)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#01D1D1',
                fontSize: '14px',
                width: '100%',
              }}
            />
          </Box>

          {/* Upload Zone */}
          <Box
            {...getRootProps()}
            sx={{
              flex: 1,
              border: '2px dashed',
              borderRadius: '12px',
              padding: 3,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              position: 'relative',
              overflow: 'hidden',
              ...getDropzoneStyles(),
              '&:hover': {
                transform: 'scale(1.02)',
                borderColor: '#01D1D1',
              },
            }}
          >
            <input {...getInputProps()} />
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #01D1D1 0%, #2A9D8F 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(1, 209, 209, 0.3)',
                }}
              >
                <CloudUpload sx={{ fontSize: 30, color: '#000' }} />
              </Box>
              
              {uploadMutation.isPending ? (
                <Box sx={{ width: '100%' }}>
                  <Typography variant="body1" sx={{ color: '#01D1D1', mb: 1 }}>
                    Uploading...
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
              ) : (
                <>
                  <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    {isDragActive ? 'Drop file here' : 'Drag & drop your file here'}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    or click to browse
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    Supports CSV, XLS, XLSX files (max 10MB)
                  </Typography>
                </>
              )}
            </Box>
          </Box>

          {/* Selected Property Indicator */}
          <Box sx={{ mt: 2 }}>
            {fileType === 'rent_roll' ? (
              <Chip
                label="Portfolio-wide upload (all properties)"
                size="small"
                sx={{
                  backgroundColor: 'rgba(1, 209, 209, 0.2)',
                  color: '#01D1D1',
                  border: '1px solid rgba(1, 209, 209, 0.3)',
                }}
              />
            ) : selectedProperties.length > 0 ? (
              <Chip
                label={`Property: ${selectedProperties[0]}`}
                size="small"
                sx={{
                  backgroundColor: 'rgba(42, 157, 143, 0.2)',
                  color: '#2A9D8F',
                  border: '1px solid rgba(42, 157, 143, 0.3)',
                }}
              />
            ) : (
              <Chip
                label="Please select a property"
                size="small"
                sx={{
                  backgroundColor: 'rgba(255, 193, 7, 0.2)',
                  color: '#FFC107',
                  border: '1px solid rgba(255, 193, 7, 0.3)',
                }}
              />
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  const RecentUploads: React.FC = () => (
    <Card
      sx={{
        background: 'rgba(42, 42, 48, 0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(1, 209, 209, 0.2)',
        borderRadius: '16px',
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" sx={{ color: '#01D1D1', fontWeight: 600 }}>
            Recent Uploads
          </Typography>
          <Tooltip title="Refresh">
            <IconButton
              onClick={() => queryClient.invalidateQueries({ queryKey: ['upload-history'] })}
              sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>

        {uploadResults.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <FileUpload sx={{ fontSize: 48, color: 'rgba(255, 255, 255, 0.3)', mb: 2 }} />
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              No recent uploads
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.4)' }}>
              Upload your first file to see results here
            </Typography>
          </Box>
        ) : (
          <Stack spacing={2}>
            {uploadResults.map((result, index) => (
              <Fade in={true} key={result.upload_id || index} timeout={300 * (index + 1)}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    background: result.success 
                      ? 'rgba(76, 175, 80, 0.1)' 
                      : 'rgba(244, 67, 54, 0.1)',
                    border: result.success 
                      ? '1px solid rgba(76, 175, 80, 0.3)' 
                      : '1px solid rgba(244, 67, 54, 0.3)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {result.success ? (
                      <CheckCircle sx={{ color: '#4CAF50', fontSize: 20 }} />
                    ) : (
                      <ErrorIcon sx={{ color: '#f44336', fontSize: 20 }} />
                    )}
                    <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontWeight: 500 }}>
                      {result.message}
                    </Typography>
                  </Box>
                  
                  {result.success && (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {result.row_count && (
                        <Chip
                          label={`${result.row_count.toLocaleString()} rows`}
                          size="small"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      )}
                      {result.quality_score !== undefined && (
                        <Chip
                          label={`${Math.round(result.quality_score * 100)}% quality`}
                          size="small"
                          color={result.quality_score > 0.8 ? 'success' : result.quality_score > 0.6 ? 'warning' : 'error'}
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      )}
                      {result.processing_time_seconds && (
                        <Chip
                          label={`${result.processing_time_seconds.toFixed(1)}s`}
                          size="small"
                          sx={{ fontSize: '0.7rem', height: 20 }}
                        />
                      )}
                    </Box>
                  )}

                  {result.warnings && result.warnings.length > 0 && (
                    <Alert 
                      severity="warning" 
                      sx={{ mt: 1, fontSize: '0.8rem' }}
                      icon={<WarningIcon fontSize="inherit" />}
                    >
                      {result.warnings[0]}
                      {result.warnings.length > 1 && ` (+${result.warnings.length - 1} more)`}
                    </Alert>
                  )}
                </Box>
              </Fade>
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );

  const ResultDialog: React.FC = () => (
    <Dialog
      open={showResultDialog}
      onClose={() => setShowResultDialog(false)}
      maxWidth="md"
      PaperProps={{
        sx: {
          background: 'rgba(42, 42, 48, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(1, 209, 209, 0.2)',
          borderRadius: '16px',
        },
      }}
    >
      <DialogTitle sx={{ color: '#01D1D1', fontWeight: 600 }}>
        Upload Results
      </DialogTitle>
      <DialogContent>
        {currentResult && (
          <Box sx={{ minWidth: 400 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              {currentResult.success ? (
                <CheckCircle sx={{ color: '#4CAF50', fontSize: 24 }} />
              ) : (
                <ErrorIcon sx={{ color: '#f44336', fontSize: 24 }} />
              )}
              <Typography variant="h6" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                {currentResult.message}
              </Typography>
            </Box>

            {currentResult.success && (
              <Grid container spacing={2} sx={{ mb: 2 }}>
                {currentResult.row_count && (
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, background: 'rgba(1, 209, 209, 0.1)', border: '1px solid rgba(1, 209, 209, 0.3)' }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Rows Processed
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#01D1D1' }}>
                        {currentResult.row_count.toLocaleString()}
                      </Typography>
                    </Paper>
                  </Grid>
                )}
                {currentResult.quality_score !== undefined && (
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, background: 'rgba(1, 209, 209, 0.1)', border: '1px solid rgba(1, 209, 209, 0.3)' }}>
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Data Quality
                      </Typography>
                      <Typography variant="h6" sx={{ color: '#01D1D1' }}>
                        {Math.round(currentResult.quality_score * 100)}%
                      </Typography>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            )}

            {currentResult.warnings && currentResult.warnings.length > 0 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Warnings ({currentResult.warnings.length}):
                </Typography>
                {currentResult.warnings.map((warning, index) => (
                  <Typography key={index} variant="body2" sx={{ ml: 1 }}>
                    • {warning}
                  </Typography>
                ))}
              </Alert>
            )}

            {currentResult.errors && currentResult.errors.length > 0 && (
              <Alert severity="error" sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Errors ({currentResult.errors.length}):
                </Typography>
                {currentResult.errors.map((error, index) => (
                  <Typography key={index} variant="body2" sx={{ ml: 1 }}>
                    • {error}
                  </Typography>
                ))}
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => setShowResultDialog(false)}
          sx={{ color: '#01D1D1' }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          sx={{ 
            color: '#01D1D1', 
            fontWeight: 700, 
            mb: 1,
            textShadow: '0 0 20px rgba(1, 209, 209, 0.5)',
          }}
        >
          Data Uploads
        </Typography>
        <Typography 
          variant="body1" 
          sx={{ 
            color: 'rgba(255, 255, 255, 0.8)',
            maxWidth: 600,
          }}
        >
          Upload your monthly rent roll and competition data to track historical trends and optimize pricing strategies.
        </Typography>
      </Box>

      {selectedProperties.length === 0 && (
        <Alert 
          severity="info" 
          sx={{ 
            mb: 3,
            background: 'rgba(2, 136, 209, 0.1)',
            border: '1px solid rgba(2, 136, 209, 0.3)',
            color: 'rgba(255, 255, 255, 0.9)',
          }}
        >
          Rent roll uploads work portfolio-wide. Competition data uploads require property selection.
        </Alert>
      )}

      <Paper
        sx={{
          background: 'rgba(31, 31, 35, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(1, 209, 209, 0.2)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            borderBottom: '1px solid rgba(1, 209, 209, 0.2)',
            '& .MuiTab-root': {
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 500,
              '&.Mui-selected': {
                color: '#01D1D1',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#01D1D1',
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab 
            label="Upload Files" 
            icon={<CloudUpload />} 
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          <Tab 
            label="Upload History" 
            icon={<HistoryIcon />} 
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <UploadZone fileType="rent_roll" />
            </Grid>
            <Grid item xs={12} md={6}>
              <UploadZone fileType="competition" />
            </Grid>
            <Grid item xs={12}>
              <RecentUploads />
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <UploadHistoryView />
        </TabPanel>
      </Paper>

      <ResultDialog />
    </Box>
  );
};

export default UploadsPage;
