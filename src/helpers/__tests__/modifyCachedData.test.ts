import {InMemoryCache} from '@apollo/client'

import modifyCachedData from '../modifyCachedData'

describe('modifyCachedData', () => {
  it('returns store values unmodified', () => {
    const cache = new InMemoryCache()

    expect(
      modifyCachedData({__typename: 'Test', id: 'thingy'}, {}, cache),
    ).toEqual({
      __typename: 'Test',
      id: 'thingy',
    })
  })

  it('evaluates modifiers when there is cached data', () => {
    const cache = new InMemoryCache()

    expect(
      modifyCachedData(
        {
          __typename: 'Test',
          id: 'thingy',
          array: ['cached item'],
        },
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

    expect(
      modifyCachedData(
        {
          __typename: 'Test',
          id: 'thingy',
          nested: [
            {
              __typename: 'Nested',
              id: 'nested thingy',
            },
          ],
        },
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
