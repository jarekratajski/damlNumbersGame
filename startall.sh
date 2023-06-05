daml build
sbt package
nohup >/tmp/daml.log daml start &
sleep 10
nohup >/tmp/numbers-game.log sbt run &
cd ui
nohup >/tmp/numbers-game-ui.log npm start &
