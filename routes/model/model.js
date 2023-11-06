class MasterViolationModel {
    constructor(violationid, description, actionid, createby, createdate, status) {
        this.violationid = violationid;
        this.description = description;
        this.actionid = actionid;
        this.createby = createby;
        this.createdate = createdate;
        this.status = status;
    }
}




module.exports = { MasterViolationModel };