import express from 'express';
import { companyDbService } from '../../app-globals';


export const companyRouter = express.Router();

companyRouter.get('/companies', async (req, res) => {
    const companies = await companyDbService.getAllCompanies();

    res.send(companies);
});