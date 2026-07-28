import type { ProgramAssetFolderKey, ProgramEventDetails, ProgramFolderRecord, ProgramRecord, ProgramScheduleConfig, ProgramSegmentConfig, ProgramToken, ProgramType } from '../types/programs'
import { defaultFlowStepsForProgramType } from './programFlowData'

export const programAssetFolderLabels: Record<ProgramAssetFolderKey, string> = {
  emails: 'Emails',
  'landing-pages': 'Landing Pages',
  forms: 'Forms',
  files: 'Files',
}

export const programTypeDefaults: Record<ProgramType, ProgramAssetFolderKey[]> = {
  'Automated Campaign': [],
  'Simple Email': ['emails'],
  Nurture: ['emails'],
  Event: ['emails', 'landing-pages', 'forms', 'files'],
  Container: [],
}

export const programFlowTemplates: Record<ProgramType, string[]> = {
  'Automated Campaign': ['Evaluate audience', 'Apply qualification rules', 'Update lead data'],
  'Simple Email': ['Build audience', 'Send email', 'Wait 2 days', 'Track engagement'],
  Nurture: ['Segment audience', 'Add to nurture stream', 'Send nurture email', 'Wait 7 days'],
  Event: ['Process registration', 'Send confirmation email', 'Send event reminder', 'Send follow-up'],
  Container: [],
}

export function defaultSegmentForProgramType(type: ProgramType): ProgramSegmentConfig {
  const sampleConditions = [
    { id: `default-${type.toLowerCase().replaceAll(' ', '-')}-lifecycle`, field: 'Lifecycle Stage', operator: 'is', value: 'MQL' },
    { id: `default-${type.toLowerCase().replaceAll(' ', '-')}-score`, field: 'Lead Score', operator: 'greater than', value: '70' },
  ]

  if (type === 'Event') {
    return {
      mode: 'trigger',
      groups: [{ id: 'event-filter-group', logic: 'AND', conditions: sampleConditions }],
      triggers: [{ id: 'event-registration-trigger', type: 'Fills Out Registration Form', source: 'Event Registration Form', constraints: [] }],
    }
  }

  return {
    mode: 'filter',
    groups: [{ id: `default-${type.toLowerCase().replaceAll(' ', '-')}-group`, logic: 'AND', conditions: sampleConditions }],
    triggers: [],
  }
}

export function defaultScheduleForProgramType(type: ProgramType): ProgramScheduleConfig {
  return {
    mode: type === 'Event' ? 'trigger' : 'batch',
    startAt: '2026-07-29T09:00',
    recurrence: 'None (once)',
    cron: '0 9 * * 1-5',
    timezone: 'America/Los_Angeles',
    qualificationMode: 'new-only',
    allowReentry: false,
    reentryMode: 'Once per person',
    active: false,
  }
}

export function defaultTokensForProgramType(type: ProgramType, programName: string): ProgramToken[] {
  const base: ProgramToken[] = [
    { id: `token-program-name-${programName}`, name: 'ProgramName', type: 'Text', defaultValue: programName, automatic: true },
    { id: `token-owner-email-${programName}`, name: 'OwnerEmail', type: 'Text', defaultValue: 'marketingops@example.com' },
  ]
  if (type !== 'Event') return base
  return [...base,
    { id: `token-event-name-${programName}`, name: 'EventName', type: 'Text', defaultValue: programName, automatic: true },
    { id: `token-event-date-${programName}`, name: 'EventDate', type: 'DateTime', defaultValue: '2026-09-18T10:00', automatic: true },
    { id: `token-event-end-${programName}`, name: 'EventEndDate', type: 'DateTime', defaultValue: '2026-09-18T16:00', automatic: true },
    { id: `token-event-venue-${programName}`, name: 'EventVenue', type: 'Text', defaultValue: 'San Francisco, CA', automatic: true },
  ]
}

export function defaultEventDetails(programName: string): ProgramEventDetails {
  return { eventName: programName, startAt: '2026-09-18T10:00', endAt: '2026-09-18T16:00', timezone: 'America/Los_Angeles', capacity: 500, waitlist: true, venueDescription: 'San Francisco Conference Center\nAnnual revenue leadership summit.' }
}

export const initialProgramFolders: ProgramFolderRecord[] = [
  { id: 'pf-program-1', name: 'Program 1', parentId: null },
]

