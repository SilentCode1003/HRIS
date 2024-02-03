class MasterViolationModel {
  constructor(id, description, actionid, createby, createdate, status) {
    this.violationid = violationid;
    this.description = description;
    this.actionid = actionid;
    this.createby = createby;
    this.createdate = createdate;
    this.status = status;
  }
}

class OJTAttendanceModel {
  constructor(id, date, time, latitude, longitude, device, type) {
    this.id = id;
    this.date = date;
    this.time = time;
    this.latitude = latitude;
    this.longitude = longitude;
    this.device = device;
    this.type = type;
  }
}

module.exports = { MasterViolationModel, OJTAttendanceModel };
