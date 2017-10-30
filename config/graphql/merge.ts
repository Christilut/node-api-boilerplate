import * as path from 'path'
import * as fs from 'fs'
import { fileLoader, mergeTypes, mergeResolvers, GraphQlSchema } from 'merge-graphql-schemas'
import * as GraphQl from 'graphql-tools'

let schema: GraphQlSchema
let adminSchema: GraphQlSchema

const modelDir = path.join(__dirname, '../../server/models')

// Note that in this file we use .js because the compiled code that is executed isnt Typescript but Javascript

// Default schema, for graphql endpoint available to all authenticated users
{
  const schemas: string[] = []
  const resolvers: string[] = []

  fs.readdirSync(modelDir).forEach(dir => {
    if (dir.lastIndexOf('.js') === dir.length - '.js'.length) return

    const dirPath = path.join(modelDir, dir)

    // load schemas
    fs.readdirSync(dirPath).forEach(file => {
      if (file.includes('.gql')) {
        schemas.push(fs.readFileSync(path.join(dirPath, file), 'utf8'))
      }
    })

    // load resolvers
    fs.readdirSync(dirPath).forEach(file => {
      if (file === 'resolvers.js') {
        resolvers.push(require(path.join(dirPath, file)).default)
      }
    })
  })

  const mergedSchemas = mergeTypes(schemas)
  const mergedResolvers = resolvers.length > 1 ? mergeResolvers(resolvers) : resolvers[0]

  schema = GraphQl.makeExecutableSchema({ typeDefs: mergedSchemas, resolvers: mergedResolvers })
}

// Admin schema, for graphql endpoint only available to admins
{ // TODO combine these 2
  const schemas: string[] = []
  const resolvers: string[] = []

  fs.readdirSync(modelDir).forEach(dir => {
    if (dir.lastIndexOf('.js') === dir.length - '.js'.length) return

    const dirPath = path.join(modelDir, dir)
    const dirAdminPath = path.join(dirPath, 'admin')

    if (!fs.existsSync(dirAdminPath)) return

    // load admin schemas
    schemas.push(fs.readFileSync(path.join(dirPath, 'shared.gql'), 'utf8'))

    fs.readdirSync(dirAdminPath).forEach(file => {
      if (file.includes('.gql')) {
        schemas.push(fs.readFileSync(path.join(dirAdminPath, file), 'utf8'))
      }
    })

    // load admin resolvers
    fs.readdirSync(dirAdminPath).forEach(file => {
      if (file === 'resolvers.js') {
        resolvers.push(require(path.join(dirAdminPath, file)).default)
      }
    })
  })

  if (schemas.length > 0) {
    const mergedSchemas = mergeTypes(schemas)
    const mergedResolvers = resolvers.length > 1 ? mergeResolvers(resolvers) : resolvers[0]

    adminSchema = GraphQl.makeExecutableSchema({ typeDefs: mergedSchemas, resolvers: mergedResolvers })
  }
}

export {
  schema,
  adminSchema
}
