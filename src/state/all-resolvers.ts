import { experienceDefinitionResolvers } from "../components/ExperienceDefinition/resolvers";
import { experienceNewEntryParentResolvers } from "../components/ExperienceNewEntryParent/resolvers";
import { newEntryResolvers } from "../components/NewEntry/resolvers";

export const allResolvers = [
  experienceDefinitionResolvers,
  experienceNewEntryParentResolvers,
  newEntryResolvers,
];
