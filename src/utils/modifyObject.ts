import {Modifier, ModifyData} from '../types'

export function isModifier<TData>(
  arg?: any,
): arg is Modifier<TData[keyof TData]> {
  return typeof arg === 'function'
}

export function isModifyData<TData>(
  arg: ModifyData<TData[keyof TData]> | TData[keyof TData],
): arg is ModifyData<TData[keyof TData]> {
  if (!arg || typeof arg !== 'object') return false
  return Object.values(arg as any).some(
    (val: any) => isModifier(val) || isModifyData<any>(val),
  )
}

export default function modifyObject<TData>(
  cachedData: TData,
  modifiers: ModifyData<TData>,
): TData {
  return Object.keys(cachedData).reduce<TData>((acc, key) => {
    const modifier = modifiers[key as keyof TData] as ModifyData<
      TData[keyof TData]
    >
    const cachedValue = acc[key as keyof TData]
    const value = isModifier<TData>(modifier) ? modifier(cachedValue) : modifier

    if (isModifyData(value)) {
      return {
        ...acc,
        [key]: modifyObject(cachedValue, value),
      }
    }

    return {
      ...acc,
      [key]: typeof value === 'undefined' ? cachedValue : value,
    }
  }, cachedData)
}

/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: GetProjectVersion
// ====================================================

export interface GetProjectVersion_projectVersion_teacherResources {
  __typename: 'GCSFile'
  id: string
  url: string
  name: string | null
  mimeType: string | null
}

export interface GetProjectVersion_projectVersion_project_tags {
  __typename: 'Tag'
  id: string
  name: string
}

export interface GetProjectVersion_projectVersion_project {
  __typename: 'Project'
  id: string
  isChallenge: boolean
  tags: GetProjectVersion_projectVersion_project_tags[]
}

export interface GetProjectVersion_projectVersion_sections {
  __typename: 'Section'
  id: string
  title: string | null
  description: string | null
  createdAt: string
  updatedAt: string
  crossVersionId: string
  number: number
}

export interface GetProjectVersion_projectVersion_coderFiles {
  __typename: 'CoderFile'
  id: string
  code: string | null
  name: string
  crossVersionId: string
  sourceCrossVersionId: string | null
}

export interface GetProjectVersion_projectVersion {
  __typename: 'ProjectVersion'
  id: string
  schemaVersion: number | null
  title: string
  number: number
  thumbnail: string | null
  description: string | null
  standards: ({[key: string]: any} | null)[] | null
  teacherResources: GetProjectVersion_projectVersion_teacherResources[]
  createdAt: string
  updatedAt: string
  project: GetProjectVersion_projectVersion_project | null
  sections: GetProjectVersion_projectVersion_sections[]
  coderFiles: GetProjectVersion_projectVersion_coderFiles[]
}

export interface GetProjectVersion {
  projectVersion: GetProjectVersion_projectVersion | null
}

export interface GetProjectVersionVariables {
  id: string
}

modifyObject<GetProjectVersion>(
  {
    projectVersion: {
      __typename: 'ProjectVersion',
      id: '',
      schemaVersion: 2,
      title: '',
      number: 1,
      thumbnail: '',
      description: '',
      standards: null,
      teacherResources: [],
      sections: [],
      createdAt: '',
      updatedAt: '',
      project: null,
      coderFiles: [],
    },
  },
  {
    projectVersion: (version) =>
      version && {...version, coderFiles: (coderFiles) => coderFiles},
  },
)
