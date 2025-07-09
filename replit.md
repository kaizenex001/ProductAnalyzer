# Product Analyzer - Replit Project Documentation

## Overview

This is a full-stack product analysis application built with React, Express, and PostgreSQL. The application allows users to input product details and receive AI-generated analysis reports. Users can save these reports and view them in a dedicated reports section. The application features a modern UI built with shadcn/ui components and integrates with OpenAI for intelligent product analysis.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state management
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API with JSON responses
- **File Upload**: Multer middleware for image uploads
- **Error Handling**: Centralized error handling middleware

### Database Architecture
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Schema**: Single `reports` table storing product data and analysis results
- **Migrations**: Drizzle Kit for schema management

## Key Components

### Page Structure
1. **Analyzer Page** (`/`): Two-panel interface for product input and real-time analysis
2. **Reports Page** (`/reports`): Card-based list of saved analysis reports
3. **Content Ideation Page** (`/content-ideation`): AI-powered content generation with multiple options per category
4. **Report Modal**: Overlay component for viewing detailed saved reports

### Core Features
- **Product Input Form**: Collapsible accordion sections for organized data entry
- **AI Analysis Panel**: Real-time display of generated analysis with copy-to-clipboard functionality
- **Report Management**: Save, view, and delete analysis reports
- **Content Ideation**: AI-generated content with multiple options (hashtags, captions, storylines, hooks, CTAs)
- **Content Optimization**: AI refinement of selected content pieces
- **Image Upload**: File upload with drag-and-drop support
- **PDF Generation**: Export reports as PDF documents

### UI Components
- **Navigation**: Persistent header with route-based active states
- **Forms**: Validated forms with error handling and loading states
- **Modals**: Overlays for detailed report viewing
- **File Upload**: Custom drag-and-drop file upload component
- **Responsive Design**: Mobile-friendly layouts with Tailwind breakpoints

## Data Flow

### Analysis Workflow
1. User fills out product details in the input form
2. Form validation ensures required fields are completed
3. Data is sent to `/api/analyze` endpoint
4. Backend processes data and calls OpenAI API for analysis
5. Generated analysis is returned and displayed in the analysis panel
6. User can save the report, which stores both input data and analysis results

### Report Management
1. Saved reports are stored in PostgreSQL with full product and analysis data
2. Reports page fetches all reports via `/api/reports`
3. Individual reports can be viewed via modal using `/api/reports/:id`
4. Reports can be deleted with confirmation
5. PDF export generates downloadable reports

### File Upload Process
1. Images are uploaded via `/api/upload-image` endpoint
2. Multer processes multipart form data with file validation
3. Images are stored and URLs returned for form integration
4. Optional image analysis integration with OpenAI Vision API

### Content Generation Workflow
1. Users select a saved product report as context for content generation
2. AI generates multiple options for each content category via `/api/generate-content`
3. Users can select preferred options and request optimization via `/api/optimize-content`
4. All content is tailored to the specific product and target audience
5. Content includes trending hashtags, SEO captions, storylines, hooks, and CTAs

## External Dependencies

### Core Technologies
- **React Ecosystem**: React, React DOM, React Hook Form, TanStack Query
- **UI Framework**: Radix UI primitives, Lucide icons, Tailwind CSS
- **Backend**: Express.js, Multer for file uploads
- **Database**: Drizzle ORM, Neon PostgreSQL driver
- **Validation**: Zod for schema validation
- **AI Integration**: OpenAI API for product analysis

### Development Tools
- **Build System**: Vite for frontend bundling and development
- **TypeScript**: Full type safety across frontend and backend
- **Development**: tsx for TypeScript execution, ESBuild for production builds

### Third-Party Services
- **Database**: Neon PostgreSQL for serverless database hosting
- **AI Analysis**: OpenAI GPT-4 for intelligent product analysis
- **File Storage**: Local file system for image uploads (can be extended to cloud storage)

## Deployment Strategy

### Development Setup
- **Frontend**: Vite development server with HMR
- **Backend**: tsx for TypeScript execution with auto-restart
- **Database**: Drizzle Kit for schema management and migrations
- **Environment**: Environment variables for database and API configuration

### Production Build
- **Frontend**: Vite builds static assets to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Static Serving**: Express serves built frontend assets
- **Database**: Production PostgreSQL with connection pooling

### Key Configuration
- **Database URL**: Required environment variable for PostgreSQL connection
- **OpenAI API Key**: Required for AI analysis functionality
- **File Upload**: Configurable storage location and size limits
- **CORS**: Configured for development and production environments

### Scalability Considerations
- Stateless server design allows for horizontal scaling
- Database connection pooling for concurrent request handling
- Modular architecture supports microservice migration
- API-first design enables mobile app integration