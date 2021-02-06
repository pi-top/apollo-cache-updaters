import {DataProxy, gql, InMemoryCache} from '@apollo/client'

import writeQuery from '../writeQuery'

describe('writeQuery', () => {
  it('writes data to the cache', () => {
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

    writeQuery((result) => ({
      query,
      data: result.data,
    }))(cache, {data})

    expect(
      cache.readQuery({
        query,
      }),
    ).toEqual(data)
  })

  it('can write data with variables to the cache', () => {
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

    writeQuery((result) => ({
      query,
      data: result.data,
      variables: {id: data.test.id},
    }))(cache, {data})

    expect(
      cache.readQuery({
        query,
        variables: {id: data.test.id},
      }),
    ).toEqual(data)
  })

  it('can write multiple queries', () => {
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

    writeQuery<any, any, any>((result) =>
      result.data.things.map((thingy: any) => ({
        query,
        data: {test: thingy},
        variables: {id: thingy.id},
      })),
    )(cache, {
      data: {
        things: [thingOneData, thingTwoData],
      },
    })

    expect(cache.readQuery({query, variables: {id: thingOneData.id}})).toEqual({
      test: thingOneData,
    })
    expect(cache.readQuery({query, variables: {id: thingTwoData.id}})).toEqual({
      test: thingTwoData,
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

    writeQuery((result, c) => ({
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

    writeQuery((result) => ({
      query,
      data: result.data,
    }))(cache, {data: {test: data}})

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

    writeQuery((result) => ({
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

    writeQuery<any>((result) => ({
      query,
      data: result.data,
      skip: result.data.test.skip,
    }))(cache, {data})

    expect(cache.readQuery({query})).toBeNull()
  })
})
