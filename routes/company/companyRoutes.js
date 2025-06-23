// routes/serviceOwnerRoutes.js
import express from 'express';
import crypto from 'crypto';
import companies from "../../db/companies.js"; 

const router = express.Router();


router.post('/register-company', (req, res) => {
    const { companyName } = req.body;
    if (companies.find(c => c.name === companyName)) {
        return res.status(400).json({ error: 'Company already exists' });
    }

    const apiKey = crypto.randomBytes(24).toString('hex');
    const tenantId = `tenant-${Date.now()}`;
    companies.push({ name: companyName, apiKey, tenantId });
    res.json({ apiKey });
});

export default router;
