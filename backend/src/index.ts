import app from './server';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`CyberRiskOS API Gateway running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Organizations: http://localhost:${PORT}/api/organizations`);
  console.log(`Business Units: http://localhost:${PORT}/api/business-units`);
});
