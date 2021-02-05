import {DataProxy, gql, InMemoryCache} from '@apollo/client'

import modify from '../modify'

describe('modify', () => {
  it('modifies data in cache', () => {
    const cache = new InMemoryCache()
    const fragment = gql`
      fragment ModifyTestData on Test {
        __typename
        id
        firstName
      }
    `
    const data = {
      __typename: 'Test',
      id: 'thingy',
      firstName: 'Old firstName',
    }

    cache.writeFragment({
      fragment,
      data,
    })

    modify<any>((result) => ({
      id: cache.identify(result.data),
      fields: {
        firstName() {
          return 'New firstName'
        },
      },
    }))(cache, {data})

    expect(
      cache.readFragment({
        fragment,
        id: cache.identify(data),
      }),
    ).toEqual({
      ...data,
      firstName: 'New firstName',
    })
  })

  it('can specify multiple transactions', () => {
    const cache = new InMemoryCache()
    const fragment = gql`
      fragment ModifyMultipleTestData on Test {
        __typename
        id
        firstName
        lastName
      }
    `
    const data = {
      __typename: 'Test',
      id: 'thingy',
      firstName: 'Old firstName',
      lastName: 'Old lastName',
    }

    cache.writeFragment({
      fragment,
      data,
    })

    modify<any>((result) => [
      {
        id: cache.identify(result.data),
        fields: {
          firstName() {
            return 'New firstName'
          },
          lastName(lastName) {
            return lastName
          }
        },
      },
      {
        id: cache.identify(result.data),
        fields: {
          firstName(firstName) {
            return firstName
          },
          lastName() {
            return 'New lastName'
          },
        },
      },
    ])(cache, {data})

    expect(
      cache.readFragment({
        fragment,
        id: cache.identify(data),
      }),
    ).toEqual({
      ...data,
      firstName: 'New firstName',
      lastName: 'New lastName',
    })
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

    modify<any>((result) => ({
      id: cache.identify(result.data),
      fields: {
        firstName() {
          return 'New firstName'
        },
      },
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

    modify<any>((result) => ({
      id: cache.identify(result.data),
      fields: {
        firstName() {
          return 'New firstName'
        },
      },
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

    cache.writeFragment({
      fragment,
      data,
    })

    modify<any>((result) => ({
      id: cache.identify(result.data),
      fields: {
        skip() {
          return false
        },
      },
      skip: result.data.skip,
    }))(cache, {data})

    expect(
      cache.readFragment({
        id: cache.identify(data),
        fragment,
      }),
    ).toEqual({
      ...data,
      skip: true,
    })
  })
})
