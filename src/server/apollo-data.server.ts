import express from 'express';
import { ObjectId } from 'mongodb';
import { apolloDbService, apolloService } from '../app-globals';

export const apolloOrganizationRouter = express.Router();

apolloOrganizationRouter.use('/apollo', (req, res, next) => {
    next();
});

apolloOrganizationRouter.get('/companies', async (req, res) => {
    // Get all of the companies.
    const companies = await apolloDbService.getAllOrganizations();

    // Return them.
    res.send(companies);
});

/** Attempts to update the Apollo companies in the database, using the domain of a company, with a specified id. */
apolloOrganizationRouter.post('/companies/update-for-company/:companyId', async (req, res) => {
    // Get the ID.
    const id = req.params.companyId;

    if (!ObjectId.isValid(id)) {
        res.sendStatus(400);
        return;
    }

    // Create the company ID.
    const companyId = new ObjectId(id);

    // Perform the update.
    try {
        const result = await apolloService.updateApolloCompanyByCompanyDomain(companyId);

        // Return the ID of the Apollo company to the caller.
        res.send(result);
    } catch (err: any) {
        // Oops - error.  Let the user know.
        res.status(500).send(err.toString());
    }
});

/** Returns a specified ApolloCompany by its ID. */
apolloOrganizationRouter.get('/companies/:companyId', async (req, res) => {
    // Get the ID from the params.
    const id = req.params.companyId;

    // Validate.
    if (!ObjectId.isValid(id)) {
        res.send(400);
        return;
    }

    // Get the value from the database.
    const result = await apolloDbService.getOrganizationById(new ObjectId(id));

    // Return it.
    res.send(result);
});