import { isTimeOverlapping } from "./time-overlap";

export type AutoAssignMember = {
  id: string;
  skillIds: string[];
  workloadCount: number;
  lastAssignedDate: string | null;
  existingSlotsToday: { startTime: string; endTime: string }[];
};

export type AutoAssignTask = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  requiredHeadcount: number;
  requiredSkillIds: string[];
  assignedMemberIds: string[];
};

export type AutoAssignRecommendation = { taskId: string; memberId: string };

export type AutoAssignShortfall = {
  taskId: string;
  taskTitle: string;
  requiredHeadcount: number;
  filledTotal: number;
  reason: string;
};

export type AutoAssignResult = {
  recommendations: AutoAssignRecommendation[];
  shortfalls: AutoAssignShortfall[];
};

// 순수 함수: 가용 인원 + 과업 정보 + 기존 배정 현황 → 추천 배정 결과 (PRD 3.6, CLAUDE.md 2.2)
export function recommendAssignments(
  tasks: AutoAssignTask[],
  members: AutoAssignMember[]
): AutoAssignResult {
  const recommendations: AutoAssignRecommendation[] = [];
  const shortfalls: AutoAssignShortfall[] = [];

  const runtimeSlotsByMember = new Map<string, { startTime: string; endTime: string }[]>();
  const runtimeWorkload = new Map<string, number>();
  for (const m of members) {
    runtimeSlotsByMember.set(m.id, [...m.existingSlotsToday]);
    runtimeWorkload.set(m.id, m.workloadCount);
  }

  const sortedTasks = [...tasks].sort((a, b) => a.startTime.localeCompare(b.startTime));

  for (const task of sortedTasks) {
    const needed = task.requiredHeadcount - task.assignedMemberIds.length;
    if (needed <= 0) continue;

    const candidates = members.filter((m) => {
      if (task.assignedMemberIds.includes(m.id)) return false;

      const slots = runtimeSlotsByMember.get(m.id) ?? [];
      return !slots.some((s) => isTimeOverlapping(s.startTime, s.endTime, task.startTime, task.endTime));
    });

    const skillHolders = candidates.filter((m) =>
      task.requiredSkillIds.every((skillId) => m.skillIds.includes(skillId))
    );

    const sorted = [...skillHolders].sort((a, b) => {
      const workloadDiff = (runtimeWorkload.get(a.id) ?? 0) - (runtimeWorkload.get(b.id) ?? 0);
      if (workloadDiff !== 0) return workloadDiff;

      const aDate = a.lastAssignedDate ?? "";
      const bDate = b.lastAssignedDate ?? "";
      return aDate.localeCompare(bDate);
    });

    const chosen = sorted.slice(0, needed);

    for (const m of chosen) {
      recommendations.push({ taskId: task.id, memberId: m.id });

      const slots = runtimeSlotsByMember.get(m.id) ?? [];
      slots.push({ startTime: task.startTime, endTime: task.endTime });
      runtimeSlotsByMember.set(m.id, slots);

      runtimeWorkload.set(m.id, (runtimeWorkload.get(m.id) ?? 0) + 1);
    }

    const filledTotal = task.assignedMemberIds.length + chosen.length;
    if (filledTotal < task.requiredHeadcount) {
      shortfalls.push({
        taskId: task.id,
        taskTitle: task.title,
        requiredHeadcount: task.requiredHeadcount,
        filledTotal,
        reason: task.requiredSkillIds.length > 0 ? "해당 스킬 보유 가용 인원 부족" : "가용 인원 부족",
      });
    }
  }

  return { recommendations, shortfalls };
}
