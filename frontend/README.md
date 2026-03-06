# Frontend - AI Financial Transaction Analyzer

This is the frontend application for the AI Financial Transaction Analyzer, built with Next.js, TypeScript, and Tailwind CSS.

## 🚀 Features

### Dashboard
- **Real-time Overview**: Key metrics and statistics at a glance
- **Interactive Charts**: Risk distribution and transaction trends
- **Recent Transactions**: Live feed of transaction data with risk scoring
- **Security Alerts**: Real-time fraud detection alerts and notifications

### Key Components
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Real-time Updates**: WebSocket integration for live data
- **Data Visualization**: Interactive charts using Recharts
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Loading States**: Skeleton screens and spinners for better UX
- **Toast Notifications**: Non-intrusive user feedback system

## 🛠 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Charts**: Recharts
- **State Management**: React Query (TanStack Query)
- **HTTP Client**: Axios
- **Date Handling**: date-fns
- **Forms**: React Hook Form
- **Notifications**: Custom Toast System

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js App Router
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home page
│   └── providers.tsx       # App providers (Query, Toast, Error Boundary)
├── components/             # Reusable components
│   ├── Dashboard.tsx       # Main dashboard
│   ├── Sidebar.tsx         # Navigation sidebar
│   ├── Header.tsx          # App header
│   ├── OverviewCards.tsx   # Statistics cards
│   ├── RecentTransactions.tsx # Transaction list
│   ├── AlertsPanel.tsx     # Security alerts
│   ├── RiskDistributionChart.tsx # Risk chart
│   ├── TransactionTrendsChart.tsx # Trends chart
│   ├── LoadingSpinner.tsx  # Loading components
│   ├── ErrorBoundary.tsx   # Error handling
│   ├── Toast.tsx           # Notification system
│   └── index.ts            # Component exports
├── utils/                  # Utility functions
│   └── api.ts              # API client and endpoints
├── public/                 # Static assets
├── package.json            # Dependencies and scripts
├── next.config.js          # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
└── next-env.d.ts          # Next.js TypeScript definitions
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API running on http://localhost:8000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env.local
```

3. Configure environment variables in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📊 Available Pages

### Dashboard (`/`)
- Overview statistics
- Risk distribution chart
- Transaction trends
- Recent transactions
- Security alerts

### Transactions (`/transactions`)
- Transaction list with filtering
- Transaction details
- Upload new transactions
- Bulk operations

### Analytics (`/analytics`)
- Detailed analytics and reports
- Risk analysis
- Pattern detection
- Merchant analysis

### Alerts (`/alerts`)
- Security alerts management
- Alert investigation
- Alert resolution
- Alert history

### Risk Analysis (`/risk`)
- Risk scoring details
- AI model explanations
- Risk factors analysis
- Prediction insights

### Reports (`/reports`)
- Generate reports
- Download reports
- Report history
- Custom reports

### Settings (`/settings`)
- User preferences
- API configuration
- System settings
- Data management

## 🎨 Design System

### Colors
- **Primary**: Blue (`#3b82f6`)
- **Success**: Green (`#10b981`)
- **Warning**: Yellow (`#f59e0b`)
- **Danger**: Red (`#ef4444`)
- **Info**: Blue (`#3b82f6`)
- **Gray**: Various shades (`#f3f4f6` to `#111827`)

### Typography
- **Font**: Inter (system font fallback)
- **Headings**: `text-lg`, `text-xl`, `text-2xl`
- **Body**: `text-sm`, `text-base`
- **Small**: `text-xs`

### Components
- **Buttons**: `.btn`, `.btn-primary`, `.btn-secondary`, etc.
- **Cards**: `.card`, `.stat-card`
- **Badges**: `.badge`, `.badge-success`, `.badge-warning`, etc.
- **Forms**: Standard form elements with Tailwind styling

## 🔧 Configuration

### Next.js Configuration (`next.config.js`)
- API rewrites for backend proxy
- Image optimization settings
- App router configuration

### Tailwind CSS Configuration (`tailwind.config.js`)
- Custom color palette
- Extended theme
- Custom components
- Plugin configuration

### TypeScript Configuration
- Strict mode enabled
- Path aliases (`@/*`)
- Next.js types
- Component type safety

## 📱 Responsive Design

### Breakpoints
- **Mobile**: `sm:` (640px+)
- **Tablet**: `md:` (768px+)
- **Desktop**: `lg:` (1024px+)
- **Large Desktop**: `xl:` (1280px+)

### Mobile Considerations
- Collapsible sidebar
- Touch-friendly interactions
- Optimized charts for small screens
- Responsive tables with horizontal scroll

## 🔄 State Management

### React Query Configuration
- Stale time: 1 minute
- Retry: 1 attempt
- Background refetching
- Cache management

### Toast System
- Auto-dismiss after 5 seconds
- Manual dismiss option
- Multiple toast support
- Type-specific styling

### Error Handling
- Error boundaries for component errors
- API error handling with user feedback
- Loading states and skeletons
- Graceful degradation

## 📈 Performance

### Optimization
- Image optimization with Next.js
- Code splitting by pages
- Lazy loading components
- Efficient re-renders with React Query

### Bundle Size
- Tree shaking enabled
- Dynamic imports for large libraries
- Optimized dependencies
- Minimal CSS with PurgeCSS

## 🔐 Security

### Authentication
- JWT token management
- Secure token storage
- Automatic token refresh
- Protected routes

### Data Security
- HTTPS enforcement
- API request validation
- XSS protection
- CSRF protection

## 🧪 Testing

### Unit Tests
- Component testing with Jest
- Hook testing with React Testing Library
- API client testing
- Utility function testing

### Integration Tests
- End-to-end testing with Cypress
- API integration testing
- User flow testing
- Cross-browser testing

## 📚 API Integration

### Endpoints
- Authentication: `/auth/*`
- Transactions: `/transactions/*`
- Analytics: `/analytics/*`
- Alerts: `/alerts/*`
- Risk Analysis: `/risk/*`
- Reports: `/reports/*`

### Error Handling
- Network error handling
- Timeout management
- Retry logic
- User feedback

## 🚀 Deployment

### Build Process
```bash
npm run build
npm start
```

### Environment Variables
- Production API URL
- Analytics configuration
- Feature flags
- Performance settings

### Static Assets
- Optimized images
- Minified CSS/JS
- CDN integration
- Caching strategy

## 🐛 Troubleshooting

### Common Issues
1. **API Connection Errors**: Check backend is running and API URL is correct
2. **Build Errors**: Ensure all dependencies are installed
3. **Type Errors**: Check TypeScript configuration
4. **Styling Issues**: Verify Tailwind CSS is properly configured

### Debug Tools
- React Query DevTools
- Next.js DevTools
- Browser DevTools
- Network tab for API calls

## 📝 Development Guidelines

### Code Style
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Consistent naming conventions

### Component Structure
- Single responsibility principle
- Reusable and composable
- Proper TypeScript types
- Documentation with JSDoc

### Best Practices
- Performance optimization
- Accessibility compliance
- SEO optimization
- Progressive enhancement

## 🔮 Future Enhancements

### Planned Features
- Real-time WebSocket updates
- Advanced filtering and search
- Custom dashboard widgets
- Export functionality
- Multi-language support
- Dark mode theme
- Advanced analytics
- Machine learning insights

### Technical Improvements
- Server-side rendering optimization
- Micro-frontend architecture
- Progressive Web App (PWA)
- Offline functionality
- Performance monitoring
- Error tracking integration
