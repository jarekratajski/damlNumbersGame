
scalaVersion := "2.13.8"

val grpcVersion = "1.41.2"

val damlSdkVersion = "2.4.0"


libraryDependencies ++= Seq(
  "io.grpc" % "grpc-netty" % grpcVersion,
  "com.daml" % "bindings-java" % damlSdkVersion,
  "com.daml" % "bindings-rxjava" % damlSdkVersion,
  "dev.zio" %% "zio-interop-reactivestreams" % "2.0.0",

)



lazy val damlTask = taskKey[Seq[File]]("daml compile ")
damlTask / fileInputs += baseDirectory.value.toGlob / "daml" / "*.daml"
damlTask := {
  {
    import scala.sys.process._
    val log = streams.value.log
    val dir = (Compile / sourceManaged).value
    "daml build --project-root=. -o target/numbers.dar" ! streams.value.log
    s"daml codegen java -o $dir target/numbers.dar" ! streams.value.log
    val base = file(".")
    val output = (dir) ** "*.java"
    output.get
  }
}
Compile / run / mainClass := Some("com.example.game.NumbersGame")
Compile / sourceGenerators  += damlTask.taskValue
