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
  Chip,
  Button,
  Alert,
  CircularProgress,
} from "@mui/material"
import { Refresh as RefreshIcon, CheckCircle as CheckIcon, Error as ErrorIcon } from "@mui/icons-material"

export default function ModelsPage() {
  const { user } = useAuth()
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchModels()
  }, [])

  const fetchModels = async () => {
    setLoading(true)
    setError("")
    try {
      const response = await fetch("http://localhost:8000/api/models")
      if (response.ok) {
        const data = await response.json()
        setModels(data.models)
      } else {
        setError("Failed to fetch models")
      }
    } catch (error) {
      setError("Network error while fetching models")
    } finally {
      setLoading(false)
    }
  }

  const getProviderColor = (provider) => {
    switch (provider) {
      case "ollama":
        return "primary"
      case "gemini":
        return "secondary"
      case "huggingface":
        return "success"
      default:
        return "default"
    }
  }

  const getProviderIcon = (available) => {
    return available ? <CheckIcon color="success" /> : <ErrorIcon color="error" />
  }

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" component="h1">
            Available AI Models
          </Typography>
          <Button variant="outlined" startIcon={<RefreshIcon />} onClick={fetchModels}>
            Refresh
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        <Alert severity="info" sx={{ mb: 4 }}>
          These are the AI models available for your chatbot. The system will automatically fallback between models if
          one is unavailable.
        </Alert>

        <Grid container spacing={3}>
          {models.map((model) => (
            <Grid item xs={12} md={6} lg={4} key={model.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="h3">
                      {model.name}
                    </Typography>
                    {getProviderIcon(model.available)}
                  </Box>

                  <Chip
                    label={model.provider.toUpperCase()}
                    color={getProviderColor(model.provider)}
                    size="small"
                    sx={{ mb: 2 }}
                  />

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Model ID: <code>{model.id}</code>
                  </Typography>

                  <Typography variant="body2" color={model.available ? "success.main" : "error.main"}>
                    Status: {model.available ? "Available" : "Unavailable"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Model Fallback Order
          </Typography>
          <Alert severity="info">
            <Typography variant="body2">
              1. <strong>Ollama Models</strong> - Local, fast, private
              <br />
              2. <strong>Gemini Pro</strong> - Google's powerful model (requires API key)
              <br />
              3. <strong>HuggingFace Models</strong> - Open source fallback
            </Typography>
          </Alert>
        </Box>
      </Box>
    </Container>
  )
}
