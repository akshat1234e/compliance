/**
 * Workflow Templates Component
 * Pre-built workflow templates for common compliance processes
 */

import {
    Badge,
    Button,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    Input,
    LoadingSpinner,
    Modal
} from '@/components/ui';
import { cn } from '@/lib/utils';
import React, { useEffect, useState } from 'react';

// Types
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'regulatory' | 'compliance' | 'risk' | 'audit' | 'operations';
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedDuration: string;
  tags: string[];
  nodeCount: number;
  usageCount: number;
  rating: number;
  lastUpdated: string;
  createdBy: string;
  isSystemTemplate: boolean;
  preview: {
    steps: string[];
    roles: string[];
    approvals: number;
    notifications: number;
  };
  template: {
    nodes: any[];
    triggers: any[];
    variables: any[];
    permissions: any[];
  };
}

export interface WorkflowTemplatesProps {
  onCreateFromTemplate: (template: WorkflowTemplate) => void;
}

const WorkflowTemplates: React.FC<WorkflowTemplatesProps> = ({
  onCreateFromTemplate
}) => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [showTemplateDetail, setShowTemplateDetail] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterComplexity, setFilterComplexity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'rating' | 'updated'>('usage');

  // Mock templates data
  useEffect(() => {
    const mockTemplates: WorkflowTemplate[] = [
      {
        id: 'template-001',
        name: 'RBI Circular Review & Implementation',
        description: 'Comprehensive workflow for reviewing, analyzing, and implementing RBI circulars with impact assessment and stakeholder notifications.',
        category: 'regulatory',
        complexity: 'complex',
        estimatedDuration: '5-7 days',
        tags: ['rbi', 'circular', 'regulatory', 'compliance', 'implementation'],
        nodeCount: 12,
        usageCount: 45,
        rating: 4.8,
        lastUpdated: '2024-03-15',
        createdBy: 'System Admin',
        isSystemTemplate: true,
        preview: {
          steps: [
            'Initial Review',
            'Impact Assessment',
            'Stakeholder Notification',
            'Implementation Planning',
            'Approval Process',
            'Final Implementation'
          ],
          roles: ['Compliance Analyst', 'Risk Manager', 'Department Head', 'CEO'],
          approvals: 3,
          notifications: 5
        },
        template: {
          nodes: [],
          triggers: [{ type: 'manual', config: {} }],
          variables: [],
          permissions: []
        }
      },
      {
        id: 'template-002',
        name: 'Document Approval Workflow',
        description: 'Multi-level approval process for compliance documents with version control and audit trail.',
        category: 'compliance',
        complexity: 'moderate',
        estimatedDuration: '2-3 days',
        tags: ['document', 'approval', 'version-control', 'audit'],
        nodeCount: 8,
        usageCount: 78,
        rating: 4.6,
        lastUpdated: '2024-03-10',
        createdBy: 'Document Manager',
        isSystemTemplate: true,
        preview: {
          steps: [
            'Document Submission',
            'Initial Review',
            'Manager Approval',
            'Final Approval',
            'Publication'
          ],
          roles: ['Document Author', 'Reviewer', 'Manager', 'Approver'],
          approvals: 2,
          notifications: 4
        },
        template: {
          nodes: [],
          triggers: [{ type: 'manual', config: {} }],
          variables: [],
          permissions: []
        }
      },
      {
        id: 'template-003',
        name: 'Risk Assessment Process',
        description: 'Systematic risk assessment workflow with quantitative analysis and mitigation planning.',
        category: 'risk',
        complexity: 'complex',
        estimatedDuration: '7-10 days',
        tags: ['risk', 'assessment', 'mitigation', 'analysis'],
        nodeCount: 15,
        usageCount: 32,
        rating: 4.7,
        lastUpdated: '2024-03-08',
        createdBy: 'Risk Team',
        isSystemTemplate: true,
        preview: {
          steps: [
            'Risk Identification',
            'Risk Analysis',
            'Risk Evaluation',
            'Mitigation Planning',
            'Approval & Implementation',
            'Monitoring'
          ],
          roles: ['Risk Analyst', 'Risk Manager', 'Business Owner', 'Executive'],
          approvals: 2,
          notifications: 6
        },
        template: {
          nodes: [],
          triggers: [{ type: 'scheduled', config: {} }],
          variables: [],
          permissions: []
        }
      },
      {
        id: 'template-004',
        name: 'Incident Response Workflow',
        description: 'Rapid response workflow for compliance incidents with escalation and reporting mechanisms.',
        category: 'operations',
        complexity: 'moderate',
        estimatedDuration: '1-2 days',
        tags: ['incident', 'response', 'escalation', 'reporting'],
        nodeCount: 10,
        usageCount: 23,
        rating: 4.5,
        lastUpdated: '2024-03-12',
        createdBy: 'Operations Team',
        isSystemTemplate: true,
        preview: {
          steps: [
            'Incident Detection',
            'Initial Assessment',
            'Response Team Assignment',
            'Investigation',
            'Resolution',
            'Post-Incident Review'
          ],
          roles: ['Incident Reporter', 'Response Team', 'Manager', 'Compliance Officer'],
          approvals: 1,
          notifications: 7
        },
        template: {
          nodes: [],
          triggers: [{ type: 'event', config: {} }],
          variables: [],
          permissions: []
        }
      },
      {
        id: 'template-005',
        name: 'Audit Planning & Execution',
        description: 'Comprehensive audit workflow from planning through reporting with stakeholder coordination.',
        category: 'audit',
        complexity: 'complex',
        estimatedDuration: '14-21 days',
        tags: ['audit', 'planning', 'execution', 'reporting'],
        nodeCount: 18,
        usageCount: 15,
        rating: 4.9,
        lastUpdated: '2024-03-05',
        createdBy: 'Audit Team',
        isSystemTemplate: true,
        preview: {
          steps: [
            'Audit Planning',
            'Resource Allocation',
            'Fieldwork Execution',
            'Findings Documentation',
            'Report Preparation',
            'Management Response',
            'Follow-up'
          ],
          roles: ['Audit Manager', 'Auditor', 'Auditee', 'Management'],
          approvals: 3,
          notifications: 8
        },
        template: {
          nodes: [],
          triggers: [{ type: 'scheduled', config: {} }],
          variables: [],
          permissions: []
        }
      },
      {
        id: 'template-006',
        name: 'Simple Task Assignment',
        description: 'Basic workflow for assigning and tracking simple compliance tasks.',
        category: 'operations',
        complexity: 'simple',
        estimatedDuration: '1 day',
        tags: ['task', 'assignment', 'tracking', 'simple'],
        nodeCount: 4,
        usageCount: 156,
        rating: 4.3,
        lastUpdated: '2024-03-18',
        createdBy: 'System Admin',
        isSystemTemplate: true,
        preview: {
          steps: [
            'Task Creation',
            'Assignment',
            'Execution',
            'Completion'
          ],
          roles: ['Task Creator', 'Assignee'],
          approvals: 0,
          notifications: 2
        },
        template: {
          nodes: [],
          triggers: [{ type: 'manual', config: {} }],
          variables: [],
          permissions: []
        }
      }
    ];

    setTemplates(mockTemplates);
    setLoading(false);
  }, []);

  // Filter and sort templates
  const filteredAndSortedTemplates = templates
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
      const matchesComplexity = filterComplexity === 'all' || template.complexity === filterComplexity;

      return matchesSearch && matchesCategory && matchesComplexity;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'usage':
          return b.usageCount - a.usageCount;
        case 'rating':
          return b.rating - a.rating;
        case 'updated':
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        default:
          return 0;
      }
    });

  // Event handlers
  const handleTemplateClick = (template: WorkflowTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateDetail(true);
  };

  const handleUseTemplate = (template: WorkflowTemplate) => {
    onCreateFromTemplate(template);
    setShowTemplateDetail(false);
  };

  // Utility functions
  const getCategoryBadgeVariant = (category: string) => {
    switch (category) {
      case 'regulatory': return 'destructive';
      case 'compliance': return 'primary';
      case 'risk': return 'warning';
      case 'audit': return 'secondary';
      case 'operations': return 'success';
      default: return 'secondary';
    }
  };

  const getComplexityBadgeVariant = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'success';
      case 'moderate': return 'warning';
      case 'complex': return 'destructive';
      default: return 'secondary';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={cn(
        'text-sm',
        i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'
      )}>
        ★
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Workflow Templates</h2>
          <p className="text-gray-600 mt-1">Choose from pre-built templates to quickly create workflows</p>
        </div>
        <Button variant="outline">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Custom Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Categories</option>
            <option value="regulatory">Regulatory</option>
            <option value="compliance">Compliance</option>
            <option value="risk">Risk</option>
            <option value="audit">Audit</option>
            <option value="operations">Operations</option>
          </select>

          <select
            value={filterComplexity}
            onChange={(e) => setFilterComplexity(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="all">All Complexity</option>
            <option value="simple">Simple</option>
            <option value="moderate">Moderate</option>
            <option value="complex">Complex</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="border rounded-md px-3 py-2 text-sm"
          >
            <option value="usage">Most Used</option>
            <option value="rating">Highest Rated</option>
            <option value="updated">Recently Updated</option>
            <option value="name">Name</option>
          </select>
        </div>
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedTemplates.map((template) => (
          <Card
            key={template.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleTemplateClick(template)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={getCategoryBadgeVariant(template.category)}>
                      {template.category}
                    </Badge>
                    <Badge variant={getComplexityBadgeVariant(template.complexity)}>
                      {template.complexity}
                    </Badge>
                  </div>
                </div>
                {template.isSystemTemplate && (
                  <Badge variant="outline" className="text-xs">
                    System
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {template.description}
              </p>

              {/* Template Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <div className="font-medium">{template.estimatedDuration}</div>
                </div>
                <div>
                  <span className="text-gray-600">Steps:</span>
                  <div className="font-medium">{template.nodeCount} nodes</div>
                </div>
                <div>
                  <span className="text-gray-600">Used:</span>
                  <div className="font-medium">{template.usageCount} times</div>
                </div>
                <div>
                  <span className="text-gray-600">Rating:</span>
                  <div className="flex items-center gap-1">
                    {renderStars(template.rating)}
                    <span className="text-xs text-gray-600 ml-1">
                      {template.rating}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 mb-4">
                {template.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {template.tags.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{template.tags.length - 3}
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUseTemplate(template);
                  }}
                >
                  Use Template
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTemplateClick(template);
                  }}
                >
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredAndSortedTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No templates found
          </h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search criteria or filters
          </p>
          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setFilterCategory('all');
            setFilterComplexity('all');
          }}>
            Clear Filters
          </Button>
        </div>
      )}

      {/* Template Detail Modal */}
      {showTemplateDetail && selectedTemplate && (
        <Modal
          open={showTemplateDetail}
          onClose={() => setShowTemplateDetail(false)}
          title={selectedTemplate.name}
          size="xl"
        >
          <div className="space-y-6">
            {/* Template Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-gray-600 mb-4">{selectedTemplate.description}</p>
                <div className="flex items-center gap-4">
                  <Badge variant={getCategoryBadgeVariant(selectedTemplate.category)}>
                    {selectedTemplate.category}
                  </Badge>
                  <Badge variant={getComplexityBadgeVariant(selectedTemplate.complexity)}>
                    {selectedTemplate.complexity}
                  </Badge>
                  <div className="flex items-center gap-1">
                    {renderStars(selectedTemplate.rating)}
                    <span className="text-sm text-gray-600 ml-1">
                      {selectedTemplate.rating} ({selectedTemplate.usageCount} uses)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Template Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Template Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Estimated Duration:</span>
                    <span className="ml-2 font-medium">{selectedTemplate.estimatedDuration}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Number of Steps:</span>
                    <span className="ml-2 font-medium">{selectedTemplate.nodeCount}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Approvals Required:</span>
                    <span className="ml-2 font-medium">{selectedTemplate.preview.approvals}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Notifications:</span>
                    <span className="ml-2 font-medium">{selectedTemplate.preview.notifications}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Created By:</span>
                    <span className="ml-2">{selectedTemplate.createdBy}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="ml-2">{selectedTemplate.lastUpdated}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Involved Roles</h4>
                <div className="space-y-2">
                  {selectedTemplate.preview.roles.map((role, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">{role}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Workflow Steps */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Workflow Steps</h4>
              <div className="space-y-3">
                {selectedTemplate.preview.steps.map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{step}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {selectedTemplate.tags.map(tag => (
                  <Badge key={tag} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between pt-4 border-t">
              <div className="flex gap-2">
                <Button onClick={() => handleUseTemplate(selectedTemplate)}>
                  Use This Template
                </Button>
                <Button variant="outline">
                  Customize & Use
                </Button>
              </div>
              <Button variant="outline" onClick={() => setShowTemplateDetail(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default WorkflowTemplates;
