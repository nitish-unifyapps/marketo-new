import type { ProgramMemberRecord, ProgramType } from '../types/programs'

export interface ProgramReportKpi {
  label: string
  value: string
  trend: string
  direction: 'up' | 'down'
}

export interface ProgramChartSeries {
  name: string
  color: string
  values: number[]
}

const people = [
  { personId: 'p-1', name: 'Sophia Kim', email: 'sophia.kim@northlane.com', registrationDate: '2026-07-26', lastActivity: '2h ago' },
  { personId: 'p-2', name: 'Noah Patel', email: 'noah.patel@brightscale.io', registrationDate: '2026-07-23', lastActivity: '6h ago' },
  { personId: 'p-3', name: 'Elena Garcia', email: 'elena.garcia@hexametrics.com', registrationDate: '2026-07-19', lastActivity: '1d ago' },
  { personId: 'p-4', name: 'Arjun Rao', email: 'arjun.rao@finarc.io', registrationDate: '2026-07-12', lastActivity: '3d ago' },
  { personId: 'p-5', name: 'Grace Walker', email: 'grace.walker@cloudforge.net', registrationDate: '2026-07-04', lastActivity: '5d ago' },
]

export function defaultProgramMembers(type: ProgramType): ProgramMemberRecord[] {
  const statuses = type === 'Event'
    ? ['Registered', 'Attended', 'Invited', 'No Show', 'Waitlisted']
    : type === 'Nurture'
      ? ['Active', 'Active', 'Paused', 'Exhausted', 'Normal']
      : type === 'Container'
        ? ['Member', 'Member', 'Member', 'Member', 'Member']
        : ['Member', 'Qualified', 'Engaged', 'Converted', 'Paused']
  const streams = ['General Nurture', 'Engaged', 'General Nurture', 'Engaged', 'General Nurture']

  return people.map((person, index) => ({
    id: `membership-${type.toLowerCase().replaceAll(' ', '-')}-${index + 1}`,
    ...person,
    status: statuses[index],
    stream: type === 'Nurture' ? streams[index] : undefined,
    activity: [
      { id: `activity-${type}-${index}-1`, type: 'status', label: `Program status changed to ${statuses[index]}`, timestamp: person.lastActivity },
      { id: `activity-${type}-${index}-2`, type: index % 2 === 0 ? 'email' : 'activity', label: index % 2 === 0 ? 'Opened program email' : 'Matched program entry criteria', timestamp: person.registrationDate },
    ],
  }))
}

export function reportKpis(type: ProgramType, convertedToNurture = false): ProgramReportKpi[] {
  if (type === 'Event') return [
    { label: 'Invited', value: '2,400', trend: '12.4%', direction: 'up' },
    { label: 'Registered', value: '1,824', trend: '9.8%', direction: 'up' },
    { label: 'Attended', value: '1,268', trend: '7.2%', direction: 'up' },
    { label: 'No Show', value: '556', trend: '3.1%', direction: 'down' },
  ]
  if (type === 'Nurture' || convertedToNurture) return [
    { label: 'Members', value: '8,620', trend: '11.6%', direction: 'up' },
    { label: 'Active', value: '6,881', trend: '8.4%', direction: 'up' },
    { label: 'Paused', value: '724', trend: '1.8%', direction: 'down' },
    { label: 'Exhausted', value: '1,015', trend: '4.2%', direction: 'up' },
    { label: 'Goal', value: '943', trend: '13.7%', direction: 'up' },
  ]
  return [
    { label: 'Total Members', value: '12,480', trend: '10.2%', direction: 'up' },
    { label: 'Sent', value: '10,842', trend: '8.6%', direction: 'up' },
    { label: 'Delivered', value: '10,315', trend: '8.1%', direction: 'up' },
    { label: 'Opens', value: '4,921', trend: '12.5%', direction: 'up' },
    { label: 'Clicks', value: '1,684', trend: '6.4%', direction: 'up' },
    { label: 'Goal', value: '812', trend: '14.1%', direction: 'up' },
  ]
}

export function reportChartSeries(type: ProgramType, convertedToNurture = false): ProgramChartSeries[] {
  if (type === 'Event') return [
    { name: 'Registrations', color: '#D97757', values: [18, 31, 42, 55, 69, 78, 86, 96] },
    { name: 'Attendance', color: '#4E8B68', values: [8, 17, 24, 32, 45, 58, 66, 73] },
  ]
  if (type === 'Nurture' || convertedToNurture) return [
    { name: 'Active Members', color: '#D97757', values: [44, 49, 55, 58, 65, 69, 76, 82] },
    { name: 'Goal Reached', color: '#7C72C5', values: [12, 18, 22, 29, 35, 43, 51, 61] },
  ]
  return [
    { name: 'Delivered', color: '#D97757', values: [34, 45, 52, 66, 72, 78, 86, 93] },
    { name: 'Opens', color: '#557F9D', values: [14, 22, 28, 35, 41, 46, 54, 61] },
    { name: 'Clicks', color: '#7C72C5', values: [5, 9, 13, 17, 21, 26, 31, 36] },
  ]
}

export const chartLabels = ['Jul 1', 'Jul 5', 'Jul 9', 'Jul 13', 'Jul 17', 'Jul 21', 'Jul 25', 'Jul 28']
