"use client"
import { useState } from "react"
import { useAuth } from "../contexts/AuthContext"
import { Container, Typography, Box, Card, CardContent, TextField, Button, Alert, Paper } from "@mui/material"

export default function WidgetGenerator() {
  const { user } = useAuth()
  const [apiKey, setApiKey] = useState("")
  const [widgetCode, setWidgetCode] = useState("")

  const generateWidget = () => {
    if (!apiKey) {
      alert("Please enter an API key")
      return
    }

    const code = `<!-- AI Chatbot Widget -->
<script>
  (function() {
    // Load widget CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://your-domain.com/widget.css';
    document.head.appendChild(link);

    // Load widget HTML
    const script = document.createElement('script');
    script.src = 'https://your-domain.com/widget.js';
    script.onload = function() {
      window.ChatbotWidget.init({
        apiKey: '${apiKey}',
        apiUrl: 'http://localhost:8000',
        theme: 'light',
        position: 'bottom-right'
      });
    };
    document.head.appendChild(script);
  })();
</script>`

    setWidgetCode(code)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(widgetCode)
    alert("Widget code copied to clipboard!")
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Widget Generator
        </Typography>

        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Generate Embeddable Widget
            </Typography>

            <TextField
              fullWidth
              label="API Key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
              sx={{ mb: 2 }}
            />

            <Button variant="contained" onClick={generateWidget} disabled={!apiKey}>
              Generate Widget Code
            </Button>
          </CardContent>
        </Card>

        {widgetCode && (
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Widget Code</Typography>
                <Button variant="outlined" onClick={copyToClipboard}>
                  Copy Code
                </Button>
              </Box>

              <Paper sx={{ p: 2, bgcolor: "#f5f5f5" }}>
                <Typography
                  component="pre"
                  sx={{
                    fontFamily: "monospace",
                    fontSize: "0.875rem",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-all",
                  }}
                >
                  {widgetCode}
                </Typography>
              </Paper>

              <Alert severity="info" sx={{ mt: 2 }}>
                Copy this code and paste it into your website's HTML to add the chatbot widget.
              </Alert>
            </CardContent>
          </Card>
        )}
      </Box>
    </Container>
  )
}
