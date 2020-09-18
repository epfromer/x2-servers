import { custodianCollection, dbName } from '@klonzo/common'
import { Request, Response } from 'express'
import mysql, { ConnectionConfig } from 'mysql2/promise'

// HTTP PUT /custodians/:id
export async function setCustodian(req: Request, res: Response): Promise<void> {
  try {
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_ROOT_PASSWORD,
      database: dbName,
    } as ConnectionConfig)
    await connection.execute(
      `update ${custodianCollection} set color = '${req.body.color}' where custodian_id = '${req.params.id}'`
    )
    res.status(200).send('success')
  } catch (err) {
    console.error(err.stack)
    res.status(500).send(err.msg)
  }
}
