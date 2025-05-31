export interface ApolloPhone {
  number: string;
  source?: string;
  sanitized_number: string;
}

export interface ApolloEntity {
  id: string;
  name: string;
  website_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  facebook_url?: string;
  primary_phone?: ApolloPhone;
  languages?: string[];
  phone?: string;
  linkedin_uid?: string;
  founded_year?: number;
  logo_url?: string;
  primary_domain?: string;
  sanitized_phone?: string;
  owned_by_organization_id?: string | null;
  intent_strength?: number | null;
  show_intent: boolean;
  has_intent_signal_account: boolean;
  intent_signal_account?: any | null;
  organization_headcount_six_month_growth?: number | null;
  organization_headcount_twelve_month_growth?: number | null;
  organization_headcount_twenty_four_month_growth?: number | null;
}

export interface ApolloOrganizationOwner {
  id: string;
  name: string;
  website_url?: string;
}

export interface ApolloOrganization extends ApolloEntity {
  publicly_traded_symbol?: string;
  publicly_traded_exchange?: string;
  market_cap?: string;
  organization_revenue_printed?: string | null;
  organization_revenue?: number;
  owned_by_organization?: ApolloOrganizationOwner | null;
}

export interface ApolloAccount extends ApolloEntity {
  owned_by_organization?: ApolloOrganizationOwner | null;
  organization_revenue_printed?: string | null;
  organization_revenue?: number;
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
  created_at?: string;
  phone_status?: string;
  account_playbook_statuses?: any[];
  existence_level?: string;
  label_ids?: any[];
  typed_custom_fields?: Record<string, any>;
  custom_field_errors?: Record<string, any> | null;
  modality?: string;
  source_display_name?: string;
  crm_record_url?: string | null;
  contact_emailer_campaign_ids?: string[];
  contact_campaign_status_tally?: Record<string, any>;
  num_contacts?: number;
  last_activity_date?: string | null;
}

export interface ApolloEmploymentHistory {
  _id: string;
  created_at?: string | null;
  current: boolean;
  degree?: string | null;
  description?: string | null;
  emails?: string[] | null;
  end_date?: string | null;
  grade_level?: string | null;
  kind?: string | null;
  major?: string | null;
  organization_id?: string | null;
  organization_name?: string;
  raw_address?: string | null;
  start_date?: string;
  title?: string;
  updated_at?: string | null;
  id?: string;
  key?: string;
}

export interface ApolloPerson {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  linkedin_url?: string;
  title?: string;
  email_status?: string;
  photo_url?: string;
  twitter_url?: string | null;
  github_url?: string | null;
  facebook_url?: string | null;
  extrapolated_email_confidence?: number | null;
  headline?: string;
  email?: string;
  organization_id?: string;
  employment_history?: ApolloEmploymentHistory[];
  state?: string;
  city?: string;
  country?: string;
  organization?: ApolloOrganization;
  account_id?: string;
  account?: ApolloAccount;
  departments?: string[];
  subdepartments?: string[];
  seniority?: string;
  functions?: string[];
  intent_strength?: number | null;
  show_intent?: boolean;
  email_domain_catchall?: boolean;
  revealed_for_current_team?: boolean;
}

export interface ApolloPagination {
  page: number;
  per_page: number;
  total_entries: number;
  total_pages: number;
}

export interface ApolloSearchBreadcrumb {
  label: string;
  signal_field_name: string;
  value: string | string[];
  display_name: string;
}

export interface ApolloSearchResponseBase {
  breadcrumbs: ApolloSearchBreadcrumb[];
  partial_results_only: boolean;
  has_join: boolean;
  disable_eu_prospecting: boolean;
  partial_results_limit: number;
  pagination: ApolloPagination;
  model_ids: string[];
  num_fetch_result?: number | null;
  derived_params?: any | null;
}

export interface ApolloCompanySearchResponse extends ApolloSearchResponseBase {
  accounts: ApolloAccount[];
  organizations: ApolloOrganization[];
}

export interface ApolloPeopleSearchResponse extends ApolloSearchResponseBase {
  contacts: any[];
  people: ApolloPerson[];
}
  