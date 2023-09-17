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
