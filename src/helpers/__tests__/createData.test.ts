import {gql, InMemoryCache} from '@apollo/client'

import createData from '../createData'

describe('createData', () => {
  it('returns store values unmodified', () => {
    const cache = new InMemoryCache()

    expect(createData({__typename: 'Test', id: 'thingy'}, cache)).toEqual({
      __typename: 'Test',
      id: 'thingy',
    })
  })

  it('evaluates modifiers when there is no cached data', () => {
    const cache = new InMemoryCache()

    expect(
      createData(
        {__typename: 'Test', id: 'thingy', array: () => ['new item']},
        cache,
      ),
    ).toEqual({
      __typename: 'Test',
      id: 'thingy',
      array: ['new item'],
    })
  })

  it('evaluates modifiers when there is cached data', () => {
    const cache = new InMemoryCache()
    cache.writeFragment({
      fragment: gql`
        fragment CachedTestData on Test {
          __typename
          id
          array
        }
      `,
      data: {
        __typename: 'Test',
        id: 'thingy',
        array: ['cached item'],
      },
    })

    expect(
      createData(
        {
          __typename: 'Test',
          id: 'thingy',
          array: (cachedItems?: string[]) => [
            ...(cachedItems || []),
            'new item',
          ],
        },
        cache,
      ),
    ).toEqual({
      __typename: 'Test',
      id: 'thingy',
      array: ['cached item', 'new item'],
    })
  })

  it('evaluates modifiers of relations', () => {
    const cache = new InMemoryCache()
    cache.writeFragment({
      fragment: gql`
        fragment NestedCachedTestData on Test {
          __typename
          id
          nested {
            __typename
            id
          }
        }
      `,
      data: {
        __typename: 'Test',
        id: 'thingy',
        nested: [
          {
            __typename: 'Nested',
            id: 'nested thingy',
          },
        ],
      },
    })

    expect(
      createData(
        {
          __typename: 'Test',
          id: 'thingy',
          nested: (cachedItems?: any[]) => [
            ...(cachedItems || []),
            {
              __typename: 'Nested',
              id: 'new nested thingy',
            },
          ],
        },
        cache,
      ),
    ).toEqual({
      __typename: 'Test',
      id: 'thingy',
      nested: [
        {
          __typename: 'Nested',
          id: 'nested thingy',
        },
        {
          __typename: 'Nested',
          id: 'new nested thingy',
        },
      ],
    })
  })
})
