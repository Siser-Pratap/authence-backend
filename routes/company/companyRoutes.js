// routes/serviceOwnerRoutes.js
import express from 'express';
import { registerCompany, loginCompany, deleteCompany, generateApiKey, deleteApiKey, getCompanyProfile, getCompanyApiKey} from '../../controllers/companyController.js';

const router = express.Router();

router.post('/register-company', registerCompany);
router.post('/login-company', loginCompany);
router.delete('/delete-company', deleteCompany);
router.post('/generate-api-key', generateApiKey);
router.post('/delete-api-key', deleteApiKey);
router.get('/get-profile', getCompanyProfile);
router.get('/get-api-key', getCompanyApiKey);


export default router;
