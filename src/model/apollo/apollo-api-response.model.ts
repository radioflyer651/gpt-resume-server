import { ObjectId } from "mongodb";

export interface ApolloBreadcrumb {
  label: string;
  signal_field_name: string;
  value: string;
  display_name: string;
}

export interface ApolloPagination {
  page: number;
  per_page: number;
  total_entries: number;
  total_pages: number;
}

export interface ApolloPhone {
  number: string;
  source: string;
  sanitized_number: string;
}

// Base interface for properties shared by ApolloOrganization and ApolloAccount
export interface ApolloBaseOrganization {
  /** Optional MongoDB ID for this type.
   *   !IMPORTANT: This should match the id property.
   */
  _id: ObjectId;
  id: string;
  name: string;
  website_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  languages: string[];
  linkedin_uid?: string;
  founded_year?: number;
  logo_url?: string;
  primary_domain?: string;
  owned_by_organization_id?: string | null;
  organization_revenue_printed?: string | null;
  organization_revenue?: number;
  intent_strength?: number | null;
  show_intent: boolean;
  has_intent_signal_account: boolean;
  intent_signal_account?: any | null;
  organization_headcount_six_month_growth?: number;
  organization_headcount_twelve_month_growth?: number;
  organization_headcount_twenty_four_month_growth?: number;
}

// Interface for ApolloOrganization (minimal, common fields)
export interface ApolloOrganization extends ApolloBaseOrganization {
  // no additional fields currently seen
}

// Interface for ApolloAccount (extends organization with many additional user-related props)
export interface ApolloAccount extends ApolloBaseOrganization {
  primary_phone?: ApolloPhone;
  phone?: string;
  sanitized_phone?: string;
  organization_raw_address?: string;
  organization_postal_code?: string;
  organization_street_address?: string;
  organization_city?: string;
  organization_state?: string;
  organization_country?: string;
  suggest_location_enrichment?: boolean;
  raw_address?: string;
  street_address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  domain?: string;
  team_id?: string;
  organization_id?: string;
  account_stage_id?: string;
  source?: string;
  original_source?: string;
  creator_id?: string;
  owner_id?: string;
  created_at?: string; // ISO date string
  phone_status?: string;
  account_playbook_statuses?: any[];  // array of unknown objects
  existence_level?: string;
  label_ids?: any[]; // array of unknown identifiers
  typed_custom_fields?: Record<string, any>;
  custom_field_errors?: Record<string, any>;
  modality?: string;
  source_display_name?: string;
  crm_record_url?: string | null;
  contact_emailer_campaign_ids?: any[];
  contact_campaign_status_tally?: Record<string, any>;
  num_contacts?: number;
  last_activity_date?: string | null;
}

export interface ApolloOrganizationResponse {
  breadcrumbs: ApolloBreadcrumb[];
  partial_results_only: boolean;
  has_join: boolean;
  disable_eu_prospecting: boolean;
  partial_results_limit: number;
  pagination: ApolloPagination;
  accounts: ApolloAccount[];
  organizations: ApolloOrganization[];
  model_ids: string[];
  num_fetch_result?: number | null;
  derived_params?: any | null;
}

export interface ApolloVendorValidationStatus {
  raw_status: string;
  third_party_validator_name: string;
  timestamp: string | null;
}

export interface ApolloContactEmail {
  email_md5: string;
  email_sha256: string;
  email_status: string;
  extrapolated_email_confidence: number | null;
  position: number;
  email: string;
  free_domain: boolean;
  source: string;
  third_party_vendor_name: string | null;
  vendor_validation_statuses: ApolloVendorValidationStatus[];
  email_needs_tickling: boolean;
  email_true_status: string;
  email_status_unavailable_reason: string | null;
}

export interface ApolloEmploymentHistoryEntry {
  _id: string;
  created_at: string | null;
  current: boolean;
  degree: string | null;
  description: string | null;
  emails: string[] | null;
  end_date: string | null;
  grade_level: string | null;
  kind: string | null;
  major: string | null;
  organization_id: string | null;
  organization_name: string;
  raw_address: string | null;
  start_date: string | null;
  title: string | null;
  updated_at: string | null;
  id: string;
  key: string;
}

export interface ApolloBasePerson {
  /** Optional MongoDB ID for this type.
   *   !IMPORTANT: This should match the id property.
   */
  _id: ObjectId;
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  linkedin_url?: string;
  title?: string;
  email_status?: string;
  photo_url?: string | null;
  twitter_url?: string | null;
  github_url?: string | null;
  facebook_url?: string | null;
  extrapolated_email_confidence?: number | null;
  headline?: string;
  email?: string;
  organization_id?: string;
  employment_history?: ApolloEmploymentHistoryEntry[];
  state?: string;
  city?: string;
  country?: string;
  organization?: ApolloOrganization;      // from previous types
  account_id?: string;
  account?: ApolloAccount;                // from previous types
  departments?: string[];
  subdepartments?: string[];
  seniority?: string;
  functions?: string[];
  intent_strength?: number | null;
  show_intent: boolean;
  email_domain_catchall?: boolean;
  revealed_for_current_team?: boolean;
}

