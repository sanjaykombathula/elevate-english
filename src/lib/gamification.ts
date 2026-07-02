import { supabase } from '@/integrations/supabase/client';

export async function awardXP(amount: number, source: string, meta: Record<string, unknown> = {}) {
  if (amount <= 0) return;
  await supabase.rpc('award_xp', { _amount: amount, _source: source, _meta: meta as any });
}

export async function issueCertificate(moduleId: string) {
  const { data, error } = await supabase.rpc('issue_certificate', { _module_id: moduleId });
  if (error) throw error;
  return data;
}

export async function checkAndAwardBadges(userId: string) {
  // fetch stats + attempts to evaluate badge criteria
  const [{ data: stats }, { data: attempts }, { data: badges }, { data: earned }] = await Promise.all([
    supabase.from('user_stats').select('*').eq('user_id', userId).maybeSingle(),
    supabase.from('task_attempts').select('id, percentage, task_id').eq('user_id', userId).eq('completed', true),
    supabase.from('badges').select('id, code'),
    supabase.from('user_badges').select('badge_id').eq('user_id', userId),
  ]);
  const earnedIds = new Set((earned || []).map((b: any) => b.badge_id));
  const byCode = new Map((badges || []).map((b: any) => [b.code, b.id]));
  const toAward: string[] = [];
  const push = (code: string) => {
    const id = byCode.get(code);
    if (id && !earnedIds.has(id)) toAward.push(id);
  };
  if ((attempts || []).length >= 1) push('first_task');
  if ((attempts || []).some((a: any) => Number(a.percentage) >= 100)) push('perfect_task');
  if ((stats?.streak_current || 0) >= 7 || (stats?.streak_best || 0) >= 7) push('streak_7');
  if ((stats?.xp_total || 0) >= 1000) push('xp_1000');
  if (toAward.length) {
    await supabase.from('user_badges').insert(toAward.map((badge_id) => ({ user_id: userId, badge_id })));
  }
  return toAward.length;
}
