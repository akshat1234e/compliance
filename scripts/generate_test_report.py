#!/usr/bin/env python3
"""
Backup Verification Test Report Generator
Generates comprehensive HTML reports for automated backup verification test results
"""

import json
import argparse
import sys
from datetime import datetime
from typing import Dict, Any, List


class BackupTestReportGenerator:
    """Generates HTML reports for backup verification test results"""

    def __init__(self):
        self.template = self._get_html_template()

    def generate_report(self, results_file: str, output_file: str) -> None:
        """Generate HTML test report"""
        try:
            with open(results_file, 'r') as f:
                results = json.load(f)

            report_html = self._generate_html_report(results)

            with open(output_file, 'w') as f:
                f.write(report_html)

            print(f"Test report generated: {output_file}")

        except Exception as e:
            print(f"Error generating test report: {e}")
            sys.exit(1)

    def _generate_html_report(self, results: Dict[str, Any]) -> str:
        """Generate HTML content for the test report"""
        timestamp = results.get('timestamp', datetime.now().isoformat())
        test_execution = results.get('test_execution', {})

        total_tests = test_execution.get('total_tests', 0)
        passed_tests = test_execution.get('passed_tests', 0)
        failed_tests = test_execution.get('failed_tests', 0)

        # Calculate success rate
        success_rate = (passed_tests / max(total_tests, 1)) * 100

        # Determine overall status
        overall_status = "PASS" if failed_tests == 0 else "FAIL"
        status_color = "success" if overall_status == "PASS" else "danger"

        # Generate sections
        summary_section = self._generate_summary_section(test_execution)
        test_suites_section = self._generate_test_suites_section(test_execution.get('test_suites', {}))
        recommendations_section = self._generate_recommendations_section(test_execution)

        return self.template.format(
            timestamp=timestamp,
            overall_status=overall_status,
            status_color=status_color,
            total_tests=total_tests,
            passed_tests=passed_tests,
            failed_tests=failed_tests,
            success_rate=success_rate,
            summary_section=summary_section,
            test_suites_section=test_suites_section,
            recommendations_section=recommendations_section
        )

    def _generate_summary_section(self, test_execution: Dict[str, Any]) -> str:
        """Generate test execution summary section"""
        total_tests = test_execution.get('total_tests', 0)
        passed_tests = test_execution.get('passed_tests', 0)
        failed_tests = test_execution.get('failed_tests', 0)
        success_rate = (passed_tests / max(total_tests, 1)) * 100

        return f"""
        <div class='row'>
            <div class='col-md-3'>
                <div class='card text-center border-primary'>
                    <div class='card-body'>
                        <h5 class='card-title text-primary'>Total Tests</h5>
                        <h2 class='display-4 text-primary'>{total_tests}</h2>
                    </div>
                </div>
            </div>
            <div class='col-md-3'>
                <div class='card text-center border-success'>
                    <div class='card-body'>
                        <h5 class='card-title text-success'>Passed</h5>
                        <h2 class='display-4 text-success'>{passed_tests}</h2>
                    </div>
                </div>
            </div>
            <div class='col-md-3'>
                <div class='card text-center border-danger'>
                    <div class='card-body'>
                        <h5 class='card-title text-danger'>Failed</h5>
                        <h2 class='display-4 text-danger'>{failed_tests}</h2>
                    </div>
                </div>
            </div>
            <div class='col-md-3'>
                <div class='card text-center border-info'>
                    <div class='card-body'>
                        <h5 class='card-title text-info'>Success Rate</h5>
                        <h2 class='display-4 text-info'>{success_rate:.1f}%</h2>
                    </div>
                </div>
            </div>
        </div>
        """

    def _generate_test_suites_section(self, test_suites: Dict[str, Any]) -> str:
        """Generate detailed test suites section"""
        if not test_suites:
            return "<p>No test suite results available.</p>"

        html = ""

        for suite_name, suite_data in test_suites.items():
            status = "passed" if suite_data.get('passed', False) else "failed"
            status_class = 'success' if status == 'passed' else 'danger'
            status_icon = '✓' if status == 'passed' else '✗'

            html += f"""
            <div class='card mb-4'>
                <div class='card-header bg-{status_class} text-white'>
                    <h4 class='mb-0'>
                        <span class='badge badge-light me-2'>{status_icon}</span>
                        {suite_name.replace('_', ' ').title()}
                    </h4>
                </div>
                <div class='card-body'>
            """

            # Database Integrity Tests
            if suite_name == 'database_integrity':
                html += f"""
                    <div class='row'>
                        <div class='col-md-6'>
                            <h6>Database Structure</h6>
                            <ul class='list-unstyled'>
                                <li><strong>Tables:</strong> {suite_data.get('table_count', 'N/A')}</li>
                                <li><strong>Constraints:</strong> {suite_data.get('constraint_count', 'N/A')}</li>
                                <li><strong>Indexes:</strong> {suite_data.get('index_count', 'N/A')}</li>
                            </ul>
                        </div>
                        <div class='col-md-6'>
                            <h6>Data Quality</h6>
                            <ul class='list-unstyled'>
                                <li><strong>Orphaned Records:</strong>
                                    <span class='badge badge-{"success" if suite_data.get("orphaned_records", 0) == 0 else "warning"}'>
                                        {suite_data.get('orphaned_records', 'N/A')}
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                """

            # Redis Integrity Tests
            elif suite_name == 'redis_integrity':
                html += f"""
                    <div class='row'>
                        <div class='col-md-6'>
                            <h6>Cache Statistics</h6>
                            <ul class='list-unstyled'>
                                <li><strong>Total Keys:</strong> {suite_data.get('key_count', 'N/A')}</li>
                                <li><strong>Memory Usage:</strong> {suite_data.get('memory_usage', 'N/A')}</li>
                            </ul>
                        </div>
                        <div class='col-md-6'>
                            <h6>Key Distribution</h6>
                            <ul class='list-unstyled'>
                                <li><strong>Session Keys:</strong> {suite_data.get('session_keys', 'N/A')}</li>
                                <li><strong>Cache Keys:</strong> {suite_data.get('cache_keys', 'N/A')}</li>
                            </ul>
                        </div>
                    </div>
                """

            # Performance Tests
            elif suite_name == 'performance_tests':
                pg_status = "success" if suite_data.get('postgresql_passed', False) else "danger"
                redis_status = "success" if suite_data.get('redis_passed', False) else "danger"

                html += f"""
                    <div class='row'>
                        <div class='col-md-6'>
                            <h6>Restore Performance</h6>
                            <div class='mb-2'>
                                <span class='badge badge-{pg_status}'>PostgreSQL</span>
                                <span class='ms-2'>{suite_data.get('postgresql_restore_seconds', 'N/A')}s</span>
                                <small class='text-muted'>(Threshold: 300s)</small>
                            </div>
                            <div class='mb-2'>
                                <span class='badge badge-{redis_status}'>Redis</span>
                                <span class='ms-2'>{suite_data.get('redis_restore_seconds', 'N/A')}s</span>
                                <small class='text-muted'>(Threshold: 60s)</small>
                            </div>
                        </div>
                        <div class='col-md-6'>
                            <h6>Performance Analysis</h6>
                            <div class='progress mb-2'>
                                <div class='progress-bar bg-{pg_status}' style='width: {min(100, (300 - suite_data.get("postgresql_restore_seconds", 300)) / 300 * 100)}%'>
                                    PostgreSQL
                                </div>
                            </div>
                            <div class='progress'>
                                <div class='progress-bar bg-{redis_status}' style='width: {min(100, (60 - suite_data.get("redis_restore_seconds", 60)) / 60 * 100)}%'>
                                    Redis
                                </div>
                            </div>
                        </div>
                    </div>
                """

            # Cross-System Validation
            elif suite_name == 'cross_system_validation':
                consistency_status = "success" if suite_data.get('consistency_passed', False) else "warning"

                html += f"""
                    <div class='row'>
                        <div class='col-md-6'>
                            <h6>System Consistency</h6>
                            <ul class='list-unstyled'>
                                <li><strong>Database Users:</strong> {suite_data.get('user_count_db', 'N/A')}</li>
                                <li><strong>Redis Sessions:</strong> {suite_data.get('session_count_redis', 'N/A')}</li>
                            </ul>
                        </div>
                        <div class='col-md-6'>
                            <h6>Consistency Metrics</h6>
                            <div class='mb-2'>
                                <span class='badge badge-{consistency_status}'>Consistency Ratio</span>
                                <span class='ms-2'>{suite_data.get('consistency_ratio', 'N/A')}</span>
                            </div>
                            <small class='text-muted'>Expected ratio: ≥ 0.1 (active sessions to total users)</small>
                        </div>
                    </div>
                """

            html += """
                </div>
            </div>
            """

        return html

    def _generate_recommendations_section(self, test_execution: Dict[str, Any]) -> str:
        """Generate recommendations based on test results"""
        recommendations = []
        test_suites = test_execution.get('test_suites', {})

        # Check for failed tests and generate recommendations
        for suite_name, suite_data in test_suites.items():
            if not suite_data.get('passed', False):
                if suite_name == 'database_integrity':
                    if suite_data.get('orphaned_records', 0) > 0:
                        recommendations.append({
                            'type': 'warning',
                            'title': 'Data Integrity Issue',
                            'description': f'Found {suite_data.get("orphaned_records")} orphaned records. Consider running data cleanup procedures.'
                        })

                elif suite_name == 'performance_tests':
                    if not suite_data.get('postgresql_passed', True):
                        recommendations.append({
                            'type': 'danger',
                            'title': 'PostgreSQL Performance Issue',
                            'description': f'Restore time ({suite_data.get("postgresql_restore_seconds")}s) exceeds threshold (300s). Consider optimizing backup compression or storage.'
                        })

                    if not suite_data.get('redis_passed', True):
                        recommendations.append({
                            'type': 'danger',
                            'title': 'Redis Performance Issue',
                            'description': f'Restore time ({suite_data.get("redis_restore_seconds")}s) exceeds threshold (60s). Check Redis configuration and storage performance.'
                        })

                elif suite_name == 'cross_system_validation':
                    if not suite_data.get('consistency_passed', True):
                        recommendations.append({
                            'type': 'warning',
                            'title': 'Cross-System Consistency Issue',
                            'description': f'Session-to-user ratio ({suite_data.get("consistency_ratio")}) is below expected threshold. Verify cache synchronization.'
                        })

        # Add general recommendations if all tests passed
        if not recommendations:
            recommendations.append({
                'type': 'success',
                'title': 'All Tests Passed',
                'description': 'Backup verification completed successfully. All systems are functioning within expected parameters.'
            })
            recommendations.append({
                'type': 'info',
                'title': 'Maintenance Recommendation',
                'description': 'Continue monitoring backup performance trends and consider periodic optimization reviews.'
            })

        html = ""
        for rec in recommendations:
            html += f"""
            <div class='alert alert-{rec["type"]} mb-3'>
                <h6 class='alert-heading'>{rec["title"]}</h6>
                <p class='mb-0'>{rec["description"]}</p>
            </div>
            """

        return html

    def _get_html_template(self) -> str:
        """Get HTML template for the test report"""
        return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Backup Verification Test Report</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }}
        .card {{
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border: none;
        }}
        .badge {{
            font-size: 0.9em;
        }}
        .display-4 {{
            font-size: 2.5rem;
        }}
        .progress {{
            height: 20px;
        }}
        .alert-heading {{
            margin-bottom: 0.5rem;
        }}
    </style>
