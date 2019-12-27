/* eslint-disable @typescript-eslint/no-var-requires*/
const fetch = require("node-fetch");
const fs = require("fs");
const exec = require("child_process").exec;
const rimraf = require("rimraf");

rimraf.sync("./src/graphql/apollo-types");
const endpoint = process.env.API_URL;

exec(
  `./node_modules/.bin/apollo codegen:generate --endpoint=${endpoint} --tagName=gql --target=typescript --includes=src/graphql/*.ts --outputFlat=src/graphql/apollo-types`,
  (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return;
    }
    console.log(`stdout: ${stdout}`);
    console.log(`stderr: ${stderr}`);

    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        variables: {},
        query: `
      {
        __schema {
          types {
            kind
            name
            possibleTypes {
              name
            }
          }
        }
      }
    `,
      }),
    })
      .then(result => result.json())
      .then(result => {
        // here we're filtering out any type information unrelated to unions or interfaces
        const filteredData = result.data.__schema.types.filter(
          type => type.possibleTypes !== null,
        );
        result.data.__schema.types = filteredData;
        fs.writeFile(
          "./src/graphql/apollo-types/fragment-types.json",
          JSON.stringify(result.data),
          err => {
            if (err) {
              console.error("Error writing fragmentTypes file", err);
            } else {
              console.log("Fragment types successfully extracted!");
            }
          },
        );
      });
  },
);
