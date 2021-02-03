import {ApolloCache} from '@apollo/client'

import createUpdater from './helpers/createUpdater'
import modifyCachedData from './helpers/modifyCachedData'
import {ModifyQueryOptions} from './types'

function modifyQuery<TData, TQueryData = {}, TQueryVariables = {}>(
  cache: ApolloCache<TData>,
  options: ModifyQueryOptions<TQueryData, TQueryVariables>,
) {
  const {data: modifiers, optimistic = true, ...queryOptions} = options
  const queryData = cache.readQuery(queryOptions, optimistic)
  if (!queryData) return

  cache.writeQuery({
    data: modifyCachedData(queryData, modifiers, cache),
    ...queryOptions,
  })
}

export default createUpdater(modifyQuery)
