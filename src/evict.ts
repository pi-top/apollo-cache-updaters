import {ApolloCache} from '@apollo/client'
import createUpdater from './helpers/createUpdater'

import {EvictOptions} from './types'

function evict<TData>(cache: ApolloCache<TData>, options: EvictOptions) {
  const {skipGarbageCollection, ...evictOptions} = options

  const evicted = cache.evict(evictOptions)
  if (evicted && !skipGarbageCollection) {
    cache.gc()
  }
}

export default createUpdater(evict);
