// Unit Tests for Banking Connector Service
// Testing integration with core banking systems (Temenos, Finacle, Flexcube)

const axios = require('axios');
const { BankingConnector } = require('../../../src/services/integration/banking.connector');
const { EncryptionService } = require('../../../src/services/security/encryption.service');
const { CacheService } = require('../../../src/services/cache/cache.service');
const { AuditService } = require('../../../src/services/audit/audit.service');
const { ConnectionError, ValidationError, TimeoutError } = require('../../../src/utils/errors');

// Mock dependencies
jest.mock('axios');
jest.mock('../../../src/services/security/encryption.service');
jest.mock('../../../src/services/cache/cache.service');
jest.mock('../../../src/services/audit/audit.service');

describe('BankingConnector', () => {
  let bankingConnector;
  let mockEncryptionService;
  let mockCacheService;
  let mockAuditService;
  let mockAxios;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create mock instances
    mockEncryptionService = new EncryptionService();
    mockCacheService = new CacheService();
    mockAuditService = new AuditService();
    mockAxios = axios.create();
    
    // Setup axios mock
    axios.create.mockReturnValue(mockAxios);
    
    // Create service instance
    bankingConnector = new BankingConnector(
      mockEncryptionService,
      mockCacheService,
      mockAuditService
    );
  });

  describe('Temenos T24 Integration', () => {
    const temenosConfig = {
      baseUrl: 'https://temenos-api.bank.com',
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      timeout: 30000
    };

    describe('authenticate', () => {
      it('should authenticate with Temenos successfully', async () => {
        // Arrange
        const mockResponse = {
          data: {
            access_token: 'temenos-access-token',
            token_type: 'Bearer',
            expires_in: 3600
          }
        };
        
        mockAxios.post.mockResolvedValue(mockResponse);
        mockCacheService.set.mockResolvedValue(true);
        mockAuditService.log.mockResolvedValue(true);

        // Act
        const result = await bankingConnector.authenticateTemenos(temenosConfig);

        // Assert
        expect(mockAxios.post).toHaveBeenCalledWith('/oauth/token', {
          grant_type: 'client_credentials',
          client_id: temenosConfig.clientId,
          client_secret: temenosConfig.clientSecret
        });
        expect(mockCacheService.set).toHaveBeenCalledWith(
          'temenos_token',
          mockResponse.data.access_token,
          3600
        );
        expect(result).toEqual(mockResponse.data);
      });

      it('should throw ConnectionError on authentication failure', async () => {
        // Arrange
        mockAxios.post.mockRejectedValue(new Error('Network error'));

        // Act & Assert
        await expect(bankingConnector.authenticateTemenos(temenosConfig))
          .rejects.toThrow(ConnectionError);
        expect(mockAuditService.log).toHaveBeenCalledWith(
          expect.objectContaining({
            action: 'TEMENOS_AUTH_FAILED',
            level: 'ERROR'
          })
        );
      });
    });

    describe('getCustomers', () => {
      it('should fetch customers from Temenos successfully', async () => {
        // Arrange
        const mockToken = 'valid-token';
        const mockCustomers = [
          {
            customerId: 'CUST001',
            customerName: 'John Doe',
            accountNumber: 'ACC001',
            branch: 'MUMBAI'
          }
        ];
        
        mockCacheService.get.mockResolvedValue(mockToken);
        mockAxios.get.mockResolvedValue({ data: { customers: mockCustomers } });
        mockAuditService.log.mockResolvedValue(true);

        // Act
        const result = await bankingConnector.getTemenosCustomers({
          branchCode: 'MUMBAI',
          limit: 100
        });

        // Assert
        expect(mockCacheService.get).toHaveBeenCalledWith('temenos_token');
        expect(mockAxios.get).toHaveBeenCalledWith('/customers', {
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            branchCode: 'MUMBAI',
            limit: 100
          }
        });
        expect(result).toEqual(mockCustomers);
      });

      it('should handle token expiration and re-authenticate', async () => {
        // Arrange
        mockCacheService.get.mockResolvedValue(null);
        mockAxios.post.mockResolvedValue({
          data: { access_token: 'new-token', expires_in: 3600 }
        });
        mockAxios.get.mockResolvedValue({ data: { customers: [] } });

        // Act
        await bankingConnector.getTemenosCustomers({ branchCode: 'MUMBAI' });

        // Assert
        expect(mockAxios.post).toHaveBeenCalledWith('/oauth/token', expect.any(Object));
        expect(mockAxios.get).toHaveBeenCalled();
      });
    });

    describe('getTransactions', () => {
      it('should fetch transactions from Temenos successfully', async () => {
        // Arrange
        const mockToken = 'valid-token';
        const mockTransactions = [
          {
            transactionId: 'TXN001',
            accountNumber: 'ACC001',
            amount: 1000,
            currency: 'INR',
            transactionDate: '2023-12-01',
            description: 'Test Transaction'
          }
        ];
        
        mockCacheService.get.mockResolvedValue(mockToken);
        mockAxios.get.mockResolvedValue({ data: { transactions: mockTransactions } });

        // Act
        const result = await bankingConnector.getTemenosTransactions({
          accountNumber: 'ACC001',
          fromDate: '2023-12-01',
          toDate: '2023-12-31'
        });

        // Assert
        expect(mockAxios.get).toHaveBeenCalledWith('/transactions', {
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          },
          params: {
            accountNumber: 'ACC001',
            fromDate: '2023-12-01',
            toDate: '2023-12-31'
          }
        });
        expect(result).toEqual(mockTransactions);
      });

      it('should validate date range parameters', async () => {
        // Act & Assert
        await expect(bankingConnector.getTemenosTransactions({
          accountNumber: 'ACC001',
          fromDate: '2023-12-31',
          toDate: '2023-12-01'
        })).rejects.toThrow(ValidationError);
      });
    });
  });

  describe('Finacle Integration', () => {
    const finacleConfig = {
      baseUrl: 'https://finacle-api.bank.com',
      username: 'test-user',
      password: 'test-password',
      timeout: 30000
    };

    describe('authenticate', () => {
      it('should authenticate with Finacle successfully', async () => {
        // Arrange
        const mockResponse = {
          data: {
            sessionId: 'finacle-session-id',
            status: 'SUCCESS',
            expiryTime: '2023-12-01T23:59:59Z'
          }
        };
        
        mockEncryptionService.encrypt.mockReturnValue('encrypted-password');
        mockAxios.post.mockResolvedValue(mockResponse);
        mockCacheService.set.mockResolvedValue(true);

        // Act
        const result = await bankingConnector.authenticateFinacle(finacleConfig);

        // Assert
        expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(finacleConfig.password);
        expect(mockAxios.post).toHaveBeenCalledWith('/authenticate', {
          username: finacleConfig.username,
          password: 'encrypted-password'
        });
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('getAccountDetails', () => {
      it('should fetch account details from Finacle successfully', async () => {
        // Arrange
        const mockSessionId = 'valid-session-id';
        const mockAccountDetails = {
          accountNumber: 'FIN001',
          accountName: 'John Doe',
          balance: 50000,
          currency: 'INR',
          accountType: 'SAVINGS',
          status: 'ACTIVE'
        };
        
        mockCacheService.get.mockResolvedValue(mockSessionId);
        mockAxios.get.mockResolvedValue({ data: mockAccountDetails });

        // Act
        const result = await bankingConnector.getFinacleAccountDetails('FIN001');

        // Assert
        expect(mockAxios.get).toHaveBeenCalledWith('/accounts/FIN001', {
          headers: {
            'Session-Id': mockSessionId,
            'Content-Type': 'application/json'
          }
        });
        expect(result).toEqual(mockAccountDetails);
      });

      it('should handle session expiration', async () => {
        // Arrange
        mockCacheService.get.mockResolvedValue(null);
        mockAxios.post.mockResolvedValue({
          data: { sessionId: 'new-session-id', status: 'SUCCESS' }
        });
        mockAxios.get.mockResolvedValue({ data: {} });

        // Act
        await bankingConnector.getFinacleAccountDetails('FIN001');

        // Assert
        expect(mockAxios.post).toHaveBeenCalled(); // Re-authentication
        expect(mockAxios.get).toHaveBeenCalled();
      });
    });
  });

  describe('Flexcube Integration', () => {
    const flexcubeConfig = {
      baseUrl: 'https://flexcube-api.bank.com',
      userId: 'test-user',
      password: 'test-password',
      branchCode: 'MUMBAI',
      timeout: 30000
    };

    describe('authenticate', () => {
      it('should authenticate with Flexcube successfully', async () => {
        // Arrange
        const mockResponse = {
          data: {
            token: 'flexcube-token',
            validity: '2023-12-01T23:59:59Z',
            userRole: 'OPERATOR'
          }
        };
        
        mockAxios.post.mockResolvedValue(mockResponse);
        mockCacheService.set.mockResolvedValue(true);

        // Act
        const result = await bankingConnector.authenticateFlexcube(flexcubeConfig);

        // Assert
        expect(mockAxios.post).toHaveBeenCalledWith('/login', {
          userId: flexcubeConfig.userId,
          password: flexcubeConfig.password,
          branchCode: flexcubeConfig.branchCode
        });
        expect(result).toEqual(mockResponse.data);
      });
    });

    describe('getCustomerData', () => {
      it('should fetch customer data from Flexcube successfully', async () => {
        // Arrange
        const mockToken = 'valid-token';
        const mockCustomerData = {
          customerId: 'FLEX001',
          customerName: 'Jane Smith',
          accounts: ['ACC001', 'ACC002'],
          branch: 'MUMBAI',
          customerType: 'INDIVIDUAL'
        };
        
        mockCacheService.get.mockResolvedValue(mockToken);
        mockAxios.get.mockResolvedValue({ data: mockCustomerData });

        // Act
        const result = await bankingConnector.getFlexcubeCustomerData('FLEX001');

        // Assert
        expect(mockAxios.get).toHaveBeenCalledWith('/customers/FLEX001', {
          headers: {
            'Authorization': `Bearer ${mockToken}`,
            'Content-Type': 'application/json'
          }
        });
        expect(result).toEqual(mockCustomerData);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network timeouts', async () => {
      // Arrange
      const timeoutError = new Error('timeout of 30000ms exceeded');
      timeoutError.code = 'ECONNABORTED';
      mockAxios.post.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(bankingConnector.authenticateTemenos({}))
        .rejects.toThrow(TimeoutError);
    });

    it('should handle connection refused errors', async () => {
      // Arrange
      const connectionError = new Error('connect ECONNREFUSED');
      connectionError.code = 'ECONNREFUSED';
      mockAxios.post.mockRejectedValue(connectionError);

      // Act & Assert
      await expect(bankingConnector.authenticateTemenos({}))
        .rejects.toThrow(ConnectionError);
    });

    it('should log all API calls for audit', async () => {
      // Arrange
      mockAxios.post.mockResolvedValue({ data: { access_token: 'token' } });

      // Act
      await bankingConnector.authenticateTemenos({
        baseUrl: 'https://test.com',
        clientId: 'test',
        clientSecret: 'secret'
      });

      // Assert
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'TEMENOS_AUTH_SUCCESS',
          level: 'INFO'
        })
      );
    });
  });

  describe('Data Transformation', () => {
    it('should transform Temenos data to standard format', () => {
      // Arrange
      const temenosData = {
        customerId: 'T001',
        customerName: 'John Doe',
        accountNumber: 'ACC001'
      };

      // Act
      const result = bankingConnector.transformTemenosCustomer(temenosData);

      // Assert
      expect(result).toEqual({
        id: 'T001',
        name: 'John Doe',
        accountNumber: 'ACC001',
        source: 'TEMENOS'
      });
    });

    it('should transform Finacle data to standard format', () => {
      // Arrange
      const finacleData = {
        accountNumber: 'FIN001',
        accountName: 'Jane Smith',
        balance: 50000
      };

      // Act
      const result = bankingConnector.transformFinacleAccount(finacleData);

      // Assert
      expect(result).toEqual({
        accountNumber: 'FIN001',
        accountHolder: 'Jane Smith',
        currentBalance: 50000,
        source: 'FINACLE'
      });
    });
  });
});
