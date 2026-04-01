# Campus Cruise

Community-driven carpooling platform for college students to facilitate ride-sharing within campus and surrounding communities.

## Project Structure

```
campus-cruise/
├── backend/                 # Node.js + Express.js backend
│   ├── src/
│   │   ├── config/         # Configuration files (database, firebase)
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── migrations/     # Database migrations
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   ├── seeders/        # Database seeders
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   └── server.js       # Entry point
│   ├── .env.example        # Environment variables template
│   ├── .eslintrc.json      # ESLint configuration
│   ├── .sequelizerc        # Sequelize CLI configuration
│   ├── jest.config.js      # Jest configuration
│   └── package.json        # Backend dependencies
│
├── frontend/               # React.js frontend
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   ├── context/       # React Context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   ├── utils/         # Utility functions
│   │   ├── App.jsx        # Main App component
│   │   ├── App.css        # App styles
│   │   ├── main.jsx       # Entry point
│   │   └── index.css      # Global styles
│   ├── .env.example       # Environment variables template
│   ├── .eslintrc.json     # ESLint configuration
│   ├── vite.config.js     # Vite configuration
│   └── package.json       # Frontend dependencies
│
└── .kiro/specs/           # Feature specifications
    └── campus-cruise/
        ├── requirements.md # Requirements document
        ├── design.md      # Design document
        └── tasks.md       # Implementation tasks
```

## Prerequisites

- Node.js 18+ LTS
- MySQL 8.0+
- npm or yarn
- Firebase account (for real-time features)

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration:
   - Database credentials
   - JWT secret
   - Email service credentials
   - Firebase credentials

5. Create the MySQL database:
   ```sql
   CREATE DATABASE campus_cruise;
   ```

6. Run database migrations (when available):
   ```bash
   npx sequelize-cli db:migrate
   ```

7. Start the development server:
   ```bash
   npm run dev
   ```

The backend API will be available at `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your API URL (default: `http://localhost:5000`)

5. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:3000`

## Available Scripts

### Backend

- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

## Technology Stack

### Backend
- Node.js & Express.js
- MySQL with Sequelize ORM
- Socket.io for WebSockets
- JWT for authentication
- Firebase Realtime Database
- Nodemailer for emails
- Apollo Server for GraphQL

### Frontend
- React.js 18+
- React Router
- Axios for HTTP requests
- Socket.io-client
- Vite for build tooling

### Testing
- Jest for unit testing
- Supertest for API testing
- fast-check for property-based testing

## Development Workflow

This project follows a spec-driven development approach. See the `.kiro/specs/campus-cruise/` directory for:
- `requirements.md` - Feature requirements with acceptance criteria
- `design.md` - System design and architecture
- `tasks.md` - Implementation task list

## License

ISC
