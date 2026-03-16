const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./database');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// --- 1. AUTHENTICATION (Login) ---
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const [rows] = await db.execute('SELECT * FROM users WHERE username = ?', [username]);
        if (rows.length === 0) return res.status(401).json({ message: 'User not found' });

        const user = rows[0];
        if (password === user.password) {
            delete user.password; // Don't send password back
            res.json({ message: 'Login successful', user });
        } else {
            res.status(401).json({ message: 'Invalid password' });
        }
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- 2. ADMIN DASHBOARD STATS (Matches your Screenshot) ---
app.get('/api/admin/stats', async (req, res) => {
    // In a real app, you would count these from tables.
    // For now, we return the data needed for your Admin Dashboard UI.
    res.json({
        totalStudents: 1240,
        attendanceRate: 96,
        feeCollection: '12.5k',
        activeAlerts: 3
    });
});

// --- 3. STUDENT DATA (For Student Dashboard) ---
app.get('/api/student/:id', async (req, res) => {
    try {
        // Get Student Info
        const [userRows] = await db.execute('SELECT * FROM users WHERE id = ?', [req.params.id]);
        if (userRows.length === 0) return res.status(404).json({ message: 'Student not found' });

        // Get Pending Assignments
        const [taskRows] = await db.execute('SELECT * FROM assignments WHERE student_id = ? AND status = "Pending"', [req.params.id]);

        res.json({
            profile: userRows[0],
            pendingTasks: taskRows.length,
            tasks: taskRows
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- 4. ANNOUNCEMENTS (For Home Page) ---
app.get('/api/announcements', async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM announcements');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});