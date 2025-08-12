#!/usr/bin/env python3
"""
Backup Verification Report Generator
Generates comprehensive HTML reports for backup verification results
"""

import json
import argparse
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List


class VerificationReportGenerator:
    """Generates HTML reports for backup verification results"""
    
    def __init__(self):
        self.template = self._get_html_template()
    
    def generate_report(self, results_file: str, output_file: str) -> None:
        """Generate HTML verification report"""
        try:
            with open(results_file, 'r') as f:
                results = json.load(f)
            
            report_html = self._generate_html_report(results)
            
            with open(output_file, 'w') as f:
                f.write(report_html)
            
            print(f"Verification report generated: {output_file}")
            
        except Exception as e:
            print(f"Error generating report: {e}")
            sys.exit(1)
    
    def _generate_html_report(self, results: Dict[str, Any]) -> str:
        """Generate HTML content for the report"""
        timestamp = results.get('timestamp', datetime.now().isoformat())
        verification_results = results.get('results', {})
        integrity_tests = results.get('integrity_tests', {})
        performance_tests = results.get('performance_tests', {})
        
        # Calculate overall status
        overall_status = self._calculate_overall_status(verification_results, integrity_tests)
        status_color = "success" if overall_status == "PASS" else "danger"
        
        # Generate sections
        verification_section = self._generate_verification_section(verification_results)
        integrity_section = self._generate_integrity_section(integrity_tests)
        performance_section = self._generate_performance_section(performance_tests)
        summary_section = self._generate_summary_section(verification_results, integrity_tests, performance_tests)
        
        return self.template.format(
            timestamp=timestamp,
            overall_status=overall_status,
            status_color=status_color,
            summary_section=summary_section,
            verification_section=verification_section,
            integrity_section=integrity_section,
            performance_section=performance_section
        )
    
    def _calculate_overall_status(self, verification: Dict, integrity: Dict) -> str:
        """Calculate overall verification status"""
        all_results = []
        
        # Check verification results
        for service, result in verification.items():
            all_results.append(result.get('status') == 'success')
        
        # Check integrity results
        for service, result in integrity.items():
            all_results.append(result.get('status') == 'success')
        
        return "PASS" if all(all_results) else "FAIL"
    
    def _generate_verification_section(self, results: Dict[str, Any]) -> str:
        """Generate verification results section"""
        if not results:
            return "<p>No verification results available.</p>"
        
        html = "<div class='row'>"
        
        for service, result in results.items():
            status = result.get('status', 'unknown')
            status_class = 'success' if status == 'success' else 'danger'
            
            html += f"""
            <div class='col-md-4 mb-3'>
                <div class='card'>
                    <div class='card-header bg-{status_class} text-white'>
                        <h5 class='mb-0'>{service.title()}</h5>
                    </div>
                    <div class='card-body'>
                        <p><strong>Status:</strong> <span class='badge badge-{status_class}'>{status.upper()}</span></p>
            """
            
            if 'backup_file' in result:
                html += f"<p><strong>Backup File:</strong> {result['backup_file']}</p>"
            
            if 'table_count' in result:
                html += f"<p><strong>Tables:</strong> {result['table_count']}</p>"
            
            if 'snapshot' in result:
                html += f"<p><strong>Snapshot:</strong> {result['snapshot']}</p>"
            
            if 'message' in result:
                html += f"<p><strong>Message:</strong> {result['message']}</p>"
            
            html += """
                    </div>
                </div>
            </div>
            """
        
        html += "</div>"
        return html
    
    def _generate_integrity_section(self, results: Dict[str, Any]) -> str:
        """Generate integrity test results section"""
        if not results:
            return "<p>No integrity test results available.</p>"
        
        html = "<div class='row'>"
        
        for service, result in results.items():
            status = result.get('status', 'unknown')
            status_class = 'success' if status == 'success' else 'danger'
            
            html += f"""
            <div class='col-md-6 mb-3'>
                <div class='card'>
                    <div class='card-header bg-{status_class} text-white'>
                        <h5 class='mb-0'>{service.title()} Integrity</h5>
                    </div>
                    <div class='card-body'>
                        <p><strong>Status:</strong> <span class='badge badge-{status_class}'>{status.upper()}</span></p>
            """
            
            if service == 'postgresql':
                html += f"""
                        <p><strong>Records:</strong> {result.get('record_count', 'N/A')}</p>
                        <p><strong>Indexes:</strong> {result.get('index_count', 'N/A')}</p>
                        <p><strong>Constraints:</strong> {result.get('constraint_count', 'N/A')}</p>
                        <p><strong>FK Violations:</strong> {result.get('fk_violations', 'N/A')}</p>
                """
            elif service == 'redis':
                html += f"""
                        <p><strong>Keys:</strong> {result.get('key_count', 'N/A')}</p>
                        <p><strong>Memory Usage:</strong> {result.get('memory_usage', 'N/A')}</p>
                """
            
            html += """
                    </div>
                </div>
            </div>
            """
        
        html += "</div>"
        return html
    
    def _generate_performance_section(self, results: Dict[str, Any]) -> str:
        """Generate performance test results section"""
        if not results:
            return "<p>No performance test results available.</p>"
        
        html = "<div class='row'>"
        
        for service, result in results.items():
            html += f"""
            <div class='col-md-6 mb-3'>
                <div class='card'>
                    <div class='card-header bg-info text-white'>
                        <h5 class='mb-0'>{service.title()} Performance</h5>
                    </div>
                    <div class='card-body'>
            """
            
            if service == 'postgresql':
                html += f"""
                        <p><strong>Restore Duration:</strong> {result.get('restore_duration_seconds', 'N/A')}s</p>
                        <p><strong>Backup Size:</strong> {result.get('backup_size', 'N/A')}</p>
                        <p><strong>Query Duration:</strong> {result.get('query_duration_ms', 'N/A')}ms</p>
                """
            
            html += """
                    </div>
                </div>
            </div>
            """
        
        html += "</div>"
        return html
    
    def _generate_summary_section(self, verification: Dict, integrity: Dict, performance: Dict) -> str:
        """Generate summary statistics section"""
        total_tests = len(verification) + len(integrity) + len(performance)
        passed_tests = 0
        
        for result in verification.values():
            if result.get('status') == 'success':
                passed_tests += 1
        
        for result in integrity.values():
            if result.get('status') == 'success':
                passed_tests += 1
        
        # Performance tests are informational, not pass/fail
        
        success_rate = (passed_tests / max(total_tests - len(performance), 1)) * 100
        
        return f"""
        <div class='row'>
            <div class='col-md-3'>
                <div class='card text-center'>
                    <div class='card-body'>
                        <h5 class='card-title'>Total Tests</h5>
                        <h2 class='text-primary'>{total_tests}</h2>
                    </div>
                </div>
            </div>
            <div class='col-md-3'>
                <div class='card text-center'>
                    <div class='card-body'>
                        <h5 class='card-title'>Passed</h5>
                        <h2 class='text-success'>{passed_tests}</h2>
                    </div>
                </div>
            </div>
            <div class='col-md-3'>
                <div class='card text-center'>
                    <div class='card-body'>
                        <h5 class='card-title'>Failed</h5>
                        <h2 class='text-danger'>{total_tests - len(performance) - passed_tests}</h2>
                    </div>
                </div>
            </div>
            <div class='col-md-3'>
                <div class='card text-center'>
                    <div class='card-body'>
                        <h5 class='card-title'>Success Rate</h5>
                        <h2 class='text-info'>{success_rate:.1f}%</h2>
                    </div>
                </div>
            </div>
        </div>
        """
    
    def _get_html_template(self) -> str:
        """Get HTML template for the report"""
        return """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Backup Verification Report</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }}
        .card {{ box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }}
        .badge {{ font-size: 0.9em; }}
    </style>
</head>
<body>
    <div class="header text-white py-4 mb-4">
        <div class="container">
            <h1 class="mb-0">Backup Verification Report</h1>
            <p class="mb-0">Generated on {timestamp}</p>
        </div>
    </div>
    
    <div class="container">
        <div class="alert alert-{status_color} mb-4">
            <h4 class="alert-heading">Overall Status: {overall_status}</h4>
        </div>
        
        <h2>Summary</h2>
        {summary_section}
        
        <h2 class="mt-5">Backup Verification Results</h2>
        {verification_section}
        
        <h2 class="mt-5">Data Integrity Tests</h2>
        {integrity_section}
        
        <h2 class="mt-5">Performance Tests</h2>
        {performance_section}
        
        <footer class="mt-5 py-4 border-top">
            <p class="text-muted text-center">RBI Compliance Platform - Automated Backup Verification System</p>
        </footer>
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
        """


def main():
    parser = argparse.ArgumentParser(description='Generate backup verification report')
    parser.add_argument('--results', required=True, help='Path to verification results JSON file')
    parser.add_argument('--output', required=True, help='Path to output HTML report file')
    
    args = parser.parse_args()
    
    generator = VerificationReportGenerator()
    generator.generate_report(args.results, args.output)


if __name__ == '__main__':
    main()
