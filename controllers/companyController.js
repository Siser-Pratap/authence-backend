// controllers/companyController.js
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import Company from '../models/Company.js';

export const registerCompany = async (req, res) => {
  try {
    const { companyName, email, password, plan } = req.body;

    const existing = await Company.findOne({ $or: [{ email }, { companyName }] });
    if (existing) return res.status(400).json({ error: 'Company already exists' });

    const apiKey = crypto.randomBytes(24).toString('hex');
    const companyId = uuidv4();
    const tenantId = `tenant-${Date.now()}`;

    const newCompany = new Company({
      companyId,
      companyName,
      email,
      password,
      plan,
      apiKey,
      tenantId
    });

    await newCompany.save();
    return res.status(201).json({ message: 'Company registered', apiKey, companyId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const loginCompany = async (req, res) => {
  try {
    const { email, password } = req.body;
    const company = await Company.findOne({ email });
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const isMatch = await bcrypt.compare(password, company.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    return res.status(200).json({
      message: 'Login successful',
      companyId: company.companyId,
      apiKey: company.apiKey
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const deleteCompany = async (req, res) => {
  try {
    const { email } = req.body;
    const company = await Company.findOneAndDelete({ email });
    if (!company) return res.status(404).json({ error: 'Company not found' });

    return res.status(200).json({ message: 'Company deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const generateApiKey = async (req, res) => {
  try {
    const { email } = req.body;
    const company = await Company.findOne({ email });
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const newKey = crypto.randomBytes(24).toString('hex');
    company.apiKey = newKey;
    await company.save();

    return res.status(200).json({ message: 'API key regenerated', apiKey: newKey });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const deleteApiKey = async (req, res) => {
  try {
    const { email } = req.body;
    const company = await Company.findOne({ email });
    if (!company) return res.status(404).json({ error: 'Company not found' });

    company.apiKey = null;
    await company.save();

    return res.status(200).json({ message: 'API key removed successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

export const getCompanyProfile = async (req, res) => {
  try {
    const { email, companyId } = req.query;

    const company = await Company.findOne(
      email ? { email } : { companyId },
      { password: 0, __v: 0 } // exclude password & Mongoose metadata
    );

    if (!company) return res.status(404).json({ error: 'Company not found' });

    res.status(200).json({ profile: company });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCompanyApiKey = async (req, res) => {
  try {
    const { email, companyId } = req.query;

    const company = await Company.findOne(
      email ? { email } : { companyId },
      { apiKey: 1, _id: 0 }
    );

    if (!company) return res.status(404).json({ error: 'Company not found' });

    res.status(200).json({ apiKey: company.apiKey });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

