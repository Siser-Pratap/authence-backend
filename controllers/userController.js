import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import Company from '../models/Company.js';

const ACCESS_SECRET = process.env.ACCESS_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

const generateAccessToken = (user) =>
  jwt.sign({ userId: user.userId, tenantId: user.tenantId }, ACCESS_SECRET, { expiresIn: '15m' });

const generateRefreshToken = (user, tokenId) =>
  jwt.sign({ userId: user.userId, tokenId }, REFRESH_SECRET, { expiresIn: '7d' });

export const signupUser = async (req, res) => {
  try {
    const { email, password, username, apiKey } = req.body;

    const company = await Company.findOne({ apiKey });
    if (!company) return res.status(403).json({ error: 'Invalid API key' });

    const existing = await User.findOne({ email, tenantId: company.tenantId });
    if (existing) return res.status(400).json({ error: 'User already exists' });

    const userId = `${company.tenantId}-${Date.now()}`;
    const newUser = new User({ email, username, password, tenantId: company.tenantId, userId });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const signinUser = async (req, res) => {
  try {
    const { email, password, apiKey } = req.body;

    const company = await Company.findOne({ apiKey });
    if (!company) return res.status(403).json({ error: 'Invalid API key' });

    const user = await User.findOne({ email, tenantId: company.tenantId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const tokenId = uuidv4();
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user, tokenId);

    user.refreshTokenId = tokenId;
    await user.save();

    res.cookie('jid', refreshToken, {
      httpOnly: true,
      path: '/user/refresh-token',
      secure: false,
      sameSite: 'lax',
    });

    res.json({ accessToken });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.jid;
    if (!token) return res.sendStatus(401);

    const payload = jwt.verify(token, REFRESH_SECRET);
    const user = await User.findOne({ userId: payload.userId });

    if (!user || user.refreshTokenId !== payload.tokenId) return res.sendStatus(403);

    const newTokenId = uuidv4();
    const accessToken = generateAccessToken(user);
    const newRefresh = generateRefreshToken(user, newTokenId);

    user.refreshTokenId = newTokenId;
    await user.save();

    res.cookie('jid', newRefresh, {
      httpOnly: true,
      path: '/user/refresh-token',
      secure: false,
      sameSite: 'lax'
    });

    res.json({ accessToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

export const logoutUser = async (req, res) => {
  try {
    const token = req.cookies.jid;
    if (token) {
      const payload = jwt.verify(token, REFRESH_SECRET);
      const user = await User.findOne({ userId: payload.userId });
      if (user) {
        user.refreshTokenId = null;
        await user.save();
      }
    }
    res.clearCookie('jid', { path: '/user/refresh-token' });
    res.json({ message: 'User logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.sendStatus(401);

    const token = auth.split(' ')[1];
    const payload = jwt.verify(token, ACCESS_SECRET);

    const user = await User.findOne({ userId: payload.userId }, { password: 0 });
    if (!user) return res.sendStatus(404);

    res.json({ user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid access token' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { userId, username } = req.body;
    const user = await User.findOneAndUpdate({ userId }, { username }, { new: true, projection: { password: 0 } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { userId, oldPassword, newPassword } = req.body;
    const user = await User.findOne({ userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Incorrect old password' });

    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
