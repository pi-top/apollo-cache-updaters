import {ApolloCache} from '@apollo/client'

import buildFragment from './helpers/buildFragment'
import createData from './helpers/createData'
import createUpdater from './helpers/createUpdater'
import {ModifyFragmentOptions} from './types'

function modifyFragment<TData, TFragmentData, TFragmentVariables>(
  cache: ApolloCache<TData>,
  options: ModifyFragmentOptions<TFragmentData, TFragmentVariables>,
) {
  const {data: modifyData, ...queryOptions} = options
  const data = createData<any>(modifyData, cache)
  const fragment = buildFragment(data)

  return cache.writeFragment<any, TFragmentVariables>({
    id: cache.identify(data),
    fragment,
    data,
    ...queryOptions,
  })
}

export default createUpdater(modifyFragment)
