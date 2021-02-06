import {ApolloCache} from '@apollo/client'

import createUpdater from '../utils/createUpdater'
import modifyObject from '../utils/modifyObject'
import buildFragment from '../utils/buildFragment'
import {ModifyFragmentOptions} from '../types'

function modifyFragment<TData, TFragmentData = {}, TFragmentVariables = {}>(
  cache: ApolloCache<TData>,
  options: ModifyFragmentOptions<TFragmentData, TFragmentVariables>,
) {
  const {
    data: modifiers,
    id = cache.identify(modifyObject({}, modifiers({} as any))),
    fragment = buildFragment(modifyObject({}, modifiers({} as any))),
    optimistic = true,
    ...fragmentOptions
  } = options

  const fragmentData = cache.readFragment<TFragmentData, TFragmentVariables>(
    {id, fragment, ...fragmentOptions},
    optimistic,
  )
  if (!fragmentData) return

  cache.writeFragment<any, TFragmentVariables>({
    ...fragmentOptions,
    data: modifyObject(fragmentData, modifiers(fragmentData)),
    fragment,
    id,
  })
}

export default createUpdater(modifyFragment)
