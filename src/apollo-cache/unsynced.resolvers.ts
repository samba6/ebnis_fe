/* istanbul ignore file */
const KEY = "S4gz/ER4FSYsvw";

export function getUnsyncedExperience(
  id: string,
): UnsyncedModifiedExperience | undefined {
  const data = localStorage.getItem(KEY);

  return data
    ? (JSON.parse(data)[id] as UnsyncedModifiedExperience)
    : undefined;
}

export function writeUnsyncedExperience(id: string, data: UnsyncedData) {
  const allUnsycned = getUnsyncedExperiences();
  allUnsycned[id] = data;
  localStorage.setItem(KEY, JSON.stringify(allUnsycned));
}

function getUnsyncedExperiences() {
  return JSON.parse(localStorage.getItem(KEY) || "{}") as Unsynced;
}

export function removeUnsyncedExperience(id: string) {
  const allUnsycned = getUnsyncedExperiences();
  delete allUnsycned[id];
  localStorage.setItem(KEY, JSON.stringify(allUnsycned));
}

////////////////////////// TYPES ////////////////////////////

type UnsyncedData = true | UnsyncedModifiedExperience;

interface Unsynced {
  [k: string]: UnsyncedData;
}

export interface ModifiedExperienceUnsyncedDefinition {
  name?: true;
  // type?: true;
}

export interface UnsyncedModifiedExperience {
  ownFields?: {
    title?: true;
    description?: true;
  };
  definitions?: {
    [k: string]: ModifiedExperienceUnsyncedDefinition;
  };
  newEntries?: true;
  modifiedEntries?: {
    [k: string]: {
      [k: string]: true;
    };
  };
}
