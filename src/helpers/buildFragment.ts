import {DocumentNode, gql} from '@apollo/client'

/*
It might be better to cut out gql entirely here and build the fragment
definition object directly
*/

function buildFragmentName(data: {[key: string]: any}): string {
  const {__typename = '', ...fields} = data || {}

  return [
    __typename,
    ...Object.entries(fields).map(([key, value]) => {
      if (value && typeof value === 'object') {
        const {__typename: nestedTypename = key, ...nestedData} = value
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return `_${nestedTypename}${buildFragmentName(nestedData)}`
      }
      return key.trim()
    }),
  ].join('')
}

const aggregateFields = (objects: Record<string, any>[]) =>
  objects.reduce(
    (acc, object) => ({
      ...acc,
      ...object,
    }),
    {},
  )

function buildFields(data: {[field: string]: any}, i = 0): string {
  const indent = Array(i).join(' ')
  return `${Object.entries(data).reduce((fields, [field, value]) => {
    if (value && typeof value === 'object') {
      const fieldData = Array.isArray(value) ? aggregateFields(value) : value
      if (fieldData && Object.keys(fieldData).length) {
        return `${fields}\n${indent}${field} {${buildFields(
          fieldData,
          i + 2,
        )}\n${indent}}`
      }
    }

    return `${fields}\n${indent}${field}`
  }, '')}`
}

function buildFragment(data: any): DocumentNode {
  const {__typename: typename} = data
  if (!typename) {
    throw new Error('Unable to build a fragment without a typename')
  }

  return gql`
    fragment ${buildFragmentName(data)} on ${typename} {
      ${buildFields(data)}
    }
  `
}

export default buildFragment
