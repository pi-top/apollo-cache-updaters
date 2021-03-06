<div align="center">
<h1>apollo-cache-updaters</h1>

</a>

<p>Apollo cache updater functions that make cache updates simpler and more concise.</p>

</div>

<hr />

[![Build Status][build-badge]][build]
[![version][version-badge]][package]
[![MIT License][license-badge]][license]
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![PRs Welcome][prs-badge]][prs]
[![Code of Conduct][coc-badge]][coc]

## The problem

Apollo cache updates are verbose and require an understanding of how the cache
uses references and normalises data internally.

## This solution

A set of declarative updaters that perform common actions automatically.

Restructuring updaters to be declarative makes cache updates more concise. This
makes it possible to write complex updates inline.

Common patterns in update methods are done automatically, for instance
`writeFragment` automatically generates it's fragment from `data`. All automatic
behaviours are easy to disable.

## Table of Contents

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Installation](#installation)
- [Usage](#usage)
  - [Updaters](#updaters)
  - [writeFragment](#writefragment)
  - [evict](#evict)
  - [combine](#combine)
  - [skipping updates](#skipping-updates)
  - [Typescript](#typescript)
- [LICENSE](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Installation

This module is distributed via [npm][npm] which is bundled with [node][node] and
should be installed as one of your project's `dependencies`:

```
npm install --save @pi-top/apollo-cache-updaters
```

The `@apollo/client` package is a `peerDepencency`.

## Usage

This package exports updaters for the cache actions: `evict`, `modify`,
`writeFragment` and `writeQuery`. It also exports a helper called `combine`
(see below).

### Updaters

Each updater accepts a `createOptions` callback that is called with the
`ExecutionResult` and the `ApolloCache` as the first and second arguments
respectively. The `createOptions` callback is used to create options for a cache
method, for example `writeQuery`'s `createOptions` callback should return the
same options that would be passed `cache.writeQuery`:

```
import { writeQuery } from '@pi-top/apollo-cache-updaters';

const update = writeQuery((result) => ({
  data: result.data,
  query: gql`
    query GetStuff {
      stuff {
        id
        __typename
      }
    }
  `,
})),
```

`createOptions` can also return an array of options, for when multiple similar
operations need to performed from a single `ExecutionResult`:

```
import { writeQuery } from '@pi-top/apollo-cache-updaters';

const update = writeQuery((result) => result.data.stuffs.map(stuff => ({
  data: { stuff },
  variables: { id: stuff.id }
  query: gql`
    query GetStuff($id: string) {
      stuff(id: $id) {
        id
        __typename
      }
    }
  `,
}))
```

### writeFragment

`writeFragment` automatically generates it's fragment from the `data` property
when `fragment` is undefined. Note that when using this behaviour the
`__typename` property is required to exist in `data`:

```
import { writeFragment } from '@pi-top/apollo-cache-updaters';

const update = writeFragment((result) => ({
  data: {
    ...thing,
    __typename: 'Thing',
    stuff: result.data.stuff
  }
}))
```

### evict

`evict` automatically calls `cache.gc` if there was a successful eviction. To
stop the behaviour there is an option `gc` that can be set to `false`

```
import { evict } from '@pi-top/apollo-cache-updaters';

const update = evict((result, cache) => ({
  id: cache.identify(result.data),
  gc: false,
}))
```

### combine

When multiple types of operation need to performed for one `ExecutionResult` the
`combine` method can be used:

```
import { combine } from '@pi-top/apollo-cache-updaters';

const update = combine(
  writeFragment((result) => ({
    data: {
      ...thing,
      stuff: result.data.stuff
    }
  })),
  writeQuery((result) => ({
    data: result.data,
    query: GET_STUFF,
  })),
)
```

### skipping updates

Sometimes we want to conditionally update the cache, to do this we can set the
`skip` value in the updater options:

```
import { evict } from '@pi-top/apollo-cache-updaters'

const update = evict((result, cache) => ({
  id: cache.identify(objectToDelete),
  skip: !(result.data && result.data.deleted),
}));
```

### Typescript

The project comes fully typed.

## LICENSE

MIT

[npm]: https://www.npmjs.com/
[node]: https://nodejs.org
[build-badge]: https://github.com/pi-top/apollo-cache-updaters/workflows/apollo-cache-updaters/badge.svg
[build]: https://github.com/pi-top/apollo-cache-updaters/actions?query=branch%3Amaster+workflow%3Aapollo-cache-updaters
[version-badge]: https://img.shields.io/npm/v/@pi-top/apollo-cache-updaters.svg?style=flat-square
[package]: https://www.npmjs.com/package/@pi-top/apollo-cache-updaters
[downloads-badge]: https://img.shields.io/npm/dm/@pi-top/apollo-cache-updaters.svg?style=flat-square
[npmtrends]: http://www.npmtrends.com/@pi-top/apollo-cache-updaters
[license-badge]: https://img.shields.io/npm/l/@pi-top/apollo-cache-updaters.svg?style=flat-square
[license]: https://github.com/pi-top/apollo-cache-updaters/blob/master/LICENSE
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs]: http://makeapullrequest.com
[coc-badge]: https://img.shields.io/badge/code%20of-conduct-ff69b4.svg?style=flat-square
[coc]: https://github.com/pi-top/apollo-cache-updaters/blob/master/other/CODE_OF_CONDUCT.md
