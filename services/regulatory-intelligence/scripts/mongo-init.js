// MongoDB Initialization Script
// Creates database, collections, and indexes for Regulatory Intelligence Service

// Switch to the regulatory intelligence database
db = db.getSiblingDB('regulatory_intelligence');

// Create collections with validation schemas
db.createCollection('circular_content', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['circular_id', 'raw_content', 'parsed_content', 'nlp_analysis'],
      properties: {
        circular_id: {
          bsonType: 'string',
          description: 'Reference to the circular ID from PostgreSQL'
        },
        raw_content: {
          bsonType: 'string',
          description: 'Raw HTML/text content of the circular'
        },
        parsed_content: {
          bsonType: 'object',
          required: ['summary', 'key_points', 'requirements', 'deadlines'],
          properties: {
            summary: { bsonType: 'string' },
            key_points: { bsonType: 'array' },
            requirements: { bsonType: 'array' },
            deadlines: { bsonType: 'array' },
            references: { bsonType: 'array' },
            definitions: { bsonType: 'array' }
          }
        },
        nlp_analysis: {
          bsonType: 'object',
          required: ['sentiment', 'complexity', 'urgency'],
          properties: {
            sentiment: {
              bsonType: 'object',
              required: ['score', 'label'],
              properties: {
                score: { bsonType: 'number' },
                label: { enum: ['positive', 'negative', 'neutral'] }
              }
            },
            complexity: {
              bsonType: 'object',
              required: ['score', 'level'],
              properties: {
                score: { bsonType: 'number' },
                level: { enum: ['simple', 'moderate', 'complex'] }
              }
            },
            urgency: {
              bsonType: 'object',
              required: ['score', 'level'],
              properties: {
                score: { bsonType: 'number' },
                level: { enum: ['low', 'medium', 'high'] }
              }
            },
            topics: { bsonType: 'array' },
            entities: { bsonType: 'array' },
            keywords: { bsonType: 'array' }
          }
        },
        processing_metadata: {
          bsonType: 'object',
          properties: {
            parsed_at: { bsonType: 'date' },
            parser_version: { bsonType: 'string' },
            confidence: { bsonType: 'number' },
            processing_time: { bsonType: 'number' }
          }
        },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('timeline_mappings', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['circular_id', 'timeline_events', 'critical_path', 'total_duration'],
      properties: {
        circular_id: {
          bsonType: 'string',
          description: 'Reference to the circular ID from PostgreSQL'
        },
        organization_id: {
          bsonType: ['string', 'null'],
          description: 'Optional organization-specific timeline'
        },
        timeline_events: {
          bsonType: 'array',
          description: 'Array of timeline events'
        },
        critical_path: {
          bsonType: 'array',
          description: 'Array of event IDs in critical path'
        },
        total_duration: {
          bsonType: 'string',
          description: 'Total estimated duration'
        },
        key_milestones: { bsonType: 'array' },
        risk_factors: { bsonType: 'array' },
        recommendations: { bsonType: 'array' },
        created_at: { bsonType: 'date' },
        updated_at: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('notification_logs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['notification_id', 'type', 'title', 'message', 'recipients', 'channels', 'status'],
      properties: {
        notification_id: {
          bsonType: 'string',
          description: 'Unique notification identifier'
        },
        type: {
          bsonType: 'string',
          description: 'Type of notification'
        },
        title: { bsonType: 'string' },
        message: { bsonType: 'string' },
        recipients: { bsonType: 'array' },
        channels: { bsonType: 'array' },
        status: {
          bsonType: 'string',
          enum: ['sent', 'failed', 'pending', 'scheduled']
        },
        channel_results: { bsonType: 'array' },
        metadata: { bsonType: 'object' },
        sent_at: { bsonType: ['date', 'null'] },
        created_at: { bsonType: 'date' }
      }
    }
  }
});

// Create indexes for better performance

// Circular Content Indexes
db.circular_content.createIndex({ circular_id: 1 }, { unique: true });
db.circular_content.createIndex({ 'parsed_content.category': 1 });
db.circular_content.createIndex({ 'nlp_analysis.topics': 1 });
db.circular_content.createIndex({ 'nlp_analysis.keywords': 1 });
db.circular_content.createIndex({ created_at: -1 });
db.circular_content.createIndex({ updated_at: -1 });

// Text search index for content
db.circular_content.createIndex({
  'parsed_content.summary': 'text',
  'parsed_content.key_points': 'text',
  raw_content: 'text'
}, {
  name: 'content_text_search',
  weights: {
    'parsed_content.summary': 10,
    'parsed_content.key_points': 5,
    raw_content: 1
  }
});

// Timeline Mapping Indexes
db.timeline_mappings.createIndex({ circular_id: 1 });
db.timeline_mappings.createIndex({ organization_id: 1 });
db.timeline_mappings.createIndex({ circular_id: 1, organization_id: 1 }, { unique: true });
db.timeline_mappings.createIndex({ created_at: -1 });
db.timeline_mappings.createIndex({ 'timeline_events.date': 1 });
db.timeline_mappings.createIndex({ 'timeline_events.status': 1 });

// Notification Log Indexes
db.notification_logs.createIndex({ notification_id: 1 }, { unique: true });
db.notification_logs.createIndex({ type: 1 });
db.notification_logs.createIndex({ status: 1 });
db.notification_logs.createIndex({ created_at: -1 });
db.notification_logs.createIndex({ sent_at: -1 });
db.notification_logs.createIndex({ 'metadata.circular_id': 1 });
db.notification_logs.createIndex({ 'metadata.organization_id': 1 });

// Compound indexes for common queries
db.notification_logs.createIndex({ type: 1, status: 1, created_at: -1 });
db.circular_content.createIndex({ 'nlp_analysis.urgency.level': 1, created_at: -1 });

// Insert sample data for development
print('Inserting sample data...');

// Sample circular content
db.circular_content.insertOne({
  circular_id: 'sample-circular-001',
  raw_content: '<html><body><h1>Guidelines on Capital Adequacy Framework</h1><p>This circular provides updated guidelines...</p></body></html>',
  parsed_content: {
    summary: 'Updated guidelines for capital adequacy framework implementation under Basel III norms',
    key_points: [
      'Minimum capital adequacy ratio increased to 9%',
      'New reporting format for quarterly submissions',
      'Enhanced risk assessment requirements'
    ],
    requirements: [
      {
        title: 'Maintain minimum capital ratio',
        description: 'Banks must maintain minimum 9% capital adequacy ratio',
        category: 'Capital Adequacy',
        priority: 'high'
      }
    ],
    deadlines: [
      {
        description: 'Submit quarterly capital adequacy report',
        date: '2024-06-30',
        type: 'reporting'
      }
    ],
    references: ['Basel III Framework', 'RBI Master Circular'],
    definitions: [
      {
        term: 'Capital Adequacy Ratio',
        definition: 'The ratio of a bank\'s capital to its risk-weighted assets'
      }
    ]
  },
  nlp_analysis: {
    sentiment: {
      score: 0.1,
      label: 'neutral'
    },
    complexity: {
      score: 7.5,
      level: 'moderate'
    },
    urgency: {
      score: 8.0,
      level: 'high'
    },
    topics: ['capital adequacy', 'basel iii', 'banking regulation'],
    entities: [
      {
        text: 'RBI',
        label: 'ORGANIZATION',
        confidence: 0.95
      },
      {
        text: '9%',
        label: 'PERCENTAGE',
        confidence: 0.90
      }
    ],
    keywords: ['capital', 'adequacy', 'ratio', 'basel', 'reporting', 'quarterly']
  },
  processing_metadata: {
    parsed_at: new Date(),
    parser_version: '1.0.0',
    confidence: 0.85,
    processing_time: 1500
  },
  created_at: new Date(),
  updated_at: new Date()
});

// Sample timeline mapping
db.timeline_mappings.insertOne({
  circular_id: 'sample-circular-001',
  organization_id: null, // Generic timeline
  timeline_events: [
    {
      id: 'event_001',
      type: 'circular_published',
      title: 'RBI Circular Published',
      description: 'Capital Adequacy Guidelines published by RBI',
      date: new Date('2024-01-15'),
      status: 'completed',
      priority: 'high',
      dependencies: [],
      estimated_duration: '1 day',
      completion_percentage: 100
    },
    {
      id: 'event_002',
      type: 'assessment_phase',
      title: 'Impact Assessment',
      description: 'Assess impact of new guidelines on current operations',
      date: new Date('2024-02-01'),
      status: 'in_progress',
      priority: 'high',
      dependencies: ['event_001'],
      estimated_duration: '2 weeks',
      completion_percentage: 60
    }
  ],
  critical_path: ['event_001', 'event_002'],
  total_duration: '120 days',
  key_milestones: [
    {
      id: 'milestone_001',
      name: 'System Implementation Complete',
      description: 'All system changes implemented and tested',
      target_date: new Date('2024-03-31'),
      status: 'not_started',
      criticality: 'high',
      progress: 0
    }
  ],
  risk_factors: [
    {
      id: 'risk_001',
      type: 'schedule',
      description: 'Potential delay in system implementation',
      probability: 6,
      impact: 8,
      mitigation: 'Allocate additional development resources'
    }
  ],
  recommendations: [
    {
      id: 'rec_001',
      type: 'acceleration',
      title: 'Early Start Recommendation',
      description: 'Begin system changes immediately to avoid delays',
      priority: 'high'
    }
  ],
  created_at: new Date(),
  updated_at: new Date()
});

// Sample notification log
db.notification_logs.insertOne({
  notification_id: 'notif_001',
  type: 'regulatory_change',
  title: 'New RBI Circular: Capital Adequacy Guidelines',
  message: 'A new RBI circular on capital adequacy guidelines has been published. Please review and assess impact.',
  recipients: [
    {
      id: 'user_001',
      type: 'user',
      identifier: 'compliance@example.com'
    }
  ],
  channels: ['email', 'in_app'],
  status: 'sent',
  channel_results: [
    {
      channel: 'email',
      status: 'delivered',
      sent_at: new Date(),
      delivered_at: new Date()
    },
    {
      channel: 'in_app',
      status: 'delivered',
      sent_at: new Date(),
      delivered_at: new Date()
    }
  ],
  metadata: {
    source: 'regulatory-intelligence-service',
    circular_id: 'sample-circular-001',
    tags: ['capital_adequacy', 'high_priority']
  },
  sent_at: new Date(),
  created_at: new Date()
});

print('MongoDB initialization completed successfully!');
print('Collections created: circular_content, timeline_mappings, notification_logs');
print('Indexes created for optimal performance');
print('Sample data inserted for development');

// Create a user for the application (optional)
db.createUser({
  user: 'regulatory_app',
  pwd: 'app_password',
  roles: [
    {
      role: 'readWrite',
      db: 'regulatory_intelligence'
    }
  ]
});
