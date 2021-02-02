import {DataProxy, gql, InMemoryCache} from '@apollo/client'

import modifyFragment from '../modifyFragment'

describe('modifyFragment', () => {
  it('throws when there is no typename in data', () => {
    const cache = new InMemoryCache()
    const update = modifyFragment(() => ({
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

    modifyFragment<any, any, any>((result) => ({
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

    modifyFragment<any, any, any>((result) => ({
      data: {
        ...result.data,
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

    modifyFragment<any, any, any>((result) => ({
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

  it('calls modifiers with undefined if cached data does not exist', () => {
    const cache = new InMemoryCache()
    const fragment = gql`
      fragment UndefinedRelationTestData on Test {
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

    const newNested = {
      __typename: 'Nested',
      id: 'new-nested-thingy',
    }

    modifyFragment<any, any, any>((result) => ({
      data: {
        ...result.data,
        relation: (cachedRelation: any) =>
          typeof cachedRelation === 'undefined' ? [newNested] : [],
      },
    }))(cache, {data})

    expect(
      cache.readFragment({
        id: cache.identify(data),
        fragment: gql`
          fragment UndefinedRelationTestDataResult on Test {
            __typename
            id
            relation {
              __typename
              id
            }
          }
        `,
      }),
    ).toEqual({
      ...data,
      relation: [newNested],
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

    modifyFragment<any, any, any>((result) => ({
      data: {
        ...data,
        relation: (cachedRelation: typeof nested[] = []) =>
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

    modifyFragment<any, any, any>((result) =>
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
      id: 'nested-thingy',
    }
    const data = {
      __typename: 'Test',
      id: 'thingy',
      relation: nested,
    }

    modifyFragment<any, any, any>((result) => ({
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
      id: 'nested-thingy',
    }
    const data = {
      __typename: 'Test',
      id: 'thingy',
      relation: nested,
    }

    modifyFragment<any, any, any>((result) => ({
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

    modifyFragment<any, any, any>((result) => ({
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

    modifyFragment<any, any, any>((result) => ({
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

    modifyFragment((_, c) => ({
      data: {__typename: data.__typename},
      id: c.identify(data),
    }))(cache, {})

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
      modifyFragment<any, any, any>((result) => ({
        data: result.data,
        fragment,
      }))(cache, {data}),
    ).toThrowError(
      'Found 2 fragments. `fragmentName` must be provided when there is not exactly 1 fragment.',
    )
  })

  it('can use fragementName to choose between fragments definitions', () => {
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

    modifyFragment<any, any, any>((result) => ({
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

    modifyFragment<any, any, any>((result) => ({
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

    modifyFragment<any>((result) => ({
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
