exports.generateUsernameAndPassword = (employee) => {
    try {
        const { me_id: employeeid, me_firstname: firstname, me_lastname: lastname, me_birthday: birthday } = employee;
  
        // Generate username by combining the first letter of the first name and the last name
        const username = (firstname.charAt(0) + lastname).toLowerCase();
      
        // Generate the password by combining employeeid and birthday
        const password = employeeid + birthday.replace(/-/g, '');
      
        return { username, password };
    } catch (error) {
        console.log(error);
    }
}

exports.UserLogin = (result, callback) => {
    try {
        const userData = [];
  
        result.forEach((row) => {
          userData.push({
            employeeid: row.employeeid,
            fullname: row.fullname,
            accesstype: row.accesstype,
          });
        });
      
        return userData;
    } catch (error) {
        console.log(error);
        callback(error);
        
    }
}
exports.showSweetAlert = (title, text, icon, buttonText) => {
    try {
        swal({
            title: title,
            text: text,
            icon: icon,
            button: buttonText,
          });
    } catch (error) {
        console.log(error);
        
    }
}
  
  // Example of how to use the custom function:
  // showSweetAlert("success", "Log in Successfully", "success", "Let's go!");
  // showSweetAlert("incorrect", "Incorrect Credentials. Please try again!", "error", "AWW NO!!!");
  