export const initialPrograms: ProgramRecord[] = [
  {
    id: 'program-email',
    name: 'Program Email',
    parentId: 'pf-program-1',
    type: 'Simple Email',
    status: 'Draft',
    enabledAssetFolders: ['emails'],
    assets: [{ id: 'program-email-welcome', name: 'Program Welcome Email', type: 'Email', folder: 'emails' }],
    flow: ['Send program email'],
    flowSteps: defaultFlowStepsForProgramType('Simple Email'),
    description: 'Focused email program for a defined audience.',
    createdAt: 'Jul 28, 2026',
    tags: ['Email'],
    tokens: defaultTokensForProgramType('Simple Email', 'Program Email'),
    schedule: defaultScheduleForProgramType('Simple Email'),
    communicationLimits: { perDay: 1, perWeek: 3 },
  },
  {
    id: 'program-engagement',
    name: 'Program Engagement',
    parentId: 'pf-program-1',
    type: 'Nurture',
    status: 'Active',
    enabledAssetFolders: ['emails', 'forms', 'landing-pages'],
    assets: [
      { id: 'engagement-email', name: 'Engagement Email', type: 'Email', folder: 'emails' },
      { id: 'engagement-form', name: 'Engagement Form', type: 'Form', folder: 'forms' },
      { id: 'engagement-page', name: 'Engagement Landing Page', type: 'Landing Page', folder: 'landing-pages' },
    ],
    flow: ['Route audience', 'Run engagement streams'],
    flowSteps: defaultFlowStepsForProgramType('Nurture'),
    description: 'Multi-channel engagement program with local assets.',
    createdAt: 'Jul 28, 2026',
    tags: ['Engagement'],
    tokens: defaultTokensForProgramType('Nurture', 'Program Engagement'),
    schedule: { ...defaultScheduleForProgramType('Nurture'), active: true },
    communicationLimits: { perDay: 1, perWeek: 3 },
    pauseOnEngagement: true,
  },
  {
    id: 'program-email-blast',
    name: 'Program Email Blast',
    parentId: 'pf-program-1',
    type: 'Simple Email',
    status: 'Draft',
    enabledAssetFolders: ['emails'],
    assets: [{ id: 'email-blast-email', name: 'Email Blast', type: 'Email', folder: 'emails' }],
    flow: ['Send email blast'],
    flowSteps: defaultFlowStepsForProgramType('Simple Email'),
    description: 'One-time email blast program.',
    createdAt: 'Jul 28, 2026',
    tags: ['Email Blast'],
    tokens: defaultTokensForProgramType('Simple Email', 'Program Email Blast'),
    schedule: defaultScheduleForProgramType('Simple Email'),
    communicationLimits: { perDay: 1, perWeek: 3 },
  },
  {
    id: 'program-smart-campaign',
    name: 'Program smart campaign',
    parentId: 'pf-program-1',
    type: 'Automated Campaign',
    status: 'Active',
    enabledAssetFolders: ['emails'],
    assets: [{ id: 'smart-campaign-email', name: 'Smart Campaign Email', type: 'Email', folder: 'emails' }],
    flow: ['Evaluate criteria', 'Execute campaign'],
    flowSteps: defaultFlowStepsForProgramType('Automated Campaign'),
    description: 'Automated smart campaign program.',
    createdAt: 'Jul 28, 2026',
    tags: ['Automation'],
    tokens: defaultTokensForProgramType('Automated Campaign', 'Program smart campaign'),
    schedule: { ...defaultScheduleForProgramType('Automated Campaign'), mode: 'trigger', active: true },
  },
  {
    id: 'program-nurture',
    name: 'Program Nurture',
    parentId: 'pf-program-1',
    type: 'Nurture',
    status: 'Draft',
    enabledAssetFolders: ['emails', 'forms', 'landing-pages'],
    assets: [
      { id: 'nurture-email', name: 'Nurture Email', type: 'Email', folder: 'emails' },
      { id: 'nurture-form', name: 'Nurture Form', type: 'Form', folder: 'forms' },
      { id: 'nurture-page', name: 'Nurture Landing Page', type: 'Landing Page', folder: 'landing-pages' },
    ],
    flow: ['Route audience', 'Run nurture streams'],
    flowSteps: defaultFlowStepsForProgramType('Nurture'),
    description: 'Always-on nurture program with local conversion assets.',
    createdAt: 'Jul 28, 2026',
    tags: ['Nurture'],
    tokens: defaultTokensForProgramType('Nurture', 'Program Nurture'),
    schedule: defaultScheduleForProgramType('Nurture'),
    communicationLimits: { perDay: 1, perWeek: 3 },
    exclusionSmartList: 'Global Suppression List',
    pauseOnEngagement: true,
  },
]
