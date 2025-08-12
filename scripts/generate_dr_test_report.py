#!/usr/bin/env python3
"""
Cross-Region Disaster Recovery Test Report Generator
Generates comprehensive HTML reports for cross-region disaster recovery test results
"""

import json
import argparse
import sys
from datetime import datetime
from typing import Dict, Any


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
        recommendations_section = self._generate_dr_recommendations_section(test_execution)
        
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
            regions_section=regions_section,
            recommendations_section=recommendations_section
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
    
    def _generate_dr_recommendations_section(self, test_execution: Dict[str, Any]) -> str:
        """Generate recommendations based on DR test results"""
        recommendations = []
        test_scenarios = test_execution.get('test_scenarios', {})
        
        # Check for failed scenarios and generate recommendations
        for scenario_name, scenario_data in test_scenarios.items():
            if scenario_data.get('status') != 'PASS':
                if scenario_name == 'cross_region_failover':
                    if not scenario_data.get('rto_achieved', True):
                        recommendations.append({
                            'type': 'danger',
                            'title': 'Cross-Region Failover RTO Issue',
                            'description': f'Failover took {scenario_data.get("failover_duration_seconds")}s, exceeding the {scenario_data.get("rto_target_seconds")}s target. Consider optimizing DNS propagation and load balancer configuration.'
                        })
                    
                    if not scenario_data.get('auth_service_functional', True):
                        recommendations.append({
                            'type': 'danger',
                            'title': 'Authentication Service Issue',
                            'description': 'Authentication service failed during cross-region failover. Verify service health checks and regional deployment configuration.'
                        })
                
                elif scenario_name == 'data_replication_integrity':
                    db_replication = scenario_data.get('database_replication', {})
                    redis_replication = scenario_data.get('redis_replication', {})
                    
                    if not db_replication.get('secondary_replicated', True):
                        recommendations.append({
                            'type': 'danger',
                            'title': 'Database Replication Issue',
                            'description': 'Database replication to secondary region failed. Check replication configuration and network connectivity.'
                        })
                    
                    if not redis_replication.get('secondary_retrieved', True):
                        recommendations.append({
                            'type': 'danger',
                            'title': 'Redis Replication Issue',
                            'description': 'Redis replication to secondary region failed. Verify Redis cluster configuration and replication settings.'
                        })
                
                elif scenario_name == 'rto_validation':
                    db_rto = scenario_data.get('database_rto', {})
                    app_rto = scenario_data.get('application_rto', {})
                    
                    if not db_rto.get('achieved', True):
                        recommendations.append({
                            'type': 'warning',
                            'title': 'Database RTO Target Missed',
                            'description': f'Database recovery took {db_rto.get("actual_seconds")}s, exceeding the {db_rto.get("target_seconds")}s target. Consider optimizing database startup procedures.'
                        })
                    
                    if not app_rto.get('achieved', True):
                        recommendations.append({
                            'type': 'warning',
                            'title': 'Application RTO Target Missed',
                            'description': f'Application recovery took {app_rto.get("actual_seconds")}s, exceeding the {app_rto.get("target_seconds")}s target. Review application startup and health check configurations.'
                        })
        
        # Add general recommendations if all tests passed
        if not recommendations:
            recommendations.append({
                'type': 'success',
                'title': 'All DR Tests Passed',
                'description': 'Cross-region disaster recovery testing completed successfully. All scenarios met their objectives.'
            })
            recommendations.append({
                'type': 'info',
                'title': 'Continuous Improvement',
                'description': 'Continue regular DR testing and consider implementing chaos engineering practices to further validate resilience.'
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
        
        <!-- Recommendations -->
        <h2 class="mt-5 mb-4">Recommendations</h2>
        {recommendations_section}
        
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


def main():
    parser = argparse.ArgumentParser(description='Generate cross-region disaster recovery test report')
    parser.add_argument('--results', required=True, help='Path to test results JSON file')
    parser.add_argument('--output', required=True, help='Path to output HTML report file')
    
    args = parser.parse_args()
    
    generator = CrossRegionDRReportGenerator()
    generator.generate_report(args.results, args.output)


if __name__ == '__main__':
    main()
