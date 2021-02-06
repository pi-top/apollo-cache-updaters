import {DataProxy, gql, InMemoryCache} from '@apollo/client'

import modifyQuery from '../modifyQuery'

describe('modifyQuery', () => {
  it('does nothing if query is not cached', () => {
    const cache = new InMemoryCache()
    const query = gql`
      query GetTest {
        test {
          __typename
          id
        }
      }
    `
    const data = {
      test: {
        __typename: 'Test',
        id: 'thingy',
      },
    }

    modifyQuery<typeof data, typeof data>((result) => ({
      query,
      data: (cached) => ({
        ...cached,
        ...result.data,
      }),
    }))(cache as any, {data})

    expect(cache.readQuery({query})).toBeNull()
  })

  it('does nothing if query with matching variables is not cached', () => {
    const cache = new InMemoryCache()
    const query = gql`
      query GetTest($id: String) {
        test(id: $id) {
          __typename
          id
        }
      }
    `
    const data = {
      test: {
        __typename: 'Test',
        id: 'thingy',
      },
    }

    cache.writeQuery({query, data})

    modifyQuery<typeof data, typeof data>((result) => ({
      query,
      data: (cached) => ({
        ...cached,
        ...result.data,
      }),
      variables: {id: data.test.id},
    }))(cache as any, {data})

    expect(
      cache.readQuery({
        query,
        variables: {id: data.test.id},
      }),
    ).toBeNull()
  })

  it('can modify existing query', () => {
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
        firstName: 'Original firstName',
      },
    }

    cache.writeQuery({
      query,
      data,
    })

    modifyQuery<typeof data, typeof data>(() => ({
      query,
      data: () => ({
        test: (test) => ({
          ...test,
          firstName: (firstName) => `${firstName} modified`,
        }),
      }),
    }))(cache as any, {data})

    expect(cache.readQuery({query, returnPartialData: true})).toEqual({
      test: {
        ...data.test,
        firstName: 'Original firstName modified',
      },
    })
  })

  it('can modify existing query with variables', () => {
    const cache = new InMemoryCache()
    const query = gql`
      query GetTest($id: String) {
        test(id: $id) {
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
        firstName: 'Original firstName',
      },
    }
    const variables = {id: data.test.id}

    cache.writeQuery({
      query,
      data,
      variables,
    })

    modifyQuery<typeof data, typeof data>((result) => ({
      query,
      data: () => ({
        test: (test) => ({
          ...test,
          firstName: (firstName) => `${firstName} modified`,
        }),
      }),
      variables: {id: result?.data?.test.id},
    }))(cache as any, {data})

    expect(cache.readQuery({query, variables})).toEqual({
      test: {
        ...data.test,
        firstName: 'Original firstName modified',
      },
    })
  })

  it('can modify cached relations', () => {
    const cache = new InMemoryCache()
    const query = gql`
      query GetTest {
        test {
          __typename
          id
          relation {
            __typename
            id
          }
        }
      }
    `
    const nested = {
      __typename: 'Nested',
      id: 'nested-thingy',
    }

    const data = {
      test: {
        __typename: 'Test',
        id: 'thingy',
        relation: [nested],
      },
    }

    cache.writeQuery({
      query,
      data,
    })

    const newNested = {
      __typename: 'Nested',
      id: 'new-nested-thingy',
    }

    modifyQuery<typeof nested, typeof data>((result) => ({
      query,
      data: () => ({
        test: (test) => ({
          ...test,
          relation: (cachedRelation) =>
            result.data ? [...cachedRelation, result.data] : cachedRelation,
        }),
      }),
    }))(cache as any, {data: newNested})

    expect(cache.readQuery({query})).toEqual({
      test: {
        ...data.test,
        relation: [nested, newNested],
      },
    })
  })

  it('can evaluate nested modifiers', () => {
    const cache = new InMemoryCache()
    const query = gql`
      query GetTest {
        test {
          __typename
          id
          relation {
            __typename
            id
            counter
            activeUser
          }
        }
      }
    `
    const nested = {
      __typename: 'Nested',
      id: 'nested-thingy',
      activeUser: 'Liv',
      counter: 1,
    }
    const data = {
      test: {
        __typename: 'Test',
        id: 'thingy',
        relation: nested,
      },
    }

    cache.writeQuery({
      query,
      data,
    })

    const newNested = {
      __typename: 'Nested',
      id: 'nested-thingy',
      activeUser: 'Angus',
    }

    modifyQuery<typeof newNested, typeof data>((result) => ({
      query,
      data: () => ({
        test: (test) => ({
          ...test,
          relation: (relation) => ({
            ...relation,
            ...result.data,
            counter: (counter) => counter + 1,
          }),
        }),
      }),
    }))(cache as any, {data: newNested})

    expect(cache.readQuery({query})).toEqual({
      test: {
        ...data.test,
        relation: {
          ...nested,
          ...newNested,
          counter: 2,
        },
      },
    })
  })

  it('can modify multiple queries', () => {
    const cache = new InMemoryCache()
    const query = gql`
      query GetTest($id: String) {
        test(id: $id) {
          __typename
          id
          firstName
          lastName
        }
      }
    `
    const thingOneData = {
      __typename: 'Test',
      id: 'thingy-one',
      firstName: 'Thing',
      lastName: 'One',
    }
    const thingTwoData = {
      __typename: 'Test',
      id: 'thingy-two',
      firstName: 'Thing',
      lastName: 'Two',
    }

    cache.writeQuery({
      query,
      data: {test: thingOneData},
      variables: {id: thingOneData.id},
    })
    cache.writeQuery({
      query,
      data: {test: thingTwoData},
      variables: {id: thingTwoData.id},
    })

    const data = {
      things: [thingOneData, thingTwoData],
    }

    modifyQuery<typeof data, {test: typeof thingOneData}>((result) =>
      (result?.data?.things || []).map((thingy: any) => ({
        query,
        data: () => ({
          test: (test) => ({
            ...test,
            lastName: (lastName: string) => `${lastName} modified`,
          }),
        }),
        variables: {id: thingy.id},
      })),
    )(cache as any, {data})

    expect(cache.readQuery({query, variables: {id: thingOneData.id}})).toEqual({
      test: {
        ...thingOneData,
        lastName: 'One modified',
      },
    })
    expect(cache.readQuery({query, variables: {id: thingTwoData.id}})).toEqual({
      test: {
        ...thingTwoData,
        lastName: 'Two modified',
      },
    })
  })

  it('can pass custom id', () => {
    const cache = new InMemoryCache()
    const query = gql`
      query GetTest($id: String) {
        test(id: $id) {
          __typename
          firstName
        }
      }
    `
    const data = {
      test: {
        __typename: 'Test',
        firstName: 'Test',
      },
    }

    const reference = cache.writeQuery({
      query,
      data: {
        test: {
          ...data.test,
          firstName: 'Initial firstName',
        },
      },
    })

    modifyQuery<typeof data, typeof data>((result, c) => ({
      id: c.identify(reference!),
      query,
      data: (cached) => ({
        ...cached,
        ...result.data,
      }),
    }))(cache as any, {data})

    expect(cache.readQuery({query})).toEqual(data)
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
      firstName: 'Original firstName',
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

    modifyQuery<any, {test: typeof data}>(() => ({
      query,
      data: () => ({
        test: (test) => ({
          ...test,
          firstName: (firstName: string) => `${firstName} modified`,
        }),
      }),
    }))(cache as any, {})

    expect(diffResult).toBeDefined()
  })

  it('can prevent broadcasting changes', () => {
    const cache = new InMemoryCache()
    const query = gql`
      query GetTest {
        test {
          __typename
          id
        }
      }
    `
    const data = {
      __typename: 'Test',
      id: 'thingy',
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

    modifyQuery<any, {test: typeof data}>((result) => ({
      query,
      data: result.data,
      broadcast: false,
    }))(cache, {data: {test: data}})

    expect(diffResult).not.toBeDefined()
  })

  it('can skip', () => {
    const cache = new InMemoryCache()
    const query = gql`
      query GetTest {
        test {
          __typename
          id
          skip
        }
      }
    `
    const data = {
      test: {
        __typename: 'Test',
        id: 'thingy',
        skip: true,
      },
    }

    modifyQuery<typeof data, typeof data>((result) => ({
      query,
      data: (cached) => ({
        ...cached,
        ...result.data,
      }),
      skip: result.data?.test.skip,
    }))(cache as any, {data})

    expect(cache.readQuery({query})).toBeNull()
  })

  it('uses optimistic cache by default', () => {
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
        firstName: 'Original firstName',
      },
    }

    cache.recordOptimisticTransaction(
      (c) =>
        c.writeQuery({
          query,
          data,
        }),
      'optimistic-query-id',
    )

    modifyQuery<any, typeof data>((result) => ({
      query,
      data: () => ({
        test: () => ({
          ...result.data.test,
          firstName: (cachedFirstName?: string) =>
            `${cachedFirstName || ''} modified`,
        }),
      }),
    }))(cache, {data})

    expect(cache.readQuery({query})).toEqual({
      test: {
        ...data.test,
        firstName: 'Original firstName modified',
      },
    })
  })

  it('can use normal cache', () => {
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
        firstName: 'Original firstName',
      },
    }

    cache.recordOptimisticTransaction(
      (c) =>
        c.writeQuery({
          query,
          data,
        }),
      'optimistic-query-id',
    )

    modifyQuery<any, typeof data>(() => ({
      optimistic: false,
      query,
      data: () => ({
        test: (cached) => ({
          ...cached,
          firstName: (cachedFirstName?: string) =>
            `${cachedFirstName || ''} modified`,
        }),
      }),
    }))(cache, {})

    expect(cache.readQuery({query})).toBeNull()
  })
})
