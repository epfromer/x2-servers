import { buildSchema } from 'graphql'

export const graphqlSchema = buildSchema(`
  type Word {
    tag: String
    weight: Int
  }

  type EmailSentByDay {
    sent: String
    emailIds: [String]
  }

  type EmailSentToCustodians {
    emailId: String
    custodianIds: [String]
  }
  
  type EmailReceivedFromCustodians {
    emailId: String
    custodianId: String
  }

  type Custodian {
    id: String
    name: String
    title: String
    color: String
    senderTotal: Int
    receiverTotal: Int
    toCustodians: [EmailSentToCustodians]
    fromCustodians: [EmailReceivedFromCustodians]
  }

  type Email {
    id: ID
    sent: String
    sentShort: String
    from: String
    fromCustodian: String
    to: String
    toCustodians: [String]
    cc: String
    bcc: String
    subject: String
    body: String
  }

  type EmailTotal {
    emails: [Email]
    total: Int
  }

  type ImportLogEntry {
    id: String
    timestamp: String
    entry: String
  }

  type Mutation {
    importPST(loc: String): String
    setCustodianColor(id: ID, color: String): [Custodian]
  }

  type Query {
    getImportStatus: [ImportLogEntry]
    getWordCloud: [Word]
    getEmailSentByDay: [EmailSentByDay]
    getCustodians: [Custodian]
    getEmail(
      id: ID, 
      skip: Int = 0, 
      limit: Int = 20, 
      sort: String = "sent", 
      order: Int = 1, 
      sent: String,
      timeSpan: Int
      allText: String
      from: String
      to: String
      subject: String
      body: String
      ): EmailTotal
  }
`)