[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/digital-asset/daml/blob/main/LICENSE)

# numbers-game

This is an example game based on daml template engine.

# prerequisites

- daml sdk installed
- java 11
- sbt
- node/npm (tested on node v15.8.0)

# building

1. build daml part
`daml build`
2. start daml
`daml start`
3. (other console) build and start ui application
```
cd ui
npm install
npm start
```
4. (other console) build and start scala application
`sbt package run`

# Playing

- open browser at `localhost:3000` 
- use any desired  username (lowercase letters)
  (user is automatically created - we do not care really for authentication in this example)
- type a number and wait for results
- actually at least 3 different players must *bet* in order for a single game to finish

# Navigator

open http://localhost:7500 to browse contracts


# using postgres sql
do not run `daml start`

instead:
- create empty postgres database as specified in `postgres.conf`
- run `bash canton.sh`
- `daml json-api --ledger-host localhost --ledger-port 5011 --http-port 7575 --allow-insecure-tokens`

(ui and scala remains unchanged)

# Disclaimer

Code in this repository is for demonstration purposes only.
It is neither complete nor well-designed in order to keep it simple.

Important aspects such as error handling and security are ignored.
Any suggestions for improvements are welcome.

# Further readings
# Daml 
See [documentation] for details.

[documentation]: https://docs.daml.com/getting-started/installation.html

Please ask for help on [the Daml forum] if you encounter any issue!

[the Daml forum]: https://discuss.daml.com
