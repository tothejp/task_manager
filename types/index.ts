export type MemberRole = 'admin' | 'member'
export type AvailabilityStatus = 'available' | 'vacation' | 'dayoff'
export type RepeatType = 'daily' | 'weekly' | 'monthly'
export type AssignmentStatus = 'assigned' | 'vacant' | 'completed'
export type AssignedBy = 'manual' | 'auto'

export interface Team {
  id: string
  name: string
  created_by: string
  created_at: string
}

export interface Member {
  id: string
  team_id: string
  user_id: string
  role: MemberRole
  name: string
  created_at: string
}

export interface SkillTag {
  id: string
  team_id: string
  name: string
  created_at: string
}

export interface MemberSkill {
  member_id: string
  skill_tag_id: string
}

export interface TaskSkill {
  task_id: string
  skill_tag_id: string
}

export interface Availability {
  id: string
  member_id: string
  status: AvailabilityStatus
  start_date: string
  end_date: string
  repeat_type: RepeatType | null
  repeat_until: string | null
  parent_id: string | null
  created_at: string
}

export interface Task {
  id: string
  team_id: string
  title: string
  description: string | null
  date: string
  start_time: string
  end_time: string
  required_headcount: number
  repeat_type: RepeatType | null
  repeat_until: string | null
  parent_id: string | null
  created_at: string
}

export interface Assignment {
  id: string
  task_id: string
  member_id: string
  status: AssignmentStatus
  assigned_by: AssignedBy
  skill_override: boolean
  created_at: string
}

export interface Invitation {
  id: string
  team_id: string
  code: string
  expires_at: string
  created_at: string
}

// 조인 결과 타입
export interface MemberWithSkills extends Member {
  skills: SkillTag[]
}

export interface TaskWithSkills extends Task {
  skills: SkillTag[]
}

export interface AssignmentWithMember extends Assignment {
  member: Member
}
