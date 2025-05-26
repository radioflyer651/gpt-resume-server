import express from 'express';
import { companyDbService } from '../../app-globals';
import { ObjectId } from 'mongodb';
import { JobListing } from '../../model/shared-models/job-tracking/job-listing.model';
import { UpsertDbItem } from '../../model/shared-models/db-operation-types.model';
import { CompanyContact } from '../../model/shared-models/job-tracking/company-contact.data';
import { Company } from '../../model/shared-models/company.model';


export const companyRouter = express.Router();

companyRouter.get('/companies', async (req, res) => {
    const companies = await companyDbService.getCompanyList();

    res.send(companies);
});

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
    if (!ObjectId.isValid(listing.companyId)) {
        res.sendStatus(400);
        return;
    }

    // Upsert the item.
    const result = await companyDbService.upsertCompanyJobListing(listing);

    // Return it.
    res.send(result);
});

/** Updates a specified company. */
companyRouter.post('/companies', async (req, res) => {
    // Get the company from the body.
    const company = req.body as Company;

    // Ensure it has an ID.
    if (!ObjectId.isValid(company._id)) {
        res.sendStatus(400);
        return;
    }

    // Update the company.
    await companyDbService.updateCompany(company);

    // All done.
    res.sendStatus(200);
});

companyRouter.post('/companies/contacts', async (req, res) => {
    // Get the job listing from the body.
    const listing = req.body as UpsertDbItem<CompanyContact>;

    // Ensure the company ID is set.
    if (!ObjectId.isValid(listing.companyId)) {
        res.sendStatus(400);
        return;
    }

    // Upsert the item.
    const result = await companyDbService.upsertCompanyContact(listing);

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
    res.sendStatus(200);
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
    res.sendStatus(200);
});