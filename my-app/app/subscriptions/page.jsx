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
  CardActions,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material"
import { Check as CheckIcon, Star as StarIcon } from "@mui/icons-material"

export default function Subscriptions() {
  const { user } = useAuth()
  const [plans, setPlans] = useState([])
  const [currentSubscription, setCurrentSubscription] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchPlans()
    fetchCurrentSubscription()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/plans")
      if (response.ok) {
        const plansData = await response.json()
        setPlans(plansData)
      }
    } catch (error) {
      console.error("Error fetching plans:", error)
    }
  }

  const fetchCurrentSubscription = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8000/api/subscription", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const subscription = await response.json()
        setCurrentSubscription(subscription)
      }
    } catch (error) {
      console.error("Error fetching subscription:", error)
    }
  }

  const subscribe = async (planId) => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("http://localhost:8000/api/subscribe", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan_id: planId }),
      })

      if (response.ok) {
        alert("Subscription created successfully!")
        fetchCurrentSubscription()
      } else {
        alert("Failed to create subscription")
      }
    } catch (error) {
      console.error("Error creating subscription:", error)
      alert("Error creating subscription")
    } finally {
      setLoading(false)
    }
  }

  const getPlanFeatures = (plan) => {
    const features = [`${plan.daily_requests} requests per day`, "API access", "Email support"]

    if (plan.name === "Pro") {
      features.push("Priority support", "Advanced analytics")
    }

    if (plan.name === "Enterprise") {
      features.push("Priority support", "Advanced analytics", "Custom integrations", "Dedicated account manager")
    }

    return features
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Choose Your Plan
        </Typography>

        <Typography variant="h6" component="h2" gutterBottom align="center" color="text.secondary" sx={{ mb: 4 }}>
          Upgrade your AI chatbot experience
        </Typography>

        {currentSubscription && (
          <Card sx={{ mb: 4, bgcolor: "primary.light", color: "primary.contrastText" }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Subscription
              </Typography>
              <Typography variant="body1">
                Plan: {currentSubscription.plan_name} - Status: {currentSubscription.status}
              </Typography>
            </CardContent>
          </Card>
        )}

        <Grid container spacing={4} justifyContent="center">
          {plans.map((plan) => (
            <Grid item xs={12} md={4} key={plan.id}>
              <Card
                sx={{
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  ...(plan.name === "Pro" && {
                    border: 2,
                    borderColor: "primary.main",
                  }),
                }}
              >
                {plan.name === "Pro" && (
                  <Chip
                    icon={<StarIcon />}
                    label="Most Popular"
                    color="primary"
                    sx={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                    }}
                  />
                )}

                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" component="h3" gutterBottom>
                    {plan.name}
                  </Typography>

                  <Typography variant="h3" component="div" color="primary" gutterBottom>
                    ${plan.price}
                    <Typography variant="h6" component="span" color="text.secondary">
                      /month
                    </Typography>
                  </Typography>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    {plan.description}
                  </Typography>

                  <List dense>
                    {getPlanFeatures(plan).map((feature, index) => (
                      <ListItem key={index} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckIcon color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={feature} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>

                <CardActions sx={{ p: 2 }}>
                  <Button
                    fullWidth
                    variant={plan.name === "Pro" ? "contained" : "outlined"}
                    size="large"
                    onClick={() => subscribe(plan.id)}
                    disabled={loading || plan.price === 0}
                  >
                    {plan.price === 0 ? "Current Plan" : `Subscribe to ${plan.name}`}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box sx={{ mt: 6, textAlign: "center" }}>
          <Typography variant="body2" color="text.secondary">
            All plans include a 7-day free trial. Cancel anytime.
          </Typography>
        </Box>
      </Box>
    </Container>
  )
}
