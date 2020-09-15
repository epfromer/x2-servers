import { Client } from '@elastic/elasticsearch'
import {
  Custodian,
  custodianCollection,
  dbName,
  elasticServer,
  Email,
  EmailSentByDay,
  emailSentByDayCollection,
  processCustodians,
  processEmailSentByDay,
  processWordCloud,
  walkFSfolder,
  wordCloudCollection,
  WordCloudTag,
} from '@klonzo/common'
import * as dotenv from 'dotenv'
import { v4 as uuidv4 } from 'uuid'
dotenv.config()

// https://www.elastic.co/blog/new-elasticsearch-javascript-client-released
// https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/7.x/introduction.html
// http://localhost:9200/x2
// http://localhost:9200/x2/_search?q=*

// TODO create this each request
export let client: Client

async function run() {
  process.send(`connect`)
  client = new Client({ node: elasticServer })

  const insertEmails = async (emails: Email[]): Promise<void> => {
    emails.forEach(async (email) => {
      await client.index({
        index: dbName,
        body: {
          id: uuidv4(),
          sent: email.sent,
          from: email.from,
          fromCustodian: email.fromCustodian,
          to: email.to,
          toCustodians: email.toCustodians,
          cc: email.cc,
          bcc: email.bcc,
          subject: email.subject,
          body: email.body,
        },
      })
    })
  }

  const insertWordCloud = async (wordCloud: WordCloudTag[]): Promise<void> => {
    await client.index({
      index: dbName + wordCloudCollection,
      body: {
        wordCloudCollection: wordCloud,
      },
    })
  }

  const insertEmailSentByDay = async (
    email: EmailSentByDay[]
  ): Promise<void> => {
    await client.index({
      index: dbName + emailSentByDayCollection,
      body: {
        emailSentCollection: email,
      },
    })
  }

  const insertCustodians = async (custodians: Custodian[]): Promise<void> => {
    custodians.forEach(async (custodian) => {
      await client.index({
        index: dbName + custodianCollection,
        id: custodian.id,
        body: {
          id: custodian.id,
          name: custodian.name,
          title: custodian.title,
          color: custodian.color,
          senderTotal: custodian.senderTotal,
          receiverTotal: custodian.receiverTotal,
          toCustodians: custodian.toCustodians,
          fromCustodians: custodian.fromCustodians,
        },
      })
    })
  }

  process.send(`drop database`)
  try {
    await client.indices.delete({ index: dbName })
    await client.indices.delete({ index: dbName + wordCloudCollection })
    await client.indices.delete({ index: dbName + emailSentByDayCollection })
    await client.indices.delete({ index: dbName + custodianCollection })
  } catch (error) {
    console.error(error)
  }

  process.send(`create index`)
  await client.indices.create({ index: dbName })
  await client.indices.create({ index: dbName + wordCloudCollection })
  await client.indices.create({ index: dbName + emailSentByDayCollection })
  await client.indices.create({ index: dbName + custodianCollection })

  process.send(`process emails`)
  const numEmails = await walkFSfolder(insertEmails, (msg) => process.send(msg))

  process.send(`process word cloud`)
  await processWordCloud(insertWordCloud, (msg) => process.send(msg))

  process.send(`process email sent`)
  await processEmailSentByDay(insertEmailSentByDay, (msg) => process.send(msg))

  process.send(`process custodians`)
  await processCustodians(insertCustodians, (msg) => process.send(msg))

  process.send(`refresh index`)
  await client.indices.refresh({ index: dbName })

  process.send(`completed ${numEmails} emails`)
}

run().catch((err) => console.error(err))
