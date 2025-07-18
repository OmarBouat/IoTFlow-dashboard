import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  Toolbar,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Avatar,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Add,
  Search,
  FilterList,
  MoreVert,
  Edit,
  Delete,
  Key,
  Visibility,
  Download,
  DeviceHub,
  CheckCircle,
  Error,
  Warning,
  Schedule,
  ControlPoint,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/apiService';
import DeviceControlDialog from '../components/DeviceControlDialog';

const Devices = () => {
  const { user } = useAuth();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Dialog states
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
  const [controlDialogOpen, setControlDialogOpen] = useState(false);
  const [newDeviceConnection, setNewDeviceConnection] = useState(null);
  const [deviceToDelete, setDeviceToDelete] = useState(null);

  // Form state
  const [deviceForm, setDeviceForm] = useState({
    name: '',
    type: 'Temperature',
    location: '',
    description: '',
    firmware_version: '1.0.0',
    hardware_version: '1.0',
  });

  // Load user devices
  useEffect(() => {
    const loadDevices = async () => {
      try {
        setLoading(true);
        const response = await apiService.getDevices();
        if (response.success) {
          // Transform API data to match component's expected format
          const transformedDevices = response.data.devices.map(device => ({
            id: device.id,
            name: device.name,
            type: device.type,
            location: device.location,
            status: device.status,
            last_seen: new Date(device.lastSeen),
            firmware_version: device.firmwareVersion || '1.0.0',
            hardware_version: device.hardwareVersion || '1.0',
            api_key: device.apiKey,
            description: device.description || '',
            created_at: new Date(device.createdAt),
            telemetry_count: Math.floor(Math.random() * 50000), // Mock for demo
          }));
          setDevices(transformedDevices);
        }
      } catch (error) {
        console.error('Failed to load devices:', error);
        toast.error('Failed to load devices');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadDevices();
    }
  }, [user]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'default';
      case 'error': return 'error';
      case 'maintenance': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle />;
      case 'inactive': return <Schedule />;
      case 'error': return <Error />;
      case 'maintenance': return <Warning />;
      default: return <CheckCircle />;
    }
  };

  const filteredDevices = devices.filter(device => {
    const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         device.type.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || device.status === statusFilter;
    const matchesType = typeFilter === 'all' || device.type.toLowerCase().includes(typeFilter.toLowerCase());
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = filteredDevices.map((device) => device.id);
      setSelectedDevices(newSelected);
      return;
    }
    setSelectedDevices([]);
  };

  const handleDeviceSelect = (deviceId) => {
    const selectedIndex = selectedDevices.indexOf(deviceId);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedDevices, deviceId);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedDevices.slice(1));
    } else if (selectedIndex === selectedDevices.length - 1) {
      newSelected = newSelected.concat(selectedDevices.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedDevices.slice(0, selectedIndex),
        selectedDevices.slice(selectedIndex + 1),
      );
    }

    setSelectedDevices(newSelected);
  };

  const handleCreateDevice = () => {
    setSelectedDevice(null);
    setDeviceForm({
      name: '',
      type: 'Temperature',
      location: '',
      description: '',
      firmware_version: '1.0.0',
      hardware_version: '1.0',
    });
    setDeviceDialogOpen(true);
  };

  const handleEditDevice = (device) => {
    setSelectedDevice(device);
    setDeviceForm({
      name: device.name,
      type: device.type,
      location: device.location,
      description: device.description,
      firmware_version: device.firmware_version,
      hardware_version: device.hardware_version,
    });
    setDeviceDialogOpen(true);
  };

  const handleSaveDevice = async () => {
    try {
      setLoading(true);
      
      if (selectedDevice) {
        // Update existing device
        const updatedDevice = { ...selectedDevice, ...deviceForm };
        setDevices(devices.map(device => 
          device.id === selectedDevice.id ? updatedDevice : device
        ));
        toast.success('Device updated successfully');
        setDeviceDialogOpen(false);
      } else {
        // Create new device through API
        const result = await apiService.createDevice(deviceForm);
        
        if (result.success) {
          // Transform API response to match component format
          const newDevice = {
            id: result.data.device.id,
            name: result.data.device.name,
            type: result.data.device.type,
            location: result.data.device.location,
            status: result.data.device.status,
            last_seen: result.data.device.lastSeen ? new Date(result.data.device.lastSeen) : null,
            firmware_version: result.data.device.firmwareVersion,
            hardware_version: result.data.device.hardwareVersion,
            api_key: result.data.device.connectionDetails.deviceToken,
            description: result.data.device.description,
            created_at: new Date(result.data.device.createdAt),
            telemetry_count: 0,
            connectionDetails: result.data.device.connectionDetails
          };
          
          setDevices([...devices, newDevice]);
          setNewDeviceConnection(result.data.device.connectionDetails);
          setDeviceDialogOpen(false);
          setConnectionDialogOpen(true);
          toast.success('Device registered successfully');
        } else {
          throw new Error('Failed to create device');
        }
      }
    } catch (error) {
      console.error('Error saving device:', error);
      toast.error('Failed to save device');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDevice = (device) => {
    setDeviceToDelete(device);
  };

  const confirmDeleteDevice = () => {
    setDevices(devices.filter(device => device.id !== deviceToDelete.id));
    setDeviceToDelete(null);
    toast.success('Device deleted successfully');
  };

  const handleShowConnectionDetails = (device) => {
    setSelectedDevice(device);
    setNewDeviceConnection(device.connectionDetails || {
      deviceToken: device.api_key,
      gatewayIP: '192.168.1.100',
      mqttEndpoint: 'mqtt://192.168.1.100:1883',
      httpsEndpoint: 'https://192.168.1.100:8443',
      mqttTopic: `devices/${user?.id}/${device.name.toLowerCase().replace(/\s+/g, '_')}`,
      reconnectInterval: 30,
      heartbeatInterval: 60
    });
    setConnectionDialogOpen(true);
  };

  const handleControlDevice = (device) => {
    setSelectedDevice(device);
    setControlDialogOpen(true);
  };

  const isControllableDevice = (device) => {
    const controllableTypes = ['LED', 'Engine', 'Door Lock', 'Pump', 'Fan', 'Valve', 'Thermostat', 'Switch', 'Dimmer', 'Motor', 'Actuator'];
    return controllableTypes.includes(device.type);
  };

  const handleBulkStatusUpdate = (newStatus) => {
    setDevices(devices.map(device => 
      selectedDevices.includes(device.id) 
        ? { ...device, status: newStatus }
        : device
    ));
    setSelectedDevices([]);
    toast.success(`Updated ${selectedDevices.length} device(s) to ${newStatus}`);
  };

  const DeviceActionsMenu = ({ device, anchorEl, onClose }) => (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
    >
      {isControllableDevice(device) && (
        <MenuItem onClick={() => { handleControlDevice(device); onClose(); }}>
          <ControlPoint sx={{ mr: 1 }} /> Control Device
        </MenuItem>
      )}
      <MenuItem onClick={() => { handleEditDevice(device); onClose(); }}>
        <Edit sx={{ mr: 1 }} /> Edit Device
      </MenuItem>
      <MenuItem onClick={() => { handleShowConnectionDetails(device); onClose(); }}>
        <Key sx={{ mr: 1 }} /> Connection Details
      </MenuItem>
      <MenuItem onClick={() => { handleDeleteDevice(device); onClose(); }}>
        <Delete sx={{ mr: 1 }} /> Delete Device
      </MenuItem>
    </Menu>
  );

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuDevice, setMenuDevice] = useState(null);

  const openMenu = (event, device) => {
    setMenuAnchor(event.currentTarget);
    setMenuDevice(device);
  };

  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuDevice(null);
  };

  return (
    <Box className="fade-in">
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Device Management
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Manage and monitor your IoT devices, API keys, and configurations
            {user && ` • Logged in as ${user.firstName} ${user.lastName}`}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreateDevice}
          size="large"
        >
          Add Device
        </Button>
      </Box>

      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search devices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="error">Error</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Type</InputLabel>
                <Select
                  value={typeFilter}
                  label="Type"
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="sensor">Sensor</MenuItem>
                  <MenuItem value="tracker">Tracker</MenuItem>
                  <MenuItem value="monitor">Monitor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                <Button variant="outlined" startIcon={<FilterList />}>
                  More Filters
                </Button>
                <Button variant="outlined" startIcon={<Download />}>
                  Export
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Bulk Actions Toolbar */}
      {selectedDevices.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <Toolbar
            sx={{
              pl: { sm: 2 },
              pr: { xs: 1, sm: 1 },
              bgcolor: alpha('primary.main', 0.1),
            }}
          >
            <Typography
              sx={{ flex: '1 1 100%' }}
              color="inherit"
              variant="subtitle1"
              component="div"
            >
              {selectedDevices.length} device(s) selected
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                size="small"
                onClick={() => handleBulkStatusUpdate('active')}
              >
                Activate
              </Button>
              <Button
                size="small"
                onClick={() => handleBulkStatusUpdate('inactive')}
              >
                Deactivate
              </Button>
              <Button
                size="small"
                onClick={() => handleBulkStatusUpdate('maintenance')}
              >
                Maintenance
              </Button>
            </Box>
          </Toolbar>
        </Card>
      )}

      {/* Device Table */}
      <Card>
        {loading ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography>Loading your devices...</Typography>
          </Box>
        ) : filteredDevices.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <DeviceHub sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {devices.length === 0 ? 'No Devices Yet' : 'No Matching Devices'}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              {devices.length === 0 
                ? 'Get started by adding your first IoT device to the platform.' 
                : 'Try adjusting your search or filter criteria.'}
            </Typography>
            {devices.length === 0 && (
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleCreateDevice}
              >
                Add Your First Device
              </Button>
            )}
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={selectedDevices.length > 0 && selectedDevices.length < filteredDevices.length}
                        checked={filteredDevices.length > 0 && selectedDevices.length === filteredDevices.length}
                        onChange={handleSelectAllClick}
                      />
                    </TableCell>
                    <TableCell>Device</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Location</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Seen</TableCell>
                    <TableCell>Messages</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDevices
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((device) => {
                      const isSelected = selectedDevices.indexOf(device.id) !== -1;
                      return (
                        <TableRow
                          hover
                          onClick={() => handleDeviceSelect(device.id)}
                          role="checkbox"
                          aria-checked={isSelected}
                          tabIndex={-1}
                          key={device.id}
                          selected={isSelected}
                        >
                          <TableCell padding="checkbox">
                            <Checkbox checked={isSelected} />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                                <DeviceHub />
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                  {device.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  v{device.firmware_version}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{device.type}</TableCell>
                          <TableCell>{device.location}</TableCell>
                          <TableCell>
                            <Chip
                              icon={getStatusIcon(device.status)}
                              label={device.status.charAt(0).toUpperCase() + device.status.slice(1)}
                              color={getStatusColor(device.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {device.last_seen.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {device.telemetry_count.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {isControllableDevice(device) && (
                                <Tooltip title="Control Device">
                                  <IconButton
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleControlDevice(device);
                                    }}
                                    sx={{ color: 'primary.main' }}
                                  >
                                    <ControlPoint />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="More Actions">
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openMenu(e, device);
                                  }}
                                >
                                  <MoreVert />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={filteredDevices.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}
      </Card>

      {/* Device Form Dialog */}
      <Dialog
        open={deviceDialogOpen}
        onClose={() => setDeviceDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedDevice ? 'Edit Device' : 'Register New Device'}
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            {selectedDevice 
              ? 'Update your device configuration below.'
              : 'After registration, you will receive connection credentials to connect your device to the IoT platform.'
            }
          </Alert>
          
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Device Name"
                value={deviceForm.name}
                onChange={(e) => setDeviceForm({ ...deviceForm, name: e.target.value })}
                placeholder="e.g., Living Room Temperature Sensor"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Device Type</InputLabel>
                <Select
                  value={deviceForm.type}
                  label="Device Type"
                  onChange={(e) => setDeviceForm({ ...deviceForm, type: e.target.value })}
                >
                  {/* Sensor Devices */}
                  <MenuItem value="Temperature">Temperature Sensor</MenuItem>
                  <MenuItem value="Humidity">Humidity Sensor</MenuItem>
                  <MenuItem value="Pressure">Pressure Sensor</MenuItem>
                  <MenuItem value="Motion">Motion Sensor</MenuItem>
                  <MenuItem value="Light">Light Sensor</MenuItem>
                  <MenuItem value="Sound">Sound Sensor</MenuItem>
                  <MenuItem value="GPS">GPS Tracker</MenuItem>
                  <MenuItem value="Camera">Camera</MenuItem>
                  <MenuItem value="Moisture">Soil Moisture Sensor</MenuItem>
                  <MenuItem value="Air Quality">Air Quality Sensor</MenuItem>
                  
                  {/* Controllable Devices */}
                  <MenuItem value="LED">LED Light Controller</MenuItem>
                  <MenuItem value="Engine">Engine Controller</MenuItem>
                  <MenuItem value="Door Lock">Smart Door Lock</MenuItem>
                  <MenuItem value="Pump">Water Pump Controller</MenuItem>
                  <MenuItem value="Fan">Smart Fan Controller</MenuItem>
                  <MenuItem value="Valve">Smart Valve Controller</MenuItem>
                  <MenuItem value="Thermostat">Smart Thermostat</MenuItem>
                  <MenuItem value="Switch">Smart Switch</MenuItem>
                  <MenuItem value="Dimmer">Smart Dimmer</MenuItem>
                  <MenuItem value="Motor">Motor Controller</MenuItem>
                  
                  {/* Other */}
                  <MenuItem value="Actuator">Generic Actuator/Controller</MenuItem>
                  <MenuItem value="Gateway">IoT Gateway</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Device Location"
                value={deviceForm.location}
                onChange={(e) => setDeviceForm({ ...deviceForm, location: e.target.value })}
                placeholder="e.g., Living Room, Office, Warehouse Zone A"
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Firmware Version"
                value={deviceForm.firmware_version}
                onChange={(e) => setDeviceForm({ ...deviceForm, firmware_version: e.target.value })}
                placeholder="e.g., 1.0.0"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Hardware Version"
                value={deviceForm.hardware_version}
                onChange={(e) => setDeviceForm({ ...deviceForm, hardware_version: e.target.value })}
                placeholder="e.g., 1.0"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={deviceForm.description}
                onChange={(e) => setDeviceForm({ ...deviceForm, description: e.target.value })}
                placeholder="Describe your device's purpose and any special notes..."
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeviceDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveDevice} 
            variant="contained"
            disabled={loading || !deviceForm.name.trim() || !deviceForm.location.trim()}
          >
            {loading ? 'Processing...' : (selectedDevice ? 'Update Device' : 'Register Device')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Connection Details Dialog */}
      <Dialog
        open={connectionDialogOpen}
        onClose={() => setConnectionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Device Connection Details
          {selectedDevice && ` - ${selectedDevice.name}`}
        </DialogTitle>
        <DialogContent>
          {newDeviceConnection && (
            <Box sx={{ mt: 2 }}>
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Device registered successfully! 
                </Typography>
                <Typography variant="body2">
                  Use the credentials below to connect your device to the IoT platform.
                </Typography>
              </Alert>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Authentication Token
                  </Typography>
                  <TextField
                    fullWidth
                    label="Device Token"
                    value={newDeviceConnection.deviceToken}
                    InputProps={{
                      readOnly: true,
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title="Copy to clipboard">
                            <IconButton
                              onClick={() => {
                                navigator.clipboard.writeText(newDeviceConnection.deviceToken);
                                toast.success('Device token copied to clipboard');
                              }}
                            >
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    }}
                    sx={{ mb: 2 }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Connection Endpoints
                  </Typography>
                  <TextField
                    fullWidth
                    label="Gateway IP Address"
                    value={newDeviceConnection.gatewayIP}
                    InputProps={{ readOnly: true }}
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    label="MQTT Endpoint"
                    value={newDeviceConnection.mqttEndpoint}
                    InputProps={{ readOnly: true }}
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    label="HTTPS Endpoint"
                    value={newDeviceConnection.httpsEndpoint}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom color="primary">
                    MQTT Configuration
                  </Typography>
                  <TextField
                    fullWidth
                    label="MQTT Topic"
                    value={newDeviceConnection.mqttTopic}
                    InputProps={{ readOnly: true }}
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    label="Reconnect Interval (seconds)"
                    value={newDeviceConnection.reconnectInterval}
                    InputProps={{ readOnly: true }}
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    label="Heartbeat Interval (seconds)"
                    value={newDeviceConnection.heartbeatInterval}
                    InputProps={{ readOnly: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography variant="subtitle2" gutterBottom>
                      Integration Instructions:
                    </Typography>
                    <Typography variant="body2" component="div">
                      1. Configure your device with the provided token for authentication<br/>
                      2. Connect to the gateway using the IP address: <code>{newDeviceConnection.gatewayIP}</code><br/>
                      3. Use MQTT protocol for real-time data transmission<br/>
                      4. Publish telemetry data to the specified MQTT topic<br/>
                      5. Implement heartbeat messages to maintain connection status
                    </Typography>
                  </Alert>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConnectionDialogOpen(false)}>Close</Button>
          <Button
            variant="outlined"
            onClick={() => {
              const connectionInfo = `Device: ${selectedDevice?.name || 'New Device'}
Token: ${newDeviceConnection?.deviceToken}
Gateway IP: ${newDeviceConnection?.gatewayIP}
MQTT Endpoint: ${newDeviceConnection?.mqttEndpoint}
MQTT Topic: ${newDeviceConnection?.mqttTopic}`;
              
              navigator.clipboard.writeText(connectionInfo);
              toast.success('Connection details copied to clipboard');
            }}
          >
            Copy All Details
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deviceToDelete)}
        onClose={() => setDeviceToDelete(null)}
      >
        <DialogTitle>Confirm Device Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete device "{deviceToDelete?.name}"?
            This action cannot be undone and will remove all associated telemetry data.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeviceToDelete(null)}>Cancel</Button>
          <Button onClick={confirmDeleteDevice} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      {menuDevice && (
        <DeviceActionsMenu
          device={menuDevice}
          anchorEl={menuAnchor}
          onClose={closeMenu}
        />
      )}

      {/* Device Control Dialog */}
      <DeviceControlDialog
        open={controlDialogOpen}
        onClose={() => {
          setControlDialogOpen(false);
          setSelectedDevice(null);
        }}
        device={selectedDevice}
      />
    </Box>
  );
};

export default Devices;
