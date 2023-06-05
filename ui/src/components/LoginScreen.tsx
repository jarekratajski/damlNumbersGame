// Copyright (c) 2022 Digital Asset (Switzerland) GmbH and/or its affiliates. All rights reserved.
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useState } from "react";
import { Button, Form, Grid, Header, Image, Segment } from "semantic-ui-react";
import Credentials, { PublicParty } from "../Credentials";
import Ledger, {UserRightHelper} from "@daml/ledger";
import {
  DamlHubLogin as DamlHubLoginBtn,
  usePublicParty,
} from "@daml/hub-react";
import { authConfig, Insecure } from "../config";

type Props = {
  onLogin: (credentials: Credentials) => void;
};

/**
 * React component for the login screen of the `App`.
 */
const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const login = useCallback(
    async (credentials: Credentials) => {
      onLogin(credentials);
    },
    [onLogin],
  );

  const wrap: (c: JSX.Element) => JSX.Element = component => (
    <Grid textAlign="center" style={{ height: "100vh" }} verticalAlign="middle">
      <Grid.Column style={{ maxWidth: 450 }}>
        <Header
          as="h1"
          textAlign="center"
          size="huge"
          style={{ color: "#223668" }}>
          <Header.Content>

            <Image
              as="a"
              href="https://www.digitalasset.com/developers"
              target="_blank"
              src="/croco.png"
              alt="Crocodile Logo"
              spaced
              size="small"
              verticalAlign="bottom"
            />
            Numbers game
          </Header.Content>
        </Header>
        <Form size="large" className="test-select-login-screen">
          <Segment>{component}</Segment>
        </Form>
      </Grid.Column>
    </Grid>
  );

  const InsecureLogin: React.FC<{ auth: Insecure }> = ({ auth }) => {
    const [username, setUsername] = React.useState("");

    const handleLogin = async (event: React.FormEvent) => {
      event.preventDefault();
      const lowerCaseName = username.toLowerCase();
      const token = auth.makeToken(lowerCaseName);
      const adminToken = auth.makeToken('admin');
      const ledger = new Ledger({ token: token });
      let primaryParty = null;
      try {

          primaryParty = await auth.userManagement
              .primaryParty(username, ledger)
              .catch(error => {
                  throw error;
              });
      } catch (err) {
          console.log("auto registering user")
          //we cheat here a little - if the user is not found we log in as admin and create it
          //(demo simplification)
          const adminLedger = new Ledger({ token: adminToken });

          const party = await adminLedger.allocateParty({
              identifierHint: lowerCaseName,
              displayName: lowerCaseName
          }).catch(error => {
              const errorMsg =
                  error instanceof Error ? error.toString() : JSON.stringify(error);
              alert(`Failed to allocate party '${lowerCaseName}':\n${errorMsg}`);
              throw error;
          });
          await adminLedger.createUser(lowerCaseName, [UserRightHelper.canActAs(party.identifier),UserRightHelper.canReadAs(party.identifier) ], party.identifier);

          primaryParty = await auth.userManagement
              .primaryParty(lowerCaseName, ledger)
              .catch(error => {
                  const errorMsg =
                      error instanceof Error ? error.toString() : JSON.stringify(error);
                  alert(`Failed to login as '${lowerCaseName}':\n${errorMsg}`);
                  throw error;
              });
      }
      const useGetPublicParty = (): PublicParty => {
        const [publicParty, setPublicParty] = useState<string | undefined>(
          undefined,
        );
        const setup = () => {
          const fn = async () => {
            const publicParty = await auth.userManagement
              .publicParty(username.toLowerCase(), ledger)
              .catch(error => {
                const errorMsg =
                  error instanceof Error
                    ? error.toString()
                    : JSON.stringify(error);
                alert(
                  `Failed to find primary party for user '${username}':\n${errorMsg}`,
                );
                throw error;
              });
            // todo stop yolowing error handling
            setPublicParty(publicParty);
          };
          fn();
        };
        return { usePublicParty: () => publicParty, setup: setup };
      };
      await login({
        user: { userId: username.toLowerCase(), primaryParty: primaryParty },
        party: primaryParty,
        token: auth.makeToken(username.toLowerCase()),
        getPublicParty: useGetPublicParty,
      });
    };

    return wrap(
      <>
        {/* FORM_BEGIN */}
        <Form.Input
          fluid
          placeholder="Username"
          value={username}
          className="test-select-username-field"
          onChange={(e, { value }) => setUsername(value?.toString() ?? "")}
        />
        <Button
          primary
          fluid
          className="test-select-login-button"
          onClick={handleLogin}>
          Log in
        </Button>
        {/* FORM_END */}
      </>,
    );
  };

  const DamlHubLogin: React.FC = () =>
    wrap(
      <DamlHubLoginBtn
        onLogin={creds => {
          if (creds) {
            login({
              party: creds.party,
              user: { userId: creds.partyName, primaryParty: creds.party },
              token: creds.token,
              getPublicParty: () => ({
                usePublicParty: () => usePublicParty(),
                setup: () => {},
              }),
            });
          }
        }}
        options={{
          method: {
            button: {
              render: () => <Button primary fluid />,
            },
          },
        }}
      />,
    );

  return authConfig.provider === "none" ? (
    <InsecureLogin auth={authConfig} />
  ) : authConfig.provider === "daml-hub" ? (
    <DamlHubLogin />
  ) : (
    <div>Invalid configuation.</div>
  );
};

export default LoginScreen;
