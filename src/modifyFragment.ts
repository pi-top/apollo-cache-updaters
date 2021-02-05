import {ApolloCache} from '@apollo/client'

import createUpdater from './utils/createUpdater'
import modifyCachedData from './helpers/modifyCachedData'
import {ModifyFragmentOptions} from './types'

function modifyFragment<
  TData,
  TFragmentData = {},
  TFragmentVariables = {}
>(
  cache: ApolloCache<TData>,
  options: ModifyFragmentOptions<TFragmentData, TFragmentVariables>,
) {
  const {data: modifiers, optimistic = true, ...fragmentOptions} = options
  const fragmentData = cache.readFragment(fragmentOptions, optimistic)
  if (!fragmentData) return

  cache.writeFragment<any, TFragmentVariables>({
    data: modifyCachedData(fragmentData, modifiers, cache),
    ...fragmentOptions,
  })
}

export default createUpdater(modifyFragment)
