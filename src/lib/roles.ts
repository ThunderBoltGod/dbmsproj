// src/lib/roles.ts
// Role-based access control helpers for the EventHub platform
// Hierarchy: super_admin > admin > organizer > volunteer > attendee

export type UserRole = "super_admin" | "admin" | "organizer" | "volunteer" | "attendee";

// Ordered from highest to lowest privilege
const ROLE_HIERARCHY: UserRole[] = [
  "super_admin",
  "admin",
  "organizer",
  "volunteer",
  "attendee",
];

/**
 * Returns the numeric level of a role (lower number = higher privilege).
 */
function roleLevel(role: UserRole): number {
  const index = ROLE_HIERARCHY.indexOf(role);
  return index === -1 ? ROLE_HIERARCHY.length : index;
}

/**
 * Check if the user's role meets the minimum required role.
 * e.g. canAccess("admin", "organizer") → true (admin is higher than organizer)
 *      canAccess("volunteer", "organizer") → false
 */
export function canAccess(userRole: string, minimumRole: UserRole): boolean {
  return roleLevel(userRole as UserRole) <= roleLevel(minimumRole);
}

/**
 * Returns true if the user has exactly this role.
 */
export function hasRole(userRole: string, role: UserRole): boolean {
  return userRole === role;
}

/**
 * Get a human-readable label for a role.
 */
export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    super_admin: "Super Admin",
    admin: "Admin",
    organizer: "Organizer",
    volunteer: "Volunteer",
    attendee: "Attendee",
  };
  return labels[role] || role;
}

/**
 * Get a color accent for a role badge (HSL values matching the design system).
 */
export function getRoleBadgeColor(role: string): { bg: string; text: string; border: string } {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    super_admin: {
      bg: "rgb(239 68 68 / 0.1)",
      text: "rgb(220 38 38)",
      border: "rgb(239 68 68 / 0.2)",
    },
    admin: {
      bg: "rgb(168 85 247 / 0.1)",
      text: "rgb(147 51 234)",
      border: "rgb(168 85 247 / 0.2)",
    },
    organizer: {
      bg: "rgb(59 130 246 / 0.1)",
      text: "rgb(37 99 235)",
      border: "rgb(59 130 246 / 0.2)",
    },
    volunteer: {
      bg: "rgb(16 185 129 / 0.1)",
      text: "rgb(5 150 105)",
      border: "rgb(16 185 129 / 0.2)",
    },
    attendee: {
      bg: "rgb(107 114 128 / 0.1)",
      text: "rgb(75 85 99)",
      border: "rgb(107 114 128 / 0.2)",
    },
  };
  return colors[role] || colors.attendee;
}

/**
 * All valid roles for dropdowns / admin panels.
 */
export const ALL_ROLES: UserRole[] = [...ROLE_HIERARCHY];
