package com.example.game

import com.daml.ledger.javaapi.data.GetUserRequest
import com.daml.ledger.rxjava.DamlLedgerClient
import io.grpc.Status
import numbers.{Game, Proposal, Result}
import zio.interop.reactivestreams.Adapters
import zio.stream.{ZSink, ZStream}
import zio.{Schedule, Unsafe, ZIO, durationInt}

import scala.jdk.CollectionConverters.SeqHasAsJava
import scala.jdk.OptionConverters.RichOptional


object NumbersGame extends App{

  val connection = {
    val cx = DamlLedgerClient.newBuilder("localhost", 6865).build()
    cx.connect()
    cx
  }

  val runtime = zio.Runtime.default
  def mainLoop() = {

    for {
      partyOpt <- userConnection("admin")
      party = partyOpt.get
      daml = new Daml(connection, party)
      existingGamesStream: ZStream[Any, Status, String] = daml.fetchDamlContracts(Game.TEMPLATE_ID)
        .flatMap(e => ZStream.fromIterable(e.event))
        .map(e => e.getContractId)
      newGameCmd = daml.sendAndLogCommand(Game.create(party, Seq().asJava))

      gameStream = existingGamesStream.concat(newGameCmd)
        .take(1)

      game <- gameStream.run(ZSink.head)
      gameId = new Game.ContractId(game.get)
      proposalStream = daml.fetchAndListenForDamlContracts(Proposal.TEMPLATE_ID)
        .scanZIO(gameId) { (lastGameId, proposalEvent) =>
          val proposal = new Proposal.ContractId(proposalEvent.getContractId)
          println(s"got proposal $proposal")
          val cmd = proposal.exerciseAccept(lastGameId)
          val res = daml.sendAndLogCommand(cmd).runHead.map(x => new Game.ContractId(x.get))
          res.mapError(e => Status.UNKNOWN)
        }.map(id => GameState(Some(id), 1,  0))

        timeStream = {
          ZStream.fromSchedule(Schedule.spaced(1.second) >>> Schedule.recurs(10_000))
          }.map(cnt => GameState(None, 0, cnt))

        combined = timeStream.merge(proposalStream)
        changesDetect = combined.scan(GameState(None,0, 0)) {
          (g, nextElem) =>
            nextElem.gameId match {
            case Some(x) =>
              if (nextElem.gameId == g.gameId) {
                GameState(nextElem.gameId, g.proposalCount + nextElem.proposalCount, g.time + 1)
              } else {
                GameState(nextElem.gameId,g.proposalCount + nextElem.proposalCount, 0)
              }
            case None =>
              GameState(g.gameId, g.proposalCount + nextElem.proposalCount, g.time + 1)
          }
      }
      tillStale = changesDetect.tap(x => ZIO.succeed(println(s"have $x"))).takeUntil((x) => x.proposalCount>3 && x.time > 30)
      last = tillStale.takeRight(1)
      endRes <- last.foreach { g1 =>
        val game = g1.gameId.get
        val cmd = game.exerciseDecide()
        val res = daml.sendAndLogCommand(cmd).runHead.map(x => new Result.ContractId(x.get))
        println("!!got result")
        res
      }
    } yield (endRes)
  }
  def userConnection(userId: String) = ZIO
    .attemptBlockingIO {
      val userManagementClient = connection.getUserManagementClient()
      println("geting user")
      val getUserResponse = userManagementClient.getUser(new GetUserRequest(userId))
      val stream = Adapters
        .publisherToStream(getUserResponse.toFlowable(), 2)
        .map(_.getUser().getPrimaryParty().toScala)
      stream.runHead.map { x =>
        x.flatten
      }
    }.flatMap(identity)

  val gameLoop = ZIO.loop(0)((_)=>true,_+1)((_)=>mainLoop())

  Unsafe.unsafe { implicit unsafe =>
    runtime.unsafe.run(gameLoop)
  }
}

case class GameState(gameId: Option[Game.ContractId], proposalCount:Int, time:Long) {

}
