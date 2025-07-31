import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  OutlinedInput,
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';

interface TableSettings {
  rentroll_table: string;
  competition_table: string;
  project_id: string;
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<TableSettings>({
    rentroll_table: 'rentroll-ai.rentroll.Update_7_8_native',
    competition_table: 'rentroll-ai.rentroll.Competition',
    project_id: 'rentroll-ai'
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  // Load current settings
  const { data: currentSettings, refetch: refetchSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiService.getSettings(),
  });

  // Update settings when data loads
  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings);
      setHasChanges(false);
    }
  }, [currentSettings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: (newSettings: TableSettings) => apiService.saveSettings(newSettings),
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: (testSettings: TableSettings) => apiService.testTableConnections(testSettings),
  });

  // Handle mutation success
  useEffect(() => {
    if (saveSettingsMutation.isSuccess) {
      setHasChanges(false);
      refetchSettings();
    }
  }, [saveSettingsMutation.isSuccess, refetchSettings]);

  useEffect(() => {
    if (testConnectionMutation.isSuccess && testConnectionMutation.data) {
      setTestResults(testConnectionMutation.data);
      setTestDialogOpen(true);
    }
  }, [testConnectionMutation.isSuccess, testConnectionMutation.data]);

  const handleInputChange = (field: keyof TableSettings) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSettings = {
      ...settings,
      [field]: event.target.value,
    };
    setSettings(newSettings);
    setHasChanges(JSON.stringify(newSettings) !== JSON.stringify(currentSettings));
  };

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const handleTestConnection = () => {
    testConnectionMutation.mutate(settings);
  };

  const handleReset = () => {
    if (currentSettings) {
      setSettings(currentSettings);
      setHasChanges(false);
    } else {
      // Reset to default values
      setSettings({
        rentroll_table: 'rentroll-ai.rentroll.Update_7_8_native',
        competition_table: 'rentroll-ai.rentroll.Competition',
        project_id: 'rentroll-ai'
      });
      setHasChanges(false);
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Configure BigQuery table connections to adapt the application for different ownership companies.
      </Typography>

      <Grid container spacing={3}>
        {/* BigQuery Configuration */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Typography variant="h6" sx={{ flexGrow: 1 }}>
                  BigQuery Table Configuration
                </Typography>
                <Chip
                  icon={hasChanges ? <ErrorIcon /> : <CheckCircleIcon />}
                  label={hasChanges ? 'Unsaved Changes' : 'Saved'}
                  color={hasChanges ? 'warning' : 'success'}
                  size="small"
                />
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Project ID"
                    value={settings.project_id}
                    onChange={handleInputChange('project_id')}
                    placeholder="your-project-id"
                    helperText="Google Cloud Project ID containing your BigQuery datasets"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Rent Roll Table"
                    value={settings.rentroll_table}
                    onChange={handleInputChange('rentroll_table')}
                    placeholder="project.dataset.table_name"
                    helperText="Full path to your rent roll data table (e.g., my-project.rentroll.units_data)"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <InfoIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Competition Table"
                    value={settings.competition_table}
                    onChange={handleInputChange('competition_table')}
                    placeholder="project.dataset.table_name"
                    helperText="Full path to your competition data table (e.g., my-project.market.competition)"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <InfoIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Box display="flex" gap={2} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={handleTestConnection}
                  startIcon={<RefreshIcon />}
                  disabled={testConnectionMutation.isPending}
                >
                  Test Connection
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleReset}
                  disabled={!hasChanges}
                >
                  Reset
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSave}
                  startIcon={<SaveIcon />}
                  disabled={!hasChanges || saveSettingsMutation.isPending}
                >
                  Save Settings
                </Button>
              </Box>

              {saveSettingsMutation.isError && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Failed to save settings: {(saveSettingsMutation.error as any)?.message || 'Unknown error'}
                </Alert>
              )}

              {saveSettingsMutation.isSuccess && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  Settings saved successfully! The application will now use your configured tables.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Requirements & Help */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Table Requirements
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Rent Roll Table Schema:
              </Typography>
              <Typography variant="body2" color="textSecondary" component="div">
                Required columns: Unit, Property, Bedroom, Bathrooms, Sqft, Status, Advertised_Rent, Market_Rent, Lease_To, Move_out
              </Typography>

              <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                Competition Table Schema:
              </Typography>
              <Typography variant="body2" color="textSecondary" component="div">
                Required columns: Property, Unit, Base_Price, Sq_Ft, Availability, Bed, Bath
              </Typography>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Note:</strong> After changing table configurations, the application will rebuild its data views and comparables. 
                  This may take a few moments for large datasets.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Test Results Dialog */}
      <Dialog
        open={testDialogOpen}
        onClose={() => setTestDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Connection Test Results</DialogTitle>
        <DialogContent>
          {testResults && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Alert 
                  severity={testResults.rentroll_table.success ? 'success' : 'error'}
                  sx={{ mb: 2 }}
                >
                  <Typography variant="subtitle2">Rent Roll Table</Typography>
                  <Typography variant="body2">
                    {testResults.rentroll_table.success 
                      ? `✅ Connected successfully (${testResults.rentroll_table.row_count} rows)`
                      : `❌ ${testResults.rentroll_table.error}`
                    }
                  </Typography>
                </Alert>
              </Grid>
              <Grid item xs={12}>
                <Alert 
                  severity={testResults.competition_table.success ? 'success' : 'error'}
                >
                  <Typography variant="subtitle2">Competition Table</Typography>
                  <Typography variant="body2">
                    {testResults.competition_table.success 
                      ? `✅ Connected successfully (${testResults.competition_table.row_count} rows)`
                      : `❌ ${testResults.competition_table.error}`
                    }
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTestDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SettingsPage; 