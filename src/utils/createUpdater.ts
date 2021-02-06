import {MutationUpdaterFn, ApolloCache} from '@apollo/client'

import {MutationUpdaterOptionsFn, UpdaterOptions} from '../types'

export default function createUpdater<
  TData extends {[key: string]: any},
  Options extends UpdaterOptions
>(
  method: (cache: ApolloCache<TData>, options: Options) => void,
): (
  createOptions: MutationUpdaterOptionsFn<TData, Options>,
) => MutationUpdaterFn<TData> {
  return (createOptions) => {
    return (cache, result) => {
      const options = createOptions(result, cache)

      if (Array.isArray(options)) {
        return options.forEach(
          (currentOptions) =>
            currentOptions.skip || method(cache, currentOptions),
        )
      }

      return options.skip || method(cache, options)
    }
  }
}
