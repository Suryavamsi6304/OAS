# Online Assessment Platform (OAS)

A comprehensive web-based assessment platform supporting multiple user roles with secure authentication and real-time test taking capabilities.

## Features

### Core Functionality
- **Multi-role Authentication**: Admin, Teacher, and Student roles
- **Assessment Management**: Create, manage, and conduct online tests
- **Real-time Test Taking**: Interactive test interface with timer and navigation
- **Results & Analytics**: Comprehensive result tracking and performance analysis
- **Practice Platform**: Level-based practice system for skill development

### Assessment Types Supported
- Multiple Choice Questions (MCQ)
- True/False Questions
- Short Answer Questions
- Essay Questions
- Fill-in-the-blank Questions

### Security Features
- JWT-based authentication
- Role-based access control (RBAC)
- Input validation and sanitization
- Audit logging
- Rate limiting

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT
- **Validation**: Joi
- **Security**: Helmet, CORS, bcrypt

### Frontend
- **Languages**: HTML5, CSS3, Vanilla JavaScript
- **Styling**: Custom CSS with responsive design
- **Architecture**: Modular JavaScript with API service layer

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd assessment-platform
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Database Setup**
   ```bash
   # Create database
   createdb assessment_platform
   
   # Run schema
   psql -d assessment_platform -f ../database/schema.sql
   ```

4. **Environment Configuration**
   ```bash
   # Copy and edit environment file
   cp .env.example .env
   # Edit .env with your database credentials
   ```

5. **Start the backend server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Serve frontend files**
   ```bash
   cd frontend
   # Use any static file server, e.g.:
   python -m http.server 3001
   # or
   npx serve -p 3001
   ```

2. **Access the application**
   - Open browser and navigate to `http://localhost:3001`
   - Default admin credentials: `admin@assessment.com` / `password`

## Project Structure

```
assessment-platform/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── middleware/
│   │   └── auth.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── assessment.js
│   │   ├── result.js
│   │   ├── user.js
│   │   ├── practice.js
│   │   └── admin.js
│   ├── package.json
│   ├── server.js
│   └── .env
├── frontend/
│   ├── css/
│   │   ├── style.css
│   │   ├── login.css
│   │   └── dashboard.css
│   ├── js/
│   │   ├── auth.js
│   │   ├── api.js
│   │   ├── login.js
│   │   └── dashboard.js
│   ├── pages/
│   ├── index.html
│   ├── dashboard.html
│   └── test-taking.html
├── database/
│   └── schema.sql
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Token verification

### Assessments
- `GET /api/assessments` - Get all assessments
- `POST /api/assessments` - Create assessment (Teacher/Admin)
- `GET /api/assessments/:id` - Get specific assessment
- `PUT /api/assessments/:id` - Update assessment
- `DELETE /api/assessments/:id` - Delete assessment

### Results
- `POST /api/results/submit/:assessmentId` - Submit assessment
- `GET /api/results/student/:studentId` - Get student results
- `GET /api/results/assessment/:assessmentId` - Get assessment results

### Practice
- `GET /api/practice/level/:level` - Get practice questions
- `POST /api/practice/submit` - Submit practice session

### Admin
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create user
- `GET /api/admin/analytics` - Get system analytics

## User Roles & Permissions

### Student
- Take assessments
- View results and performance
- Access practice platform
- View dashboard with upcoming tests

### Teacher
- Create and manage assessments
- View student results
- Grade subjective questions
- Manage question bank

### Admin
- Full system access
- User management
- System analytics
- Platform configuration

## Database Schema

### Core Tables
- `users` - User accounts and profiles
- `assessments` - Test definitions
- `questions` - Assessment questions
- `results` - Test submissions and scores
- `question_bank` - Reusable question library
- `practice_sessions` - Practice attempt tracking
- `audit_logs` - System activity logging

## Security Considerations

- All passwords are hashed using bcrypt
- JWT tokens for stateless authentication
- Input validation on all endpoints
- SQL injection prevention
- XSS protection
- CORS configuration
- Rate limiting on API endpoints

## Development

### Running Tests
```bash
cd backend
npm test
```

### Code Style
- ESLint configuration for JavaScript
- Consistent naming conventions
- Modular architecture

## Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secret
4. Enable HTTPS
5. Configure reverse proxy (nginx)
6. Set up monitoring and logging

### Environment Variables
```
PORT=3000
NODE_ENV=production
JWT_SECRET=your_secure_secret_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=assessment_platform
DB_USER=postgres
DB_PASSWORD=your_password
CORS_ORIGIN=https://yourdomain.com
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## Roadmap

### Upcoming Features
- Real-time notifications
- Advanced analytics dashboard
- Mobile application
- Integration with LMS platforms
- Automated proctoring
- Question import/export
- Bulk user management
- Advanced reporting