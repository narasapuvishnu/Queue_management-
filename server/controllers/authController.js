const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/jsonDb');
const { JWT_SECRET } = require('../middleware/auth');

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role || 'manager'
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Register a new Queue Manager
exports.register = async (req, res) => {
  try {
    const { name, email, username, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long.'
      });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = (username || email.split('@')[0]).toLowerCase().trim();

    // Check if email or username already exists
    const existingEmail = db.findOne('managers', m => m.email === cleanEmail);
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: 'A manager with this email already exists.'
      });
    }

    const existingUsername = db.findOne('managers', m => m.username === cleanUsername);
    if (existingUsername) {
      return res.status(409).json({
        success: false,
        message: 'Username is already taken. Please choose another.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newManager = db.insert('managers', {
      name: name.trim(),
      email: cleanEmail,
      username: cleanUsername,
      passwordHash,
      role: 'manager'
    });

    const token = generateToken(newManager);

    return res.status(201).json({
      success: true,
      message: 'Queue Manager registered successfully.',
      token,
      manager: {
        id: newManager.id,
        name: newManager.name,
        email: newManager.email,
        username: newManager.username,
        role: newManager.role
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during registration.'
    });
  }
};

// Login Queue Manager
exports.login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/Username and password are required.'
      });
    }

    const cleanIdentifier = emailOrUsername.toLowerCase().trim();
    const manager = db.findOne(
      'managers',
      m => m.email === cleanIdentifier || m.username === cleanIdentifier
    );

    if (!manager) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Please check your login details.'
      });
    }

    const isMatch = await bcrypt.compare(password, manager.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password does not match.'
      });
    }

    const token = generateToken(manager);

    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      manager: {
        id: manager.id,
        name: manager.name,
        email: manager.email,
        username: manager.username,
        role: manager.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during login.'
    });
  }
};

// Get current logged in manager profile
exports.getMe = (req, res) => {
  try {
    const manager = db.findById('managers', req.user.id);
    if (!manager) {
      return res.status(404).json({
        success: false,
        message: 'Manager not found.'
      });
    }

    return res.json({
      success: true,
      manager: {
        id: manager.id,
        name: manager.name,
        email: manager.email,
        username: manager.username,
        role: manager.role,
        createdAt: manager.createdAt
      }
    });
  } catch (err) {
    console.error('Get profile error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error fetching profile.'
    });
  }
};
