// Thin compatibility wrapper — reads from ProfileContext instead of creating its own queries.
// All 24+ consumers continue working without any import changes.
export { useProfileContext as useProfile } from "@/contexts/ProfileContext";
export type { Profile, UserRole } from "@/contexts/ProfileContext";
