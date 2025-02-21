const MessageStatus = {
    SUCCESS: "success",
    ERROR: "error",
    DUPLICATE: "duplicate",
    NOTEXIST: "notexist",
    DUPENTRY: "dupentry",
    EXIST: "exist",
    NOENTRY: "noentry",
    PENDINGOT: "Loooks like you have a pending overtime request. Please wait until the request is approved.",
    APPLIEDOT: "Looks like you have a applied overtime request. Please wait until the request is approved.",
    APPROVEDOT: "Looks like you have a approved overtime request.",
    PENDINGOTMEAL: "Loooks like you have a pending meal request. Please wait until the request is approved.",
    APPLIEDOTMEAL: "Looks like you have a applied meal request. Please wait until the request is approved.",
    APPROVEDOTMEAL: "Looks like you have a approved meal request.",
    APPLIEDRDOT: "Looks like you have a applied rest day overtime request. Please wait until the request is approved.",
    APPROVEDRDOT: "Looks like you have a approved rest day overtime request.",
    PENDINGRDOT: "Loooks like you have a pending rest day overtime request. Please wait until the request is approved.",
    APPLIED: 'Applied',
    APPROVED: 'Approved',
    PENDING: 'Pending',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
    APPROVAL: 'Approval',
    REJECTION: 'Rejection',
    CANCELLATION: 'Cancellation',
    DELETED: 'Deleted',
    PARTIALLY: "Partially Approved",
};

function JsonSuccess() {
  return {
    msg: MessageStatus.SUCCESS,
  };
}

function JsonDataResponse(data) {
  //JsonDataResponse
  return {
    msg: MessageStatus.SUCCESS,
    data: data,
  };
}

function JsonWarningResponse(message, data) {
  //JsonWarningResponse
  return {
    msg: message,
    data: data,
  };
}

function JsonSuccessMulti(data) {
  return data ;
}

function JsonErrorResponse(error) {
  //JsonErrorResponse
  return {
    msg: error,
  };
}

module.exports = {
  MessageStatus,
  JsonDataResponse,
  JsonWarningResponse,
  JsonErrorResponse,
  JsonSuccess,
  JsonSuccessMulti,
};
