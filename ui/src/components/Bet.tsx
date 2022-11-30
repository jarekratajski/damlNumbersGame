import React, {useCallback, useEffect} from "react";
import {userContext} from "./App";
import {Game, Proposal} from "@daml.js/numbers-game/lib/Numbers";
import {Button, Form, Segment} from "semantic-ui-react";

export const Bet: React.FC<{}> = props => {
    const party = userContext.useParty();
    const ledger = userContext.useLedger();

    const [number, setNumber] = React.useState("");
    const [bets, setBets] = React.useState(0);
    const [cnt, setCnt] = React.useState(0);

    const sendBet = async (event: React.FormEvent) => {
        let parties = await ledger.listKnownParties();
        console.log(parties);
        let admin = parties.filter(p => p.displayName === 'Admin')[0];
        let result = await ledger.create(Proposal, {player: party, dealer: admin.identifier, number: number});
        console.log(result);
        setBets(1);
    };

    const readBets = useCallback(async () => {
        let myProposals = await ledger.query(Proposal, {});
        let myGames = await ledger.query(Game, {});
        console.log(myProposals);
        console.log(myGames);
        console.log("end debug");
        setBets(myProposals.length + myGames.length);
        setTimeout(()=>setCnt(cnt+1), 1000);
    }, [cnt]);

    useEffect(() => {
        readBets()
    }, [readBets])



    let center = (bets === 0) ?
        <Segment attached={"top"}>
            <Form.Input
                fluid
                placeholder="999"
                value={number}
                className="test-select-username-field"
                onChange={(e, {value}) => setNumber(value?.toString() ?? "")}
            />

            <Button
                onClick={sendBet}
            >
                Bet
            </Button>
        </Segment>
        :
        <Segment attached={"top"}>you've sent your number. Wait for other players</Segment>
    ;

    return center;
}
