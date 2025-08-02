const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Initialize app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventmanagement', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Models
const User = require('./models/User');
const Event = require('./models/Event');
const Comment = require('./models/Comment');
const Notification = require('./models/Notification');

const crypto = require('crypto');

const PVDM_MONGODB_URI = 'mongodb+srv://PVDMidoevents:your_password@cluster0.mongodb.net/eventmanagement?retryWrites=true&w=majority';

process.env.MONGODB_URI = PVDM_MONGODB_URI;

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'PVDMidoevents';

// Middleware to verify token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Routes
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ message: 'Invalid password' });
    }
    
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        name: user.name
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/register', async (req, res) => {
  try {
    const { username, password, name, role } = req.body;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      username,
      password: hashedPassword,
      name,
      role: role || 'Team Member'
    });
    
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Events CRUD
app.get('/api/events', authenticateToken, async (req, res) => {
  try {
    const events = await Event.find().populate('teamMembers', 'name');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/events', authenticateToken, async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    
    // Emit real-time update
    io.emit('eventCreated', event);
    
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/events/:id', authenticateToken, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('teamMembers', 'name');
    
    // Emit real-time update
    io.emit('eventUpdated', event);
    
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/events/:id', authenticateToken, async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    
    // Emit real-time update
    io.emit('eventDeleted', { id: req.params.id });
    
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Comments
app.get('/api/events/:eventId/comments', authenticateToken, async (req, res) => {
  try {
    const comments = await Comment.find({ event: req.params.eventId })
      .populate('user', 'name');
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/events/:eventId/comments', authenticateToken, async (req, res) => {
  try {
    const comment = new Comment({
      ...req.body,
      event: req.params.eventId,
      user: req.user.userId
    });
    await comment.save();
    
    // Populate user info
    await comment.populate('user', 'name');
    
    // Emit real-time update
    io.emit('commentAdded', comment);
    
    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Users
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await User.find({}, 'name role');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Statistics
app.get('/api/statistics', authenticateToken, async (req, res) => {
  try {
    const statusStats = await Event.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    const priorityStats = await Event.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      statusStats,
      priorityStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('A user connected');
  
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const createDefaultAdmin = async () => {
  try {
    const adminUser = await User.findOne({ username: 'admin' });
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('Nadosh$2025', 10);
      const newAdmin = new User({
        username: 'admin',
        password: hashedPassword,
        name: 'Administrator',
        role: 'Admin'
      });
      await newAdmin.save();
      console.log('Default admin user created:');
      console.log('Username: admin');
      console.log('Password: Nadia$2025');
      console.log('Please change this password after first login!');
    }
  } catch (error) {
    console.error('Error creating default admin user:', error);
  }
};

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  await createDefaultAdmin();
});
