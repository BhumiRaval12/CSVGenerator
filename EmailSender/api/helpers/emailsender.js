const Role = sails.config.constant.Role;
module.exports = {
  friendlyName: "Email sender",

  description: "Sends an email",

  inputs: {
    subject: {
      friendlyName: "Email Subject",
      description: "The subject of the email.",
      type: "string",
    },
  },

  exits: {
    success: {
      description: "All done.",
    },

    mailError: {
      description: "Mail could not be sent due to some errors.",
    },
  },

  fn: async function (inputs, exits) {
    const nodemailer = require("nodemailer");

    const smtpTransport = nodemailer.createTransport({
      service: "gmail",
      host: "smtp.gmail.com",
      auth: {
        user: Role.user,
        pass: Role.pass,
      },
    });
    const maillist = [
      "bhumiraval456@gmail.com",
      "bhumir@zignuts.com",
      "ravirajc@zignuts.com",
    ];
    maillist.forEach(async (mail) => {
      const mailOptions = {
        from: "bhumiraval875@gmail.com",
        to: mail,
        subject: inputs.subject,
      };
  
      await smtpTransport.sendMail(mailOptions, async (err) => {
        if (err) {
          console.log(`hii error from mailSender : ${err}`);
          sails.log.info("error---->", { err });
          return exits.mailError(err);
        }

        console.log("hii solved");

        await Email.create(mailOptions);
      });
    });
    return exits.success(true);
  },
};
