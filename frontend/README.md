# RBI Compliance Platform - Frontend

A comprehensive React-based frontend application for the RBI Compliance Platform, built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

### 🏗️ **Architecture**
- **Next.js 14** with App Router for modern React development
- **TypeScript** for type safety and better developer experience
- **Redux Toolkit** for state management
- **React Query** for server state management and caching
- **Tailwind CSS** for utility-first styling
- **Headless UI** for accessible UI components

### 🔐 **Authentication & Security**
- JWT-based authentication with automatic token refresh
- Role-based access control (RBAC)
- Secure API communication with automatic error handling
- Session management with localStorage persistence

### 📊 **Dashboard & Monitoring**
- Real-time system health monitoring
- Banking connector status tracking
- Performance metrics visualization
- Alert management and notifications
- Webhook activity monitoring

### 🏦 **Banking Integration Management**
- Connector status and configuration
- Real-time performance metrics
- Error tracking and diagnostics
- Connection health monitoring

### 🔔 **Webhook Management**
- Webhook endpoint configuration
- Delivery tracking and statistics
- Event publishing and management
- Real-time activity monitoring

### 📋 **Compliance & Workflow**
- Compliance workflow management
- Task tracking and assignment
- Report generation and viewing
- Audit trail and history

### 🎨 **User Experience**
- Responsive design for all screen sizes
- Dark/light theme support
- Accessible UI components
- Real-time notifications
- Loading states and error handling

## Technology Stack

### **Core Technologies**
- **Next.js 14** - React framework with App Router
- **React 18** - UI library with concurrent features
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework

### **State Management**
- **Redux Toolkit** - Predictable state container
- **React Query** - Server state management
- **Zustand** - Lightweight state management (for local state)

### **UI Components**
- **Headless UI** - Unstyled, accessible UI components
- **Heroicons** - Beautiful hand-crafted SVG icons
- **Recharts** - Composable charting library
- **React Hook Form** - Performant forms with easy validation

### **Development Tools**
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Update the environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:3000
   NEXT_PUBLIC_APP_URL=http://localhost:3001
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3001](http://localhost:3001)

### Demo Login
Use these credentials to access the demo:
- **Email**: demo@rbi-compliance.com
- **Password**: demo123

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── dashboard/          # Dashboard pages
│   │   ├── login/              # Authentication pages
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   ├── components/             # React components
│   │   ├── auth/               # Authentication components
│   │   ├── dashboard/          # Dashboard components
│   │   ├── layout/             # Layout components
│   │   ├── providers/          # Context providers
│   │   └── ui/                 # Reusable UI components
│   ├── services/               # API services
│   │   └── api/                # API client and endpoints
│   ├── store/                  # Redux store
│   │   └── slices/             # Redux slices
│   ├── styles/                 # Global styles
│   └── lib/                    # Utility functions
├── public/                     # Static assets
├── docs/                       # Documentation
└── package.json                # Dependencies and scripts
```

## Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint errors
npm run type-check   # Run TypeScript type checking
```

## API Integration

The frontend integrates with multiple backend services:

### **Gateway API** (`/api/gateway`)
- Connector status and metrics
- Request execution and monitoring
- Performance tracking

### **Monitoring API** (`/api/monitoring`)
- System health checks
- Performance metrics
- Alert management
- Dashboard summaries

### **Webhook API** (`/api/webhooks`)
- Endpoint management
- Delivery tracking
- Event publishing
- Statistics and analytics

### **Compliance API** (`/api/compliance`)
- Workflow management
- Task tracking
- Report generation

### **Authentication API** (`/api/auth`)
- User login/logout
- Token refresh
- User profile management

## State Management

### **Redux Store Structure**
```typescript
{
  auth: {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    isLoading: boolean
    error: string | null
  },
  dashboard: {
    systemHealth: any
    connectorMetrics: any[]
    alerts: any[]
    performanceMetrics: any
  },
  // ... other slices
}
```

### **React Query Usage**
- Automatic caching and background updates
- Optimistic updates for better UX
- Error handling and retry logic
- Real-time data synchronization

## Component Architecture

### **Layout Components**
- `AppLayout` - Main application layout with navigation
- `DashboardLayout` - Dashboard-specific layout

### **Dashboard Components**
- `MainDashboard` - Primary dashboard view
- `SystemHealthCard` - System health monitoring
- `ConnectorStatusGrid` - Banking connector status
- `PerformanceChart` - Performance metrics visualization
- `RecentAlertsPanel` - Alert management
- `WebhookActivityPanel` - Webhook activity tracking

### **UI Components**
- `Button` - Reusable button component
- `Input` - Form input component
- `Card` - Content container component
- `Modal` - Modal dialog component
- `Loading` - Loading spinner component
- `StatsCard` - Statistics display component

## Styling

### **Tailwind CSS Configuration**
- Custom color palette for brand consistency
- Responsive design utilities
- Component-specific styles
- Dark mode support

### **Design System**
- Consistent spacing and typography
- Accessible color contrasts
- Reusable component patterns
- Mobile-first responsive design

## Performance Optimization

### **Code Splitting**
- Automatic route-based code splitting
- Dynamic imports for heavy components
- Lazy loading for non-critical features

### **Caching Strategy**
- React Query for server state caching
- Browser caching for static assets
- Service worker for offline support (optional)

### **Bundle Optimization**
- Tree shaking for unused code elimination
- Image optimization with Next.js
- Font optimization and preloading

## Deployment

### **Production Build**
```bash
npm run build
npm run start
```

### **Environment Variables**
Set the following environment variables for production:
```env
NEXT_PUBLIC_API_BASE_URL=https://api.your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production
```

### **Docker Deployment**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Contributing

1. Follow the existing code style and patterns
2. Write TypeScript for all new code
3. Add proper error handling and loading states
4. Test components thoroughly
5. Update documentation for new features

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

This project is proprietary software for RBI compliance management.
