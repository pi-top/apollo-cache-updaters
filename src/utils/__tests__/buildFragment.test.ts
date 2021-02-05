import {gql} from '@apollo/client'

import buildFragment from '../buildFragment'

describe('buildFragment', () => {
  it('throws when there is no typename', () => {
    expect(() => buildFragment({})).toThrow(
      'Unable to build a fragment without a typename',
    )
  })

  it('can create fragments from simple data', () => {
    expect(
      buildFragment({
        __typename: 'Test',
        id: 'test',
      }),
    ).toEqual(gql`
      fragment Testid on Test {
        __typename
        id
      }
    `)
  })

  it('can create fragments from nested data', () => {
    expect(
      buildFragment({
        __typename: 'Test',
        id: 'test',
        relation: {
          __typename: 'Nested',
          id: 'nested',
        },
      }),
    ).toEqual(gql`
      fragment Testid_Nestedid on Test {
        __typename
        id
        relation {
          __typename
          id
        }
      }
    `)
  })
})
