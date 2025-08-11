/**
 * Workflow Management Interface Tests
 * Integration tests for the workflow management system
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { WorkflowManagementInterface } from '../index';

// Mock data
const mockCurrentUser = {
  id: 'user-123',
  name: 'John Doe',
  email: 'john.doe@example.com',
  role: 'Compliance Manager',
  permissions: ['workflow:create', 'workflow:edit', 'task:assign', 'workflow:delete']
};

const mockProps = {
  organizationId: 'org-123',
  currentUser: mockCurrentUser
};

// Mock API calls
jest.mock('../../../services/api', () => ({
  workflowApi: {
    getWorkflows: jest.fn().mockResolvedValue({
      data: {
        workflows: [],
        total: 0
      }
    }),
    getTasks: jest.fn().mockResolvedValue({
      data: {
        tasks: [],
        total: 0
      }
    })
  }
}));

describe('WorkflowManagementInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the main interface', async () => {
    render(<WorkflowManagementInterface {...mockProps} />);

    // Check for main navigation tabs
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Workflows')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('should display overview metrics', async () => {
    render(<WorkflowManagementInterface {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Active Workflows')).toBeInTheDocument();
      expect(screen.getByText('Pending Tasks')).toBeInTheDocument();
      expect(screen.getByText('Overdue Items')).toBeInTheDocument();
      expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    });
  });

  it('should switch between tabs', async () => {
    render(<WorkflowManagementInterface {...mockProps} />);

    // Click on Workflows tab
    fireEvent.click(screen.getByText('Workflows'));

    await waitFor(() => {
      expect(screen.getByText('Create Workflow')).toBeInTheDocument();
    });

    // Click on Tasks tab
    fireEvent.click(screen.getByText('Tasks'));

    await waitFor(() => {
      expect(screen.getByText('Task Management')).toBeInTheDocument();
    });
  });

  it('should open workflow builder when create button is clicked', async () => {
    render(<WorkflowManagementInterface {...mockProps} />);

    // Switch to workflows tab
    fireEvent.click(screen.getByText('Workflows'));

    await waitFor(() => {
      const createButton = screen.getByText('Create Workflow');
      fireEvent.click(createButton);

      expect(screen.getByText('Workflow Builder')).toBeInTheDocument();
    });
  });

  it('should filter workflows by status', async () => {
    render(<WorkflowManagementInterface {...mockProps} />);

    // Switch to workflows tab
    fireEvent.click(screen.getByText('Workflows'));

    await waitFor(() => {
      const statusFilter = screen.getByDisplayValue('all');
      fireEvent.change(statusFilter, { target: { value: 'active' } });

      expect(statusFilter.value).toBe('active');
    });
  });

  it('should handle search functionality', async () => {
    render(<WorkflowManagementInterface {...mockProps} />);

    // Switch to workflows tab
    fireEvent.click(screen.getByText('Workflows'));

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText('Search workflows...');
      fireEvent.change(searchInput, { target: { value: 'RBI Circular' } });

      expect(searchInput.value).toBe('RBI Circular');
    });
  });

  it('should display templates when templates tab is selected', async () => {
    render(<WorkflowManagementInterface {...mockProps} />);

    // Click on Templates tab
    fireEvent.click(screen.getByText('Templates'));

    await waitFor(() => {
      expect(screen.getByText('Workflow Templates')).toBeInTheDocument();
      expect(screen.getByText('RBI Circular Review & Implementation')).toBeInTheDocument();
    });
  });

  it('should show analytics when analytics tab is selected', async () => {
    render(<WorkflowManagementInterface {...mockProps} />);

    // Click on Analytics tab
    fireEvent.click(screen.getByText('Analytics'));

    await waitFor(() => {
      expect(screen.getByText('Workflow Analytics')).toBeInTheDocument();
      expect(screen.getByText('Total Workflows')).toBeInTheDocument();
    });
  });

  it('should handle task updates', async () => {
    render(<WorkflowManagementInterface {...mockProps} />);

    // Switch to tasks tab
    fireEvent.click(screen.getByText('Tasks'));

    await waitFor(() => {
      expect(screen.getByText('Task Management')).toBeInTheDocument();
    });
  });

  it('should respect user permissions', async () => {
    const limitedUser = {
      ...mockCurrentUser,
      permissions: ['workflow:view'] // Limited permissions
    };

    render(<WorkflowManagementInterface {...mockProps} currentUser={limitedUser} />);

    // Switch to workflows tab
    fireEvent.click(screen.getByText('Workflows'));

    await waitFor(() => {
      // Create button should not be visible with limited permissions
      expect(screen.queryByText('Create Workflow')).not.toBeInTheDocument();
    });
  });
});

describe('WorkflowManagementInterface Error Handling', () => {
  it('should handle API errors gracefully', async () => {
    // Mock API error
    jest.doMock('../../../services/api', () => ({
      workflowApi: {
        getWorkflows: jest.fn().mockRejectedValue(new Error('API Error')),
        getTasks: jest.fn().mockRejectedValue(new Error('API Error'))
      }
    }));

    render(<WorkflowManagementInterface {...mockProps} />);

    await waitFor(() => {
      // Should still render the interface even with API errors
      expect(screen.getByText('Overview')).toBeInTheDocument();
    });
  });

  it('should show loading states', async () => {
    render(<WorkflowManagementInterface {...mockProps} />);

    // Should show loading initially
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    await waitFor(() => {
      // Loading should disappear after data loads
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });
});

describe('WorkflowManagementInterface Accessibility', () => {
  it('should have proper ARIA labels', async () => {
    render(<WorkflowManagementInterface {...mockProps} />);

    await waitFor(() => {
      const tabList = screen.getByRole('tablist');
      expect(tabList).toBeInTheDocument();

      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(5); // Overview, Workflows, Tasks, Templates, Analytics
    });
  });

  it('should support keyboard navigation', async () => {
    render(<WorkflowManagementInterface {...mockProps} />);

    await waitFor(() => {
      const firstTab = screen.getByRole('tab', { name: /overview/i });
      firstTab.focus();

      // Tab should be focusable
      expect(document.activeElement).toBe(firstTab);
    });
  });
});
