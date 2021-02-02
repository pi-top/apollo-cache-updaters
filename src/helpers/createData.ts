import {ApolloCache} from '@apollo/client'
import {ModifyData} from '../types'

function createData<TData>(
  modifyData: ModifyData<any>,
  cache: ApolloCache<any>,
  optimistic?: boolean,
): TData {
  const cachedData = cache.extract(optimistic)

  return Object.keys(modifyData).reduce((data, key) => {
    let value = modifyData[key]
    const id = cache.identify(modifyData)

    if (typeof value === 'function') {
      const existingValue = id && cachedData[id] && cachedData[id][key]

      if (Array.isArray(existingValue)) {
        value = value(
          existingValue.map(
            (v) => cachedData[cache.identify(v || {}) || ''] || v,
          ),
        )
      } else {
        value = value(
          cachedData[cache.identify(existingValue || {}) || ''] ||
            existingValue,
        )
      }
    }

    if (Array.isArray(value)) {
      return {
        ...data,
        [key]: value.map((v) => {
          if (v && typeof v === 'object') {
            return createData(v, cache, optimistic)
          }
          return v
        }),
      }
    }

    if (value && typeof value === 'object') {
      return {
        ...data,
        [key]: createData(value, cache, optimistic),
      }
    }

    return {
      ...data,
      [key]: value,
    }
  }, {} as TData)
}

export default createData
