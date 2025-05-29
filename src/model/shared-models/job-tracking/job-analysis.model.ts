export interface JobAnalysis {
    /** OPTIONAL: The name of the company, if found in the job description. */
    companyName?: string;

    /** OPTIONAL: The title of the job, if it's listed. */
    jobTitle?: string;

    /** A description of the job. */
    companyDescription: string;

    /** OPTIONAL: If found, the date this job opening was posted. */
    datePosted?: string;

    /** The location that this job reports to.  Preferably city/state, but if in a country outside the US, this should be stated. */
    jobLocation: string;

    /** If this job is indicated as a contractor role. */
    isContactRole: boolean;

    /** Boolean value indicating whether or not this position is open to minnesotans. */
    allowWorkInMn: boolean;

    /** OPTIONAL: The minimum compensation listed, if any found. */
    minCompensation?: string;

    /** OPTIONAL: The maximum compensation listed, if any found.  If a flat compensation
     *   is listed, then it should be listed here. */
    maxCompensation?: string;

    /** A description of the job. */
    jobDescription: string;

    /** A list of duties described by the job. */
    jobDuties: string[];

    /** Educational requirements listed by the job.  If experience can substitute education, it should be noted here. */
    educationRequirements: string;

    /** A list of skills that are required for this position.  If the job description implies that
     *   applicants would be disqualified for missing any of these skills, it must be in this list. */
    requiredSkillList: string[];

    /** Technologies the applicant must know to be qualified. */
    requiredTechnologies: string[];

    /** Technologies the company would like the candidate to know, but is not required. */
    bonusTechnologies: string[];

    /** A list of skills that are listed as preferred. */
    optionalSkillList: string[];

    /** A list of any information found int he job description that would be considered
     *   a requirement for the applicant, if that requirement doesn't fall under any other category. */
    otherQualifyingInfo: string[];

    /** A list of any other information found in the job description that might be interesting, but not
     *   detrimental to securing this position. */
    otherInformation: string[];
}