export interface ApolloPerson extends ApolloBasePerson {

}

// ApolloContact extends ApolloPerson with additional fields specific to the user
export interface ApolloContact extends ApolloBasePerson {
  contact_roles: any[];            // For generality, as example empty array in data
  contact_stage_id?: string;
  owner_id?: string;
  creator_id?: string;
  person_id?: string;
  email_needs_tickling: boolean;
  source?: string;
  original_source?: string;
  headline?: string;
  photo_url?: string | null;
  present_raw_address?: string;
  linkedin_uid?: string;
  extrapolated_email_confidence?: number | null;
  salesforce_id?: string | null;
  salesforce_lead_id?: string | null;
  salesforce_contact_id?: string | null;
  salesforce_account_id?: string | null;
  crm_owner_id?: string | null;
  created_at?: string;
  emailer_campaign_ids?: any[];
  direct_dial_status?: string | null;
  direct_dial_enrichment_failed_at?: string | null;
  city?: string;
  country?: string;
  state?: string;
  email_status?: string;
  email_source?: string;
  account_id?: string;
  last_activity_date?: string | null;
  hubspot_vid?: string | null;
  hubspot_company_id?: string | null;
  crm_id?: string | null;
  sanitized_phone?: string | null;
  merged_crm_ids?: string | null;
  updated_at?: string;
  queued_for_crm_push?: string | null;
  suggested_from_rule_engine_config_id?: string | null;
  email_unsubscribed?: boolean | null;
  person_deleted?: boolean | null;
  call_opted_out?: boolean | null;
  label_ids?: any[];
  has_pending_email_arcgate_request: boolean;
  has_email_arcgate_request: boolean;
  existence_level?: string;
  typed_custom_fields?: Record<string, any>;
  custom_field_errors?: Record<string, any> | null;
  crm_record_url?: string | null;
  email_status_unavailable_reason?: string | null;
  email_true_status?: string;
  updated_email_true_status?: boolean;
  source_display_name?: string;
  twitter_url?: string | null;
  contact_campaign_statuses?: any[];
  account?: ApolloAccount;              // embedding full account as per data
  contact_emails?: ApolloContactEmail[];
  time_zone?: string;
  phone_numbers?: any[];
  account_phone_note?: string | null;
  free_domain?: boolean;
  email_domain_catchall?: boolean;
  contact_job_change_event?: any | null;
}

// Response type including people and contacts arrays together in one system
export interface ApolloPeopleResponse {
  breadcrumbs: ApolloBreadcrumb[];
  partial_results_only: boolean;
  has_join: boolean;
  disable_eu_prospecting: boolean;
  partial_results_limit: number;
  pagination: ApolloPagination;
  contacts: ApolloContact[];
  people: ApolloPerson[];
  model_ids: string[];
  num_fetch_result?: number | null;
  derived_params?: any;
}

/** The type returned if there was an error when retrieving data. */
export interface ApolloApiErrorObject {
  message: string;
}

/** When an API Key is incorrect during an Apollo API call, a string is returned.  Otherwise a JSON object. */
export type ApolloApiError = ApolloApiErrorObject | string;

export type ApolloCompany = ApolloOrganization & Partial<ApolloAccount>;
export type ApolloEmployee = ApolloPerson & Partial<ApolloContact>;

/** TypeGuard for ApolloAccount. */
export function isAccount(target: any): target is ApolloAccount {
  if (typeof target !== 'object') {
    return false;
  }

  return isOrganization(target) && 'organization_id' in target;
}

/** TypeGuard for ApolloOrganization. */
export function isOrganization(target: any): target is ApolloOrganization {
  if (typeof target !== 'object') {
    return false;
  }

  return !('organization_id' in target) &&
    ('id' in target &&
      'has_intent_signal_account' in target &&
      'languages' in target &&
      'show_intent' in target);
}

/** TypeGuard for ApolloPerson. */
export function isPerson(target: any): target is ApolloPerson {
  if (typeof target !== 'object') {
    return false;
  }

  const hardProps = [
    'id',
    'first_name', 'last_name', 'show_intent'
  ];

  return hardProps.every(p => p in target);
}

/** TypeGuard for ApolloContact. */
export function isContact(target: any): target is ApolloContact {
  if (typeof target !== 'object') {
    return false;
  }

  if (!isPerson(target)) {
    return false;
  }

  const hardProps = [
    'contact_roles', 'email_needs_tickling',
    'has_pending_email_arcgate_request', 'has_email_arcgate_request'
  ];

  return hardProps.every(p => p in target);
}
