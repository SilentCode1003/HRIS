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
  constructor(id, date, time, latitude, longitude, device, type,geofenceid) {
    this.id = id;
    this.date = date;
    this.time = time;
    this.latitude = latitude;
    this.longitude = longitude;
    this.device = device;
    this.type = type;
    this.geofenceid = geofenceid;
  }
}

class DataModel {
  constructor(data, prefix) {
    for (const key in data) {
      this[key.replace(prefix, "")] = data[key];
    }
  }
}

class RawDataModel {
  constructor(data) {
    for (const key in data) {
      this[key] = data[key];
    }
  }
}
module.exports = {
  MasterViolationModel,
  OJTAttendanceModel,
  DataModel,
  RawDataModel,
};
