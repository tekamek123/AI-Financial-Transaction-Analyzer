"use client";

import { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  ChartBarIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  ArrowDownTrayIcon,
  CalculatorIcon,
} from "@heroicons/react/24/outline";
import LoadingSpinner from "./LoadingSpinner";
import { useToastHelpers } from "./Toast";

interface FraudFactor {
  name: string;
  weight: number;
  current_value: number;
  threshold: number;
  impact: "low" | "medium" | "high" | "critical";
  description: string;
}

interface ProbabilityCalculation {
  transaction_id: string;
  overall_probability: number;
  confidence_interval: { lower: number; upper: number };
  risk_factors: FraudFactor[];
  model_predictions: {
    isolation_forest: number;
    k_means: number;
    ensemble: number;
  };
  historical_comparison: {
    account_average: number;
    peer_group_average: number;
    industry_baseline: number;
  };
  recommendations: string[];
  explanation: string;
}

interface FraudProbabilityCalculatorProps {
  transactionId?: string;
  amount?: number;
  merchant?: string;
  accountId?: string;
  timestamp?: string;
  className?: string;
}

export default function FraudProbabilityCalculator({
  transactionId = "",
  amount = 0,
  merchant = "",
  accountId = "",
  timestamp = "",
  className = "",
}: FraudProbabilityCalculatorProps) {
  const [activeTab, setActiveTab] = useState<"factors" | "history" | "models">(
    "factors",
  );
  const [calculation, setCalculation] = useState<ProbabilityCalculation | null>(
    null,
  );
  const [isCalculating, setIsCalculating] = useState(false);
  const { success: showSuccess } = useToastHelpers();

  // Mock calculation - in real app, use this to fetch data
  const mockCalculation: ProbabilityCalculation = {
    transaction_id: transactionId,
    overall_probability: 23.4,
    confidence_interval: { lower: 18.2, upper: 28.6 },
    risk_factors: [
      {
        name: "Amount Deviation",
        weight: 30,
        current_value: 85,
        threshold: 50,
        impact: "high",
        description: "Transaction amount is 85% above account average",
      },
      {
        name: "Unusual Time",
        weight: 25,
        current_value: 92,
        threshold: 70,
        impact: "high",
        description: "Transaction occurred during high-risk hours (2-4 AM)",
      },
      {
        name: "Merchant Risk",
        weight: 20,
        current_value: 45,
        threshold: 60,
        impact: "medium",
        description:
          "Merchant has moderate risk profile based on historical data",
      },
      {
        name: "Frequency Pattern",
        weight: 15,
        current_value: 78,
        threshold: 80,
        impact: "high",
        description: "High transaction frequency detected in past 24 hours",
      },
      {
        name: "Geographic Anomaly",
        weight: 10,
        current_value: 15,
        threshold: 40,
        impact: "low",
        description: "Transaction from unusual location for this account",
      },
    ],
    model_predictions: {
      isolation_forest: 21.2,
      k_means: 18.7,
      ensemble: 23.4,
    },
    historical_comparison: {
      account_average: 12.5,
      peer_group_average: 18.3,
      industry_baseline: 15.8,
    },
    recommendations: [
      "Verify transaction legitimacy with customer",
      "Monitor account for additional suspicious activity",
      "Consider placing temporary hold on account",
      "Review merchant history and authentication",
    ],
    explanation:
      "The transaction exhibits several risk factors including unusual timing and amount deviation. While the merchant has moderate risk, the combination of factors elevates the overall fraud probability. The ensemble model prediction of 23.4% aligns with our confidence interval.",
  };

  const handleCalculate = () => {
    setIsCalculating(true);

    // Simulate API call
    setTimeout(() => {
      setCalculation(mockCalculation);
      setIsCalculating(false);
      showSuccess(
        "Calculation Complete",
        "Fraud probability has been calculated",
      );
    }, 2000);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "critical":
        return "text-red-600 bg-red-100";
      case "high":
        return "text-orange-600 bg-orange-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 50) return "text-red-600";
    if (probability >= 25) return "text-orange-600";
    if (probability >= 15) return "text-yellow-600";
    if (probability >= 5) return "text-blue-600";
    return "text-green-600";
  };

  const getProbabilityLevel = (probability: number) => {
    if (probability >= 50) return "Very High";
    if (probability >= 25) return "High";
    if (probability >= 15) return "Medium";
    if (probability >= 5) return "Low";
    return "Very Low";
  };

  const handleExport = () => {
    const reportData = {
      transaction_id: transactionId,
      calculation_date: new Date().toISOString(),
      overall_probability: calculation?.overall_probability,
      confidence_interval: calculation?.confidence_interval,
      risk_factors: calculation?.risk_factors,
      model_predictions: calculation?.model_predictions,
      historical_comparison: calculation?.historical_comparison,
      recommendations: calculation?.recommendations,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fraud_analysis_${transactionId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    showSuccess("Export Successful", "Fraud analysis report has been exported");
  };

  // Prepare chart data
  const modelComparisonData = calculation
    ? [
        {
          model: "Isolation Forest",
          probability: calculation.model_predictions.isolation_forest,
        },
        {
          model: "K-Means",
          probability: calculation.model_predictions.k_means,
        },
        {
          model: "Ensemble",
          probability: calculation.model_predictions.ensemble,
        },
      ]
    : [];

  const historicalComparisonData = calculation
    ? [
        {
          metric: "Account Average",
          value: calculation.historical_comparison.account_average,
        },
        {
          metric: "Peer Group",
          value: calculation.historical_comparison.peer_group_average,
        },
        {
          metric: "Industry Baseline",
          value: calculation.historical_comparison.industry_baseline,
        },
      ]
    : [];

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
    >
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Fraud Probability Calculator
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Advanced ML-based fraud probability analysis
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleCalculate}
              disabled={isCalculating}
              className="btn btn-primary disabled:opacity-50"
            >
              {isCalculating ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" className="mr-2" />
                  Calculating...
                </div>
              ) : (
                <div className="flex items-center">
                  <CalculatorIcon className="h-4 w-4 mr-2" />
                  Calculate
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {calculation ? (
        <div className="p-4">
          {/* Overall Probability */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-2">
                Overall Fraud Probability
              </div>
              <div
                className={`text-4xl font-bold ${getProbabilityColor(calculation.overall_probability)}`}
              >
                {calculation.overall_probability.toFixed(1)}%
              </div>
              <div className="text-lg font-medium text-gray-700 mt-1">
                {getProbabilityLevel(calculation.overall_probability)} Risk
              </div>
              <div className="text-sm text-gray-500 mt-2">
                Confidence: {calculation.confidence_interval.lower.toFixed(1)}%
                - {calculation.confidence_interval.upper.toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <div className="flex space-x-8">
              {[
                {
                  id: "factors",
                  label: "Risk Factors",
                  icon: <ExclamationTriangleIcon className="h-4 w-4" />,
                },
                {
                  id: "history",
                  label: "Historical Context",
                  icon: <ChartBarIcon className="h-4 w-4" />,
                },
                {
                  id: "models",
                  label: "Model Predictions",
                  icon: <ShieldCheckIcon className="h-4 w-4" />,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === "factors" && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  Risk Factor Analysis
                </h4>
                <div className="space-y-3">
                  {calculation.risk_factors.map((factor, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-900">
                            {factor.name}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${getImpactColor(factor.impact)}`}
                          >
                            {factor.impact}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Weight: {factor.weight}%
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Current Value
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {factor.current_value}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Threshold
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {factor.threshold}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="h-2 bg-blue-500 rounded-full"
                            style={{
                              width: `${Math.min(100, (factor.current_value / factor.threshold) * 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {factor.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "history" && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  Historical Context
                </h4>

                {/* Comparison Chart */}
                <div className="h-64 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={historicalComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Historical Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-blue-600 font-medium mb-1">
                      Account Average
                    </div>
                    <div className="text-2xl font-bold text-blue-900">
                      {calculation.historical_comparison.account_average.toFixed(
                        1,
                      )}
                      %
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-purple-600 font-medium mb-1">
                      Peer Group
                    </div>
                    <div className="text-2xl font-bold text-purple-900">
                      {calculation.historical_comparison.peer_group_average.toFixed(
                        1,
                      )}
                      %
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-green-600 font-medium mb-1">
                      Industry Baseline
                    </div>
                    <div className="text-2xl font-bold text-green-900">
                      {calculation.historical_comparison.industry_baseline.toFixed(
                        1,
                      )}
                      %
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "models" && (
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  Model Predictions
                </h4>

                {/* Model Comparison Chart */}
                <div className="h-64 mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={modelComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="model" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar
                        dataKey="probability"
                        fill="#3b82f6"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Model Details */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-3">
                      Isolation Forest
                    </h5>
                    <div className="text-2xl font-bold text-blue-600">
                      {calculation.model_predictions.isolation_forest.toFixed(
                        1,
                      )}
                      %
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Tree-based ensemble method
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h5 className="text-sm font-medium text-gray-900 mb-3">
                      K-Means
                    </h5>
                    <div className="text-2xl font-bold text-purple-600">
                      {calculation.model_predictions.k_means.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Clustering-based anomaly detection
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-4 bg-green-50">
                    <h5 className="text-sm font-medium text-gray-900 mb-3">
                      Ensemble Model
                    </h5>
                    <div className="text-2xl font-bold text-green-600">
                      {calculation.model_predictions.ensemble.toFixed(1)}%
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Combined prediction from all models
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Explanation */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
            <div className="flex items-start space-x-3">
              <InformationCircleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h5 className="text-sm font-medium text-yellow-800 mb-2">
                  AI Explanation
                </h5>
                <p className="text-sm text-yellow-700 leading-relaxed">
                  {calculation.explanation}
                </p>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="mt-6">
            <h4 className="text-md font-medium text-gray-900 mb-4">
              Recommendations
            </h4>
            <div className="space-y-2">
              {calculation.recommendations.map((recommendation, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg"
                >
                  <ShieldCheckIcon className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Export */}
          <div className="mt-6 flex justify-center">
            <button onClick={handleExport} className="btn btn-outline">
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export Analysis Report
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <CalculatorIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Ready to Calculate
          </h3>
          <p className="text-gray-600">
            Enter transaction details and click "Calculate" to analyze fraud
            probability using our advanced ML models.
          </p>
        </div>
      )}
    </div>
  );
}