</head>
<body>
    <div class="header py-4 mb-4">
        <div class="container">
            <h1 class="mb-2">Backup Verification Test Report</h1>
            <p class="mb-1">Generated on {timestamp}</p>
            <div class="mt-3">
                <span class="badge badge-{status_color} fs-6">Overall Status: {overall_status}</span>
            </div>
        </div>
    </div>

    <div class="container">
        <!-- Test Summary -->
        <h2 class="mb-4">Test Execution Summary</h2>
        {summary_section}

        <!-- Test Suites Details -->
        <h2 class="mt-5 mb-4">Test Suite Results</h2>
        {test_suites_section}

        <!-- Recommendations -->
        <h2 class="mt-5 mb-4">Recommendations</h2>
        {recommendations_section}

        <!-- Footer -->
        <footer class="mt-5 py-4 border-top">
            <div class="row">
                <div class="col-md-6">
                    <p class="text-muted">RBI Compliance Platform</p>
                    <p class="text-muted">Automated Backup Verification System</p>
                </div>
                <div class="col-md-6 text-end">
                    <p class="text-muted">Test Results: {passed_tests}/{total_tests} Passed</p>
                    <p class="text-muted">Success Rate: {success_rate:.1f}%</p>
                </div>
            </div>
        </footer>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
        """


def main():
    parser = argparse.ArgumentParser(description='Generate backup verification test report')
    parser.add_argument('--results', required=True, help='Path to test results JSON file')
    parser.add_argument('--output', required=True, help='Path to output HTML report file')

    args = parser.parse_args()

    generator = BackupTestReportGenerator()
    generator.generate_report(args.results, args.output)


if __name__ == '__main__':
    main()


# Additional specialized report generator for cross-region DR tests
class CrossRegionDRReportGenerator:
    """Generates HTML reports for cross-region disaster recovery test results"""

    def __init__(self):
        self.template = self._get_dr_html_template()

    def generate_report(self, results_file: str, output_file: str) -> None:
        """Generate HTML cross-region DR test report"""
        try:
            with open(results_file, 'r') as f:
                results = json.load(f)

            report_html = self._generate_dr_html_report(results)

            with open(output_file, 'w') as f:
                f.write(report_html)

            print(f"Cross-region DR test report generated: {output_file}")

        except Exception as e:
            print(f"Error generating DR test report: {e}")
            sys.exit(1)

    def _generate_dr_html_report(self, results: Dict[str, Any]) -> str:
        """Generate HTML content for the DR test report"""
        timestamp = results.get('timestamp', datetime.now().isoformat())
        test_execution = results.get('test_execution', {})
        regions = results.get('regions', {})

        total_scenarios = test_execution.get('total_scenarios', 0)
        passed_scenarios = test_execution.get('passed_scenarios', 0)
        failed_scenarios = test_execution.get('failed_scenarios', 0)

        # Calculate success rate
        success_rate = (passed_scenarios / max(total_scenarios, 1)) * 100

        # Determine overall status
        overall_status = "PASS" if failed_scenarios == 0 else "FAIL"
        status_color = "success" if overall_status == "PASS" else "danger"

        # Generate sections
        summary_section = self._generate_dr_summary_section(test_execution)
        scenarios_section = self._generate_dr_scenarios_section(test_execution.get('test_scenarios', {}))
        regions_section = self._generate_regions_section(regions)

        return self.template.format(
            timestamp=timestamp,
            overall_status=overall_status,
            status_color=status_color,
            total_scenarios=total_scenarios,
            passed_scenarios=passed_scenarios,
            failed_scenarios=failed_scenarios,
            success_rate=success_rate,
            summary_section=summary_section,
            scenarios_section=scenarios_section,
            regions_section=regions_section
        )

    def _generate_dr_summary_section(self, test_execution: Dict[str, Any]) -> str:
        """Generate DR test execution summary section"""
        total_scenarios = test_execution.get('total_scenarios', 0)
        passed_scenarios = test_execution.get('passed_scenarios', 0)
        failed_scenarios = test_execution.get('failed_scenarios', 0)
        success_rate = (passed_scenarios / max(total_scenarios, 1)) * 100

        return f"""
        <div class='row'>
            <div class='col-md-3'>
                <div class='card text-center border-primary'>
                    <div class='card-body'>
                        <h5 class='card-title text-primary'>Total Scenarios</h5>
                        <h2 class='display-4 text-primary'>{total_scenarios}</h2>
                    </div>
                </div>
            </div>
            <div class='col-md-3'>
                <div class='card text-center border-success'>
                    <div class='card-body'>
                        <h5 class='card-title text-success'>Passed</h5>
                        <h2 class='display-4 text-success'>{passed_scenarios}</h2>
                    </div>
                </div>
            </div>
            <div class='col-md-3'>
                <div class='card text-center border-danger'>
                    <div class='card-body'>
                        <h5 class='card-title text-danger'>Failed</h5>
                        <h2 class='display-4 text-danger'>{failed_scenarios}</h2>
                    </div>
                </div>
            </div>
            <div class='col-md-3'>
                <div class='card text-center border-info'>
                    <div class='card-body'>
                        <h5 class='card-title text-info'>Success Rate</h5>
                        <h2 class='display-4 text-info'>{success_rate:.1f}%</h2>
                    </div>
                </div>
            </div>
        </div>
        """

    def _generate_dr_scenarios_section(self, scenarios: Dict[str, Any]) -> str:
        """Generate detailed DR test scenarios section"""
        if not scenarios:
            return "<p>No test scenario results available.</p>"

        html = ""

        for scenario_name, scenario_data in scenarios.items():
            status = scenario_data.get('status', 'UNKNOWN')
            status_class = 'success' if status == 'PASS' else 'danger'
            status_icon = '✓' if status == 'PASS' else '✗'

            html += f"""
            <div class='card mb-4'>
                <div class='card-header bg-{status_class} text-white'>
                    <h4 class='mb-0'>
                        <span class='badge badge-light me-2'>{status_icon}</span>
                        {scenario_name.replace('_', ' ').title()}
                    </h4>
                </div>
                <div class='card-body'>
            """

            # Cross-Region Failover
            if scenario_name == 'cross_region_failover':
                html += f"""
                    <div class='row'>
                        <div class='col-md-6'>
                            <h6>Failover Performance</h6>
                            <ul class='list-unstyled'>
                                <li><strong>Failover Duration:</strong> {scenario_data.get('failover_duration_seconds', 'N/A')}s</li>
                                <li><strong>RTO Target:</strong> {scenario_data.get('rto_target_seconds', 'N/A')}s</li>
                                <li><strong>RTO Achieved:</strong>
                                    <span class='badge badge-{"success" if scenario_data.get("rto_achieved") else "danger"}'>
                                        {"YES" if scenario_data.get("rto_achieved") else "NO"}
                                    </span>
                                </li>
                            </ul>
                        </div>
                        <div class='col-md-6'>
                            <h6>Service Health</h6>
                            <ul class='list-unstyled'>
                                <li><strong>Primary Health:</strong> {scenario_data.get('primary_health_code', 'N/A')}</li>
                                <li><strong>Secondary Health:</strong> {scenario_data.get('secondary_health_code', 'N/A')}</li>
                                <li><strong>Auth Service:</strong>
                                    <span class='badge badge-{"success" if scenario_data.get("auth_service_functional") else "danger"}'>
                                        {"OK" if scenario_data.get("auth_service_functional") else "FAIL"}
                                    </span>
                                </li>
                                <li><strong>Compliance Service:</strong>
                                    <span class='badge badge-{"success" if scenario_data.get("compliance_service_functional") else "danger"}'>
                                        {"OK" if scenario_data.get("compliance_service_functional") else "FAIL"}
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                """

            # Data Replication Integrity
            elif scenario_name == 'data_replication_integrity':
                db_replication = scenario_data.get('database_replication', {})
                redis_replication = scenario_data.get('redis_replication', {})

                html += f"""
                    <div class='row'>
                        <div class='col-md-6'>
                            <h6>Database Replication</h6>
                            <ul class='list-unstyled'>
                                <li><strong>Primary Inserted:</strong>
                                    <span class='badge badge-{"success" if db_replication.get("primary_inserted") else "danger"}'>
                                        {"YES" if db_replication.get("primary_inserted") else "NO"}
                                    </span>
                                </li>
                                <li><strong>Secondary Replicated:</strong>
                                    <span class='badge badge-{"success" if db_replication.get("secondary_replicated") else "danger"}'>
                                        {"YES" if db_replication.get("secondary_replicated") else "NO"}
                                    </span>
                                </li>
                                <li><strong>Record Count:</strong> {db_replication.get('record_count', 'N/A')}</li>
                            </ul>
                        </div>
                        <div class='col-md-6'>
                            <h6>Redis Replication</h6>
                            <ul class='list-unstyled'>
                                <li><strong>Primary Set:</strong>
                                    <span class='badge badge-{"success" if redis_replication.get("primary_set") else "danger"}'>
                                        {"YES" if redis_replication.get("primary_set") else "NO"}
                                    </span>
                                </li>
                                <li><strong>Secondary Retrieved:</strong>
                                    <span class='badge badge-{"success" if redis_replication.get("secondary_retrieved") else "danger"}'>
                                        {"YES" if redis_replication.get("secondary_retrieved") else "NO"}
                                    </span>
                                </li>
                                <li><strong>Replication Lag:</strong> {scenario_data.get('replication_lag_seconds', 'N/A')}s</li>
                            </ul>
                        </div>
                    </div>
                """

            # RTO Validation
            elif scenario_name == 'rto_validation':
                db_rto = scenario_data.get('database_rto', {})
                app_rto = scenario_data.get('application_rto', {})

                html += f"""
                    <div class='row'>
                        <div class='col-md-6'>
                            <h6>Database RTO</h6>
                            <ul class='list-unstyled'>
                                <li><strong>Target:</strong> {db_rto.get('target_seconds', 'N/A')}s</li>
                                <li><strong>Actual:</strong> {db_rto.get('actual_seconds', 'N/A')}s</li>
                                <li><strong>Achieved:</strong>
                                    <span class='badge badge-{"success" if db_rto.get("achieved") else "danger"}'>
                                        {"YES" if db_rto.get("achieved") else "NO"}
                                    </span>
                                </li>
                            </ul>
                        </div>
                        <div class='col-md-6'>
                            <h6>Application RTO</h6>
                            <ul class='list-unstyled'>
                                <li><strong>Target:</strong> {app_rto.get('target_seconds', 'N/A')}s</li>
                                <li><strong>Actual:</strong> {app_rto.get('actual_seconds', 'N/A')}s</li>
                                <li><strong>Achieved:</strong>
                                    <span class='badge badge-{"success" if app_rto.get("achieved") else "danger"}'>
                                        {"YES" if app_rto.get("achieved") else "NO"}
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                """

            html += f"""
                    <div class='mt-3'>
                        <small class='text-muted'>Test Duration: {scenario_data.get('duration_seconds', 'N/A')} seconds</small>
                    </div>
                </div>
            </div>
            """

        return html

    def _generate_regions_section(self, regions: Dict[str, Any]) -> str:
        """Generate regions configuration section"""
        html = """
        <div class='row'>
            <div class='col-md-4'>
                <div class='card'>
                    <div class='card-header bg-primary text-white'>
                        <h5 class='mb-0'>Primary Region</h5>
                    </div>
                    <div class='card-body'>
                        <p><strong>Region:</strong> {primary}</p>
                        <p><small class='text-muted'>Main production region</small></p>
                    </div>
                </div>
            </div>
            <div class='col-md-4'>
                <div class='card'>
                    <div class='card-header bg-warning text-white'>
                        <h5 class='mb-0'>Secondary Region</h5>
                    </div>
                    <div class='card-body'>
                        <p><strong>Region:</strong> {secondary}</p>
                        <p><small class='text-muted'>Disaster recovery region</small></p>
                    </div>
                </div>
            </div>
            <div class='col-md-4'>
                <div class='card'>
                    <div class='card-header bg-info text-white'>
                        <h5 class='mb-0'>Tertiary Region</h5>
                    </div>
                    <div class='card-body'>
                        <p><strong>Region:</strong> {tertiary}</p>
                        <p><small class='text-muted'>Backup region</small></p>
                    </div>
                </div>
            </div>
        </div>
        """.format(
            primary=regions.get('primary', 'N/A'),
            secondary=regions.get('secondary', 'N/A'),
            tertiary=regions.get('tertiary', 'N/A')
        )

        return html

    def _get_dr_html_template(self) -> str:
        """Get HTML template for the DR test report"""
        return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cross-Region Disaster Recovery Test Report</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
        }}
        .card {{
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border: none;
        }}
        .badge {{
            font-size: 0.9em;
        }}
        .display-4 {{
            font-size: 2.5rem;
        }}
    </style>
</head>
<body>
    <div class="header py-4 mb-4">
        <div class="container">
            <h1 class="mb-2">Cross-Region Disaster Recovery Test Report</h1>
            <p class="mb-1">Generated on {timestamp}</p>
            <div class="mt-3">
                <span class="badge badge-{status_color} fs-6">Overall Status: {overall_status}</span>
            </div>
        </div>
    </div>

    <div class="container">
        <!-- Test Summary -->
        <h2 class="mb-4">Test Execution Summary</h2>
        {summary_section}

        <!-- Regions Configuration -->
        <h2 class="mt-5 mb-4">Regions Configuration</h2>
        {regions_section}

        <!-- Test Scenarios Details -->
        <h2 class="mt-5 mb-4">Test Scenario Results</h2>
        {scenarios_section}

        <!-- Footer -->
        <footer class="mt-5 py-4 border-top">
            <div class="row">
                <div class="col-md-6">
                    <p class="text-muted">RBI Compliance Platform</p>
                    <p class="text-muted">Cross-Region Disaster Recovery Testing</p>
                </div>
                <div class="col-md-6 text-end">
                    <p class="text-muted">Test Results: {passed_scenarios}/{total_scenarios} Passed</p>
                    <p class="text-muted">Success Rate: {success_rate:.1f}%</p>
                </div>
            </div>
        </footer>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
        """
