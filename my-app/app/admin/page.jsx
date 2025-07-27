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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
} from "@mui/material"

export default function AdminDashboard() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [analytics, setAnalytics] = useState({})
  const [showLimitDialog, setShowLimitDialog] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [newLimit, setNewLimit] = useState("")

  useEffect(() => {
    if (user?.is_admin) {
      fetchUsers()
      fetchAnalytics()
    }
  }, [user])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8000/api/admin/users", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const usersData = await response.json()
        setUsers(usersData)
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8000/api/admin/analytics", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const analyticsData = await response.json()
        setAnalytics(analyticsData)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    }
  }

  const updateUserLimit = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:8000/api/admin/users/${selectedUser.id}/limit`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ daily_limit: Number.parseInt(newLimit) }),
      })
      if (response.ok) {
        setShowLimitDialog(false)
        setSelectedUser(null)
        setNewLimit("")
        fetchUsers()
      }
    } catch (error) {
      console.error("Error updating user limit:", error)
    }
  }

  if (!user?.is_admin) {
    return (
      <Container>
        <Typography variant="h4" color="error" align="center" sx={{ mt: 4 }}>
          Access Denied
        </Typography>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>

        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Users
                </Typography>
                <Typography variant="h4" color="primary">
                  {analytics.total_users || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Requests
                </Typography>
                <Typography variant="h4" color="primary">
                  {analytics.total_requests || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Active Subscriptions
                </Typography>
                <Typography variant="h4" color="primary">
                  {analytics.active_subscriptions || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Typography variant="h5" gutterBottom>
          Users Management
        </Typography>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.is_active ? "Active" : "Inactive"}
                      color={user.is_active ? "success" : "default"}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      onClick={() => {
                        setSelectedUser(user)
                        setShowLimitDialog(true)
                      }}
                    >
                      Set Limit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={showLimitDialog} onClose={() => setShowLimitDialog(false)}>
        <DialogTitle>Update User Limit</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            User: {selectedUser?.username}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Daily Limit"
            type="number"
            fullWidth
            variant="outlined"
            value={newLimit}
            onChange={(e) => setNewLimit(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLimitDialog(false)}>Cancel</Button>
          <Button onClick={updateUserLimit} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
