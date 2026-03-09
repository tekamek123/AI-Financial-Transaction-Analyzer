"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Cog6ToothIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ArrowPathIcon,
  BookmarkIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "@/components/LoadingSpinner";
import { apiClient } from "@/utils/api";
import { useToastHelpers } from "@/components/Toast";

interface RiskRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  weight: number;
  threshold: number;
  category:
    | "amount"
    | "time"
    | "merchant"
    | "frequency"
    | "location"
    | "pattern";
}

interface RiskScoringConfig {
  overall_threshold: number;
  high_risk_threshold: number;
  medium_risk_threshold: number;
  low_risk_threshold: number;
  auto_alert_enabled: boolean;
  rules: RiskRule[];
}

export default function RiskScoringPage() {
  const [config, setConfig] = useState<RiskScoringConfig>({
    overall_threshold: 70,
    high_risk_threshold: 80,
    medium_risk_threshold: 50,
    low_risk_threshold: 30,
    auto_alert_enabled: true,
    rules: [
      {
        id: "1",
        name: "High Amount",
        description:
          "Flag transactions exceeding account average by specified percentage",
        enabled: true,
        weight: 25,
        threshold: 300,
        category: "amount",
      },
      {
        id: "2",
        name: "Unusual Time",
        description: "Flag transactions during unusual hours (10 PM - 6 AM)",
        enabled: true,
        weight: 20,
        threshold: 50,
        category: "time",
      },
      {
        id: "3",
        name: "Unknown Merchant",
        description: "Flag transactions with unknown or suspicious merchants",
        enabled: true,
        weight: 30,
        threshold: 70,
        category: "merchant",
      },
      {
        id: "4",
        name: "High Frequency",
        description: "Flag multiple transactions within short time period",
        enabled: true,
        weight: 15,
        threshold: 60,
        category: "frequency",
      },
      {
        id: "5",
        name: "Geographic Anomaly",
        description: "Flag transactions from unusual locations",
        enabled: false,
        weight: 10,
        threshold: 40,
        category: "location",
      },
    ],
  });

  const [hasChanges, setHasChanges] = useState(false);
  const { success: showSuccess, error: showError } = useToastHelpers();

  // Mock data - in real app, use this to fetch data
  // const { data: currentConfig, isLoading, error } = useQuery({
  //   queryKey: ['risk-scoring-config'],
  //   queryFn: () => apiClient.riskScoring.getConfig()
  // })

  // Update configuration mutation
  const updateMutation = useMutation({
    mutationFn: (newConfig: RiskScoringConfig) =>
      apiClient.riskScoring.updateConfig(newConfig),
    onSuccess: () => {
      showSuccess(
        "Configuration Saved",
        "Risk scoring configuration has been updated",
      );
      setHasChanges(false);
    },
    onError: (error) => {
      const apiError = error as any;
      showError(
        "Save Failed",
        apiError.message || "Failed to save configuration",
      );
    },
  });

  const isLoading = false;
  const error = null;

  const handleRuleToggle = (ruleId: string) => {
    setConfig((prev) => ({
      ...prev,
      rules: prev.rules.map((rule) =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule,
      ),
    }));
    setHasChanges(true);
  };

  const handleRuleWeightChange = (ruleId: string, weight: number) => {
    setConfig((prev) => ({
      ...prev,
      rules: prev.rules.map((rule) =>
        rule.id === ruleId
          ? { ...rule, weight: Math.max(0, Math.min(100, weight)) }
          : rule,
      ),
    }));
    setHasChanges(true);
  };

  const handleRuleThresholdChange = (ruleId: string, threshold: number) => {
    setConfig((prev) => ({
      ...prev,
      rules: prev.rules.map((rule) =>
        rule.id === ruleId
          ? { ...rule, threshold: Math.max(0, Math.min(100, threshold)) }
          : rule,
      ),
    }));
    setHasChanges(true);
  };

  const handleThresholdChange = (
    field: keyof RiskScoringConfig,
    value: number,
  ) => {
    setConfig((prev) => ({
      ...prev,
      [field]: Math.max(0, Math.min(100, value)),
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate(config);
  };

  const handleReset = () => {
    // Reset to default values
    setConfig({
      overall_threshold: 70,
      high_risk_threshold: 80,
      medium_risk_threshold: 50,
      low_risk_threshold: 30,
      auto_alert_enabled: true,
      rules: [
        {
          id: "1",
          name: "High Amount",
          description:
            "Flag transactions exceeding account average by specified percentage",
          enabled: true,
          weight: 25,
          threshold: 300,
          category: "amount",
        },
        {
          id: "2",
          name: "Unusual Time",
          description: "Flag transactions during unusual hours (10 PM - 6 AM)",
          enabled: true,
          weight: 20,
          threshold: 50,
          category: "time",
        },
        {
          id: "3",
          name: "Unknown Merchant",
          description: "Flag transactions with unknown or suspicious merchants",
          enabled: true,
          weight: 30,
          threshold: 70,
          category: "merchant",
        },
        {
          id: "4",
          name: "High Frequency",
          description: "Flag multiple transactions within short time period",
          enabled: true,
          weight: 15,
          threshold: 60,
          category: "frequency",
        },
        {
          id: "5",
          name: "Geographic Anomaly",
          description: "Flag transactions from unusual locations",
          enabled: false,
          weight: 10,
          threshold: 40,
          category: "location",
        },
      ],
    });
    setHasChanges(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "amount":
        return <span className="text-green-600">💰</span>;
      case "time":
        return <span className="text-blue-600">🕐</span>;
      case "merchant":
        return <span className="text-purple-600">🏪</span>;
      case "frequency":
        return <span className="text-orange-600">⚡</span>;
      case "location":
        return <span className="text-red-600">📍</span>;
      case "pattern":
        return <span className="text-yellow-600">🔍</span>;
      default:
        return <span className="text-gray-600">⚙️</span>;
    }
  };

  const getTotalWeight = () => {
    return config.rules
      .filter((rule) => rule.enabled)
      .reduce((sum, rule) => sum + rule.weight, 0);
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-medium text-gray-900 mb-2">
            Error loading configuration
          </h2>
          <p className="text-gray-500">Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Risk Scoring Configuration
              </h1>
              <p className="mt-2 text-gray-600">
                Configure risk scoring rules and thresholds
              </p>
            </div>

            <div className="flex space-x-3">
              <button onClick={handleReset} className="btn btn-outline">
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Reset to Default
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges || updateMutation.isPending}
                className="btn btn-primary disabled:opacity-50"
              >
                {updateMutation.isPending ? (
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <BookmarkIcon className="h-4 w-4 mr-2" />
                    Save Changes
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Global Thresholds */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Global Thresholds
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Risk Threshold
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={config.overall_threshold}
                      onChange={(e) =>
                        handleThresholdChange(
                          "overall_threshold",
                          parseInt(e.target.value),
                        )
                      }
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-gray-900 w-12">
                      {config.overall_threshold}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum score to trigger alerts
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    High Risk Threshold
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={config.high_risk_threshold}
                      onChange={(e) =>
                        handleThresholdChange(
                          "high_risk_threshold",
                          parseInt(e.target.value),
                        )
                      }
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-gray-900 w-12">
                      {config.high_risk_threshold}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Score threshold for high risk classification
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medium Risk Threshold
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={config.medium_risk_threshold}
                      onChange={(e) =>
                        handleThresholdChange(
                          "medium_risk_threshold",
                          parseInt(e.target.value),
                        )
                      }
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-gray-900 w-12">
                      {config.medium_risk_threshold}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Score threshold for medium risk classification
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Low Risk Threshold
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={config.low_risk_threshold}
                      onChange={(e) =>
                        handleThresholdChange(
                          "low_risk_threshold",
                          parseInt(e.target.value),
                        )
                      }
                      className="flex-1"
                    />
                    <span className="text-sm font-medium text-gray-900 w-12">
                      {config.low_risk_threshold}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Score threshold for low risk classification
                  </p>
                </div>

                <div className="md:col-span-2 lg:col-span-1">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={config.auto_alert_enabled}
                      onChange={(e) =>
                        handleThresholdChange(
                          "auto_alert_enabled",
                          e.target.checked ? 1 : 0,
                        )
                      }
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Enable Auto-Alert Generation
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 mt-1 ml-7">
                    Automatically generate alerts for high-risk transactions
                  </p>
                </div>
              </div>
            </div>

            {/* Risk Rules */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">
                  Risk Scoring Rules
                </h2>
                <div className="text-sm text-gray-500">
                  Total Weight: {getTotalWeight()}%
                </div>
              </div>

              <div className="space-y-4">
                {config.rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {/* Category Icon */}
                        <div className="flex-shrink-0 mt-1">
                          {getCategoryIcon(rule.category)}
                        </div>

                        {/* Rule Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-sm font-medium text-gray-900">
                              {rule.name}
                            </h3>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                rule.enabled
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {rule.enabled ? "Enabled" : "Disabled"}
                            </span>
                          </div>

                          <p className="text-sm text-gray-600 mb-3">
                            {rule.description}
                          </p>

                          {/* Rule Controls */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Weight (%)
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={rule.weight}
                                  onChange={(e) =>
                                    handleRuleWeightChange(
                                      rule.id,
                                      parseInt(e.target.value),
                                    )
                                  }
                                  disabled={!rule.enabled}
                                  className="flex-1 disabled:opacity-50"
                                />
                                <span className="text-sm font-medium text-gray-900 w-8">
                                  {rule.weight}
                                </span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Threshold
                              </label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={rule.threshold}
                                  onChange={(e) =>
                                    handleRuleThresholdChange(
                                      rule.id,
                                      parseInt(e.target.value),
                                    )
                                  }
                                  disabled={!rule.enabled}
                                  className="flex-1 disabled:opacity-50"
                                />
                                <span className="text-sm font-medium text-gray-900 w-8">
                                  {rule.threshold}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Toggle */}
                      <div className="ml-4">
                        <button
                          onClick={() => handleRuleToggle(rule.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            rule.enabled ? "bg-blue-600" : "bg-gray-200"
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              rule.enabled ? "translate-x-6" : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rule Summary */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <InformationCircleIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Risk Scoring Information</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                      <li>
                        Weights determine the impact of each rule on the overall
                        risk score
                      </li>
                      <li>Thresholds define the sensitivity of each rule</li>
                      <li>
                        Only enabled rules contribute to the final risk score
                      </li>
                      <li>
                        Higher weights increase the rule's influence on risk
                        assessment
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
