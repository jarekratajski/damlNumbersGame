package com.example.game

import com.daml.ledger.javaapi.data._
import com.daml.ledger.rxjava.DamlLedgerClient
import io.grpc.Status
import numbers.Result
import zio.ZIO
import zio.interop.reactivestreams.Adapters
import zio.stream.ZStream

import java.util.{Collections, UUID}
import scala.jdk.CollectionConverters.ListHasAsScala
import scala.jdk.OptionConverters.RichOptional

class Daml(val connection:DamlLedgerClient, party:String) {
  val DAML_APP_ID = "NumbersGame"

  def fetchDamlContract(templateId: Identifier, contract: ContractId): ZIO[Any, Status, Option[CreatedEvent]] = {
    fetchDamlContracts(templateId).flatMap(e => ZStream.fromIterable(e.event))
      .filter (_.getContractId == contract.getValue)
      .runHead
  }
  def fetchDamlContracts(
                          templateId: Identifier
                        ): ZStream[Any, Status, ContractEvents] = {
    val activeContractsClient =
      connection.getActiveContractSetClient

    val activeContractsResponses =
      activeContractsClient
        .getActiveContracts(
          makeDamlTransactionFilter(templateId),
          false,
        )
        .map(resp => (resp.getCreatedEvents.asScala.toSeq, resp.getOffset))
        .map { case (events, offset) =>
          ContractEvents(events, offset.toScala)
        }
        .replay()
    activeContractsResponses.connect()

    val activeStream: ZStream[Any, Throwable, ContractEvents] =
      Adapters.publisherToStream(activeContractsResponses, 2)
    activeStream.mapError(mapAndLogError(_))
  }


  private def listenForNewDamlContracts(
                                         offset: String,
                                         templateId: Identifier,
                                       ) = {
    val transactionsClient = connection.getTransactionsClient
    Adapters
      .publisherToStream(
        transactionsClient
          .getTransactions(
            new LedgerOffset.Absolute(offset),
            makeDamlTransactionFilter(templateId),
            false,
          ),
        2,
      )
      .mapError(mapAndLogError(_))
      .map { tx =>
        val evs = tx
          .getEvents()
          .asScala
          .filter(_.isInstanceOf[CreatedEvent])
          .map(_.asInstanceOf[CreatedEvent])
          .toSeq
        ContractEvents(evs, Some(tx.getOffset()))
      }
  }

  def fetchAndListenForDamlContracts(
                                      templateId: Identifier
                                    ) = {
    val existingContracts = fetchDamlContracts(templateId)
    val lastOffset =
      existingContracts.takeRight(1).map(_.offset.getOrElse("")).concat(ZStream("")).take(1)
    val newContracts = lastOffset.flatMap { offset =>
      listenForNewDamlContracts(offset, templateId)
    }
    existingContracts.concat(newContracts).flatMap(e => ZStream.fromIterable(e.event))
  }

  private def makeDamlTransactionFilter(
                                         templateId: Identifier
                                       ): TransactionFilter = {

    val templateFilter = new InclusiveFilter(Collections.singleton(templateId))
    val partyToTemplateFilter: java.util.Map[String, Filter] =
      Collections.singletonMap(party, templateFilter)
    new FiltersByParty(partyToTemplateFilter)
  }

  def mapAndLogError(t: Throwable) = {
    t.printStackTrace()
    Status.UNKNOWN.withCause(t)
  }

  // send an exercise command and asynchronously wait for / log success/failure
  //returns a stream of contract ids
  def sendAndLogCommand(
                         command: Command,

                       ) =
    Adapters
      .publisherToStream(
        connection.getCommandClient
          .submitAndWaitForTransaction(
            workflowId = "",
            applicationId = DAML_APP_ID,
            commandId = UUID.randomUUID().toString(),
            party,
            Collections.singletonList(command),
          )
          .toFlowable(),
        2,
      ).map { transaction =>
      val events = transaction.getEvents.asScala
      val res = events.filter(_.isInstanceOf[CreatedEvent])
        .map(_.asInstanceOf[CreatedEvent])
        .map(_.getContractId)
        .head
      res
    }.take(1)
}

case class ContractEvents(event: Seq[CreatedEvent], offset: Option[String])
