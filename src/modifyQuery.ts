import {ApolloCache} from '@apollo/client'

import createData from './helpers/createData'
import createUpdater from './helpers/createUpdater'
import {ModifyQueryOptions} from './types'

function modifyQuery<TData, TQueryData = {}, TQueryVariables = {}>(
  cache: ApolloCache<TData>,
  options: ModifyQueryOptions<TQueryData, TQueryVariables>,
) {
  const {data: modifyData, optimistic = true, ...queryOptions} = options
  const data = createData<any>(modifyData, cache, optimistic)

  cache.writeQuery<TQueryData, TQueryVariables>({
    data,
    ...queryOptions,
  })
}

export default createUpdater(modifyQuery)
