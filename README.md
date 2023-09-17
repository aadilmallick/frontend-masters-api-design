# What I learned

## Prisma setup

1. Go to render and create a postgre database, copy over all secrets.
2. Run `npm i typescript ts-node @types/node prisma @types/express nodemon --save-dev`
3. Run `npx prisma init`
4. Create a script that runs nodemon on your main file. When you isntall `ts-node`, nodemon automatically incorporates that into being able to watch and run ts-node files.

   ```json
   "scripts": {
       "dev": "nodemon src/index.ts"
   }
   ```

5. Install the prisma client
6. Perform a migration to create the tables in the database. Then the prisma client will have updated information on how to query the database. `npx prisma migrate dev --name init`

## Middleware

- `express.json()` : allows clients to send JSON as a request body to the server
- `express.urlencoded({extended: true})` : allows clients to send URL encoded data like query strings as a request body to the server. **Allows query strings**

### JWT and protect middleware

### Hashing Passwords

## Environment config

What if we made a global config that automatically changed accordingly with the current node environment. We will return different global configs depending on the node env, all originating from a single config file.

1. `npm i lodash.merge`
2. `npm i --save-dev @types/lodash.merge`

```javascript
import merge from "lodash.merge";

// make sure NODE_ENV is set
process.env.NODE_ENV = process.env.NODE_ENV || "development";

let envConfig;

// dynamically require each config depending on the stage we're in
if (process.env.NODE_ENV === "production") {
  envConfig = {
    port: process.env.PORT,
  };
} else {
  envConfig = {
    port: 3000,
  };
}

const defaultConfig = {
  mode: process.env.NODE_ENV,
  secrets: {
    jwtSecret: process.env.JWT_SECRET,
    dbUrl: process.env.DATABASE_URL,
  },
};

export default merge(defaultConfig, envConfig);
```

## Error handling

### Validation with express validator

Install express validator with `npm i express-validator --save`

Here is a basic example how to use it:

```ts
import { body, validationResult } from "express-validator";

// enforce that the name key in the request body is a string
app.post("/product", body("name").isString(), (req, res) => {
  // find the validation errors, if any
  const errors = validationResult(req);

  // perform error handling if found errors
  if (!errors.isEmpty()) {
    res.status(400);
    res.json({ errors: errors.array() });
  }
});
```

By taking advantage of the fact that each `body()` call is a simple middleware function, we can return a giant array of these validation middlewares at once. This is what I did in my code:

1. Create a store/dict of the validation middleware arrays. For example, to validate a user, check for the `username` and the `password` key and validate them.

   ```ts
   export const validationDict = {
     validateUser: [body("username").isString(), body("password").isString()],
     validateProduct: [body("name").isString()],
   };
   ```

2. Create a function that takes in an array of validation middleware and returns a function that can be used as middleware. The idea is that we can use our dictionary of validation middleware arrays and plug them into this function to get back a middleware that does everything at once.

   ```ts
   export async function validateFields(validationChain: ValidationChain[]) {
     const validateInput = async (req, res, next) => {
       // perform validation
       const errors = validationResult(req);

       // perform error handling if found errors
       if (!errors.isEmpty()) {
         res.status(400);
         return res.json({ errors: errors.array() });
       }

       // if no errors, allow passing ot route handler
       return next();
     };

     // given the validation chain, append the validateInput middleware to the end
     return [...validationChain, validateInput];
   }
   ```

3. We can then use it like this:

   ```ts
   import { validationDict, validateFields } from "./validation";

   app.post(
     "/user/new-user",
     validateFields(validationDict.validateUser),
     async (req, res) => {
       // do stuff
     }
   );
   ```

```ts
import { ValidationChain, body, validationResult } from "express-validator";
import { NextFunction, Response, Request } from "express";

export const validationDict = {
  validateUser: [body("username").isString(), body("password").isString()],
  validateProduct: [body("name").isString()],
};

export async function validateFields(validationChain: ValidationChain[]) {
  const validateInput = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const errors = validationResult(req);

    // perform error handling if found errors
    if (!errors.isEmpty()) {
      res.status(400);
      return res.json({ errors: errors.array() });
    }

    return next();
  };

  return [...validationChain, validateInput];
}
```

## Deployment

1. Modify your tsconfig to output all typescript compiled files into a `dist` folder, and include all ts files you want to compile using the `includes` key:

```json
{
  "compilerOptions": {
    "sourceMap": true,
    "outDir": "./dist",
    "strict": true,
    "lib": ["esnext"],
    "esModuleInterop": true,
    "declaration": true
  },
  "include": [
    "handlers/**/*.ts",
    "middleware/**/*.ts",
    "modules/**/*.ts",
    "config.ts",
    "routes/**/*.ts",
    "db.ts",
    "server.ts"
  ],
  "exclude": ["node_modules"]
}
```

2. Add these scripts:

```json
{
  "scripts": {
    "dev": "nodemon server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js"
  }
}
```
