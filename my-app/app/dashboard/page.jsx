"use client"
import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext" // Using your preferred useAuth hook
import api from "@/lib/api"; // Using our new centralized API library
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
} from "@mui/material"
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material"

export default function Dashboard() {
  const { user, logout, loading: authLoading } = useAuth()
  const [apiKeys, setApiKeys] = useState([])
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [visibleKeys, setVisibleKeys] = useState(new Set())

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      setError(null);
      // FIX: Use the new api library which handles auth automatically
      const keys = await api.get("/api/keys");
      setApiKeys(keys);
    } catch (error) {
      console.error("Error fetching API keys:", error);
      setError(error.message || "Failed to fetch API keys.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch keys only when the user is authenticated and loaded
  useEffect(() => {
    if (!authLoading && user) {
        fetchApiKeys();
    }
  }, [user, authLoading]);

  const createApiKey = async () => {
    if (!newKeyName) return;
    try {
      // FIX: Use the new api library
      await api.post("/api/keys", { name: newKeyName });
      setShowCreateDialog(false);
      setNewKeyName("");
      fetchApiKeys(); // Refresh the list
    } catch (error) {
      console.error("Error creating API key:", error);
      setError(error.message || "Failed to create API key.");
    }
  };

  const deleteApiKey = async (keyId) => {
    if (window.confirm('Are you sure you want to delete this key? This cannot be undone.')) {
        try {
            // FIX: Use the new api library
            await api.delete(`/api/keys/${keyId}`);
            fetchApiKeys(); // Refresh the list
        } catch (error) {
            console.error("Error deleting API key:", error);
            setError(error.message || "Failed to delete API key.");
        }
    }
  };

  const toggleKeyVisibility = (keyId) => {
    const newVisible = new Set(visibleKeys)
    if (newVisible.has(keyId)) {
      newVisible.delete(keyId)
    } else {
      newVisible.add(keyId)
    }
    setVisibleKeys(newVisible)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    // You could add a snackbar here for user feedback
  }

  const maskApiKey = (key) => {
    return key.substring(0, 8) + "..." + key.substring(key.length - 4)
  }

  if (authLoading) {
      return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
              <CircularProgress />
          </Box>
      );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" component="h1">
            Dashboard
          </Typography>
          <Button variant="outlined" onClick={logout}>
            Logout
          </Button>
        </Box>

        {/* Info Cards */}
        <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Welcome back!</Typography>
                        <Typography variant="body2" color="text.secondary">{user?.username}</Typography>
                        <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={4}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>API Keys</Typography>
                        <Typography variant="h4" color="primary">{apiKeys.length}</Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={4}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>Current Plan</Typography>
                        <Typography variant="body1">Free Tier</Typography>
                        <Typography variant="body2" color="text.secondary">10 requests/day</Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>

        {/* API Keys Table */}
        <Box sx={{ mt: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">API Keys</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreateDialog(true)}>
              Create New Key
            </Button>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          {loading ? <CircularProgress /> : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Key</TableCell>
                    <TableCell>Daily Limit</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {apiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell>{key.name}</TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" fontFamily="monospace">
                            {visibleKeys.has(key.id) ? key.key : maskApiKey(key.key)}
                          </Typography>
                          <IconButton size="small" onClick={() => toggleKeyVisibility(key.id)}>
                            {visibleKeys.has(key.id) ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell>{key.daily_limit}</TableCell>
                      <TableCell>
                        <Chip
                          label={key.is_active ? "Active" : "Inactive"}
                          color={key.is_active ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{new Date(key.created_at).toLocaleDateString()}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Copy Key">
                          <IconButton size="small" onClick={() => copyToClipboard(key.key)}>
                            <CopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Key">
                          <IconButton size="small" color="error" onClick={() => deleteApiKey(key.id)}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Box>

      {/* Create Key Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)}>
        <DialogTitle>Create New API Key</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Key Name"
            fullWidth
            variant="outlined"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button onClick={createApiKey} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
