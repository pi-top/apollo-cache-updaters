import {ApolloCache} from '@apollo/client'
import createUpdater from './helpers/createUpdater'

import {WriteQueryOptions} from './types'

function writeQuery<TData, TQueryData = {}, TQueryVariables = {}>(
  cache: ApolloCache<TData>,
  options: WriteQueryOptions<TQueryData, TQueryVariables>,
) {
  return cache.writeQuery(options)
}

export default createUpdater(writeQuery);
