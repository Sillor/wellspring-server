const Connection = require('tedious').Connection
const Request = require('tedious').Request

const config = {
  server: 'localhost',
  authentication: {
    type: 'default',
    options: {
      userName: 'your_username', // update me
      password: 'your_password' // update me
    }
  }
}

const connection = new Connection(config)

connection.on('connect', (err) => {
  if (err) {
    console.log(err)
  } else {
    executeStatement()
  }
})

function executeStatement () {
  request = new Request("select 123, 'hello world'", (err, rowCount) => {
    if (err) {
      console.log(err)
    } else {
      console.log(`${rowCount} rows`)
    }
    connection.close()
  })

  request.on('row', (columns) => {
    columns.forEach((column) => {
      if (column.value === null) {
        console.log('NULL')
      } else {
        console.log(column.value)
      }
    })
  })

  connection.execSql(request)
}