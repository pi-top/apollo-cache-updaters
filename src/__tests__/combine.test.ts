import {gql, InMemoryCache} from '@apollo/client'

import combine from '../combine'

describe('combine', () => {
  it('combines multiple updater functions into a single updater', () => {
    const cache = new InMemoryCache()
    const query = gql`
      query GetTest($id: String) {
        test(id: $id) {
          __typename
          id
          relation {
            __typename
            id
          }
        }
      }
    `
    const firstThingyData = {
      __typename: 'Test',
      id: 'thingy',
    }
    const secondThingyData = {
      __typename: 'Test',
      id: 'other-thingy',
    }

    const result = {
      data: {
        nested: {
          __typename: 'Nested',
          id: 'nested',
        },
      },
    }

    combine(
      (c, r) =>
        c.writeQuery({
          query,
          variables: {id: firstThingyData.id},
          data: {
            test: {
              ...firstThingyData,
              relation: r.data?.nested,
            },
          },
        }),
      (c, r) =>
        c.writeQuery({
          query,
          variables: {id: secondThingyData.id},
          data: {
            test: {
              ...secondThingyData,
              relation: r.data?.nested,
            },
          },
        }),
    )(cache, result)

    expect(
      cache.readQuery({query, variables: {id: firstThingyData.id}}),
    ).toEqual({
      test: {
        ...firstThingyData,
        relation: result.data.nested,
      },
    })
    expect(
      cache.readQuery({query, variables: {id: secondThingyData.id}}),
    ).toEqual({
      test: {
        ...secondThingyData,
        relation: result.data.nested,
      },
    })
  })

  it('executes updaters in order', () => {
    const cache = new InMemoryCache()
    const query = gql`
      query GetTest {
        test {
          __typename
          id
        }
      }
    `
    const firstThingyData = {
      __typename: 'Test',
      id: 'thingy',
    }
    const secondThingyData = {
      __typename: 'Test',
      id: 'other-thingy',
    }

    combine(
      (c) => c.writeQuery({query, data: {test: firstThingyData}}),
      (c) => c.writeQuery({query, data: {test: secondThingyData}}),
    )(cache, {})

    expect(cache.readQuery({query})).toEqual({test: secondThingyData})
  })
})
