import modifyObject from '../modifyObject'

describe('modifyObject', () => {
  it('can overwrite store values', () => {
    expect(modifyObject({__typename: 'Test', id: 'thingy'}, {
      __typename: 'New',
      id: 'new thingy',
    })).toEqual({
      __typename: 'New',
      id: 'new thingy',
    })
  })

  it('evaluates modifiers when there is cached data', () => {
    expect(
      modifyObject(
        {
          __typename: 'Test',
          id: 'thingy',
          array: ['cached item'],
        },
        {
          __typename: 'Test',
          id: 'thingy',
          array: (cachedItems) => [
            ...cachedItems,
            'new item',
          ],
        },
      ),
    ).toEqual({
      __typename: 'Test',
      id: 'thingy',
      array: ['cached item', 'new item'],
    })
  })

  it('evaluates modifiers of relations', () => {
    expect(
      modifyObject(
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
          nested: (cachedItems) => [
            ...cachedItems,
            {
              __typename: 'Nested',
              id: 'new nested thingy',
            },
          ],
        },
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
