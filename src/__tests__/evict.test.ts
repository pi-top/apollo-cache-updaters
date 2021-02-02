import {DataProxy, gql, InMemoryCache} from '@apollo/client'

import evict from '../evict'

describe('evict', () => {
  it('evicts data in cache', () => {
    const cache = new InMemoryCache()
    const fragment = gql`
      fragment EvictTestData on Test {
        __typename
        id
      }
    `
    const data = {
      __typename: 'Test',
      id: 'thingy',
    }

    cache.writeFragment({
      fragment,
      data,
    })

    evict<any>((result) => ({
      id: cache.identify(result.data),
    }))(cache, {data})

    expect(
      cache.readFragment({
        fragment,
        id: cache.identify(data),
      }),
    ).toBeNull()
  })

  it('can specify multiple transactions', () => {
    const cache = new InMemoryCache()
    const fragment = gql`
      fragment EvictMultipleTestData on Test {
        __typename
        id
      }
    `
    const firstThingy = {
      __typename: 'Test',
      id: 'thingy',
    }
    const secondThingy = {
      __typename: 'Test',
      id: 'thingy',
    }

    cache.writeFragment({
      fragment,
      data: firstThingy,
    })
    cache.writeFragment({
      fragment,
      data: secondThingy,
    })

    evict<any>((result) =>
      result.data.things.map((thingy: any) => ({
        id: cache.identify(thingy),
      })),
    )(cache, {
      data: {
        things: [firstThingy, secondThingy],
      },
    })

    expect(
      cache.readFragment({fragment, id: cache.identify(firstThingy)}),
    ).toBeNull()
    expect(
      cache.readFragment({fragment, id: cache.identify(secondThingy)}),
    ).toBeNull()
  })

  it('broadcasts changes', () => {
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

    evict<any>((result) => ({
      id: cache.identify(result.data),
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

    evict<any>((result) => ({
      id: cache.identify(result.data),
      broadcast: false,
    }))(cache, {data})

    expect(diffResult).not.toBeDefined()
  })

  it('collects garbage automatically', () => {
    const cache = new InMemoryCache()
    const fragment = gql`
      fragment EvictTestDataWithResult on Test {
        __typename
        id
        relation {
          __typename
          id
        }
      }
    `

    const nested = {
      __typename: 'Nested',
      id: 'cached-nested-thingy',
    }
    const data = {
      __typename: 'Test',
      id: 'thingy',
      relation: [nested],
    }

    cache.writeFragment({
      fragment,
      data,
    })

    evict<any>((result) => ({
      id: cache.identify(result.data),
    }))(cache, { data })

    expect(
      cache.readFragment({
        id: cache.identify(nested),
        fragment: gql`
          fragment GarbageCollectedNestedData on Nested {
            id
            __typename
          }
        `,
      }),
    ).toEqual(null)
  })

  it('can turn off garbage collection', () => {
    const cache = new InMemoryCache()
    const fragment = gql`
      fragment EvictTestDataWithResult on Test {
        __typename
        id
        relation {
          __typename
          id
        }
      }
    `

    const nested = {
      __typename: 'Nested',
      id: 'cached-nested-thingy',
    }
    const data = {
      __typename: 'Test',
      id: 'thingy',
      relation: [nested],
    }

    cache.writeFragment({
      fragment,
      data,
    })

    evict<any>((result) => ({
      id: cache.identify(result.data),
      gc: false,
    }))(cache, { data })

    expect(
      cache.readFragment({
        id: cache.identify(nested),
        fragment: gql`
          fragment OrphanedNestedData on Nested {
            id
            __typename
          }
        `,
      }),
    ).toEqual(nested)
  })
})
