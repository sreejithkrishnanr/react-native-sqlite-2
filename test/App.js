import React, { Component } from 'react'
import {
  StyleSheet,
  Text,
  View,
  ListView
} from 'react-native'

import SQLite, { encodeName } from 'react-native-sqlcipher-2'

const database_name = encodeName('test.db', 'testpasswor')
const database_version = '1.0'
const database_displayname = 'SQLite Test Database'
const database_size = 200000
let db

export default class ReactNativeSQLite2Test extends Component {
  constructor (props) {
    super(props)
    this.state = {
      progress: [],
      dataSource: new ListView.DataSource({
        rowHasChanged: (row1, row2) => row1 !== row2
      })
    }
  }

  componentWillUnmount () {
    this.closeDatabase()
  }

  errorCB = (err) => {
    console.log('error: ', err)
    this.state.progress.push('Error: ' + (err.message || err))
    this.setState(this.state)
    return false
  }

  successCB = () => {
    console.log('SQL executed ...')
  }

  openCB = () => {
    this.state.progress.push('Database OPEN')
    this.setState(this.state)
  }

  closeCB = () => {
    this.state.progress.push('Database CLOSED')
    this.setState(this.state)
  }

  deleteCB = () => {
    console.log('Database DELETED')
    this.state.progress.push('Database DELETED')
    this.setState(this.state)
  }

  populateDatabase (db) {
    this.state.progress.push('Database integrity check')
    this.setState(this.state)
    db.transaction((txn) => {
      txn.executeSql(
        'SELECT 1 FROM Version LIMIT 1',
        [],
        () => {
          this.state.progress.push('Database is ready ... executing query ...')
          this.setState(this.state)
          db.transaction(this.queryEmployees, this.errorCB, () => {
            this.state.progress.push('Processing completed')
            this.setState(this.state)
          })
        },
        (error) => {
          console.log('received version error:', error)
          this.state.progress.push('Database not yet ready ... populating data')
          this.setState(this.state)
          db.transaction(this.populateDB, this.errorCB, () => {
            this.state.progress.push('Database populated ... executing query ...')
            this.setState(this.state)
            db.transaction(this.queryEmployees, this.errorCB, () => {
              console.log('Transaction is now finished')
              this.state.progress.push('Processing completed')
              this.setState(this.state)
              this.closeDatabase()
            })
          })
        }
      )
    })
  }

  populateDB = (tx) => {
    this.state.progress.push('Executing DROP stmts')
    this.setState(this.state)

    tx.executeSql('DROP TABLE IF EXISTS Employees;')
    tx.executeSql('DROP TABLE IF EXISTS Offices;')
    tx.executeSql('DROP TABLE IF EXISTS Departments;')

    this.state.progress.push('Executing CREATE stmts')
    this.setState(this.state)

    tx.executeSql('CREATE TABLE IF NOT EXISTS Version( ' +
      'version_id INTEGER PRIMARY KEY NOT NULL); ', [], this.successCB, this.errorCB)

    tx.executeSql('CREATE TABLE IF NOT EXISTS Departments( ' +
      'department_id INTEGER PRIMARY KEY NOT NULL, ' +
      'name VARCHAR(30) ); ', [], this.successCB, this.errorCB)

    tx.executeSql('CREATE TABLE IF NOT EXISTS Offices( ' +
      'office_id INTEGER PRIMARY KEY NOT NULL, ' +
      'name VARCHAR(20), ' +
      'longtitude FLOAT, ' +
      'latitude FLOAT ) ; ', [], this.successCB, this.errorCB)

    tx.executeSql('CREATE TABLE IF NOT EXISTS Employees( ' +
      'employe_id INTEGER PRIMARY KEY NOT NULL, ' +
      'name VARCHAR(55), ' +
      'office INTEGER, ' +
      'department INTEGER, ' +
      'FOREIGN KEY ( office ) REFERENCES Offices ( office_id ) ' +
      'FOREIGN KEY ( department ) REFERENCES Departments ( department_id ));', [])

    this.state.progress.push('Executing INSERT stmts')
    this.setState(this.state)

    tx.executeSql('INSERT INTO Departments (name) VALUES ("Client Services");', [])
    tx.executeSql('INSERT INTO Departments (name) VALUES ("Investor Services");', [])
    tx.executeSql('INSERT INTO Departments (name) VALUES ("Shipping");', [])
    tx.executeSql('INSERT INTO Departments (name) VALUES ("Direct Sales");', [])

    tx.executeSql('INSERT INTO Offices (name, longtitude, latitude) VALUES ("Denver", 59.8,  34.);', [])
    tx.executeSql('INSERT INTO Offices (name, longtitude, latitude) VALUES ("Warsaw", 15.7, 54.);', [])
    tx.executeSql('INSERT INTO Offices (name, longtitude, latitude) VALUES ("Berlin", 35.3, 12.);', [])
    tx.executeSql('INSERT INTO Offices (name, longtitude, latitude) VALUES ("Paris", 10.7, 14.);', [])

    tx.executeSql('INSERT INTO Employees (name, office, department) VALUES ("Sylvester Stallone", 2,  4);', [])
    tx.executeSql('INSERT INTO Employees (name, office, department) VALUES ("Elvis Presley", 2, 4);', [])
    tx.executeSql('INSERT INTO Employees (name, office, department) VALUES ("Leslie Nelson", 3,  4);', [])
    tx.executeSql('INSERT INTO Employees (name, office, department) VALUES ("Fidel Castro", 3, 3);', [])
    tx.executeSql('INSERT INTO Employees (name, office, department) VALUES ("Bill Clinton", 1, 3);', [])
    tx.executeSql('INSERT INTO Employees (name, office, department) VALUES ("Margaret Thatcher", 1, 3);', [])
    tx.executeSql('INSERT INTO Employees (name, office, department) VALUES ("Donald Trump", 1, 3);', [])
    tx.executeSql('INSERT INTO Employees (name, office, department) VALUES ("Dr DRE", 2, 2);', [])
    tx.executeSql('INSERT INTO Employees (name, office, department) VALUES ("Samantha Fox", 2, 1);', [])
    console.log('all config SQL done')
  }

