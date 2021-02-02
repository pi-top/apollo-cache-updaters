import {ApolloCache} from '@apollo/client'

import buildFragment from './helpers/buildFragment'
import createUpdater from './helpers/createUpdater'
import {WriteFragmentOptions} from './types'

function writeFragment<TData, TFragmentData = {}, TFragmentVariables = {}>(
  cache: ApolloCache<TData>,
  options: WriteFragmentOptions<TFragmentData, TFragmentVariables>,
) {
  const {data} = options
  return cache.writeFragment({
    fragment: buildFragment(data),
    ...options,
  })
}

export default createUpdater(writeFragment)
