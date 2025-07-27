"use client"
import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
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
} from "@mui/material"
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from "@mui/icons-material"

export default function Dashboard() {
  const { user, logout } = useAuth()
  const [apiKeys, setApiKeys] = useState([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [visibleKeys, setVisibleKeys] = useState(new Set())

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8000/api/keys", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const keys = await response.json()
        setApiKeys(keys)
      }
    } catch (error) {
      console.error("Error fetching API keys:", error)
    }
  }

  const createApiKey = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8000/api/keys", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newKeyName }),
      })
      if (response.ok) {
        setShowCreateDialog(false)
        setNewKeyName("")
        fetchApiKeys()
      }
    } catch (error) {
      console.error("Error creating API key:", error)
    }
  }

  const deleteApiKey = async (keyId) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:8000/api/keys/${keyId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        fetchApiKeys()
      }
    } catch (error) {
      console.error("Error deleting API key:", error)
    }
  }

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
  }

  const maskApiKey = (key) => {
    return key.substring(0, 8) + "..." + key.substring(key.length - 4)
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

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Welcome back!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.username}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {user?.email}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  API Keys
                </Typography>
                <Typography variant="h4" color="primary">
                  {apiKeys.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Current Plan
                </Typography>
                <Typography variant="body1">Free Tier</Typography>
                <Typography variant="body2" color="text.secondary">
                  10 requests/day
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5">API Keys</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowCreateDialog(true)}>
              Create New Key
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Key</TableCell>
                  <TableCell>Daily Limit</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
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
                          {visibleKeys.has(key.id) ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                        <Tooltip title="Copy to clipboard">
                          <IconButton size="small" onClick={() => copyToClipboard(key.key)}>
                            <CopyIcon />
                          </IconButton>
                        </Tooltip>
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
                    <TableCell>
                      <IconButton color="error" onClick={() => deleteApiKey(key.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>

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
