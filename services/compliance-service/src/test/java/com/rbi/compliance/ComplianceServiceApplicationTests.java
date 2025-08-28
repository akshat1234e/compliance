package com.rbi.compliance;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rbi.compliance.controller.ComplianceController;
import com.rbi.compliance.dto.ComplianceReportRequest;
import com.rbi.compliance.dto.ComplianceRuleRequest;
import com.rbi.compliance.entity.ComplianceReport;
import com.rbi.compliance.entity.ComplianceRule;
import com.rbi.compliance.entity.ComplianceViolation;
import com.rbi.compliance.repository.ComplianceReportRepository;
import com.rbi.compliance.repository.ComplianceRuleRepository;
import com.rbi.compliance.repository.ComplianceViolationRepository;
import com.rbi.compliance.service.ComplianceService;
import com.rbi.compliance.service.RuleEngineService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ComplianceServiceApplicationTests {

    @Autowired
    private ComplianceService complianceService;

    @Autowired
    private RuleEngineService ruleEngineService;

    @Autowired
    private ComplianceReportRepository reportRepository;

    @Autowired
    private ComplianceRuleRepository ruleRepository;

    @Autowired
    private ComplianceViolationRepository violationRepository;

    private ComplianceRule testRule;
    private ComplianceReport testReport;
    private ComplianceRuleRequest ruleRequest;
    private ComplianceReportRequest reportRequest;

    @BeforeEach
    void setUp() {
        // Clean up database
        violationRepository.deleteAll();
        reportRepository.deleteAll();
        ruleRepository.deleteAll();

        // Create test rule
        testRule = new ComplianceRule();
        testRule.setRuleId("RULE_001");
        testRule.setRuleName("Maximum Transaction Limit");
        testRule.setRuleType("TRANSACTION_LIMIT");
        testRule.setDescription("Maximum single transaction limit of 10 lakhs");
        testRule.setRuleExpression("transaction.amount <= 1000000");
        testRule.setSeverity("HIGH");
        testRule.setEnabled(true);
        testRule.setCreatedAt(LocalDateTime.now());

        // Create test report
        testReport = new ComplianceReport();
        testReport.setReportId("RPT_001");
        testReport.setReportType("MONTHLY");
        testReport.setReportPeriod("2023-12");
        testReport.setStatus("DRAFT");
        testReport.setCreatedBy("testuser");
        testReport.setCreatedAt(LocalDateTime.now());

        // Create test requests
        ruleRequest = new ComplianceRuleRequest();
        ruleRequest.setRuleId("RULE_002");
        ruleRequest.setRuleName("Daily Transaction Count");
        ruleRequest.setRuleType("TRANSACTION_COUNT");
        ruleRequest.setDescription("Maximum 100 transactions per day");
        ruleRequest.setRuleExpression("daily_transaction_count <= 100");
        ruleRequest.setSeverity("MEDIUM");

        reportRequest = new ComplianceReportRequest();
        reportRequest.setReportType("QUARTERLY");
        reportRequest.setReportPeriod("2023-Q4");
        reportRequest.setDescription("Q4 compliance report");
    }

    @Test
    void contextLoads() {
        assertNotNull(complianceService);
        assertNotNull(ruleEngineService);
        assertNotNull(reportRepository);
        assertNotNull(ruleRepository);
        assertNotNull(violationRepository);
    }

    @Test
    void testCreateComplianceRule_Success() {
        // When
        var result = complianceService.createRule(ruleRequest);

        // Then
        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertNotNull(result.getRuleId());

        // Verify rule is saved in database
        Optional<ComplianceRule> savedRule = ruleRepository.findByRuleId(ruleRequest.getRuleId());
        assertTrue(savedRule.isPresent());
        assertEquals("Daily Transaction Count", savedRule.get().getRuleName());
        assertEquals("MEDIUM", savedRule.get().getSeverity());
        assertTrue(savedRule.get().isEnabled());
    }

    @Test
    void testCreateComplianceRule_DuplicateRuleId() {
        // Given
        ruleRepository.save(testRule);
        ruleRequest.setRuleId("RULE_001"); // Same as existing rule

        // When & Then
        assertThrows(RuntimeException.class, () -> {
            complianceService.createRule(ruleRequest);
        });
    }

    @Test
    void testUpdateComplianceRule_Success() {
        // Given
        ruleRepository.save(testRule);
        ruleRequest.setRuleId("RULE_001");
        ruleRequest.setRuleName("Updated Transaction Limit");
        ruleRequest.setSeverity("CRITICAL");

        // When
        var result = complianceService.updateRule("RULE_001", ruleRequest);

        // Then
        assertTrue(result.isSuccess());

        // Verify update in database
        Optional<ComplianceRule> updated = ruleRepository.findByRuleId("RULE_001");
        assertTrue(updated.isPresent());
        assertEquals("Updated Transaction Limit", updated.get().getRuleName());
        assertEquals("CRITICAL", updated.get().getSeverity());
    }

    @Test
    void testDeleteComplianceRule_Success() {
        // Given
        ruleRepository.save(testRule);

        // When
        var result = complianceService.deleteRule("RULE_001");

        // Then
        assertTrue(result.isSuccess());

        // Verify deletion
        Optional<ComplianceRule> deleted = ruleRepository.findByRuleId("RULE_001");
        assertFalse(deleted.isPresent());
    }

    @Test
    void testGetComplianceRule_Success() {
        // Given
        ruleRepository.save(testRule);

        // When
        var result = complianceService.getRule("RULE_001");

        // Then
        assertNotNull(result);
        assertEquals("RULE_001", result.getRuleId());
        assertEquals("Maximum Transaction Limit", result.getRuleName());
        assertEquals("HIGH", result.getSeverity());
    }

    @Test
    void testGetAllComplianceRules() {
        // Given
        ruleRepository.save(testRule);
        
        ComplianceRule rule2 = new ComplianceRule();
        rule2.setRuleId("RULE_002");
        rule2.setRuleName("Test Rule 2");
        rule2.setRuleType("BALANCE_CHECK");
        rule2.setEnabled(true);
        rule2.setCreatedAt(LocalDateTime.now());
        ruleRepository.save(rule2);

        // When
        var rules = complianceService.getAllRules();

        // Then
        assertNotNull(rules);
        assertEquals(2, rules.size());
    }

    @Test
    void testCreateComplianceReport_Success() {
        // When
        var result = complianceService.createReport(reportRequest, "testuser");

        // Then
        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertNotNull(result.getReportId());

        // Verify report is saved in database
        Optional<ComplianceReport> savedReport = reportRepository.findByReportId(result.getReportId());
        assertTrue(savedReport.isPresent());
        assertEquals("QUARTERLY", savedReport.get().getReportType());
        assertEquals("2023-Q4", savedReport.get().getReportPeriod());
        assertEquals("testuser", savedReport.get().getCreatedBy());
    }

    @Test
    void testGenerateComplianceReport_Success() {
        // Given
        reportRepository.save(testReport);

        // When
        var result = complianceService.generateReport("RPT_001");

        // Then
        assertTrue(result.isSuccess());

        // Verify report status is updated
        Optional<ComplianceReport> updated = reportRepository.findByReportId("RPT_001");
        assertTrue(updated.isPresent());
        assertEquals("GENERATED", updated.get().getStatus());
        assertNotNull(updated.get().getGeneratedAt());
    }

    @Test
    void testRuleEngineEvaluation_TransactionLimit() {
        // Given
        ruleRepository.save(testRule);
        
        TransactionData transaction = new TransactionData();
        transaction.setAmount(new BigDecimal("1500000")); // 15 lakhs - exceeds limit
        transaction.setTransactionId("TXN_001");
        transaction.setAccountNumber("ACC_001");

        // When
        var violations = ruleEngineService.evaluateTransaction(transaction);

        // Then
        assertNotNull(violations);
        assertFalse(violations.isEmpty());
        assertEquals(1, violations.size());
        
        ComplianceViolation violation = violations.get(0);
        assertEquals("RULE_001", violation.getRuleId());
        assertEquals("HIGH", violation.getSeverity());
        assertEquals("TXN_001", violation.getTransactionId());
    }

    @Test
    void testRuleEngineEvaluation_NoViolation() {
        // Given
        ruleRepository.save(testRule);
        
        TransactionData transaction = new TransactionData();
        transaction.setAmount(new BigDecimal("500000")); // 5 lakhs - within limit
        transaction.setTransactionId("TXN_002");
        transaction.setAccountNumber("ACC_001");

        // When
        var violations = ruleEngineService.evaluateTransaction(transaction);

        // Then
        assertNotNull(violations);
        assertTrue(violations.isEmpty());
    }

    @Test
    void testComplianceViolationCreation() {
        // Given
        ruleRepository.save(testRule);
        
        ComplianceViolation violation = new ComplianceViolation();
        violation.setViolationId("VIO_001");
        violation.setRuleId("RULE_001");
        violation.setTransactionId("TXN_001");
        violation.setAccountNumber("ACC_001");
        violation.setSeverity("HIGH");
        violation.setDescription("Transaction amount exceeds limit");
        violation.setStatus("OPEN");
        violation.setDetectedAt(LocalDateTime.now());

        // When
        ComplianceViolation saved = violationRepository.save(violation);

        // Then
        assertNotNull(saved);
        assertNotNull(saved.getId());
        assertEquals("VIO_001", saved.getViolationId());
        assertEquals("HIGH", saved.getSeverity());
        assertEquals("OPEN", saved.getStatus());
    }

    @Test
    void testGetViolationsByRule() {
        // Given
        ruleRepository.save(testRule);
        
        ComplianceViolation violation1 = createTestViolation("VIO_001", "RULE_001", "TXN_001");
        ComplianceViolation violation2 = createTestViolation("VIO_002", "RULE_001", "TXN_002");
        ComplianceViolation violation3 = createTestViolation("VIO_003", "RULE_002", "TXN_003");
        
        violationRepository.saveAll(List.of(violation1, violation2, violation3));

        // When
        var violations = complianceService.getViolationsByRule("RULE_001");

        // Then
        assertNotNull(violations);
        assertEquals(2, violations.size());
        assertTrue(violations.stream().allMatch(v -> "RULE_001".equals(v.getRuleId())));
    }

    @Test
    void testGetViolationsBySeverity() {
        // Given
        ComplianceViolation highViolation = createTestViolation("VIO_001", "RULE_001", "TXN_001");
        highViolation.setSeverity("HIGH");
        
        ComplianceViolation mediumViolation = createTestViolation("VIO_002", "RULE_002", "TXN_002");
        mediumViolation.setSeverity("MEDIUM");
        
        violationRepository.saveAll(List.of(highViolation, mediumViolation));

        // When
        var highViolations = complianceService.getViolationsBySeverity("HIGH");

        // Then
        assertNotNull(highViolations);
        assertEquals(1, highViolations.size());
        assertEquals("HIGH", highViolations.get(0).getSeverity());
    }

    @Test
    void testResolveViolation() {
        // Given
        ComplianceViolation violation = createTestViolation("VIO_001", "RULE_001", "TXN_001");
        violation.setStatus("OPEN");
        violationRepository.save(violation);

        // When
        var result = complianceService.resolveViolation("VIO_001", "Resolved by manual review", "testuser");

        // Then
        assertTrue(result.isSuccess());

        // Verify violation is resolved
        Optional<ComplianceViolation> resolved = violationRepository.findByViolationId("VIO_001");
        assertTrue(resolved.isPresent());
        assertEquals("RESOLVED", resolved.get().getStatus());
        assertEquals("Resolved by manual review", resolved.get().getResolutionNotes());
        assertEquals("testuser", resolved.get().getResolvedBy());
        assertNotNull(resolved.get().getResolvedAt());
    }

    @Test
    void testComplianceMetrics() {
        // Given
        ComplianceViolation violation1 = createTestViolation("VIO_001", "RULE_001", "TXN_001");
        violation1.setSeverity("HIGH");
        violation1.setStatus("OPEN");
        
        ComplianceViolation violation2 = createTestViolation("VIO_002", "RULE_001", "TXN_002");
        violation2.setSeverity("MEDIUM");
        violation2.setStatus("RESOLVED");
        
        violationRepository.saveAll(List.of(violation1, violation2));

        // When
        var metrics = complianceService.getComplianceMetrics();

        // Then
        assertNotNull(metrics);
        assertEquals(2, metrics.getTotalViolations());
        assertEquals(1, metrics.getOpenViolations());
        assertEquals(1, metrics.getResolvedViolations());
        assertEquals(1, metrics.getHighSeverityViolations());
        assertEquals(1, metrics.getMediumSeverityViolations());
    }

    @Test
    void testRuleValidation() {
        // Given
        ComplianceRuleRequest invalidRule = new ComplianceRuleRequest();
        invalidRule.setRuleId(""); // Invalid - empty rule ID
        invalidRule.setRuleName("Test Rule");
        invalidRule.setRuleExpression("invalid expression"); // Invalid expression

        // When & Then
        assertThrows(IllegalArgumentException.class, () -> {
            complianceService.createRule(invalidRule);
        });
    }

    @Test
    void testReportGeneration_WithViolations() {
        // Given
        ruleRepository.save(testRule);
        reportRepository.save(testReport);
        
        ComplianceViolation violation = createTestViolation("VIO_001", "RULE_001", "TXN_001");
        violation.setDetectedAt(LocalDateTime.of(2023, 12, 15, 10, 0));
        violationRepository.save(violation);

        // When
        var result = complianceService.generateDetailedReport("RPT_001");

        // Then
        assertNotNull(result);
        assertTrue(result.isSuccess());
        assertNotNull(result.getReportData());
        assertTrue(result.getReportData().contains("VIO_001"));
    }

    // Helper methods
    private ComplianceViolation createTestViolation(String violationId, String ruleId, String transactionId) {
        ComplianceViolation violation = new ComplianceViolation();
        violation.setViolationId(violationId);
        violation.setRuleId(ruleId);
        violation.setTransactionId(transactionId);
        violation.setAccountNumber("ACC_001");
        violation.setSeverity("HIGH");
        violation.setDescription("Test violation");
        violation.setStatus("OPEN");
        violation.setDetectedAt(LocalDateTime.now());
        return violation;
    }

    // Helper class for testing
    static class TransactionData {
        private String transactionId;
        private String accountNumber;
        private BigDecimal amount;
        
        // Getters and setters
        public String getTransactionId() { return transactionId; }
        public void setTransactionId(String transactionId) { this.transactionId = transactionId; }
        public String getAccountNumber() { return accountNumber; }
        public void setAccountNumber(String accountNumber) { this.accountNumber = accountNumber; }
        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
    }
}
