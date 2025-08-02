# Event Team Management Dashboard

A responsive web dashboard for event teams to track and manage event requests with real-time status updates.

## Features

### Event Management
- Create/Edit/Delete event entries
- Fields: Event Name, Client, Date/Time, Location, Description, Budget, Team Members
- Status tracking (Requested, Planning, Confirmed, In Progress, Completed, Cancelled)
- Priority levels (Low/Medium/High)

### Dashboard Views
- Calendar view of all events
- Kanban board for status visualization
- Summary statistics (events by status/priority/month)

### User Features
- Role-based access (Admin/Team Member)
- Assign team members to events
- Comment/update system per event

### Notifications
- Real-time updates when status changes
- Email/SMS alerts for urgent events

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Node.js with Express.js
- **Database**: MongoDB
- **Real-time**: Socket.IO
- **Authentication**: JWT
- **Charts**: Chart.js

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd event-team-management
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=3000
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:3000`

## Deployment on Render

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set the following environment variables in Render:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: Your JWT secret key
   - `PORT`: 10000 (Render's default port)

4. Set the build command to:
```bash
npm install
```

5. Set the start command to:
```bash
npm start
```

6. Add a MongoDB database (you can use Render's MongoDB service or any other provider)

## Project Structure

```
event-team-management/
├── models/              # Database models
│   ├── User.js
│   ├── Event.js
│   ├── Comment.js
│   └── Notification.js
├── public/              # Frontend files
│   ├── index.html
│   ├── styles/
│   └── js/
├── package.json
├── server.js            # Main server file
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - User registration

### Events
- `GET /api/events` - Get all events
- `POST /api/events` - Create a new event
- `PUT /api/events/:id` - Update an event
- `DELETE /api/events/:id` - Delete an event

### Comments
- `GET /api/events/:eventId/comments` - Get comments for an event
- `POST /api/events/:eventId/comments` - Add a comment to an event

### Users
- `GET /api/users` - Get all users

### Statistics
- `GET /api/statistics` - Get dashboard statistics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a pull request

## License

This project is licensed under the MIT License.
