import {ApolloCache} from '@apollo/client'

import createUpdater from '../utils/createUpdater'
import modifyObject from '../utils/modifyObject'
import {ModifyFragmentOptions} from '../types'

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
    data: modifyObject(fragmentData, modifiers(fragmentData)),
    ...fragmentOptions,
  })
}

export default createUpdater(modifyFragment)
