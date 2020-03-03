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
  const allUnsynced = getUnsyncedExperiences();
  allUnsynced[id] = data;
  localStorage.setItem(KEY, JSON.stringify(allUnsynced));
}

function getUnsyncedExperiences() {
  return JSON.parse(localStorage.getItem(KEY) || "{}") as Unsynced;
}

export function removeUnsyncedExperience(id: string) {
  const allUnsynced = getUnsyncedExperiences();
  delete allUnsynced[id];
  localStorage.setItem(KEY, JSON.stringify(allUnsynced));
}

export function removeUnsyncedExperiences(ids: string[]) {
  const allUnsynced = getUnsyncedExperiences();

  ids.forEach(id => {
    delete allUnsynced[id];
  });

  localStorage.setItem(KEY, JSON.stringify(allUnsynced));
}

////////////////////////// TYPES ////////////////////////////

type UnsyncedData = true | UnsyncedModifiedExperience;

interface Unsynced {
  [experienceId: string]: UnsyncedData;
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
    [definitionId: string]: ModifiedExperienceUnsyncedDefinition;
  };
  newEntries?: true;
  modifiedEntries?: {
    [entryId: string]: {
      [dataObjectId: string]: true;
    };
  };
}
