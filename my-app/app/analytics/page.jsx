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
  LinearProgress,
} from "@mui/material"
import { TrendingUp as TrendingUpIcon, Api as ApiIcon, Schedule as ScheduleIcon } from "@mui/icons-material"

export default function Analytics() {
  const { user } = useAuth()
  const [analytics, setAnalytics] = useState({})
  const [usage, setUsage] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
    fetchUsage()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8000/api/analytics", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    }
  }

  const fetchUsage = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8000/api/usage", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setUsage(data)
      }
    } catch (error) {
      console.error("Error fetching usage:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Container>
        <Box sx={{ py: 4 }}>
          <LinearProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Analytics Dashboard
        </Typography>

        <Grid container spacing={4} sx={{ mb: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <ApiIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Total Requests</Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {analytics.total_requests || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  This month
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Success Rate</Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {analytics.success_rate || 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last 30 days
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <ScheduleIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Avg Response Time</Typography>
                </Box>
                <Typography variant="h4" color="primary">
                  {analytics.avg_response_time || 0}ms
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Last 7 days
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Usage
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Requests</TableCell>
                    <TableCell>Model Used</TableCell>
                    <TableCell>Response Time</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {usage.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                      <TableCell>{row.requests}</TableCell>
                      <TableCell>{row.model}</TableCell>
                      <TableCell>{row.response_time}ms</TableCell>
                      <TableCell>
                        <Typography variant="body2" color={row.status === "success" ? "success.main" : "error.main"}>
                          {row.status}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}
