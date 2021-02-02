import {MutationUpdaterFn} from '@apollo/client'

export default <T extends {[key: string]: any}>(
  ...updates: MutationUpdaterFn<T>[]
): MutationUpdaterFn<T> => (...args: Parameters<MutationUpdaterFn<T>>) =>
  updates.forEach((update) => update(...args))
