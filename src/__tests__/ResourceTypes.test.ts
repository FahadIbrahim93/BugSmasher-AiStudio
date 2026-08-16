import { describe, expect, it } from 'vitest';
import { RECIPES, RESOURCES, SKILLS, type ResourceType } from '../game/ResourceTypes';

describe('ResourceTypes', () => {
  it('defines all core resource metadata', () => {
    const ids: ResourceType[] = ['scrap', 'plasma', 'alloy', 'flux', 'neural_core', 'crystals'];
    for (const id of ids) {
      expect(RESOURCES[id].id).toBe(id);
      expect(RESOURCES[id].name.length).toBeGreaterThan(0);
      expect(RESOURCES[id].color.startsWith('#')).toBe(true);
    }
  });

  it('defines craftable recipes with ingredients', () => {
    expect(RECIPES.length).toBeGreaterThanOrEqual(3);
    for (const recipe of RECIPES) {
      expect(Object.keys(recipe.ingredients).length).toBeGreaterThan(0);
      expect(['consumable', 'permanent']).toContain(recipe.resultType);
    }
  });

  it('defines skill trees with scaling costs and effects', () => {
    expect(SKILLS.length).toBeGreaterThanOrEqual(10);

    for (const skill of SKILLS) {
      expect(skill.maxLevel).toBeGreaterThan(0);
      expect(skill.costPerLevel(0)).toBeTruthy();
      expect(skill.effect(1)).toBeGreaterThanOrEqual(0);
      expect(['combat', 'scavenger', 'control']).toContain(skill.category);
    }
  });

  it('includes active abilities with crystal costs', () => {
    const actives = SKILLS.filter((skill) => skill.isActiveAbility);
    expect(actives.length).toBeGreaterThanOrEqual(3);
    for (const skill of actives) {
      expect(skill.costPerLevel(0).crystals).toBeGreaterThan(0);
    }
  });

  it('skill cost ternaries hit both branches at their thresholds', () => {
    const sentry = SKILLS.find((s) => s.id === 'sentry_optimization')!;
    // l > 5 ? 1 : 0 — low level (0 cores) and high level (1 core)
    expect(sentry.costPerLevel(3).neural_core ?? 0).toBe(0);
    expect(sentry.costPerLevel(6).neural_core).toBe(1);

    const crit = SKILLS.find((s) => s.id === 'crit_hit')!;
    // flux: l % 4 === 0 ? 1 : 0 — non-multiple and multiple of 4
    expect(crit.costPerLevel(3).flux ?? 0).toBe(0);
    expect(crit.costPerLevel(4).flux).toBe(1);
  });

  it('skills have dependency chains and active-ability flags', () => {
    const actives = SKILLS.filter((s) => s.isActiveAbility);
    for (const active of actives) {
      expect(active.dependencies?.length).toBeGreaterThan(0);
      expect(active.maxLevel).toBe(1);
    }
    const leaf = SKILLS.find((s) => s.id === 'gravity_well')!;
    expect(leaf.dependencies).toEqual(['chrono_emp_shatter']);
  });
});
