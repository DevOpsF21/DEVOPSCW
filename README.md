Introduction
    The aim of this project is creating a headless care software application for a tertiary care hospital as part of DevOps course project. this system has three man functionality each with it's own designated service endpoint, namely:

    1.	User Authentication
    for the services to be accessed securely users must be registered into the database. Hence, this module is build for user management, including:
        1.1.    Create user and assign them a role
        1.2.	Delete User.
        1.3.    Change password.
        1.4.    Login
        
    2.	Patient Registration.
    this service is built to addess the need to register patients by a clerk and it is has below main sub-modules
        2.1.	Register a patient.
        2.2.	Delete a patient.
        2.3.	List patients (All).
        2.4.	Find a patient by a Patient Number. 
        2.5.	Seach patients by name.
        
    3.	Ward Admission
    Dependency:
    In any health care system, there must be a service to manage inpations. since this is only a course work project, we fisrt created ward details uisng createwards.js. this file was create using ChatGPT since it was not part of the module that was needed as part of the project.
    
    >>> node createwards.js

    assuming that we have the wards details craated as a collection in mngodb as instructed above, this module can be accessed by 3 different roles each with their own set of functionalities:
    3.1.    Admin Role
        1.	Admit a patient.
        2.  View inpatients that need to be discharged
        3.	Discharge a patient.
    3.2.    Nurse Role
        3.	View patients in inpatient section (wards)
        4.	View & add vital signs including heart health (rates & pulse), blood pressure & temperature.
        5.	View & add medications.
        6.	View & add reports.
    3.3.    Doctor role
        7.	Add discharge form.

Usage:
1. Clone the repository:
    git clone https://github.com/DevOpsF21/DEVOPSCW.git

2. Install Dependencies
rout management
    npm install express
connection to mongodb database
    npm install mangoose
environment management
    npm install dotenv
authentication
    npm install jsonwebtoken
encryption 
    npm install bcrypt

3. Running Services:
    Open terminal and start services:

    To start the authentication service on port 3000:
    npm run authstart

    To start the registration service on port 8080:
    npm run regstart

    To start the ward service on port 9191:
    npm run wardstartnew

4. Setting up User Accounts:
Access http://localhost:3000/v1/user
Add the following JSON to the request body:
    {
    "username":"test",
    "email": "test@gmail.com",
    "password":"test@1234",
    "roles":["nurse"]
    }
Roles to test are: admin, clerk, nurse, and doctor.

5. Login to an Account:
Access http://localhost:3000/v1/login
Add the following JSON to the request body:
    {
    "username":"test",
    "password":"test@1234"
    }
In the response, you will receive an Auth token. Copy the token.
Click on Headers, add "Authentication" as the key, and paste the token in the value field.


Running Each Endpoint:
in order to test the system functionality we recomment installing (postman)[https://www.postman.com/downloads/]

1.	User Management
        1.1.    Create user and assign them a role
            Method: POST 
            Address: localhost:3000/v1/user
            body:
            {
                "username":"test",
                "email": "test@gmail.com",
                "password":"test@1234",
                "roles":["nurse"]
                }
        1.2.	Delete User.
            Method: DELETE 
            Address: localhost:3000/v1/user
            body:
            {
                "username":"test",
                }
        1.3.    Change user password
            Method: POST 
            Address: localhost:3000/v1/authChange
            body:
            {
                "oldPassword":"test",
                "newPassword":"test2"
                }
        1.4.    login
            Method: POST 
            Address: localhost:3000/v1/login
            body:
                {
                "username":"test",
                "password":"test@1234"
                }
    2.	Patient Registration 
        2.1.	Register a patient.
            Method: POST 
            Address: localhost:8080/v1/patient/
            body:
                {
                    "pnumber":"12345678",
                    "pname":"John Doe",
                    "dob":"24—03-03",
                    "blood":"O+",
                    "gender":"male",
                    "through":"opd",
                    "knowndiseases":"None",
                    "knownallergies":"None"
                }
        2.2.	Delete a patient.
            Method: DELETE 
            Address: localhost:8080/v1/patientByNumber/12345678

        2.3.	List patients (All).
            Method: GET 
            Address: localhost:8080/v1/allPatients
        2.4.	Find a patient by a Patient Number. 
            Method: GET 
            Address: localhost:8080/v1/patientByNumber/12345678
        2.5.	Seach patients by name.
            Method: GET 
            Address: localhost:8080/v1/PatientsByName/"Test Patient"
        
    3.	Ward Admission
    3.1.    Admin Role
        1.	Admit a patient.
            Method: POST 
            Address: localhost:9191/v1/inpatient/
            body:
                {
                "pid":77778888,
                "dep":"Medicine",
                "wname":"Medicine A",
                "ad":"2024-02-20T13:30:45",
                "edd":"2024-02-20"
            }
        2.  View all inpatients that need to be discharged
            Method: GET 
            Address: localhost:9191/v1/discharge
        3. View discharge form of a inpatient
            Method: GET 
            Address: localhost:9191/v1/discharge/77778888
        3.	Discharge a patient.
            Method: POST 
            Address: localhost:9191/v1/discharge/77778888
            runnning this will autamatically set the discharge date
    3.2.    Nurse Role
        1.	View patients in inpatient section by id
            Method: GET:
            Address: localhost:9191/v1/inpatient/77778888
        2.	View & add vital signs 
            Method: POST
            2.1. blood pressure & temperature.
                Address: localhost:9191/v1/inpatient/77778888/vitalsigns/bp
                body:
                {  
                    "systolic_pressure":80,
                    "diastolic_pressure":110
                }
            2.2 heart health    
                Address: localhost:9191/v1/inpatient/77778888/vitalsigns/cardiac
                body:
                {  
                    "heart_rate":90,
                    "pulse":15
                }
            2.3 Temprature 
                Address: localhost:9191/v1/inpatient/77778888/vitalsigns/temprature
                Body:
                {  
                    "temprature":36,
                }
        3.	View & add medications.
            Method: POST
            Address: localhost:9191/v1/inpatient/77778888/medication
            Body:
            {  
                "medication_name":"ponstant",
                "dosage":500,
            }
        4.	View & add reports.
            Method: POST
            Address: localhost:9191/v1/inpatient/77778888/report 
            Body: 
            {  
                "comment":"Requires a visit by doctor",
            }
   
    3.3.    Doctor role
        1. View Patient Details
            Method: GET
            Address: localhost:9191/v1/inpatient/77778888
        2. Add discharge Form
            Method: POST
            Address: localhost:9191/v1/inpatient/77778888/discharge_form
            Body:
            {  
                "diagnosis":"Severe Flu",
                "treatmen_taken":"we killed her",
                "discharge_reason":"Death",
                "future_treatment":"not needed",
                "perscribed_medications":"not needed"
                }

Contributing
Contributions are welcome! here is how you can constribute

1. Report a bug
2. Report validation requieremnts
3. Request new fucntion
    
License
GNU/General Public License 

Contact
