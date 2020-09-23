import {
  dbName,
  defaultLimit,
  emailCollection,
  EmailTotal,
  HTTPQuery,
} from '@klonzo/common'
import { Pool } from 'pg'

const createWhereClause = (httpQuery: HTTPQuery) => {
  // console.log(httpQuery)

  let { allText, from, to, subject, body } = httpQuery
  if (allText) allText = allText.toLowerCase()
  if (from) from = from.toLowerCase()
  if (to) to = to.toLowerCase()
  if (subject) subject = subject.toLowerCase()
  if (body) body = body.toLowerCase()
  const { id, sent, timeSpan } = httpQuery

  // get single email?
  if (id) return `email_id = '${id}'`

  let query = ''

  if (sent) {
    const start = new Date(sent)
    const end = new Date(start.getTime())
    end.setDate(end.getDate() + 1)
    // is there a time span?
    if (timeSpan && timeSpan > 0) {
      start.setDate(start.getDate() - +timeSpan)
      end.setDate(end.getDate() + +timeSpan)
    }
    query +=
      `(email_sent >= '${new Date(start).toISOString().slice(0, 10)}' and ` +
      `email_sent <= '${new Date(end).toISOString().slice(0, 10)}')`
  }

  if (allText) {
    // any text field?
    query +=
      (query ? ' and ' : '') +
      `(` +
      `email_from_lc like '%${allText}%' or ` +
      `email_from_custodian_lc like '%${allText}%' or ` +
      `email_to_lc like '%${allText}%' or ` +
      `email_to_custodians_lc like '%${allText}%' or ` +
      `email_cc_lc like '%${allText}%' or ` +
      `email_bcc_lc like '%${allText}%' or ` +
      `email_subject_lc like '%${allText}%' or ` +
      `email_body_lc like '%${allText}%'` +
      `)`
  } else {
    // Else, we have specific field searching.
    if (from) {
      query +=
        (query ? ' and ' : '') +
        `(` +
        `email_from_lc like '%${from}%' or ` +
        `email_from_custodian_lc like '%${from}%'` +
        `)`
    }
    if (to) {
      query +=
        (query ? ' and ' : '') +
        `(` +
        `email_to_lc like '%${to}%' or ` +
        `email_to_custodians_lc like '%${to}%' or ` +
        `email_cc_lc like '%${to}%' or ` +
        `email_bcc_lc like '%${to}%'` +
        `)`
    }
    if (subject) {
      query +=
        (query ? ' and ' : '') +
        `(` +
        `email_subject_lc like '%${subject}%'` +
        `)`
    }
    if (body) {
      query +=
        (query ? ' and ' : '') + `(` + `email_body_lc like '%${body}%'` + `)`
    }
  }

  // console.log(query)
  return query
}

// HTTP GET /email/
export async function getEmail(httpQuery: HTTPQuery): Promise<EmailTotal> {
  try {
    let qTotal = `select count(*) as total from ${emailCollection}`
    let q = `select * from ${emailCollection}`

    const whereClause = createWhereClause(httpQuery)
    if (whereClause) {
      qTotal += ' where ' + whereClause
      q += ' where ' + whereClause
    }

    q += ` order by ${
      httpQuery.sort ? 'email_' + httpQuery.sort : 'email_sent'
    } ${httpQuery.order === 1 ? 'asc' : 'desc'} offset ${
      httpQuery.skip ? +httpQuery.skip : 0
    } rows fetch next ${
      httpQuery.limit ? +httpQuery.limit : defaultLimit
    } rows only`

    const pool = new Pool({ database: dbName })
    const result = await pool.query(q)
    const resultTotal = await pool.query(qTotal)
    await pool.end()

    return {
      total: resultTotal.rows[0].total,
      emails: result.rows.map((email) => ({
        id: email.email_id,
        sent: email.email_sent,
        sentShort: new Date(email.email_sent).toISOString().slice(0, 10),
        from: email.email_from,
        fromCustodian: email.email_from_custodian,
        to: email.email_to,
        toCustodians: email.email_to_custodians
          ? email.email_to_custodians.split(',')
          : [],
        cc: email.email_cc,
        bcc: email.email_bcc,
        subject: email.email_subject,
        body: email.email_body,
      })),
    }
  } catch (err) {
    console.error(err.stack)
  }
}
