// config/teamFormConfig.ts
export const TEAM_FORM_CONFIG = {
  create: {
    title: "Create New Team",
    subtitle: "Set up your team and start collaborating",
    placeholder: "Enter your team name",
    buttonText: "Create Team",
    loadingText: "Creating Team…",
  },
  join: {
    title: "Join a Team",
    subtitle: "Enter the name of the team you'd like to join",
    placeholder: "Enter the team name you want to join",
    buttonText: "Join Team",
    loadingText: "Joining Team…",
  }
} as const;

// Type exports for better TypeScript support
export type TeamFormMode = keyof typeof TEAM_FORM_CONFIG;
export type TeamFormConfig = typeof TEAM_FORM_CONFIG[TeamFormMode];
