import React, {useCallback, useEffect} from "react";
import {userContext} from "./App";
import { Result} from '@daml.js/numbers-game/lib/Numbers';
import {Label, Segment} from "semantic-ui-react";

interface Res {
    wins: number;
    loses: number;
    games: number;
}

export const Results: React.FC<any> = () => {
    const party = userContext.useParty();
    const ledger = userContext.useLedger();
    const [justWon, setWon] = React.useState<boolean>(false);
    const [justLost, setLost] = React.useState<boolean>(false);

    const [cnt,setCnt] = React.useState<number>(0);
    const [prevResults, setRes] = React.useState<Res>({wins:0, games:0, loses:0});
    const readResults = useCallback(async () => {
        let res = await ledger.query(Result,{});
        setTimeout(()=>setCnt(cnt+1),10000);

        let games = 0;
        let wins = 0;
        let loses = 0;
        res.forEach(r => {
           let payload = r.payload as Result;
           if (payload.winner?.player === party) {
               wins = wins + 1;
           } else {
               loses = loses +1;
           }
           games = games +1;
        });
        if (prevResults.wins < wins) {
            setWon(true);
        } else if (prevResults.loses < loses ) {
            setLost(true);
        } else {
            setWon(false);
            setLost(false);
        }
        setRes({wins:wins, loses:loses, games:games})
    },[cnt]);

    useEffect(()=> {readResults()}, [readResults])

    return <Segment>
        <Segment>
        <Label>
            Games: {prevResults.games}
        </Label>
        <Label>
            Wins: {prevResults.wins}
        </Label>
        <Label>
            Loses: {prevResults.loses}
        </Label>
        </Segment>
    <Segment className="notifications">
            <Label active={justWon}>
                You just won - congratulations
            </Label>
            <Label active={justLost}>
                Sorry, you lost - better luck next time
            </Label>
    </Segment>
    </Segment>;
}
