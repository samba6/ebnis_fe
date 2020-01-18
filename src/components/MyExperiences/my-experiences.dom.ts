export const domPrefix = "my-experiences";

export function makeExperienceHeaderDomId(id: Id) {
  return `${domPrefix}-title-${id}`;
}

type Id = string | number;
