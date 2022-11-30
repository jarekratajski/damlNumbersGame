package com.example.game

import zio.stream.ZStream
import zio._
import zio.Console._

object Experiments extends ZIOAppDefault {
  def run = {
    val stream = {
      ZStream.fromSchedule(Schedule.spaced(1.second) >>> Schedule.upTo(20.second))
    }
    stream.foreach( x => ZIO.succeed(println(x)))
  }.provideEnvironment(environment)


  val environment: ZEnvironment[Console & Clock & Random & System] =
    ZEnvironment[Console, Clock, Random, System](
      Console.ConsoleLive,
      Clock.ClockLive,
      Random.RandomLive,
      System.SystemLive
    )
}
