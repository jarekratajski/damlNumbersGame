import React from "react";
import {PublicParty} from "../Credentials";
import {userContext} from "./App";
import {Container, Grid, Header} from "semantic-ui-react";
import {Results} from "./Results";
import {Bet} from "./Bet";

type Props = {
    onLogout: () => void;
    getPublicParty: () => PublicParty;
}

export const NumbersGame: React.FC<Props> = ({onLogout, getPublicParty}) => {
    const user = userContext.useUser();

    let myUserName = user.userId;
    return <Container>
        <Grid centered columns={2}>
            <Grid.Row stretched>
                <Grid.Column>
                    <Header as='h1' size='huge' color='blue' textAlign='center' style={{padding: '1ex 0em 0ex 0em'}}>
                        {myUserName ? `Welcome, ${myUserName}!` : 'Loading...'}
                    </Header>
                    <Bet/>
                </Grid.Column>
                <Grid.Column>
                    <Header as='h1' size='huge' color='blue' textAlign='center' style={{padding: '1ex 0em 0ex 0em'}}>
                        Results
                    </Header>
                    <Results/>
                </Grid.Column>
            </Grid.Row>
            <Grid.Row>
                <Grid.Column>
                    Give a number (integer). You play with multiple other players. Whoever gives second highest number  - wins.
                </Grid.Column>    
            </Grid.Row>
        </Grid>
    </Container>;

}
