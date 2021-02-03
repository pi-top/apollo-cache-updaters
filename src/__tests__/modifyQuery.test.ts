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

    modifyQuery<any>((result) => ({
      query,
      data: result.data,
    }))(cache, {data})

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

    modifyQuery<any>((result) => ({
      query,
      data: result.data,
      variables: {id: data.test.id},
    }))(cache, {data})

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

    modifyQuery<any>(() => ({
      query,
      data: {
        test: {
          firstName: (cachedFirstName?: string) =>
            `${cachedFirstName || ''} modified`,
        },
      },
    }))(cache, {})

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

    modifyQuery<any>((result) => ({
      query,
      data: {
        test: {
          firstName: (cachedFirstName?: string) =>
            `${cachedFirstName || ''} modified`,
        },
      },
      variables: {id: result.data.test.id},
    }))(cache, {data})

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

    modifyQuery((result) => ({
      query,
      data: {
        test: {
          relation: (cachedRelation: typeof nested[] = []) => [
            ...cachedRelation,
            result.data,
          ],
        },
      },
    }))(cache, {data: newNested})

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
            id
            __typename
            counter
          }
        }
      }
    `
    const nested = {
      __typename: 'Nested',
      id: 'nested-thingy',
      counter: 1,
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
      counter: 0,
    }

    modifyQuery<any>((result) => ({
      query,
      data: {
        test: {
          ...data.test,
          relation: (cachedRelation: typeof nested[] = []) =>
            [...cachedRelation, result.data].map((n) => ({
              ...n,
              counter: (counter = 0) => counter + 1,
            })),
        },
      },
    }))(cache, {data: newNested})

    expect(cache.readQuery({query})).toEqual({
      test: {
        ...data.test,
        relation: [
          {
            ...nested,
            counter: 2,
          },
          {...newNested, counter: 1},
        ],
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

    modifyQuery<any>((result) =>
      (result?.data?.things || []).map((thingy: any) => ({
        query,
        data: {
          test: {
            lastName: (lastName: string) => `${lastName} modified`,
          },
        },
        variables: {id: thingy.id},
      })),
    )(cache, {
      data: {
        things: [thingOneData, thingTwoData],
      },
    })

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

    modifyQuery<any>((result, c) => ({
      id: c.identify(reference!),
      query,
      data: result.data,
    }))(cache, {data})

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

    modifyQuery<any>(() => ({
      query,
      data: {
        test: {
          firstName: (firstName: string) => `${firstName} modified`,
        },
      },
    }))(cache, {})

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

    modifyQuery<any>((result) => ({
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

    modifyQuery<any>((result) => ({
      query,
      data: result.data,
      skip: result.data.test.skip,
    }))(cache, {data})

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

    modifyQuery<any>((result) => ({
      query,
      data: {
        test: {
          ...result.data.test,
          firstName: (cachedFirstName?: string) =>
            `${cachedFirstName || ''} modified`,
        },
      },
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

    modifyQuery<any>(() => ({
      optimistic: false,
      query,
      data: {
        test: {
          firstName: (cachedFirstName?: string) =>
            `${cachedFirstName || ''} modified`,
        },
      },
    }))(cache, {})

    expect(cache.readQuery({query})).toBeNull()
  })
})
