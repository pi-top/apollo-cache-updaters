import {MutationUpdaterFn, ApolloCache} from '@apollo/client'

import {MutationUpdaterOptionsFn} from '../types'

export default function createUpdater<
  TData extends {[key: string]: any},
  Options extends {[key: string]: any}
>(
  method: (cache: ApolloCache<TData>, options: Options) => void,
): (
  createOptions: MutationUpdaterOptionsFn<TData, Options>,
) => MutationUpdaterFn<TData> {
  return (createOptions) => {
    return (cache, result) => {
      const options = createOptions(result, cache)

      if (Array.isArray(options)) {
        return options.map((currentOptions) => method(cache, currentOptions))
      }

      return method(cache, options)
    }
  }
}
