// End-to-End Tests for Compliance Workflow
// Testing complete compliance management workflow from creation to submission

const puppeteer = require('puppeteer');
const request = require('supertest');
const { app } = require('../../src/app');
const { DatabaseService } = require('../../src/services/database/database.service');

describe('Compliance Workflow E2E Tests', () => {
  let browser;
  let page;
  let databaseService;
  let testUser;
  let accessToken;

  beforeAll(async () => {
    // Initialize database
    databaseService = new DatabaseService();
    await databaseService.connect();

    // Launch browser
    browser = await puppeteer.launch({
      headless: process.env.CI === 'true',
      slowMo: process.env.CI === 'true' ? 0 : 50,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // Create test user via API
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'e2e.compliance@example.com',
        password: 'SecurePassword123!',
        name: 'E2E Compliance User',
        role: 'compliance_officer'
      });

    testUser = registerResponse.body.data.user;

    // Login to get access token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'e2e.compliance@example.com',
        password: 'SecurePassword123!'
      });

    accessToken = loginResponse.body.data.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await request(app)
        .delete(`/api/users/${testUser.id}`)
        .set('Authorization', `Bearer ${accessToken}`);
    }

    // Close browser and database
    if (browser) {
      await browser.close();
    }
    await databaseService.disconnect();
  });

  beforeEach(async () => {
    // Create new page for each test
    page = await browser.newPage();
    
    // Set viewport
    await page.setViewport({ width: 1280, height: 720 });
    
    // Set up request interception for API calls
    await page.setRequestInterception(true);
    
    page.on('request', (request) => {
      // Add authorization header to API requests
      if (request.url().includes('/api/')) {
        const headers = {
          ...request.headers(),
          'Authorization': `Bearer ${accessToken}`
        };
        request.continue({ headers });
      } else {
        request.continue();
      }
    });

    // Navigate to application
    await page.goto('http://localhost:3000');
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  describe('Compliance Task Creation Workflow', () => {
    it('should create a new compliance task successfully', async () => {
      // Navigate to compliance dashboard
      await page.click('[data-testid="nav-compliance"]');
      await page.waitForSelector('[data-testid="compliance-dashboard"]');

      // Click create new task button
      await page.click('[data-testid="create-task-btn"]');
      await page.waitForSelector('[data-testid="task-creation-form"]');

      // Fill in task details
      await page.type('[data-testid="task-title"]', 'RBI Circular Compliance - Test');
      await page.select('[data-testid="task-category"]', 'REGULATORY_REPORTING');
      await page.type('[data-testid="task-description"]', 'Test compliance task for E2E testing');
      
      // Set due date (30 days from now)
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      const dateString = futureDate.toISOString().split('T')[0];
      await page.type('[data-testid="task-due-date"]', dateString);

      // Select priority
      await page.select('[data-testid="task-priority"]', 'HIGH');

      // Assign to user
      await page.select('[data-testid="task-assignee"]', testUser.id);

      // Submit form
      await page.click('[data-testid="submit-task-btn"]');

      // Wait for success message
      await page.waitForSelector('[data-testid="success-message"]');
      const successMessage = await page.$eval('[data-testid="success-message"]', el => el.textContent);
      expect(successMessage).toContain('Task created successfully');

      // Verify task appears in task list
      await page.waitForSelector('[data-testid="task-list"]');
      const taskExists = await page.$('[data-testid="task-item"]');
      expect(taskExists).toBeTruthy();
    });

    it('should validate required fields', async () => {
      // Navigate to task creation
      await page.click('[data-testid="nav-compliance"]');
      await page.click('[data-testid="create-task-btn"]');
      await page.waitForSelector('[data-testid="task-creation-form"]');

      // Try to submit without filling required fields
      await page.click('[data-testid="submit-task-btn"]');

      // Check for validation errors
      await page.waitForSelector('[data-testid="validation-error"]');
      const errorMessage = await page.$eval('[data-testid="validation-error"]', el => el.textContent);
      expect(errorMessage).toContain('required');
    });
  });

  describe('Document Upload Workflow', () => {
    let taskId;

    beforeEach(async () => {
      // Create a test task first
      const taskResponse = await request(app)
        .post('/api/compliance/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Document Upload Test Task',
          category: 'REGULATORY_REPORTING',
          description: 'Test task for document upload',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'MEDIUM',
          assignedTo: testUser.id
        });

      taskId = taskResponse.body.data.task.id;
    });

    it('should upload documents to compliance task', async () => {
      // Navigate to task details
      await page.goto(`http://localhost:3000/compliance/tasks/${taskId}`);
      await page.waitForSelector('[data-testid="task-details"]');

      // Click upload document button
      await page.click('[data-testid="upload-document-btn"]');
      await page.waitForSelector('[data-testid="document-upload-modal"]');

      // Upload file
      const fileInput = await page.$('[data-testid="file-input"]');
      await fileInput.uploadFile('./tests/fixtures/sample-document.pdf');

      // Fill document metadata
      await page.type('[data-testid="document-title"]', 'Test Compliance Document');
      await page.select('[data-testid="document-type"]', 'REPORT');
      await page.type('[data-testid="document-description"]', 'Test document for compliance');

      // Submit upload
      await page.click('[data-testid="upload-submit-btn"]');

      // Wait for upload completion
      await page.waitForSelector('[data-testid="upload-success"]');

      // Verify document appears in document list
      await page.waitForSelector('[data-testid="document-list"]');
      const documentExists = await page.$('[data-testid="document-item"]');
      expect(documentExists).toBeTruthy();

      // Verify document title
      const documentTitle = await page.$eval('[data-testid="document-title"]', el => el.textContent);
      expect(documentTitle).toContain('Test Compliance Document');
    });

    it('should validate file types and size', async () => {
      // Navigate to task details
      await page.goto(`http://localhost:3000/compliance/tasks/${taskId}`);
      await page.click('[data-testid="upload-document-btn"]');
      await page.waitForSelector('[data-testid="document-upload-modal"]');

      // Try to upload invalid file type
      const fileInput = await page.$('[data-testid="file-input"]');
      await fileInput.uploadFile('./tests/fixtures/invalid-file.txt');

      // Check for validation error
      await page.waitForSelector('[data-testid="file-validation-error"]');
      const errorMessage = await page.$eval('[data-testid="file-validation-error"]', el => el.textContent);
      expect(errorMessage).toContain('file type not allowed');
    });
  });

  describe('Task Status Update Workflow', () => {
    let taskId;

    beforeEach(async () => {
      // Create a test task
      const taskResponse = await request(app)
        .post('/api/compliance/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Status Update Test Task',
          category: 'REGULATORY_REPORTING',
          description: 'Test task for status updates',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          priority: 'HIGH',
          assignedTo: testUser.id
        });

      taskId = taskResponse.body.data.task.id;
    });

    it('should update task status through workflow', async () => {
      // Navigate to task details
      await page.goto(`http://localhost:3000/compliance/tasks/${taskId}`);
      await page.waitForSelector('[data-testid="task-details"]');

      // Verify initial status
      const initialStatus = await page.$eval('[data-testid="task-status"]', el => el.textContent);
      expect(initialStatus).toContain('PENDING');

      // Start working on task
      await page.click('[data-testid="start-task-btn"]');
      await page.waitForSelector('[data-testid="status-updated"]');

      // Verify status changed to IN_PROGRESS
      const inProgressStatus = await page.$eval('[data-testid="task-status"]', el => el.textContent);
      expect(inProgressStatus).toContain('IN_PROGRESS');

      // Add progress comment
      await page.click('[data-testid="add-comment-btn"]');
      await page.waitForSelector('[data-testid="comment-form"]');
      await page.type('[data-testid="comment-text"]', 'Working on compliance documentation');
      await page.click('[data-testid="submit-comment-btn"]');

      // Wait for comment to appear
      await page.waitForSelector('[data-testid="comment-item"]');
      const commentText = await page.$eval('[data-testid="comment-text"]', el => el.textContent);
      expect(commentText).toContain('Working on compliance documentation');

      // Complete the task
      await page.click('[data-testid="complete-task-btn"]');
      await page.waitForSelector('[data-testid="completion-form"]');
      await page.type('[data-testid="completion-notes"]', 'Task completed successfully');
      await page.click('[data-testid="confirm-completion-btn"]');

      // Verify status changed to COMPLETED
      await page.waitForSelector('[data-testid="status-updated"]');
      const completedStatus = await page.$eval('[data-testid="task-status"]', el => el.textContent);
      expect(completedStatus).toContain('COMPLETED');
    });
  });

  describe('Compliance Report Generation', () => {
    it('should generate compliance report successfully', async () => {
      // Navigate to reports section
      await page.click('[data-testid="nav-reports"]');
      await page.waitForSelector('[data-testid="reports-dashboard"]');

      // Click generate report button
      await page.click('[data-testid="generate-report-btn"]');
      await page.waitForSelector('[data-testid="report-generation-form"]');

      // Select report type
      await page.select('[data-testid="report-type"]', 'COMPLIANCE_SUMMARY');

      // Set date range
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();
      
      await page.type('[data-testid="start-date"]', startDate.toISOString().split('T')[0]);
      await page.type('[data-testid="end-date"]', endDate.toISOString().split('T')[0]);

      // Select format
      await page.select('[data-testid="report-format"]', 'PDF');

      // Generate report
      await page.click('[data-testid="generate-btn"]');

      // Wait for generation to complete
      await page.waitForSelector('[data-testid="report-generated"]', { timeout: 30000 });

      // Verify download link appears
      const downloadLink = await page.$('[data-testid="download-report-btn"]');
      expect(downloadLink).toBeTruthy();

      // Verify report appears in reports list
      await page.waitForSelector('[data-testid="reports-list"]');
      const reportExists = await page.$('[data-testid="report-item"]');
      expect(reportExists).toBeTruthy();
    });
  });

  describe('Dashboard Analytics', () => {
    it('should display compliance metrics correctly', async () => {
      // Navigate to dashboard
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForSelector('[data-testid="compliance-dashboard"]');

      // Wait for metrics to load
      await page.waitForSelector('[data-testid="metrics-loaded"]');

      // Verify key metrics are displayed
      const totalTasks = await page.$('[data-testid="total-tasks-metric"]');
      const pendingTasks = await page.$('[data-testid="pending-tasks-metric"]');
      const overdueTasks = await page.$('[data-testid="overdue-tasks-metric"]');
      const completionRate = await page.$('[data-testid="completion-rate-metric"]');

      expect(totalTasks).toBeTruthy();
      expect(pendingTasks).toBeTruthy();
      expect(overdueTasks).toBeTruthy();
      expect(completionRate).toBeTruthy();

      // Verify charts are rendered
      const complianceChart = await page.$('[data-testid="compliance-chart"]');
      const trendChart = await page.$('[data-testid="trend-chart"]');

      expect(complianceChart).toBeTruthy();
      expect(trendChart).toBeTruthy();
    });

    it('should filter dashboard data by date range', async () => {
      // Navigate to dashboard
      await page.goto('http://localhost:3000/dashboard');
      await page.waitForSelector('[data-testid="compliance-dashboard"]');

      // Open date filter
      await page.click('[data-testid="date-filter-btn"]');
      await page.waitForSelector('[data-testid="date-filter-form"]');

      // Set custom date range
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
      const endDate = new Date();

      await page.type('[data-testid="filter-start-date"]', startDate.toISOString().split('T')[0]);
      await page.type('[data-testid="filter-end-date"]', endDate.toISOString().split('T')[0]);

      // Apply filter
      await page.click('[data-testid="apply-filter-btn"]');

      // Wait for data to refresh
      await page.waitForSelector('[data-testid="data-refreshed"]');

      // Verify filter is applied
      const filterIndicator = await page.$('[data-testid="active-filter"]');
      expect(filterIndicator).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // Simulate network failure
      await page.setOfflineMode(true);

      // Try to navigate to a page that requires API call
      await page.goto('http://localhost:3000/compliance/tasks');

      // Wait for error message
      await page.waitForSelector('[data-testid="network-error"]');
      const errorMessage = await page.$eval('[data-testid="network-error"]', el => el.textContent);
      expect(errorMessage).toContain('network error');

      // Restore network
      await page.setOfflineMode(false);

      // Click retry button
      await page.click('[data-testid="retry-btn"]');

      // Verify page loads successfully
      await page.waitForSelector('[data-testid="compliance-dashboard"]');
    });

    it('should handle session expiration', async () => {
      // Simulate expired token by clearing storage
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      // Try to access protected page
      await page.goto('http://localhost:3000/compliance/tasks');

      // Should redirect to login
      await page.waitForSelector('[data-testid="login-form"]');
      const currentUrl = page.url();
      expect(currentUrl).toContain('/login');
    });
  });
});
