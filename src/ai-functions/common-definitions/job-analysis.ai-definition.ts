

export const jobListingAnalysisProperties_AiFunctions = {
    type: 'object',
    "required": [
        "companyName",
        "jobTitle",
        "companyDescription",
        "datePosted",
        "jobLocation",
        "isContactRole",
        "allowWorkInMn",
        "minCompensation",
        "maxCompensation",
        "jobDescription",
        "jobDuties",
        "educationRequirements",
        "requiredSkillList",
        "optionalSkillList",
        "otherQualifyingInfo",
        "otherInformation",
        "requiredTechnologies",
        "bonusTechnologies",
    ],
    "properties": {
        "companyName": {
            "type": "string",
            "description": "The name of the company, if found in the job description"
        },
        "jobTitle": {
            "type": "string",
            "description": "The title of the job opening, it's available."
        },
        "companyDescription": {
            "type": "string",
            "description": "A description of the job"
        },
        "datePosted": {
            "type": "string",
            "description": "If found, the date this job opening was posted"
        },
        "jobLocation": {
            "type": "string",
            "description": "The location that this job reports to, preferably city/state"
        },
        "isContactRole": {
            "type": "boolean",
            "description": "Indicates if this job is a contractor role"
        },
        "allowWorkInMn": {
            "type": "boolean",
            "description": "Indicates whether this position is open to minnesotans.  True if Minnesotans can apply.  False if something in the application indicates that only certain other states may apply, or other specifically mentioned exclusions indicate this."
        },
        "minCompensation": {
            "type": "string",
            "description": "The minimum compensation listed, if any found"
        },
        "maxCompensation": {
            "type": "string",
            "description": "The maximum compensation listed, if any found"
        },
        "jobDescription": {
            "type": "string",
            "description": "A description of the job"
        },
        "jobDuties": {
            "type": "array",
            "description": "A list of duties described by the job",
            "items": {
                "type": "string"
            }
        },
        "educationRequirements": {
            "type": "string",
            "description": "Educational requirements listed by the job"
        },
        "requiredTechnologies": {
            "type": "array",
            "description": "Technologies the applicant must know to be qualified",
            "items": {
                "type": "string"
            }
        },
        "bonusTechnologies": {
            "type": "array",
            "description": "Technologies the company would like the candidate to know, but is not required.",
            "items": {
                "type": "string"
            }
        },
        "requiredSkillList": {
            "type": "array",
            "description": "A list of skills that are required for this position",
            "items": {
                "type": "string"
            }
        },
        "optionalSkillList": {
            "type": "array",
            "description": "A list of skills that are listed as preferred",
            "items": {
                "type": "string"
            }
        },
        "otherQualifyingInfo": {
            "type": "array",
            "description": "A list of any qualifying information found in the job description",
            "items": {
                "type": "string"
            }
        },
        "otherInformation": {
            "type": "array",
            "description": "A list of any other interesting information found in the job description",
            "items": {
                "type": "string"
            }
        }
    },
    "additionalProperties": false
}