import {Cache, ApolloCache, StoreValue, FetchResult} from '@apollo/client'
import {Modifier} from '@apollo/client/cache/core/types/common'

export type MutationUpdaterOptionsFn<TData, Options> = (
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

export type ModifyOptions = Omit<Cache.ModifyOptions, 'fields'> & {
  fields:
    | {[fieldName: string]: Modifier<any> | undefined}
    | Modifier<any>
}

export type ModifyFragmentOptions<TData, TVariables> = Omit<
  Cache.WriteFragmentOptions<TData, TVariables>,
  'fragment' | 'data'
> & {
  data: ModifyData<any>
  fragment?: Cache.WriteFragmentOptions<TData, TVariables>['fragment']
}

export type ModifyQueryOptions<TData, TVariables> = Omit<
  Cache.WriteQueryOptions<TData, TVariables>,
  'data'
> & {
  data: ModifyData<TData>
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
