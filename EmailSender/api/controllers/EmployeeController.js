/**
 * EmployeeController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const fs = require("fs");
const Json2csvParser = require("json2csv").Parser;
const moment = require("moment");

module.exports = {
  CreateEmployee: async (req, res) => {
    let data = _.pick(req.body, ["email", "fname", "lname", "designation"]);

    try {
      let validatedData = await Employee.validateEmployee(data);
      if (validatedData["hasError"]) {
        return res.status(ResponseCodes.BAD_REQUEST).json({
          status: ResponseCodes.BAD_REQUEST,
          data: "",
          error: validatedData["errors"],
        });
      }

      const existsUser = await Employee.findOne({
        email: data.email,
      });

      if (existsUser) {
        return res.status(201).json({
          data: existsUser,
          status: "failed",
          message: "Already exists",
        });
      }
      const EmployeeData = await Employee.create(data).fetch();
      return res.status(201).json({
        status: "success",
        data: EmployeeData,
        message: "Successfully created..",
      });
    } catch (e) {
      console.log("Unable to create");
      return res.send({
        status: "failed",
        message: "Unable to create",
      });
    }
  },
  CreateReportforEmployee: async (req, res) => {
    try {
      id = req.query.id;
      const Employeedetails = await Employee.findOne({
        where: id,
      });

      console.log(Employeedetails);

      const findData = await Email.find({
        where: {
          id: id,
        },
      });

      let start_date, end_date;

      //sort by date range
      if (req.param("startDate") && req.param("endDate")) {
        start_date = moment(req.param("startDate"), "YYYY/MM/DD")
          .startOf("day")
          .valueOf();
        end_date = moment(req.param("endDate"), "YYYY/MM/DD")
          .endOf("day")
          .valueOf();
        findData.where = {
          ...findData.where,
          createdAt: { ">": start_date, "<": end_date },
        };
        console.log("date", start_date);
        console.log("date", end_date);
      }

      let query = await sails.sendNativeQuery(
        `SELECT * FROM email where createdAt between ${start_date} and ${end_date} and id=${id}`
      );

      //fields for sentemail data
      const fields1 = ["id", "from", "to", "createdAt", "updatedAt"];
      const newLine = "\r\n";
      //fileds for employeedetails data
      const fields2 = ["id", "EmployeeDetails"];

      let empStr = `
 email: ${Employeedetails.email},
 fname: ${Employeedetails.fname},
 lname: ${Employeedetails.lname},
 designation: ${Employeedetails.designation},`;

      let emparr = [{ id: Employeedetails.id, EmployeeDetails: empStr }];

      //for employeedetails data
      const json2csvParser = new Json2csvParser({
        fields: fields2,
      });

      const csv = json2csvParser.parse(emparr) + newLine;

      //writing data of employee details
      fs.writeFile("Email-Details.csv", csv, function (error) {
        if (error) throw error;

        console.log("Write to Email-Details.csv successfully!");
      });

      //for sent email details
      const jsonData = JSON.parse(JSON.stringify(query));
      const json2csvParsertwo = new Json2csvParser({
        fields: fields1,
      });
      const csv1 = json2csvParsertwo.parse(jsonData.rows);

      fields = newLine + csv1;

      //appending sent email data
      fs.appendFile("Email-Details.csv", fields, function (err, data) {
        if (err) throw err;

        console.log("file saved");
      });

      //reading data for employeedetails + sentemaildetails
      fs.readFile("Email-Details.csv", function (err, data) {
        if (err) throw err;
        data = data.toString();
        console.log(data, "hiiih doneee");
        res.attachment("Email-Details.csv").send(data);
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: 500,
        data: "",
        error: "Unknown error",
      });
    }
  },

  CreateReportforMultipleEmployee: async (req, res) => {
    try {
      const Employeedetails = await Employee.find();
      //console.log(Employeedetails);

      const findData = await Email.find();

      let start_date, end_date;

      //sort by date range
      if (req.param("startDate") && req.param("endDate")) {
        start_date = moment(req.param("startDate"), "YYYY/MM/DD")
          .startOf("day")
          .valueOf();
        end_date = moment(req.param("endDate"), "YYYY/MM/DD")
          .endOf("day")
          .valueOf();
        findData.where = {
          ...findData.where,
          createdAt: { ">": start_date, "<": end_date },
        };
        console.log("date", start_date);
        console.log("date", end_date);
      }

      let query = await sails.sendNativeQuery(
        `SELECT * FROM email where createdAt between ${start_date} and ${end_date}  `
      );

      //fileds of sent email data
      const fields1 = ["id", "from", "to", "createdAt", "updatedAt"];
      const newLine = "\r\n";

      //fields of Employeedetails
      const fields2 = ["id", "EmployeeDetails"];

      const json2csvParser = new Json2csvParser({
        fields: fields2,
      });
      //creating new file
      fs.open("Email-Details.csv", "w+", function (err) {
        if (err) {
          return console.error(err);
        }
      });

      //for appending Employeedata
      for (let data of Employeedetails) {
        let empStr = `
        email: ${data.email},
        fname: ${data.fname},
        lname: ${data.lname},
        designation: ${data.designation},`;
        let emparr = [{ id: data.id, EmployeeDetails: empStr }];
        const csv = json2csvParser.parse(emparr) + newLine;

        fs.appendFile("Email-Details.csv", csv, function (error) {
          if (error) throw error;
        });
      }

      //for sentEMail data
      const jsonData = JSON.parse(JSON.stringify(query));

      const json2csvParsertwo = new Json2csvParser({
        fields: fields1,
      });
      const CSVdata = json2csvParsertwo.parse(jsonData.rows) + newLine;
      Newdata = newLine + CSVdata;

      //appending sent email data
      fs.appendFile("Email-Details.csv", Newdata, function (err) {
        if (err) throw err;

        console.log("file saved for second data");
      });

      //reading file for employee details + EmailsentDetails
      fs.readFile("Email-Details.csv", function (err, fileData) {
        if (err) throw err;
        fileData = fileData.toString();
        res.attachment("Email-Details.csv").send(fileData);
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        status: 500,
        data: "",
        error: "Unknown error",
      });
    }
  },
};
