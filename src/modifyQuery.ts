import {ApolloCache} from '@apollo/client'

import createData from './helpers/createData'
import createUpdater from './helpers/createUpdater'
import {ModifyQueryOptions} from './types'

function modifyQuery<TQueryData = {}, TQueryVariables = {}>(
  cache: ApolloCache<any>,
  options: ModifyQueryOptions<TQueryData, TQueryVariables>,
) {
  const {data: modifyData, ...queryOptions} = options
  const data = createData<any>(modifyData, cache)

  cache.writeQuery<TQueryData, TQueryVariables>({
    data,
    ...queryOptions,
  })
}

export default createUpdater(modifyQuery)
