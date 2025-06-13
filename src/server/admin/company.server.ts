import express from 'express';
import { companyDbService, companyService } from '../../app-globals';
import { ObjectId } from 'mongodb';
import { JobListing } from '../../model/shared-models/job-tracking/job-listing.model';
import { UpsertDbItem } from '../../model/shared-models/db-operation-types.model';
import { CompanyContact } from '../../model/shared-models/job-tracking/company-contact.model';
import { Company } from '../../model/shared-models/company.model';
import { updateJobAnalysis } from '../../runtime-service-functions';
import { QuickJobSetupRequest } from '../../model/shared-models/quick-job-setup-request.model';
import { isQuickJobSetupRequest } from '../../utils/quick-job-validation.utils';
import { QuickJobSetupFunction } from '../../services/llm-functions/quick-job-setup.llm-functions';
import { getAppConfig } from '../../config';


export const companyRouter = express.Router();

companyRouter.get('/companies', async (req, res) => {
    const companies = await companyDbService.getCompanyList();

    res.send(companies);
});

// /** This expects lazy-load info for a table. */
// companyRouter.post('/companies', async (req, res) => {

//     throw new Error(`POST is already used for this path.`);

//     const tableLoadRequest = req.body as TableLoadRequest;

//     // Validate.
//     if (!tableLoadRequest) {
//         res.status(400).send('Missing TableLoadRequest information.');
//         return;
//     }

//     const companies = await companyDbService.getPaginatedCompanyList(tableLoadRequest);

//     res.send(companies);
// });

companyRouter.get('/companies/:companyId', async (req, res) => {
    const { companyId } = req.params;

    if (!ObjectId.isValid(companyId)) {
        res.send(400);
        return;
    }

    const companyIdVal = new ObjectId(companyId);
    const company = await companyDbService.getCompanyById(companyIdVal);
    res.send(company);
});

companyRouter.get('/companies/:companyId/contacts', async (req, res) => {
    const { companyId } = req.params;

    if (!ObjectId.isValid(companyId)) {
        res.send(400);
        return;
    }

    const companyIdVal = new ObjectId(companyId);
    const contacts = await companyDbService.getContactsForCompanyId(companyIdVal);
    res.send(contacts);
});

companyRouter.get('/companies/:companyId/job-listings', async (req, res) => {
    const { companyId } = req.params;

    if (!ObjectId.isValid(companyId)) {
        res.send(400);
        return;
    }

    const companyIdVal = new ObjectId(companyId);
    const contacts = await companyDbService.getJobListingsForCompanyId(companyIdVal);
    res.send(contacts);
});

companyRouter.post('/companies/job-listings', async (req, res) => {
    // Get the job listing from the body.
    const listing = req.body as UpsertDbItem<JobListing>;

    // Ensure the company ID is set.
    if (!listing.companyId || !ObjectId.isValid(listing.companyId)) {
        res.sendStatus(400);
        return;
    }

    // Upsert the item.
    const result = await companyDbService.upsertCompanyJobListing(listing);

    // Return it.
    res.send(result);
});

/** Upserts a specified company. */
companyRouter.post('/companies', async (req, res) => {
    // Get the company from the body.
    const company = req.body as Company;

    // Ensure it has an ID.
    if (company._id && !ObjectId.isValid(company._id)) {
        res.sendStatus(400);
        return;
    }

    // Update/insert the company.
    const result = await companyDbService.upsertCompany(company);

    // Send the company back, since it may have a new _id on it
    //  if it were inserted.
    res.send(result);
});

companyRouter.post('/companies/contacts', async (req, res) => {
    // Get the job listing from the body.
    const contact = req.body as UpsertDbItem<CompanyContact>;

    // Ensure the company ID is set.
    if (!contact.companyId || !ObjectId.isValid(contact.companyId)) {
        res.sendStatus(400);
        return;
    }

    // Upsert the item.
    const result = await companyDbService.upsertCompanyContact(contact);

    // Return it.
    res.send(result);
});

