/**
 * Dashboard Components Index
 * Centralized exports for all dashboard components
 */

// Core Dashboard Components
export { default as AuditTrail } from './AuditTrail'
export { default as ComplianceMetrics } from './ComplianceMetrics'
export { default as ComplianceOverview } from './ComplianceOverview'
export { default as DashboardDemo } from './DashboardDemo'
export { default as DashboardLayout } from './DashboardLayout'
export { default as RegulatoryAlerts } from './RegulatoryAlerts'
export { default as RiskHeatmap } from './RiskHeatmap'

// Component Types
export type {
    ComplianceMetric, ComplianceOverviewData, ComplianceOverviewProps
} from './ComplianceOverview'

export type {
    AlertFilters, RegulatoryAlert, RegulatoryAlertsProps
} from './RegulatoryAlerts'

export type {
    RiskCategory, RiskHeatmapProps,
    RiskItem
} from './RiskHeatmap'

export type {
    BenchmarkComparison, ComplianceMetricsProps,
    MetricData
} from './ComplianceMetrics'

export type {
    AuditEvent,
    AuditFilters, AuditTrailProps
} from './AuditTrail'

export type {
    DashboardLayoutProps,
    DashboardTab
} from './DashboardLayout'

export type {
    DashboardDemoProps
} from './DashboardDemo'
