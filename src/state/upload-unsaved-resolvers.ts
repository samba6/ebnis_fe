import { InMemoryCache, NormalizedCacheObject } from "apollo-cache-inmemory";
import ApolloClient from "apollo-client";
import {
  UNSAVED_EXPERIENCES_QUERY,
  UnsavedExperiencesQueryReturned
} from "../components/ExperienceDefinition/resolver-utils";
import {
  GET_SAVED_EXPERIENCES_UNSAVED_ENTRIES_QUERY,
  UnsavedEntriesQueryReturned
} from "../components/NewEntry/resolvers";
import { CachePersistor } from "apollo-cache-persist";
import gql from "graphql-tag";
import immer from "immer";
import { CreateExp, CreateEntry } from "../graphql/apollo-types/globalTypes";

const UPLOAD_UNSAVED_FRAGMENT = gql`
  fragment UploadUnsavedFragment on UploadUnsaved {
    lastUploadedAt
    inProgress
  }
`;

const GET_LAST_UP_LOAD_TIME = gql`
  {
    uploadUnsaved @client {
      ...UploadUnsavedFragment
    }
  }

  ${UPLOAD_UNSAVED_FRAGMENT}
`;

const UPLOAD_INTERVAL_MILLI_SECS = 10000;

const UPLOAD_UNSAVED_TYPE_NAME = "UploadUnsaved" as UploadUnsavedType;

export const defaultUploadUnsaved: UploadUnsavedQueryReturned = {
  uploadUnsaved: {
    lastUploadedAt: 0,
    inProgress: false,
    __typename: UPLOAD_UNSAVED_TYPE_NAME
  }
};

export async function uploadUnsaved(
  cache: InMemoryCache,
  client: ApolloClient<{}>,
  persistor: CachePersistor<NormalizedCacheObject>
) {
  const uploadUnsavedData = cache.readQuery<UploadUnsavedQueryReturned>({
    query: GET_LAST_UP_LOAD_TIME
  });

  const { lastUploadedAt, inProgress } = uploadUnsavedData
    ? uploadUnsavedData.uploadUnsaved
    : defaultUploadUnsaved.uploadUnsaved;

  const now = new Date().getTime();

  const shouldUpload =
    !inProgress && now - lastUploadedAt > UPLOAD_INTERVAL_MILLI_SECS;

  if (!shouldUpload) {
    return;
  }

  cache.writeData<UploadUnsavedQueryReturned>({
    data: {
      uploadUnsaved: {
        lastUploadedAt,
        inProgress: true,
        __typename: UPLOAD_UNSAVED_TYPE_NAME
      }
    }
  });

  // await persistor.persist();

  const unsavedExperiencesData = cache.readQuery<
    UnsavedExperiencesQueryReturned
  >({
    query: UNSAVED_EXPERIENCES_QUERY
  });

  let unsavedExperiences = unsavedExperiencesData
    ? unsavedExperiencesData.unsavedExperiences
    : [];

  unsavedExperiences = immer(unsavedExperiences, (proxy: CreateExp[]) => {
    for (let i = 0, len = proxy.length; i < len; i++) {
      const {
        clientId,
        description,
        fieldDefs,
        title,
        updatedAt,
        insertedAt
      } = proxy[i];

      proxy[i] = {
        clientId,
        description,
        fieldDefs,
        title,
        updatedAt,
        insertedAt
      };
    }
  });

  // tslint:disable-next-line:no-console
  console.log(
    "\n\t\tLogging start\n\n\n\n unsavedExperiences\n",
    unsavedExperiences,
    "\n\n\n\n\t\tLogging ends\n"
  );

  const savedExperiencesUnsavedEntriesData = cache.readQuery<
    UnsavedEntriesQueryReturned
  >({
    query: GET_SAVED_EXPERIENCES_UNSAVED_ENTRIES_QUERY
  });

  let savedExperiencesUnsavedEntries = savedExperiencesUnsavedEntriesData
    ? savedExperiencesUnsavedEntriesData.savedExperiencesUnsavedEntries
    : [];

  savedExperiencesUnsavedEntries = immer(
    savedExperiencesUnsavedEntries,
    (proxy: CreateEntry[]) => {
      for (let i = 0, len = proxy.length; i < len; i++) {
        const { clientId, expId, fields, updatedAt, insertedAt } = proxy[i];

        proxy[i] = { clientId, expId, fields, updatedAt, insertedAt };
      }
    }
  );

  // tslint:disable-next-line:no-console
  console.log(
    "\n\t\tLogging start\n\n\n\n savedExperiencesUnsavedEntries\n",
    savedExperiencesUnsavedEntries,
    "\n\n\n\n\t\tLogging ends\n"
  );

  cache.writeData<UploadUnsavedQueryReturned>({
    data: {
      uploadUnsaved: {
        lastUploadedAt: new Date().getTime(),
        inProgress: false,
        __typename: UPLOAD_UNSAVED_TYPE_NAME
      }
    }
  });
}

type UploadUnsavedType = "UploadUnsaved";

interface UploadUnsaved {
  lastUploadedAt: number;
  inProgress: boolean;
  __typename: UploadUnsavedType;
}

interface UploadUnsavedQueryReturned {
  uploadUnsaved: UploadUnsaved;
}
