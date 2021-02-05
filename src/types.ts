import {Cache, ApolloCache, StoreValue, FetchResult} from '@apollo/client'

export type UpdaterOptions = {
  skip?: boolean
}

export type MutationUpdaterOptionsFn<TData, Options extends UpdaterOptions> = (
  result: FetchResult<TData>,
  cache: ApolloCache<TData>,
) => Options | Options[]

export type ModifyField<FieldValue extends StoreValue> = (
  cachedData: FieldValue,
) => FieldValue

export type ModifyData<TData> = {
  [field in keyof TData]: ModifyField<TData[field]> | TData[field]
}

export type EvictOptions = Cache.EvictOptions & {
  gc?: boolean
}

export type ModifyOptions = Cache.ModifyOptions

export type ModifyFragmentOptions<TData, TVariables> = Omit<
  Cache.WriteFragmentOptions<TData, TVariables>,
  'data'
> & {
  data: ModifyData<Partial<TData>>
  optimistic?: boolean
}

export type ModifyQueryOptions<TData, TVariables> = Omit<
  Cache.WriteQueryOptions<TData, TVariables>,
  'data'
> & {
  data: ModifyData<Partial<TData>>
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