/** Returns a company contact, specified by its ID. */
companyRouter.get('/companies/contacts/:contactId', async (req, res) => {
    const { contactId } = req.params;

    if (!ObjectId.isValid(contactId)) {
        res.sendStatus(400);
        return;
    }

    // Get the contact.
    const result = await companyDbService.getContactById(new ObjectId(contactId));
    // Return it.
    res.send(result);
});

/** Returns a job listing, specified by its ID. */
companyRouter.get('/companies/job-listings/:listingId', async (req, res) => {
    const { listingId } = req.params;

    if (!ObjectId.isValid(listingId)) {
        res.sendStatus(400);
        return;
    }

    // Get the job listing.
    const result = await companyDbService.getJobListingById(new ObjectId(listingId));
    // Return it.
    res.send(result);
});

/** Deletes a job listing specified by it's ID. */
companyRouter.delete('/companies/job-listings/:listingId', async (req, res) => {
    const { listingId } = req.params;

    if (!ObjectId.isValid(listingId)) {
        res.sendStatus(400);
        return;
    }

    // Delete the job listing.
    await companyDbService.deleteCompanyJobListingById(new ObjectId(listingId));

    // All done.
    res.sendStatus(204);
});

/** Deletes a contact specified by it's ID. */
companyRouter.delete('/companies/contacts/:contactId', async (req, res) => {
    const { contactId } = req.params;

    if (!ObjectId.isValid(contactId)) {
        res.sendStatus(400);
        return;
    }

    // Delete the contact.
    await companyDbService.deleteCompanyJobListingById(new ObjectId(contactId));

    // All done.
    res.sendStatus(204);
});

/** Deletes a company specified by it's ID and its job descriptions and contacts. */
companyRouter.delete('/companies/:companyId', async (req, res) => {
    const { companyId } = req.params;

    if (!ObjectId.isValid(companyId)) {
        res.sendStatus(400);
        return;
    }

    // Delete the company.
    await companyDbService.deleteCompanyById(new ObjectId(companyId));
    res.sendStatus(204);
});

companyRouter.get('/job-listings', async (req, res) => {
    // Get all job listings in compact format
    const jobListings = await companyDbService.getAllJobListings();

    res.send(jobListings);
});

companyRouter.get('/job-listings/get-updated-analysis/:jobListingId', async (req, res) => {
    // Get the ID.
    const { jobListingId } = req.params;

    // Validate.
    if (!ObjectId.isValid(jobListingId)) {
        res.sendStatus(400);
        return;
    }

    // Convert.
    const idValue = new ObjectId(jobListingId);

    try {
        // Perform the update.
        const result = await updateJobAnalysis(idValue);

        // Return the result.
        res.send(result);

    } catch (err) {
        // Error - return that instead.
        res.status(500).send(err);
    }
});

companyRouter.post(`/job-listings/create-from-description`, async (req, res) => {
    // Get the body.
    const quickJobSetup = req.body as QuickJobSetupRequest;

    // Validate it.
    if (!isQuickJobSetupRequest(quickJobSetup)) {
        res.sendStatus(400);
    }

    // Get the app configuration.
    const appConfig = await getAppConfig();

    // Create the new function.
    const workFunction = new QuickJobSetupFunction(appConfig.openAiConfig, companyDbService, quickJobSetup);

    // Create the response.
    const response = await workFunction.execute();

    // Return the result.
    res.send(response);
});

/** Creates a new contact, in a specified company, for a specified apollo contact ID. */
companyRouter.post('/companies/:companyId/contacts/from-apollo/:apolloId', async (req, res) => {
    // Get the IDs.
    const { companyId, apolloId } = req.params;

    // Validate the company ID.
    if (!ObjectId.isValid(companyId)) {
        res.sendStatus(400);
        return;
    }

    // Convert the company ID.
    const companyIdVal = new ObjectId(companyId);
    // Create the contact from the Apollo ID.
    try {
        const contact = await companyService.createCompanyContactFromApolloId(companyIdVal, apolloId);
        res.send(contact);
    }
    catch (err) {
        console.error(`Error creating contact from Apollo ID ${apolloId} for company ${companyId}:`, err);
        res.status(500).send(`Error creating contact from Apollo ID ${apolloId} for company ${companyId}.`);
    }
});