import {ApolloCache} from '@apollo/client'

import buildFragment from './helpers/buildFragment'
import createUpdater from './helpers/createUpdater'
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
