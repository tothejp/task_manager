import { isTimeOverlapping } from "./time-overlap";

export type AutoAssignMember = {
  id: string;
  skillIds: string[];
  workloadCount: number; // 누적 배정 횟수 (전체 기간, PRD 3.6 step 3)
  lastAssignedDate: string | null; // 가장 최근 배정일 (없으면 null, step 4)
  existingSlotsToday: { startTime: string; endTime: string }[]; // 해당 날짜의 기존(수동) 배정 시간대
};

export type AutoAssignTask = {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  requiredHeadcount: number;
  requiredSkillIds: string[];
  assignedMemberIds: string[]; // 이미 배정된 인원 (자동배정은 이 슬롯을 덮어쓰지 않음)
};

export type AutoAssignRecommendation = { taskId: string; memberId: string };

export type AutoAssignShortfall = {
  taskId: string;
  taskTitle: string;
  requiredHeadcount: number;
  filledTotal: number; // 기존 배정 + 이번 추천 합계
  reason: string;
};

export type AutoAssignResult = {
  recommendations: AutoAssignRecommendation[];
  shortfalls: AutoAssignShortfall[];
};

// 순수 함수: 가용 인원 + 과업 정보 + 기존 배정 현황 → 추천 배정 결과 (PRD 3.6, CLAUDE.md 2.2)
// - 미배정 슬롯에 대해서만 동작 (이미 배정된 슬롯은 건드리지 않음)
// - 시간이 겹치는 다른 과업에 이미 배정된 인원은 후보에서 제외 (기존 배정 + 이번 실행에서 추천된 것 모두 반영)
// - 필수 스킬 보유자만 우선 채움 (미보유자는 자동배정 대상에서 제외 — 관리자가 수동으로 결정)
// - 후보 중 누적 배정 업무량이 적은 사람 우선, 동률이면 최근 배정일이 오래된 사람 우선
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

      const aDate = a.lastAssignedDate ?? ""; // 이력 없음(빈 문자열)이 사전순으로 가장 앞 = 최우선
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
