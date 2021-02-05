import {Cache, ApolloCache} from '@apollo/client'
import createUpdater from './utils/createUpdater'

import {ModifyOptions} from './types'

function modify<TData>(cache: ApolloCache<TData>, options: ModifyOptions) {
  return cache.modify(options as Cache.ModifyOptions)
}

export default createUpdater(modify);
