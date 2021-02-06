import {DataProxy, gql, InMemoryCache} from '@apollo/client'

import modifyFragment from '../modifyFragment'

describe('modifyFragment', () => {
  it('throws when there is no typename in data', () => {
    const cache = new InMemoryCache()
    const update = modifyFragment(() => ({
      data: () => ({}),
    }))

    expect(() => update(cache, {})).toThrow(
      'Unable to build a fragment without a typename',
    )
  })

  it('throws when unable to build a fragment', () => {
    const cache = new InMemoryCache()
    const fragment = gql`
      fragment WarnTestData on Test {
        __typename
        id
        relation {
          id
          __typename
        }
      }
    `
    const data = {
      __typename: 'Test',
      id: 'thingy',
      relation: [],
    }

    cache.writeFragment({
      fragment,
      data,
    })

    const update = modifyFragment<typeof data>((result) => ({
      skip: !result.data,
      data: () => ({
        ...result.data!,
        relation: (cachedRelation: {id: string}[]) =>
          cachedRelation.filter((rel) => rel.id === 'id'),
      }),
    }))

    expect(() => update(cache as any, {data})).toThrow()
  })

  it('does not check for typename in data if fragment is passed', () => {
    const cache = new InMemoryCache()
    const update = modifyFragment(() => ({
      id: cache.identify({id: 'thingy', __typename: 'Test'}),
      data: () => ({}),
      fragment: gql`
        fragment NoTypenameFragment on Test {
          __typename
          id
        }
      `,
    }))

    expect(() => update(cache, {})).not.toThrow()
  })

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

    modifyFragment<typeof data, typeof data>((result, c) => ({
      id: c.identify(result.data || {}),
      fragment,
      data: (cached) => ({
        ...cached,
        firstName: (firstName) => `${firstName} modified`,
      }),
    }))(cache as any, {data})

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

    modifyFragment<typeof data, typeof data>((result, c) => ({
      id: c.identify(result.data || {}),
      fragment,
      data: (cached) => ({
        ...cached,
        firstName: (cachedFirstName) => `${cachedFirstName || ''} modified`,
      }),
    }))(cache as any, {data})

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

  it('can modify existing cached values without passing fragment', () => {
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

    modifyFragment<typeof data, typeof data>((result, c) => ({
      skip: !result.data,
      data: () => ({
        ...result.data!,
        firstName: (cachedFirstName) => `${cachedFirstName} modified`,
      }),
    }))(cache as any, {data})

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

    modifyFragment<typeof nested, typeof data>((result, c) => ({
      id: c.identify(data),
      fragment,
      data: (cached) => ({
        ...cached,
        relation: (cachedRelation) =>
          result.data ? [...cachedRelation, result.data] : cachedRelation,
      }),
    }))(cache as any, {data: newNested})

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
      relation: nested,
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

    modifyFragment<typeof nested, typeof data>((_, c) => ({
      id: c.identify(data),
      fragment,
      data: (cached) => ({
        ...cached,
        relation: (cachedRelation: typeof nested) => ({
          ...cachedRelation,
          counter: (counter) => counter + 1,
        }),
      }),
    }))(cache as any, {data: newNested})

    expect(
      cache.readFragment({
        id: cache.identify(data),
        fragment,
      }),
    ).toEqual({
      ...data,
      relation: {
        ...nested,
        counter: 2,
      },
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

    const data = {
      things: [thingOneData, thingTwoData],
    }

    cache.writeFragment({
      fragment,
      data: thingOneData,
    })
    cache.writeFragment({
      fragment,
      data: thingTwoData,
    })

    modifyFragment<typeof data, typeof thingOneData>((result, c) =>
      (result.data?.things || []).map((thing: any) => ({
        id: c.identify(thing),
        fragment,
        data: (cached) => ({
          ...cached,
          firstName: (firstName) => `${firstName} modified`,
        }),
      })),
    )(cache as any, {
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
      extra: 'field',
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
        extra
      }
    `

    cache.writeFragment({
      fragment,
      fragmentName,
      data: {
        __typename: 'Test',
        id: 'thingy',
        firstName: 'Initial firstName',
        extra: 'field',
      },
    })

    modifyFragment<typeof data, typeof data, any>((result, c) => ({
      id: c.identify(result.data || {}),
      data: (cached) => ({
        ...cached,
        ...result.data,
      }),
      fragment,
      fragmentName,
    }))(cache as any, {data})

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

    modifyFragment<typeof data, typeof data>((result, c) => ({
      id: c.identify(result.data || {}),
      fragment: gql`
        fragment BroadcastFrag on Test {
          __typename
          id
          firstName
        }
      `,
      data: (cached) => ({
        ...cached,
        firstName: (firstName) => `${firstName} modified`,
      }),
    }))(cache as any, {data})

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

    modifyFragment<typeof data, typeof data.test, any>((result, c) => ({
      id: c.identify(result.data?.test || {}),
      fragment: gql`
        fragment PreventBroadcastFrag on Test {
          __typename
          id
          firstName
        }
      `,
      data: (cached) => ({
        ...cached,
        ...result.data?.test,
        firstName: (firstName) => `${firstName} modified`,
      }),
      broadcast: false,
    }))(cache as any, {data})

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

    modifyFragment<typeof data, typeof data>((result) => ({
      fragment,
      data: (cached) => ({
        ...cached,
        ...result.data,
      }),
      skip: result.data?.skip,
    }))(cache as any, {data})

    expect(
      cache.readFragment({
        id: cache.identify(data),
        fragment,
      }),
    ).toEqual(data)
  })

  it('uses optimistic cache by default', () => {
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

    modifyFragment<typeof data, typeof data>((result) => ({
      id: cache.identify(data),
      fragment,
      data: (cached) => ({
        ...cached,
        ...result.data,
        firstName: (cachedFirstName) => `${cachedFirstName} modified`,
      }),
    }))(cache as any, {data})

    expect(cache.readFragment({fragment, id: cache.identify(data)})).toEqual({
      ...data,
      firstName: 'Original firstName modified',
    })
  })

  it('can use normal cache', () => {
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

    modifyFragment<typeof data, typeof data>((result, c) => ({
      id: c.identify(result.data || {}),
      fragment,
      optimistic: false,
      data: (cached) => ({
        ...cached,
        firstName: (cachedFirstName) => `${cachedFirstName} modified`,
      }),
    }))(cache as any, {data})

    expect(cache.readFragment({fragment, id: cache.identify(data)})).toBeNull()
  })
})
