import { DataProxy } from "apollo-cache";
import immer, { Draft } from "immer";
import { UpdateExperiencesOnlineMutationResult } from "../graphql/update-experience.mutation";
import { readExperienceFragment } from "./read-experience-fragment";
import { writeExperienceFragmentToCache } from "./write-experience-fragment";
import { UpdateExperienceFragment } from "../graphql/apollo-types/UpdateExperienceFragment";
import { ExperienceFragment } from "../graphql/apollo-types/ExperienceFragment";
import { DataDefinitionFragment } from "../graphql/apollo-types/DataDefinitionFragment";
import { floatExperiencesToTheTopInGetExperiencesMiniQuery } from "./update-get-experiences-mini-query";

export function updateExperiencesInCache(
  dataProxy: DataProxy,
  result: UpdateExperiencesOnlineMutationResult,
) {
  const updateExperiences =
    result && result.data && result.data.updateExperiences;

  if (!updateExperiences) {
    return;
  }

  let hasUpdates = false;
  const updatedIds: { [k: string]: number } = {};

  if (updateExperiences.__typename === "UpdateExperiencesSomeSuccess") {
    const { experiences: updateResults } = updateExperiences;

    for (const updateResult of updateResults) {
      if (updateResult.__typename === "UpdateExperienceSomeSuccess") {
        const { experience: result } = updateResult;
        const { experienceId, updatedAt } = result;

        const experience = readExperienceFragment(dataProxy, experienceId);

        if (!experience) {
          continue;
        }

        hasUpdates = true;

        updatedIds[experienceId] = 1;

        const updatedExperience = immer(experience, proxy => {
          proxy.hasUnsaved = null; // if all components saved
          proxy.updatedAt = updatedAt;
          updateOwnFields(proxy, result);
          updateDefinitions(proxy, result);
        });

        writeExperienceFragmentToCache(dataProxy, updatedExperience);
      }
    }
  }

  if (!hasUpdates) {
    return;
  }

  floatExperiencesToTheTopInGetExperiencesMiniQuery(dataProxy, updatedIds);
}

function updateOwnFields(proxy: DraftState, result: UpdateExperienceFragment) {
  const ownFields = result.ownFields;

  if (ownFields && ownFields.__typename === "ExperienceOwnFieldsSuccess") {
    const {
      data: { title, description },
    } = ownFields;
    proxy.title = title;
    proxy.description = description;
  }
}

function updateDefinitions(
  proxy: DraftState,
  result: UpdateExperienceFragment,
) {
  const updatedDefinitions = result.updatedDefinitions;

  if (!updatedDefinitions) {
    return;
  }

  let hasUpdates = false;

  const updates = updatedDefinitions.reduce((acc, d) => {
    if (d.__typename === "DefinitionSuccess") {
      hasUpdates = true;
      const { definition } = d;
      acc[definition.id] = definition;
    }
    return acc;
  }, {} as { [k: string]: DataDefinitionFragment });

  if (!hasUpdates) {
    return;
  }

  proxy.dataDefinitions = proxy.dataDefinitions.map(d => {
    const definition = d as DataDefinitionFragment;
    return updates[definition.id] || definition;
  });
}

type DraftState = Draft<ExperienceFragment>;
