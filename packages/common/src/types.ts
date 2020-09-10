export interface Email {
  id: string
  sent: Date
  sentShort?: string
  from: string
  fromCustodian?: string
  to: string
  toCustodians?: string[]
  cc: string
  bcc: string
  subject: string
  body: string
}

export interface EmailSentByDay {
  sent: Date
  emailIds: string[]
}

export interface EmailSentToCustodians {
  emailId: string
  custodianIds: string[]
}

export interface EmailReceivedFromCustodians {
  emailId: string
  custodianId: string
}

export interface Custodian {
  id: string
  name: string
  aliases?: string[]
  title: string
  color: string
  senderTotal: number
  receiverTotal: number
  toCustodians: EmailSentToCustodians[]
  fromCustodians: EmailReceivedFromCustodians[]
}

export interface WordCloudTag {
  tag: string
  weight: number
}

export interface HTTPQuery {
  sent?: string
  timeSpan?: number
  allText?: string
  from?: string
  to?: string
  subject?: string
  body?: string
}
