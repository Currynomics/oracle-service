# Redcurry Oracle Service
## About
This is a microservice that uses Moralis SDK to connect to Redcurry smart contracts and retrieve the treasury state including its reserve assets.
It is designed to run on GCP Cloud Function in NodeJS environment.

## Running locally
Use npm run start after npm i to run the cloud function locally.

## API Docs
Run an authenticated (using authorization headers) get request against the cloud function to retrieve the current state of treasury.

