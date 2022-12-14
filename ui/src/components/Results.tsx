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
    const [cnt,setCnt] = React.useState<number>(0);
    const [res, setRes] = React.useState<Res>({wins:0, games:0, loses:0});
    const readResults = useCallback(async () => {
        let res = await ledger.query(Result,{});
        setTimeout(()=>setCnt(cnt+1),2000);

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
        setRes({wins:wins, loses:loses, games:games})
    },[cnt]);

    useEffect(()=> {readResults()}, [readResults])

    return <Segment>
        <Label>
            Games: {res.games}
        </Label>
        <Label>
            Wins: {res.wins}
        </Label>
        <Label>
            Loses: {res.loses}
        </Label>
    </Segment>;
}
