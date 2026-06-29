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
});
