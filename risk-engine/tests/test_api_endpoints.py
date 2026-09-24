# =============================================================================
# CyberRiskOS — Risk Engine API Endpoints Integration Tests
# Phase: Phase 2 — Risk Quantification
# Owner: TANISH (Risk Intelligence, Quantification & Decision Engine Lead)
# Spec: docs/RISK_ENGINE_CONTRACT.md
# =============================================================================

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "risk-engine"
    assert data["modelVersion"] == "1.0.0"


def test_evaluate_risk_single_endpoint():
    payload = {
        "asset": {
            "assetId": "srv-db-01",
            "assetName": "Main Customer DB",
            "criticalityTier": 2,
            "isInternetFacing": False,
            "controls": [
                {"controlCode": "MFA", "status": "IMPLEMENTED", "source": "AUDIT_VERIFIED"}
            ],
        },
        "vulnerability": {
            "cveId": "CVE-2021-44228",
            "cvssScore": 7.0,
            "cvssVersion": "3.1",
            "isKnownExploited": True,
        },
    }

    response = client.post("/api/v1/risk/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Tier 2 consequence scalar = 1.20; 70.0 * 1.20 = 84.00
    assert data["assetId"] == "srv-db-01"
    assert data["cveId"] == "CVE-2021-44228"
    assert data["riskScore"] == 84.00
    assert data["severity"] == "HIGH"
    assert data["modelVersion"] == "1.0.0"
    assert len(data["provenanceHash"]) == 64
    assert "CISA_KEV_ACTIVE_EXPLOITATION" in data["riskFlags"]
    assert "COMPENSATING_CONTROLS_ACTIVE" in data["riskFlags"]


def test_evaluate_risk_batch_endpoint():
    payload = {
        "evaluations": [
            {
                "asset": {
                    "assetId": "srv-01",
                    "assetName": "Web App",
                    "criticalityTier": 1,
                    "isInternetFacing": True,
                },
                "vulnerability": {
                    "cveId": "CVE-2021-44228",
                    "cvssScore": 10.0,
                    "isKnownExploited": True,
                },
            },
            {
                "asset": {
                    "assetId": "srv-02",
                    "assetName": "Dev Box",
                    "criticalityTier": 5,
                    "isInternetFacing": False,
                },
                "vulnerability": {
                    "cveId": "CVE-2022-22965",
                    "cvssScore": 5.0,
                    "isKnownExploited": False,
                },
            },
        ]
    }

    response = client.post("/api/v1/risk/evaluate/batch", json=payload)
    assert response.status_code == 200
    data = response.json()

    assert data["totalEvaluated"] == 2
    assert len(data["results"]) == 2
    # Tier 1 clamped max = 100.0
    assert data["results"][0]["riskScore"] == 100.00
    assert data["results"][0]["severity"] == "CRITICAL"
    # Tier 5 scalar = 0.60; 50.0 * 0.60 = 30.00
    assert data["results"][1]["riskScore"] == 30.00
    assert data["results"][1]["severity"] == "LOW"
