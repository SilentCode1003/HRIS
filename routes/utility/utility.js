const mysql = require('mysql2/promise')
require('dotenv').config()
const { Decrypter } = require('../repository/cryptography')
const { DataModeling } = require('../model/hrmisdb')
const { SelectStatement } = require('../repository/customhelper')
const { logger } = require('../../middleware/logger')

Decrypter(process.env._PASSWORD_ADMIN, async (err, result) => {
  if (err) throw err
  const password = result

  const pool = mysql.createPool({
    host: process.env._HOST_ADMIN,
    user: process.env._USER_ADMIN,
    password: password,
    database: process.env._DATABASE_ADMIN,
    multipleStatements: true,
  })

  //@use for Checking if data exist
  exports.Check = async (sql, params = []) => {
    try {
      const [result] = await pool.query(sql, params)
      if (result.length != 0) {
        return true
      } else {
        return false
      }
    } catch (error) {
      logger.error(error)
      console.error('Error executing query:', error)
      throw error
    }
  }

  //@ Specific Select ALL no params
  exports.SelectAll = async (tableName, prefix) => {
    try {
      const [result] = await pool.query(`SELECT * FROM ${tableName}`)
      if (prefix) {
        const data = DataModeling(result, prefix)
        return data
      }
      return result
    } catch (error) {
      logger.error(error)
      console.error('Error executing query:', error)

      throw error
    }
  }

  //@ can be used for universal query SELECT, INSERT, UPDATE, DELETE
  exports.Query = async (sql, params = [], prefix) => {
    try {
      const [result] = await pool.query(sql, params)
      if (sql.trim().toUpperCase().startsWith('INSERT')) {
        return { ...result, insertId: result.insertId }
      }
      if (prefix && sql.trim().toUpperCase().startsWith('SELECT')) {
        const data = DataModeling(result, prefix)
        return data
      }
      return result
    } catch (error) {
      logger.error(error)
      console.error('Error executing query:', error)
      throw error
    }
  }

  //@use for Transac and Commit
  exports.Transaction = async (queries) => {
    let connection
    try {
      connection = await pool.getConnection()
      await connection.beginTransaction()

      const queryPromises = queries.map((query) => {   
        return connection.execute(query.sql, query.values)
      })

      await Promise.all(queryPromises)
      await connection.commit()
      return true
    } catch (error) {
      logger.error(error)
      if (connection) {
        await connection.rollback()
      }
      console.error('Error executing transaction:', error)
      throw error
    } finally {
      if (connection) {
        connection.release()
      }
    }
  }
})
