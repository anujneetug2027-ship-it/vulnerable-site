const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// MONGOOSE SETUP - Use your own database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vulnerable-site', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// User Schema - DELIBERATELY VULNERABLE
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Plain text - VULNERABLE!
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// VULNERABLE: No rate limiting, plain text passwords
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // VULNERABLE: Accepting weak 4-digit passwords
        if (!/^\d{4}$/.test(password)) {
            return res.status(400).json({ error: 'Password must be 4 digits' });
        }
        
        const user = new User({ email, password }); // VULNERABLE: Storing plain text
        await user.save();
        
        res.json({ message: 'User registered (Educational Purpose)' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// VULNERABLE: No rate limiting, no account lockout
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password }); // VULNERABLE: Plain text comparison
        
        if (user) {
            // VULNERABLE: Logging sensitive info
            console.log(`Successful login: ${email} with password: ${password}`);
            res.json({ 
                success: true, 
                message: 'Login successful (This is a demonstration of poor security)' 
            });
        } else {
            console.log(`Failed login attempt for: ${email}`);
            res.status(401).json({ success: false, message: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Vulnerable endpoint to check if user exists
app.get('/api/check-user/:email', async (req, res) => {
    const user = await User.findOne({ email: req.params.email });
    res.json({ exists: !!user });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`🚨 VULNERABLE SITE running on port ${PORT}`);
    console.log('⚠️  WARNING: This server has intentional security vulnerabilities');
    console.log('⚠️  FOR EDUCATIONAL PURPOSES ONLY');
});
