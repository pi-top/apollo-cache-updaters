import {DataProxy, gql, InMemoryCache} from '@apollo/client'

import writeFragment from '../writeFragment'

describe('writeFragment', () => {
  it('throws when there is no typename in data', () => {
    const cache = new InMemoryCache()
    const update = writeFragment(() => ({
      data: {},
    }))

    expect(() => update(cache, {})).toThrow(
      'Unable to build a fragment without a typename',
    )
  })

  it('writes data to the cache', () => {
    const cache = new InMemoryCache()
    const data = {
      __typename: 'Test',
      id: 'thingy',
    }

    writeFragment<any, any, any>((result) => ({
      data: result.data,
    }))(cache, {data})

    expect(
      cache.readFragment({
        id: cache.identify(data),
        fragment: gql`
          fragment TestData on Test {
            __typename
            id
          }
        `,
      }),
    ).toEqual(data)
  })

  it('can specify multiple transactions', () => {
    const cache = new InMemoryCache()
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

    writeFragment<any, any, any>((result) =>
      result.data.things.map((thing: any) => ({data: thing})),
    )(cache, {
      data: {
        things: [thingOneData, thingTwoData],
      },
    })

    expect(
      cache.readFragment({
        id: cache.identify(thingOneData),
        fragment: gql`
          fragment ThingOneTestData on Test {
            __typename
            id
            firstName
            lastName
          }
        `,
      }),
    ).toEqual(thingOneData)

    expect(
      cache.readFragment({
        id: cache.identify(thingTwoData),
        fragment: gql`
          fragment ThingTwoTestData on Test {
            __typename
            id
            firstName
            lastName
          }
        `,
      }),
    ).toEqual(thingTwoData)
  })

  it('normalises nested data', () => {
    const cache = new InMemoryCache()
    const nested = {
      __typename: 'Nested',
      id: 'nested thingy',
    }
    const data = {
      __typename: 'Test',
      id: 'thingy',
      relation: nested,
    }

    writeFragment<any, any, any>((result) => ({
      data: result.data,
    }))(cache, {data})

    expect(
      cache.readFragment({
        id: cache.identify(nested),
        fragment: gql`
          fragment NestedTestData on Nested {
            __typename
            id
          }
        `,
      }),
    ).toEqual(nested)
  })

  it('relates nested data correctly', () => {
    const cache = new InMemoryCache()
    const nested = {
      __typename: 'Nested',
      id: 'nested thingy',
    }
    const data = {
      __typename: 'Test',
      id: 'thingy',
      relation: nested,
    }

    writeFragment<any, any, any>((result) => ({
      data: result.data,
    }))(cache, {data})

    expect(
      cache.readFragment({
        id: cache.identify(data),
        fragment: gql`
          fragment TestDataWithRelation on Test {
            __typename
            id
            relation {
              __typename
              id
            }
          }
        `,
      }),
    ).toEqual(data)
  })

  it('merges data with existing normalised cache object', () => {
    const cache = new InMemoryCache()
    const data = {
      __typename: 'Test',
      id: 'thingy',
      lastName: 'Y',
    }

    cache.writeFragment({
      fragment: gql`
        fragment CachedNormalisedTestData on Test {
          __typename
          id
          firstName
        }
      `,
      data: {
        __typename: 'Test',
        id: 'thingy',
        firstName: 'Thing',
      },
    })

    writeFragment<any, any, any>((result) => ({
      data: result.data,
    }))(cache, {data})

    expect(
      cache.readFragment({
        id: cache.identify(data),
        fragment: gql`
          fragment NormalisedTestData on Test {
            __typename
            id
            firstName
            lastName
          }
        `,
      }),
    ).toEqual({
      ...data,
      firstName: 'Thing',
    })
  })

  it('follows cache typePolicies', () => {
    const cache = new InMemoryCache({
      typePolicies: {
        Test: {fields: {person: {merge: true}}},
      },
    })
    const data = {
      __typename: 'Test',
      id: 'thingy',
      person: {
        lastName: 'Ed',
      },
    }

    const reference = cache.writeFragment({
      fragment: gql`
        fragment CachedTestDataWithTypePolicy on Test {
          __typename
          id
          person {
            firstName
          }
        }
      `,
      data: {
        __typename: 'Test',
        id: 'thingy',
        person: {
          firstName: 'Nest',
        },
      },
    })

    writeFragment<any, any, any>((result) => ({
      data: result.data,
    }))(cache, {data})

    expect(
      cache.readFragment({
        id: cache.identify(reference!),
        fragment: gql`
          fragment TestDataWithTypePolicy on Test {
            __typename
            id
            person {
              firstName
              lastName
            }
          }
        `,
      }),
    ).toEqual({
      ...data,
      person: {
        ...data.person,
        firstName: 'Nest',
      },
    })
  })

  it('can pass custom id', () => {
    const cache = new InMemoryCache()
    const data = {
      __typename: 'Test',
      id: 'thingy',
    }

    cache.writeFragment({
      fragment: gql`
        fragment CachedTestDataById on Test {
          __typename
          id
        }
      `,
      data: {
        __typename: 'Test',
        id: 'thingy',
      },
    })

    writeFragment<any, any, any>((result, c) => ({
      data: {__typename: result.data.__typename},
      id: c.identify(data),
    }))(cache, {data})

    expect(
      cache.readFragment({
        id: cache.identify(data),
        fragment: gql`
          fragment TestDataById on Test {
            __typename
            id
          }
        `,
      }),
    ).toEqual(data)
  })

  it('can pass custom fragment', () => {
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
        firstName: 'Thing',
      },
    })

    expect(() =>
      writeFragment<any, any, any>((result) => ({
        data: result.data,
        fragment,
      }))(cache, {data}),
    ).toThrowError(
      'Found 2 fragments. `fragmentName` must be provided when there is not exactly 1 fragment.',
    )
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

    writeFragment<any, any, any>((result) => ({
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

    writeFragment<any, any, any>((result) => ({
      data: result.data,
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

    writeFragment<any, any, any>((result) => ({
      data: result.data,
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

    writeFragment<any>((result) => ({
      data: result.data,
      skip: result.data.skip,
    }))(cache, {data})

    expect(
      cache.readFragment({
        id: cache.identify(data),
        fragment,
      }),
    ).toBeNull()
  })
})
