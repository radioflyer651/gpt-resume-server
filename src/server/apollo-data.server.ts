import express from 'express';
import { ObjectId } from 'mongodb';
import { apolloDbService, apolloService } from '../app-globals';
import { convertToLApolloOrganization } from '../utils/apollo-data-converter.utils';

export const apolloOrganizationRouter = express.Router();

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
    const dbResult = await apolloDbService.getOrganizationById(new ObjectId(id));

    if (!dbResult) {
        res.status(404).send('Organization not found');
        return;
    }

    // Convert the result to a LApolloOrganization.
    const result = convertToLApolloOrganization(dbResult);

    // Return it.
    res.send(result);
});

/** Instructs the server to obtain employee data for an Apollo Company, specified by it's ID. */
apolloOrganizationRouter.post('/companies/update-employees/:apolloCompanyId', async (req, res) => {
    // Get the ID from the params.
    const id = req.params.apolloCompanyId;

    // Validate.
    if (!ObjectId.isValid(id)) {
        res.send(400);
        return;
    }

    // Perform the update.
    const result = await apolloService.loadEmployeesForCompany(id, true);

    // Return the status of the update.
    if (result.state === 'complete') {
        res.sendStatus(200);
    } else if (result.state === 'error') {
        res.status(500).send(result.errorMessage!);
    } else {
        // We shouldn't hit any other status, so... error??
        res.status(500).send('Unexpected status state: ' + result.state);
    }
});

/** Returns the status (Info object) of the last attempt to load employee data for an Apollo Company, specified by its apollo organization ID. */
apolloOrganizationRouter.get('/companies/employee-data-status/:apolloCompanyId', async (req, res) => {
    // Get the ID from the params.
    const id = req.params.apolloCompanyId;

    // Validate.
    if (!ObjectId.isValid(id)) {
        res.send(400);
        return;
    }

    // Get the status of the last attempt to load employee data.
    const status = await apolloService.getInfoForApolloCompanyId(id);

    // If none, then we'll indicate that it's not been loaded.
    if (!status) {
        res.sendStatus(404);
        return;
    }

    // Return it.
    res.send(status);
});

apolloOrganizationRouter.get('/companies/:apolloCompanyId/employees', async (req, res) => {
    // Get the ID from the params.
    const id = req.params.apolloCompanyId;

    // Validate.
    if (!ObjectId.isValid(id)) {
        res.send(400);
        return;
    }

    // Get the employees for the specified Apollo company ID.
    const employees = await apolloService.getApolloEmployeesForApolloCompany(id);

    // Return them.
    res.send(employees);
});