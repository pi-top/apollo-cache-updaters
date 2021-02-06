import {Cache, ApolloCache, FetchResult} from '@apollo/client'

export type MutationUpdaterOptionsFn<TData, Options extends UpdaterOptions> = (
  result: FetchResult<TData>,
  cache: ApolloCache<TData>,
) => Options | Options[]

export type DenormalisedStoreValue =
  | void
  | null
  | undefined
  | number
  | string
  | string[]
  | Object
  | DenormalisedStoreObject
  | DenormalisedStoreObject[]

export type DenormalisedStoreObject = {
  [key: string]: DenormalisedStoreValue
}

export type ModifyData<TData> = {
  [field in keyof TData]: Modifier<TData[field]> | TData[field]
}

export type Modifier<TValue> = (
  cachedData: TValue,
) => TValue | ModifyData<TValue>

export type UpdaterOptions = {
  skip?: boolean;
  [key: string]: any;
}

export type EvictOptions = Cache.EvictOptions & {
  gc?: boolean
}

export type ModifyOptions = Cache.ModifyOptions

export type ModifyFragmentOptions<TData, TVariables> = Omit<
  Cache.WriteFragmentOptions<TData, TVariables>,
  'data' | 'fragment'
> & {
  data: (data: TData) => ModifyData<TData>
  fragment?: Cache.WriteFragmentOptions<TData, TVariables>['fragment']
  optimistic?: boolean
}

export type ModifyQueryOptions<TData, TVariables> = Omit<
  Cache.WriteQueryOptions<TData, TVariables>,
  'data'
> & {
  data: (data: TData) => ModifyData<TData>
  optimistic?: boolean
}

export type WriteFragmentOptions<TData, TVariables> = Omit<
  Cache.WriteFragmentOptions<TData, TVariables>,
  'fragment'
> & {
  fragment?: Cache.WriteFragmentOptions<TData, TVariables>['fragment']
}

export type WriteQueryOptions<TData, TVariables> = Cache.WriteQueryOptions<
  TData,
  TVariables
>
