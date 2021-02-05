import {ApolloCache} from '@apollo/client'
import createUpdater from './utils/createUpdater'

import {EvictOptions} from './types'

function evict<TData>(cache: ApolloCache<TData>, options: EvictOptions) {
  const {gc = true, ...evictOptions} = options

  const evicted = cache.evict(evictOptions)
  if (evicted && gc) {
    cache.gc()
  }
}

export default createUpdater(evict);
