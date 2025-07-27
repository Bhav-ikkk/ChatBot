"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "./contexts/AuthContext"
import { Container, Typography, Button, Box, Grid, Card, CardContent, CircularProgress } from "@mui/material"
import { Api as ApiIcon, Speed as SpeedIcon, Security as SecurityIcon } from "@mui/icons-material"

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 8 }}>
        <Typography variant="h2" component="h1" gutterBottom align="center">
          AI Chatbot API
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom align="center" color="text.secondary">
          Scalable AI chatbot with Ollama and HuggingFace integration
        </Typography>

        <Box sx={{ mt: 4, mb: 6, textAlign: "center" }}>
          <Button variant="contained" size="large" sx={{ mr: 2 }} onClick={() => router.push("/auth/register")}>
            Get Started
          </Button>
          <Button variant="outlined" size="large" onClick={() => router.push("/auth/login")}>
            Sign In
          </Button>
        </Box>

        <Grid container spacing={4} sx={{ mt: 4 }}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: "center", p: 3 }}>
                <ApiIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Easy API Integration
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Simple REST API with authentication and rate limiting
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: "center", p: 3 }}>
                <SpeedIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  High Performance
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Powered by Ollama and HuggingFace for fast responses
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent sx={{ textAlign: "center", p: 3 }}>
                <SecurityIcon sx={{ fontSize: 48, color: "primary.main", mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Secure & Scalable
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Built with security and scalability in mind
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  )
}
