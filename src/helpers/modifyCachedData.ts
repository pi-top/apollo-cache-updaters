import {ApolloCache} from '@apollo/client'
import {ModifyData} from '../types'

function modifyCachedData<TData extends {[key: string]: any}>(
  cachedData: TData,
  modifiers: ModifyData<Partial<TData>>,
  cache: ApolloCache<any>,
): TData {
  return Object.keys({
    ...cachedData,
    ...modifiers,
  }).reduce<TData>((acc, key) => {
    const modifier = modifiers[key as keyof TData]
    const existingValue = acc[key]
    const value =
      typeof modifier === 'function' ? modifier(existingValue) : modifier

    if (value && Array.isArray(value)) {
      return {
        ...acc,
        [key]: value.map((item) => {
          if (!item || typeof item !== 'object') {
            return item
          }

          /*
            the current item could be a set of modifiers, find the corresponding
            cached item in the existingValue data.
          */
          const cachedDataSlice = existingValue.find(
            (cachedItem: any) =>
              cache.identify(cachedItem) === cache.identify(item),
          )

          return modifyCachedData(cachedDataSlice || {}, item, cache)
        }),
      }
    }

    if (value && typeof value === 'object') {
      return {
        ...acc,
        [key]: modifyCachedData(existingValue, value, cache),
      }
    }

    return {
      ...acc,
      [key]: value || existingValue,
    }
  }, cachedData)
}

export default modifyCachedData
