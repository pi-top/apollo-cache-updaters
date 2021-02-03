import {DataProxy, gql, InMemoryCache} from '@apollo/client'

import modifyFragment from '../modifyFragment'

describe('modifyFragment', () => {
  it('does nothing if fragment is not cached', () => {
    const cache = new InMemoryCache()
    const fragment = gql`
      fragment UncachedFrag on Test {
        id
        __typename
        firstName
      }
    `

    const data = {
      __typename: 'Test',
      id: 'thingy',
      firstName: 'Original firstName',
    }

    modifyFragment<any>((result, c) => ({
      id: c.identify(result.data),
      fragment,
      data: {
        firstName: (firstName: string) => `${firstName} modified`,
      },
    }))(cache, {data})

    expect(cache.readFragment({fragment, id: cache.identify(data)})).toBeNull()
  })

  it('can modify existing cached values', () => {
    const cache = new InMemoryCache()
    const fragment = gql`
      fragment ModifiedTestData on Test {
        __typename
        id
        firstName
      }
    `
    const data = {
      __typename: 'Test',
      id: 'thingy',
      firstName: 'Original firstName',
    }

    cache.writeFragment({
      fragment,
      data,
    })

    modifyFragment<any, any, any>((result, c) => ({
      id: c.identify(result.data),
      fragment,
      data: {
        firstName: (cachedFirstName?: string) =>
          `${cachedFirstName || ''} modified`,
      },
    }))(cache, {data})

    expect(
      cache.readFragment({
        id: cache.identify(data),
        fragment,
      }),
    ).toEqual({
      ...data,
      firstName: 'Original firstName modified',
    })
  })

  it('can modify cached relations', () => {
    const cache = new InMemoryCache()
    const nested = {
      __typename: 'Nested',
      id: 'nested-thingy',
    }
    const fragment = gql`
      fragment ModifiedRelationTestData on Test {
        __typename
        id
        relation {
          __typename
          id
        }
      }
    `
    const data = {
      __typename: 'Test',
      id: 'thingy',
      relation: [nested],
    }

    cache.writeFragment({
      fragment,
      data,
    })

    const newNested = {
      __typename: 'Nested',
      id: 'new-nested-thingy',
    }

    modifyFragment<any, any, any>((result, c) => ({
      id: c.identify(data),
      fragment,
      data: {
        ...data,
        relation: (cachedRelation: typeof nested[] = []) => [
          ...cachedRelation,
          result.data,
        ],
      },
    }))(cache, {data: newNested})

    expect(
      cache.readFragment({
        id: cache.identify(data),
        fragment,
      }),
    ).toEqual({
      ...data,
      relation: [nested, newNested],
    })
  })

  it('can evaluate nested modifiers', () => {
    const cache = new InMemoryCache()
    const nested = {
      __typename: 'Nested',
      id: 'nested-thingy',
      counter: 1,
    }
    const fragment = gql`
      fragment NestedModifierTestData on Test {
        __typename
        id
        relation {
          __typename
          id
          counter
        }
      }
    `
    const data = {
      __typename: 'Test',
      id: 'thingy',
      relation: [nested],
    }

    cache.writeFragment({
      fragment,
      data,
    })

    const newNested = {
      __typename: 'Nested',
      id: 'new-nested-thingy',
      counter: 0,
    }

    modifyFragment<any, any, any>((result, c) => ({
      id: c.identify(data),
      fragment,
      data: {
        relation: (cachedRelation: typeof nested[]) =>
          [...cachedRelation, result.data].map((n) => ({
            ...n,
            counter: (counter = 0) => counter + 1,
          })),
      },
    }))(cache, {data: newNested})

    expect(
      cache.readFragment({
        id: cache.identify(data),
        fragment,
      }),
    ).toEqual({
      ...data,
      relation: [
        {
          ...nested,
          counter: 2,
        },
        {...newNested, counter: 1},
      ],
    })
  })

  it('can specify multiple transactions', () => {
    const cache = new InMemoryCache()
    const fragment = gql`
      fragment MultipleTransactions on Test {
        __typename
        id
        firstName
      }
    `
    const thingOneData = {
      __typename: 'Test',
      id: 'thingy-one',
      firstName: 'One',
    }
    const thingTwoData = {
      __typename: 'Test',
      id: 'thingy-two',
      firstName: 'Two',
    }

    cache.writeFragment({
      fragment,
      data: thingOneData,
    })
    cache.writeFragment({
      fragment,
      data: thingTwoData,
    })

    modifyFragment<any>((result, c) =>
      result.data.things.map((thing: any) => ({
        id: c.identify(thing),
        fragment,
        data: {
          firstName: (firstName: string) => `${firstName} modified`,
        },
      })),
    )(cache, {
      data: {
        things: [thingOneData, thingTwoData],
      },
    })

    expect(
      cache.readFragment({
        id: cache.identify(thingOneData),
        fragment,
      }),
    ).toEqual({
      ...thingOneData,
      firstName: 'One modified',
    })

    expect(
      cache.readFragment({
        id: cache.identify(thingTwoData),
        fragment,
      }),
    ).toEqual({
      ...thingTwoData,
      firstName: 'Two modified',
    })
  })

  it('can use fragmentName to choose between fragments definitions', () => {
    const cache = new InMemoryCache()
    const data = {
      __typename: 'Test',
      id: 'thingy',
      firstName: 'New firstName',
    }
    const fragmentName = 'TestDataWithOwnFrag'
    const fragment = gql`
      fragment TestFields on Test {
        __typename
        id
        firstName
      }

      fragment ${fragmentName} on Test {
        ...TestFields
      }
    `

    cache.writeFragment({
      fragment,
      fragmentName,
      data: {
        __typename: 'Test',
        id: 'thingy',
        firstName: 'Initial firstName',
      },
    })

    modifyFragment<any, any, any>((result) => ({
      data: result.data,
      fragment,
      fragmentName,
    }))(cache, {data})

    expect(
      cache.readFragment({
        id: cache.identify(data),
        fragment,
        fragmentName,
      }),
    ).toEqual(data)
  })

  it('broadcasts changes', () => {
    const cache = new InMemoryCache()
    const query = gql`
      query GetTest {
        test {
          __typename
          id
          firstName
        }
      }
    `
    const data = {
      __typename: 'Test',
      id: 'thingy',
      firstName: 'Thing',
    }

    cache.writeQuery({
      query,
      data: {
        test: data,
      },
    })

    let diffResult: DataProxy.DiffResult<any> | undefined
    cache.watch({
      query,
      callback: (newDiffResult) => {
        diffResult = newDiffResult
      },
      optimistic: false,
    })

    modifyFragment<any, any, any>((result, c) => ({
      id: c.identify(result.data),
      fragment: gql`
        fragment BroadcastFrag on Test {
          __typename
          id
          firstName
        }
      `,
      data: {
        firstName: (firstName: string) => `${firstName} modified`,
      },
    }))(cache, {data})

    expect(diffResult).toBeDefined()
  })

  it('can prevent broadcasting changes', () => {
    const cache = new InMemoryCache()
    const query = gql`
      query GetTest {
        test {
          __typename
          id
          firstName
        }
      }
    `
    const data = {
      test: {
        __typename: 'Test',
        id: 'thingy',
        firstName: 'Thing',
      },
    }

    cache.writeQuery({
      query,
      data,
    })

    let diffResult: DataProxy.DiffResult<any> | undefined
    cache.watch({
      query,
      callback: (newDiffResult) => {
        diffResult = newDiffResult
      },
      optimistic: false,
    })

    modifyFragment<any, any, any>((result) => ({
      fragment: gql`
        fragment PreventBroadcastFrag on Test {
          __typename
          id
          firstName
        }
      `,
      data: {
        ...result.data.test,
        firstName: (firstName: string) => `${firstName} modified`,
      },
      broadcast: false,
    }))(cache, {data})

    expect(diffResult).not.toBeDefined()
  })

  it('can skip', () => {
    const cache = new InMemoryCache()
    const fragment = gql`
      fragment SkipTestData on Test {
        __typename
        id
        skip
      }
    `
    const data = {
      __typename: 'Test',
      id: 'thingy',
      skip: true,
    }

    cache.writeFragment({
      fragment,
      data,
    })

    modifyFragment<any>((result) => ({
      fragment,
      data: {
        ...result.data,
        skip: false,
      },
      skip: result.data.skip,
    }))(cache, {data})

    expect(
      cache.readFragment({
        id: cache.identify(data),
        fragment,
      }),
    ).toEqual(data)
  })

  it('uses optimistic cache for modifiers by default', () => {
    const cache = new InMemoryCache()
    const fragment = gql`
      fragment OptimisticTestData on Test {
        __typename
        id
        firstName
      }
    `
    const data = {
      __typename: 'Test',
      id: 'thingy',
      firstName: 'Original firstName',
    }

    cache.recordOptimisticTransaction(
      (c) =>
        c.writeFragment({
          fragment,
          data,
        }),
      'optimistic-query-id',
    )

    modifyFragment<any>((result) => ({
      id: cache.identify(data),
      fragment,
      data: {
        ...result.data,
        firstName: (cachedFirstName?: string) =>
          `${cachedFirstName || ''} modified`,
      },
    }))(cache, {data})

    expect(cache.readFragment({fragment, id: cache.identify(data)})).toEqual({
      ...data,
      firstName: 'Original firstName modified',
    })
  })

  it('can use normal cache for modifiers', () => {
    const cache = new InMemoryCache()
    const fragment = gql`
      fragment OptimisticTestData on Test {
        __typename
        id
        firstName
      }
    `
    const data = {
      __typename: 'Test',
      id: 'thingy',
      firstName: 'Original firstName',
    }

    cache.recordOptimisticTransaction(
      (c) =>
        c.writeFragment({
          fragment,
          data,
        }),
      'optimistic-query-id',
    )

    modifyFragment<any>((result) => ({
      fragment,
      optimistic: false,
      data: {
        ...result.data,
        firstName: (cachedFirstName?: string) =>
          `${cachedFirstName || ''} modified`,
      },
    }))(cache, {data})

    expect(cache.readFragment({fragment, id: cache.identify(data)})).toEqual({
      ...data,
      firstName: ' modified',
    })
  })
})