  queryEmployees = (tx) => {
    console.log('Executing sql...')
    tx.executeSql('SELECT a.name, b.name as deptName FROM Employees a, Departments b WHERE a.department = b.department_id and a.department=?', [3],
      this.queryEmployeesSuccess, this.errorCB)
  }

  queryEmployeesSuccess = (tx, results) => {
    this.state.progress.push('Query completed')
    this.setState(this.state)
    var len = results.rows.length
    for (let i = 0; i < len; i++) {
      let row = results.rows.item(i)
      this.state.progress.push(`Empl Name: ${row.name}, Dept Name: ${row.deptName}`)
    }
    this.setState(this.state)
  }

  loadAndQueryDB () {
    this.state.progress.push('Opening database ...')
    this.setState(this.state)
    db = SQLite.openDatabase(database_name, database_version, database_displayname, database_size, this.openCB, this.errorCB)
    this.populateDatabase(db)
  }

  closeDatabase () {
    var that = this
    if (db) {
      console.log('Closing database ...')
      that.state.progress.push('Closing database')
      that.setState(that.state)
    } else {
      that.state.progress.push('Database was not OPENED')
      that.setState(that.state)
    }
  }

  runDemo () {
    this.state.progress = ['Starting SQLite Callback Demo']
    this.setState(this.state)
    this.loadAndQueryDB()
  }

  renderProgressEntry (entry) {
    return (
      <View style={listStyles.li}>
        <View>
          <Text style={listStyles.liText}>{entry}</Text>
        </View>
      </View>
    )
  }

  render () {
    var ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
    return (
      <View style={styles.mainContainer}>
        <View style={styles.toolbar}>
          <Text style={styles.toolbarButton} onPress={() => this.runDemo()}>
            Run Demo
          </Text>
        </View>
        <ListView
          enableEmptySections
          dataSource={ds.cloneWithRows(this.state.progress)}
          renderRow={this.renderProgressEntry.bind(this)}
          style={listStyles.liContainer}
        />
      </View>
    )
  }
};

var listStyles = StyleSheet.create({
  li: {
    borderBottomColor: '#c8c7cc',
    borderBottomWidth: 0.5,
    paddingTop: 15,
    paddingRight: 15,
    paddingBottom: 15
  },
  liContainer: {
    backgroundColor: '#fff',
    flex: 1,
    paddingLeft: 15
  },
  liIndent: {
    flex: 1
  },
  liText: {
    color: '#333',
    fontSize: 17,
    fontWeight: '400',
    marginBottom: -3.5,
    marginTop: -3.5
  }
})

var styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF'
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5
  },
  toolbar: {
    backgroundColor: '#51c04d',
    paddingTop: 30,
    paddingBottom: 10,
    flexDirection: 'row'
  },
  toolbarButton: {
    color: 'white',
    textAlign: 'center',
    flex: 1
  },
  mainContainer: {
    flex: 1
  }
})
