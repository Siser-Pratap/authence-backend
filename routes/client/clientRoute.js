// routes/clientFacingRoutes.js
import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import users from '../db/users.js';
import companies from '../db/companies.js';
import apiKeyAuth from '../middleware/apiKeyAuth.js';

const router = express.Router();

const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

function generateAccessToken(user) {
    return jwt.sign({ id: user.id }, ACCESS_SECRET, { expiresIn: '15m' });
}

function generateRefreshToken(user, tokenId) {
    return jwt.sign({ id: user.id, tokenId }, REFRESH_SECRET, { expiresIn: '7d' });
}

// Signup
router.post('/signup', apiKeyAuth, async (req, res) => {
    const { username, password } = req.body;
    const { tenantId } = req.company;

    if (users.find(u => u.username === username && u.tenantId === tenantId)) {
        return res.status(400).json({ error: 'User already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const id = `${tenantId}-${Date.now()}`;
    users.push({ id, username, password: hashed, tenantId });
    res.json({ message: 'User created' });
});

// Signin
router.post('/signin', apiKeyAuth, async (req, res) => {
    const { username, password } = req.body;
    const { tenantId } = req.company;

    const user = users.find(u => u.username === username && u.tenantId === tenantId);
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const tokenId = Date.now().toString();
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user, tokenId);
    user.refreshTokenId = tokenId;

    res.cookie('jid', refreshToken, {
        httpOnly: true,
        path: '/refresh_token',
        sameSite: 'lax',
        secure: false,
    });
    res.json({ accessToken });
});

// Refresh
router.post('/refresh_token', apiKeyAuth, (req, res) => {
    const token = req.cookies.jid;
    if (!token) return res.sendStatus(401);

    let payload;
    try {
        payload = jwt.verify(token, REFRESH_SECRET);
    } catch {
        return res.sendStatus(403);
    }

    const user = users.find(u => u.id === payload.id);
    if (!user || user.refreshTokenId !== payload.tokenId) return res.sendStatus(403);

    const newTokenId = Date.now().toString();
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user, newTokenId);
    user.refreshTokenId = newTokenId;

    res.cookie('jid', refreshToken, {
        httpOnly: true,
        path: '/refresh_token',
        sameSite: 'lax',
        secure: false,
    });
    res.json({ accessToken });
});

// Logout
router.post('/logout', apiKeyAuth, (req, res) => {
    const token = req.cookies.jid;
    if (!token) return res.sendStatus(200);

    try {
        const payload = jwt.verify(token, REFRESH_SECRET);
        const user = users.find(u => u.id === payload.id);
        if (user) user.refreshTokenId = null;
    } catch {}

    res.clearCookie('jid', { path: '/refresh_token' });
    res.send({ message: 'Logged out' });
});

export default router;
