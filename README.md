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

Any time you are accepting POST requests, you should be using these two middlewares.

```ts
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

### JWT and protect middleware

We are going to use the `jsonwebtoken` package for handling jwts. This is the basic auth flow:

1. Create a new user or log them in. On success, return a jwt token.
2. In the `protect()` middleware, get the JWT from the `Authorization` request header using bearer token syntax.
3. Verify that the JWT is valid, If so, augment the request object with a `req.user` property for easy access to user information in protected routes.
4. If the JWT is not valid, fail the middleware and prevent access to any protected routes.

We need dotenv configuration to use env variables and we need to have a JWT secret to encode our JWTs.

```ts
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();
```

Here we use generics to provide type support for the payload we receive and encode in the JWT.

```javascript
interface UserPayload {
  id: string;
  username: string;
}

export function generateToken<T extends object = UserPayload>(user: T) {
  return jwt.sign(user, process.env.JWT_SECRET as string, {
    expiresIn: "7d",
  });
}

export function decodeToken<T extends object = UserPayload>(token: string): T {
  const payload = jwt.verify(token, process.env.JWT_SECRET as string);
  return JSON.parse(JSON.stringify(payload)) as T;
}
```

Then here is the `protect()` middleware, following these steps:

1. Get the JWT from the `Authorization` request header using bearer token syntax.
2. Verify that the JWT is valid, If so, augment the request object with a `req.user` property for easy access to user information in protected routes.
3. If the JWT is not valid, throw an error to prevent access to any protected routes.

```javascript
// create augmented interface for type gymnastics
export interface AppRequest extends Request {
  user?: UserPayload;
}

export async function protect(
  req: AppRequest,
  res: Response,
  next: NextFunction
) {
  let token: string | undefined;

  // check existence of bearer token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // get the token from "Bearer <token>" syntax
    token = req.headers.authorization.split(" ")[1];

    try {
      // decode user from jwt
      const user = await decodeToken(token);
      if (!user)
        throw new CustomAPIError("Not authorized. Incorrect token.", 401);

      // set req.user variable for next middleware
      req.user = user;
      next();
    } catch (e) {
      throw new CustomAPIError("Not authorized.", 401);
    }
  }

  if (!token) {
    throw new CustomAPIError("Not authorized.", 401);
  }
}
```

### Hashing Passwords

```javascript
export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

export const comparePasswords = (
  plainTextPassword: string,
  hashedPassword: string
) => bcrypt.compare(plainTextPassword, hashedPassword);
```

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

### Express async errors

The `express-async-errors` package allows us to throw errors in async and synchronous code and have them be handled by our error handling middleware. This is how we use it:

1. `npm i express-async-errors`
2. Paste this code `import "express-async-errors";` whenever you are creating routes in your application and using async middleware, on the route level. Basically import this into all of your middleware and router files, just to be safe.

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

### Custom error handling and error handler

The first order of business is to create a simple error handler that overrides express's default error handler, and register it as the last middleware in the application.

```ts
// this should be last app.use() in the application
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({ msg: err.message });
});
```

Then we can create a custom error class that extends the default error class, and use it to throw errors in our application.

```ts
export class CustomAPIError extends Error {
  constructor(public message: string, public statusCode: number = 400) {
    super(message);
    this.name = "CustomAPIError";
  }
}
```

The `error.name` property is the name of the class that the error was created from. We can set this manually to differentiate between normal errors and custom api errors in our error handler at runtime, allowing us to do interesting stuff like augmenting the error and then having complete type safety when working with either type of error.

### Zod validation

This custom function takes in a zod schema and returns middleware that validates if the request body matches the zod schema. If it does not, it throws a custom api error with the validation error message.

```javascript
import { NextFunction, Request, Response } from "express";
import { fromZodError } from "zod-validation-error";
import * as z from "zod";
import { CustomAPIError } from "../modules/errors";

export function validate<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // parse in accordance to schema. If does not fit schema, throw error
      schema.parse(req.body);
      return next();
    } catch (e) {
      // can only type check errors with type guards
      if (e instanceof z.ZodError) {
        // library that makes readable zod message
        const validationError = fromZodError(e);
        throw new CustomAPIError(validationError.message, 400);
      }
    }
  };
}
```

```ts
const userSchema = z
  .object({
    username: z.string().min(2, "dude, a min of 2 chars").max(255),
    password: z.string().min(4, "dude, a min of 4 chars").max(255),
  })
  .required();

router.post("/new-user", validate(userSchema), createNewuser);
router.post("/login", validate(userSchema), signIn);
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
