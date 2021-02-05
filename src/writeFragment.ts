import {ApolloCache} from '@apollo/client'

import buildFragment from './utils/buildFragment'
import createUpdater from './utils/createUpdater'
import {WriteFragmentOptions} from './types'

function writeFragment<TData, TFragmentData = {}, TFragmentVariables = {}>(
  cache: ApolloCache<TData>,
  options: WriteFragmentOptions<TFragmentData, TFragmentVariables>,
) {
  return cache.writeFragment({
    ...options,
    fragment: options.fragment || buildFragment(options.data),
  })
}

export default createUpdater(writeFragment)
