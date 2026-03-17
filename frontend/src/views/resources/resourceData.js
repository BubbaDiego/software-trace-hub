// ---------------------------------------------------------------------------
// Static resource data — will be replaced by API hooks once backend exists
// ---------------------------------------------------------------------------
export const MONTHS = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
export const MONTH_FULL = [
  'Mar 26',
  'Apr 26',
  'May 26',
  'Jun 26',
  'Jul 26',
  'Aug 26',
  'Sep 26',
  'Oct 26',
  'Nov 26',
  'Dec 26',
  'Jan 27',
  'Feb 27'
];

export const PROJECTS = {
  'PCU Refresh': [15.2, 15.2, 15.2, 15.2, 15.2, 15.2, 15.2, 15.2, 15.2, 15.2, 15.2, 15.2],
  Automation: [12.0, 12.0, 12.0, 12.0, 12.0, 12.0, 12.0, 12.0, 12.0, 12.0, 12.0, 12.0],
  'Alaris R2': [6.0, 6.0, 6.0, 6.0, 6.0, 6.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  'Alaris R3': [0.0, 0.0, 0.5, 0.5, 0.5, 0.5, 6.5, 6.5, 6.5, 6.5, 6.5, 6.5],
  'Apollo R2.5': [3.5, 3.5, 3.5, 3.5, 3.5, 3.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  'Apollo R2.6': [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 3.5, 3.5, 3.5, 3.5, 3.5, 3.5],
  'Alaris R1.1': [3.5, 3.5, 3.2, 1.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0],
  'Maven (APM)': [2.0, 2.0, 2.0, 2.0, 2.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
};

export const TEAMS = {
  'BD TCI': [15.0, 15.0, 15.0, 15.0, 15.0, 15.0, 15.0, 15.0, 15.0, 15.0, 15.0, 15.0],
  Platform: [13.2, 13.2, 13.0, 10.8, 9.8, 7.8, 7.8, 7.8, 7.8, 7.8, 7.8, 7.8],
  Application: [8.0, 8.0, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5, 8.5],
  Firmware: [4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0, 4.0],
  Innovation: [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0],
  'BD RCI': [1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0]
};

export const PROJ_COLORS = {
  'PCU Refresh': 'primary',
  Automation: 'secondary',
  'Alaris R2': 'success',
  'Alaris R3': 'info',
  'Apollo R2.5': 'warning',
  'Apollo R2.6': 'warning',
  'Alaris R1.1': 'error',
  'Maven (APM)': 'error'
};

export const TEAM_FTE_CONTRACTOR = [
  { team: 'BD TCI', fte: 23, contractor: 0 },
  { team: 'Application', fte: 10, contractor: 0 },
  { team: 'Platform', fte: 7, contractor: 7 },
  { team: 'Firmware', fte: 3, contractor: 1 },
  { team: 'Dispensing', fte: 3, contractor: 0 },
  { team: 'Innovation', fte: 2, contractor: 0 },
  { team: 'RPM', fte: 2, contractor: 0 },
  { team: 'BD RCI', fte: 1, contractor: 0 }
];

export const LOCATIONS = [
  { name: 'US San Diego', count: 42, pct: 72 },
  { name: 'IND Bangalore', count: 23, pct: 39 },
  { name: 'FRA Toulouse', count: 2, pct: 3 },
  { name: 'Remote', count: 2, pct: 3 },
  { name: 'Ireland', count: 1, pct: 2 }
];

export const TRANSITIONS = [
  { name: 'Aaron Ellis', team: 'Application', from: 'Alaris R2', to: 'Alaris R3', when: 'Aug 2026' },
  { name: 'Ajinkya Pilaji', team: 'Application', from: 'Alaris R2', to: 'Alaris R3', when: 'Aug 2026' },
  { name: 'Duc Nguyen', team: 'Application', from: 'Alaris R2', to: 'Alaris R3', when: 'Aug 2026' },
  { name: 'Gaetan Cravero', team: 'Application', from: 'Alaris R2', to: 'Alaris R3', when: 'Aug 2026' },
  { name: 'Kevin Nguyen', team: 'Application', from: 'Alaris R2', to: 'Alaris R3', when: 'Aug 2026' },
  { name: 'Sebastian Morgan', team: 'Application', from: 'Alaris R2', to: 'Alaris R3', when: 'Aug 2026' },
  { name: 'Indresh Chaudhari', team: 'Platform', from: 'R1.1 / Apollo R2.5', to: 'Apollo R2.6', when: 'Aug 2026' },
  { name: 'Joseph Bollish', team: 'Platform', from: 'Apollo R2.5', to: 'Apollo R2.6', when: 'Aug 2026' },
  { name: 'Mira Stenger', team: 'Platform', from: 'Apollo R2.5', to: 'Apollo R2.6', when: 'Aug 2026' },
  { name: 'Mooneer Salem', team: 'Platform', from: 'Apollo R2.5', to: 'Apollo R2.6', when: 'Aug 2026' }
];

export const PEOPLE = [
  {
    name: 'Aaron Ellis',
    type: 'FTE',
    team: 'Application',
    loc: 'US San Diego',
    mgr: 'Andreas Krueger',
    project: 'Alaris R2/R3',
    activity: 'software development',
    alloc: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  },
  {
    name: 'Ajinkya Pilaji',
    type: 'FTE',
    team: 'Application',
    loc: 'US San Diego',
    mgr: 'Duc Nguyen',
    project: 'Alaris R2/R3',
    activity: 'software development',
    alloc: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  },
  {
    name: 'Andreas Krueger',
    type: 'FTE',
    team: 'Application',
    loc: 'US San Diego',
    mgr: 'Gene Rozell',
    project: 'None',
    activity: 'manager',
    alloc: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  {
    name: 'Andy Ngo',
    type: 'FTE',
    team: 'Platform',
    loc: 'US San Diego',
    mgr: 'Indresh Chaudhari',
    project: 'Alaris R1.1',
    activity: 'software development',
    alloc: [1, 1, 1, 0.25, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  {
    name: 'Andy Wang',
    type: 'FTE',
    team: 'Platform',
    loc: 'US San Diego',
    mgr: 'Indresh Chaudhari',
    project: 'Alaris R1.1',
    activity: 'software development',
    alloc: [1, 1, 1, 0.25, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  {
    name: 'Aruna Veerabhadruni',
    type: 'FTE',
    team: 'BD TCI',
    loc: 'IND Bangalore',
    mgr: 'Sowmya Malakkaran',
    project: 'Automation',
    activity: 'test automation',
    alloc: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  },
  {
    name: 'Ashutosh Dubey',
    type: 'FTE',
    team: 'BD TCI',
    loc: 'IND Bangalore',
    mgr: 'Sowmya Malakkaran',
    project: 'Automation',
    activity: 'test automation',
    alloc: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  },
  {
    name: 'Bharath Yadav',
    type: 'FTE',
    team: 'BD TCI',
    loc: 'IND Bangalore',
    mgr: 'Sowmya Malakkaran',
    project: 'Automation',
    activity: 'test automation',
    alloc: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  },
  {
    name: 'Chenchu Reddy',
    type: 'FTE',
    team: 'BD TCI',
    loc: 'IND Bangalore',
    mgr: 'Kishore Vuyyuru',
    project: 'PCU Refresh',
    activity: 'test engineer',
    alloc: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  },
  {
    name: 'Dan Stumpf',
    type: 'FTE',
    team: 'Firmware',
    loc: 'US San Diego',
    mgr: 'Satya Surapaneni',
    project: 'PCU Refresh',
    activity: 'software development',
    alloc: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  },
  {
    name: 'Duc Nguyen',
    type: 'FTE',
    team: 'Application',
    loc: 'US San Diego',
    mgr: 'Andreas Krueger',
    project: 'Alaris R2/R3',
    activity: 'dev lead',
    alloc: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  },
  {
    name: 'Gaetan Cravero',
    type: 'FTE',
    team: 'Application',
    loc: 'FRA Toulouse',
    mgr: 'Andreas Krueger',
    project: 'Alaris R2/R3',
    activity: 'software development',
    alloc: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  },
  {
    name: 'Gene Rozell',
    type: 'FTE',
    team: 'Application',
    loc: 'US San Diego',
    mgr: '\u2014',
    project: 'None',
    activity: 'manager',
    alloc: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  },
  {
    name: 'Harsh Gosai',
    type: 'FTE',
    team: 'BD TCI',
    loc: 'IND Bangalore',
    mgr: 'Kishore Vuyyuru',
    project: 'PCU Refresh',
    activity: 'test engineer',
    alloc: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  },
  {
    name: 'Indresh Chaudhari',
    type: 'FTE',
    team: 'Platform',
    loc: 'US San Diego',
    mgr: 'Gene Rozell',
    project: 'R1.1/Apollo',
    activity: 'dev lead',
    alloc: [0.5, 0.5, 0.25, 0.25, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
  },
  {
    name: 'James Myles',
    type: 'Contractor',
    team: 'Platform',
    loc: 'US San Diego',
    mgr: 'Joseph Bollish',
    project: 'Apollo R2.5/R2.6',
    activity: 'software development',
    alloc: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  },
  {
    name: 'Joseph Bollish',
    type: 'FTE',
    team: 'Platform',
    loc: 'US San Diego',
    mgr: 'Gene Rozell',
    project: 'Apollo R2.5/R2.6',
    activity: 'dev lead',
    alloc: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  },
  {
    name: 'Kevin Nguyen',
    type: 'FTE',
    team: 'Application',
    loc: 'US San Diego',
    mgr: 'Duc Nguyen',
    project: 'Alaris R2/R3',
    activity: 'software development',
    alloc: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  },
  {
    name: 'Kishore Vuyyuru',
    type: 'FTE',
    team: 'BD TCI',
    loc: 'IND Bangalore',
    mgr: 'Sowmya Malakkaran',
    project: 'PCU Refresh',
    activity: 'test engineer',
    alloc: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  },
  {
    name: 'Mira Stenger',
    type: 'Contractor',
    team: 'Platform',
    loc: 'US San Diego',
    mgr: 'Joseph Bollish',
    project: 'Apollo R2.5/R2.6',
    activity: 'software development',
    alloc: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  },
  {
    name: 'Mooneer Salem',
    type: 'FTE',
    team: 'Platform',
    loc: 'US San Diego',
    mgr: 'Joseph Bollish',
    project: 'Apollo R2.5/R2.6',
    activity: 'software development',
    alloc: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  },
  {
    name: 'Sebastian Morgan',
    type: 'FTE',
    team: 'Application',
    loc: 'US San Diego',
    mgr: 'Duc Nguyen',
    project: 'Alaris R2/R3',
    activity: 'software development',
    alloc: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
  },
  {
    name: 'Surjit Variyankandy',
    type: 'FTE',
    team: 'Platform',
    loc: 'US San Diego',
    mgr: 'Indresh Chaudhari',
    project: 'Alaris R1.1',
    activity: 'software development',
    alloc: [1, 1, 1, 0.25, 0, 0, 0, 0, 0, 0, 0, 0]
  }
];
