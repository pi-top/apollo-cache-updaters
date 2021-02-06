import {ApolloCache} from '@apollo/client'

import createUpdater from '../utils/createUpdater'
import modifyObject from '../utils/modifyObject'
import {ModifyQueryOptions} from '../types'

function modifyQuery<
  TData,
  TQueryData = {},
  TQueryVariables = {}
>(
  cache: ApolloCache<TData>,
  options: ModifyQueryOptions<TQueryData, TQueryVariables>,
) {
  const {data: modifiers, optimistic = true, ...queryOptions} = options
  const queryData = cache.readQuery(queryOptions, optimistic)
  if (!queryData) return

  cache.writeQuery({
    data: modifyObject(queryData, modifiers(queryData)),
    ...queryOptions,
  })
}

export default createUpdater(modifyQuery)
