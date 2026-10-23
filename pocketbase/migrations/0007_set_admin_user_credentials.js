migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const targetEmail = 'angelo.marcos_silva@hotmail.com'
    const targetPassword = '12345678'

    let adminRecord
    try {
      adminRecord = app.findAuthRecordByEmail('_pb_users_auth_', targetEmail)
      adminRecord.setPassword(targetPassword)
      adminRecord.setVerified(true)
      adminRecord.set('role', 'admin')
      if (!adminRecord.getString('name')) {
        adminRecord.set('name', 'Administrador Fideliza')
      }
      app.save(adminRecord)
    } catch (_) {
      adminRecord = new Record(users)
      adminRecord.setEmail(targetEmail)
      adminRecord.setPassword(targetPassword)
      adminRecord.setVerified(true)
      adminRecord.set('role', 'admin')
      adminRecord.set('name', 'Administrador Fideliza')
      app.save(adminRecord)
    }
  },
  (app) => {
    // Revert/down: no-op to preserve user data integrity
  },
)
